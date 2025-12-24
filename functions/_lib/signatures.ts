import { cryptoWaitReady, signatureVerify } from "@polkadot/util-crypto";

export async function verifySubstrateSignature(input: {
  address: string;
  message: string;
  signature: string;
}): Promise<boolean> {
  await cryptoWaitReady();
  try {
    const result = signatureVerify(
      input.message,
      input.signature,
      input.address,
    );
    return result.isValid;
  } catch {
    return false;
  }
}
