"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLong = toLong;
const long_1 = __importDefault(require("long"));
function toLong(value) {
    if (typeof value === 'number') {
        return long_1.default.fromNumber(value);
    }
    return value;
}
