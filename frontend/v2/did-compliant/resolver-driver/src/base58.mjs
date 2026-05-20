const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58btcEncode(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError("base58btcEncode expects Uint8Array");
  }
  if (bytes.length === 0) return "";

  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1;
  if (zeros === bytes.length) return ALPHABET[0].repeat(zeros);

  const digits = [0];
  for (let i = zeros; i < bytes.length; i += 1) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j += 1) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let out = ALPHABET[0].repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    out += ALPHABET[digits[i]];
  }
  return out;
}

export function base64ToBytes(value) {
  if (typeof value !== "string" || value.length === 0) return null;
  try {
    return new Uint8Array(Buffer.from(value, "base64"));
  } catch {
    return null;
  }
}

export function secp256k1PublicKeyToMultibase(pubKeyBytes) {
  if (!(pubKeyBytes instanceof Uint8Array)) return null;
  if (![33, 65].includes(pubKeyBytes.length)) return null;

  // multicodec secp256k1-pub varint is 0xe7 0x01. DID-key style publicKeyMultibase
  // is multibase base58btc over multicodec || compressed_public_key.
  const prefixed = new Uint8Array(2 + pubKeyBytes.length);
  prefixed[0] = 0xe7;
  prefixed[1] = 0x01;
  prefixed.set(pubKeyBytes, 2);
  return `z${base58btcEncode(prefixed)}`;
}
