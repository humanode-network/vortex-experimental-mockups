import { xxhashAsHex } from "@polkadot/util-crypto";
import { cryptoWaitReady, decodeAddress } from "@polkadot/util-crypto";
import { hexToU8a, u8aEq, u8aToHex } from "@polkadot/util";

type Env = Record<string, string | undefined>;

type JsonRpcResponse<T> =
  | { jsonrpc: "2.0"; id: number; result: T }
  | { jsonrpc: "2.0"; id: number; error: { code: number; message: string } };

function storageKeySessionValidators(): string {
  const pallet = xxhashAsHex("Session", 128).slice(2);
  const item = xxhashAsHex("Validators", 128).slice(2);
  return `0x${pallet}${item}`;
}

function storageKeySessionCurrentIndex(): string {
  const pallet = xxhashAsHex("Session", 128).slice(2);
  const item = xxhashAsHex("CurrentIndex", 128).slice(2);
  return `0x${pallet}${item}`;
}

function storageKeyImOnlineAuthoredBlocksPrefix(): string {
  const pallet = xxhashAsHex("ImOnline", 128).slice(2);
  const item = xxhashAsHex("AuthoredBlocks", 128).slice(2);
  return `0x${pallet}${item}`;
}

function storageKeyImOnlineReceivedHeartbeatsPrefix(): string {
  const pallet = xxhashAsHex("ImOnline", 128).slice(2);
  const item = xxhashAsHex("ReceivedHeartbeats", 128).slice(2);
  return `0x${pallet}${item}`;
}

async function rpcCall<T>(rpcUrl: string, method: string, params: unknown[]) {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = (await res.json()) as JsonRpcResponse<T>;
  if ("error" in json) throw new Error(json.error.message);
  return json.result;
}

function u32LeBytes(value: number): Uint8Array {
  return new Uint8Array([
    value & 0xff,
    (value >> 8) & 0xff,
    (value >> 16) & 0xff,
    (value >> 24) & 0xff,
  ]);
}

function decodeU32Le(hex: string | null): number | null {
  if (!hex || hex === "0x") return null;
  const bytes = hexToU8a(hex);
  if (bytes.length < 4) return null;
  return bytes[0] + (bytes[1] << 8) + (bytes[2] << 16) + (bytes[3] << 24);
}

function decodeTruthy(hex: string | null): boolean {
  if (!hex || hex === "0x") return false;
  const bytes = hexToU8a(hex);
  if (!bytes.length) return false;
  return bytes[0] !== 0;
}

function readCompactU32(
  bytes: Uint8Array,
  offset: number,
): { value: number; offset: number } {
  const first = bytes[offset];
  if (first === undefined) throw new Error("SCALE: unexpected EOF");
  const mode = first & 0b11;
  if (mode === 0) return { value: first >> 2, offset: offset + 1 };
  if (mode === 1) {
    const b1 = bytes[offset + 1];
    if (b1 === undefined) throw new Error("SCALE: unexpected EOF");
    const value = (first >> 2) | (b1 << 6);
    return { value, offset: offset + 2 };
  }
  if (mode === 2) {
    const b1 = bytes[offset + 1];
    const b2 = bytes[offset + 2];
    const b3 = bytes[offset + 3];
    if (b3 === undefined) throw new Error("SCALE: unexpected EOF");
    const value = (first >> 2) | (b1 << 6) | (b2 << 14) | (b3 << 22);
    return { value, offset: offset + 4 };
  }
  throw new Error("SCALE: compact big-int not supported");
}

function decodeVecAccountId32(hex: string | null): Uint8Array[] {
  if (!hex || hex === "0x") return [];
  const bytes = hexToU8a(hex);
  const { value: length, offset } = readCompactU32(bytes, 0);
  const accounts: Uint8Array[] = [];
  let cursor = offset;
  for (let i = 0; i < length; i++) {
    const chunk = bytes.slice(cursor, cursor + 32);
    if (chunk.length !== 32) throw new Error("SCALE: invalid AccountId");
    accounts.push(chunk);
    cursor += 32;
  }
  return accounts;
}

export async function isActiveHumanNodeViaRpc(
  env: Env,
  address: string,
): Promise<boolean> {
  const rpcUrl = env.HUMANODE_RPC_URL;
  if (!rpcUrl) throw new Error("HUMANODE_RPC_URL is required");

  await cryptoWaitReady();
  const subject = decodeAddress(address);

  const validatorsKey = storageKeySessionValidators();
  const validatorsStorage = await rpcCall<string | null>(
    rpcUrl,
    "state_getStorage",
    [validatorsKey],
  );
  const validators = decodeVecAccountId32(validatorsStorage);
  const isValidator = validators.some((v) => u8aEq(v, subject));
  if (!isValidator) return false;

  const sessionIndexHex = await rpcCall<string | null>(
    rpcUrl,
    "state_getStorage",
    [storageKeySessionCurrentIndex()],
  );
  const sessionIndex = decodeU32Le(sessionIndexHex);
  if (sessionIndex === null) return true;

  const heartbeatKey =
    storageKeyImOnlineReceivedHeartbeatsPrefix() +
    xxhashAsHex(u32LeBytes(sessionIndex), 64).slice(2) +
    u8aToHex(u32LeBytes(sessionIndex)).slice(2) +
    xxhashAsHex(subject, 64).slice(2) +
    u8aToHex(subject).slice(2);

  const authoredBlocksKey =
    storageKeyImOnlineAuthoredBlocksPrefix() +
    xxhashAsHex(subject, 64).slice(2) +
    u8aToHex(subject).slice(2);

  const [heartbeatHex, authoredBlocksHex] = await Promise.all([
    rpcCall<string | null>(rpcUrl, "state_getStorage", [heartbeatKey]).catch(
      () => null,
    ),
    rpcCall<string | null>(rpcUrl, "state_getStorage", [
      authoredBlocksKey,
    ]).catch(() => null),
  ]);

  const anyImOnlineData = heartbeatHex !== null || authoredBlocksHex !== null;
  if (!anyImOnlineData) return true;

  if (decodeTruthy(heartbeatHex)) return true;
  const authoredBlocks = decodeU32Le(authoredBlocksHex);
  return authoredBlocks !== null && authoredBlocks > 0;
}
