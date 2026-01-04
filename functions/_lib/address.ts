import { cryptoWaitReady, decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";
import { encodeAddress } from "@polkadot/util-crypto";

// Humanode mainnet SS58 format (produces `hm...`-prefixed addresses).
export const HUMANODE_SS58_FORMAT = 5234;

export async function addressToPublicKeyHex(
  address: string,
): Promise<string | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  await cryptoWaitReady();
  try {
    return u8aToHex(decodeAddress(trimmed));
  } catch {
    return null;
  }
}

export async function canonicalizeHmndAddress(
  address: string,
): Promise<string | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  await cryptoWaitReady();
  try {
    // decodeAddress accepts any SS58 format; re-encode into the Humanode prefix.
    return encodeAddress(trimmed, HUMANODE_SS58_FORMAT);
  } catch {
    return null;
  }
}

export async function addressesReferToSameKey(
  a: string,
  b: string,
): Promise<boolean> {
  const left = a.trim();
  const right = b.trim();
  if (!left || !right) return false;
  if (left === right) return true;
  const [pkA, pkB] = await Promise.all([
    addressToPublicKeyHex(left),
    addressToPublicKeyHex(right),
  ]);
  return Boolean(pkA && pkB && pkA === pkB);
}
