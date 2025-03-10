"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidToValue = uuidToValue;
exports.uuidToNative = uuidToNative;
const node_buffer_1 = require("node:buffer");
const long_1 = __importDefault(require("long"));
const to_long_1 = require("./utils/to-long");
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
function uuidToValue(uuid) {
    if (!UUID_REGEX.test(uuid)) {
        throw new Error(`Incorrect UUID value: ${uuid}`);
    }
    // Remove dashes from the UUID string
    const hex = uuid.replace(/-/g, '');
    // Create a buffer from the hexadecimal string
    const bytes = node_buffer_1.Buffer.from(hex, 'hex');
    // Swap byte order for the first three fields of the UUID (big-endian to little-endian)
    // First 4 bytes (indices 0-3)
    bytes[0] ^= bytes[3];
    bytes[3] ^= bytes[0];
    bytes[0] ^= bytes[3];
    bytes[1] ^= bytes[2];
    bytes[2] ^= bytes[1];
    bytes[1] ^= bytes[2];
    // Next 2 bytes (indices 4-5)
    bytes[4] ^= bytes[5];
    bytes[5] ^= bytes[4];
    bytes[4] ^= bytes[5];
    // Another 2 bytes (indices 6-7)
    bytes[6] ^= bytes[7];
    bytes[7] ^= bytes[6];
    bytes[6] ^= bytes[7];
    // Read low128 and high128 values from the buffer in little-endian format
    const low128 = long_1.default.fromBytesLE(bytes.slice(0, 8), true);
    const high128 = long_1.default.fromBytesLE(bytes.slice(8), true);
    return { low_128: low128, high_128: high128 };
}
function uuidToNative(value) {
    const low128 = (0, to_long_1.toLong)(value.low_128);
    const high128 = (0, to_long_1.toLong)(value.high_128);
    // Create a 16-byte buffer
    const bytes = node_buffer_1.Buffer.alloc(16);
    // Write low128 and high128 values to the buffer in little-endian format
    bytes.set(low128.toBytesLE(), 0);
    bytes.set(high128.toBytesLE(), 8);
    // Swap byte order for the first three fields of the UUID (little-endian to big-endian)
    // First 4 bytes (indices 0-3)
    bytes[0] ^= bytes[3];
    bytes[3] ^= bytes[0];
    bytes[0] ^= bytes[3];
    bytes[1] ^= bytes[2];
    bytes[2] ^= bytes[1];
    bytes[1] ^= bytes[2];
    // Next 2 bytes (indices 4-5)
    bytes[4] ^= bytes[5];
    bytes[5] ^= bytes[4];
    bytes[4] ^= bytes[5];
    // Another 2 bytes (indices 6-7)
    bytes[6] ^= bytes[7];
    bytes[7] ^= bytes[6];
    bytes[6] ^= bytes[7];
    // Convert the buffer to a hexadecimal string
    const hex = bytes.toString('hex');
    // Form the UUID string
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
// @ts-ignore
// For future use, when migrate to BigInt
function uuidFromBigInts(low128, high128) {
    // Create a 16-byte buffer
    const bytes = node_buffer_1.Buffer.alloc(16);
    // Write low128 and high128 values to the buffer in little-endian format
    bytes.writeBigUInt64LE(low128, 0);
    bytes.writeBigUInt64LE(high128, 8);
    // Swap byte order for the first three fields of the UUID (little-endian to big-endian)
    // First 4 bytes (indices 0-3)
    bytes[0] ^= bytes[3];
    bytes[3] ^= bytes[0];
    bytes[0] ^= bytes[3];
    bytes[1] ^= bytes[2];
    bytes[2] ^= bytes[1];
    bytes[1] ^= bytes[2];
    // Next 2 bytes (indices 4-5)
    bytes[4] ^= bytes[5];
    bytes[5] ^= bytes[4];
    bytes[4] ^= bytes[5];
    // Another 2 bytes (indices 6-7)
    bytes[6] ^= bytes[7];
    bytes[7] ^= bytes[6];
    bytes[6] ^= bytes[7];
    // Convert the buffer to a hexadecimal string
    const hex = bytes.toString('hex');
    // Form the UUID string
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
// @ts-ignore
// For future use, when migrate to BigInt
function bigIntsFromUuid(uuid) {
    // Remove dashes from the UUID string
    const hex = uuid.replace(/-/g, '');
    // Create a buffer from the hexadecimal string
    const bytes = node_buffer_1.Buffer.from(hex, 'hex');
    // Swap byte order for the first three fields of the UUID (big-endian to little-endian)
    // First 4 bytes (indices 0-3)
    bytes[0] ^= bytes[3];
    bytes[3] ^= bytes[0];
    bytes[0] ^= bytes[3];
    bytes[1] ^= bytes[2];
    bytes[2] ^= bytes[1];
    bytes[1] ^= bytes[2];
    // Next 2 bytes (indices 4-5)
    bytes[4] ^= bytes[5];
    bytes[5] ^= bytes[4];
    bytes[4] ^= bytes[5];
    // Another 2 bytes (indices 6-7)
    bytes[6] ^= bytes[7];
    bytes[7] ^= bytes[6];
    bytes[6] ^= bytes[7];
    // Read low128 and high128 values from the buffer in little-endian format
    const low128 = bytes.readBigUInt64LE(0);
    const high128 = bytes.readBigUInt64LE(8);
    return { low128, high128 };
}
