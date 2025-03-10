"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HRInterval = void 0;
/**
 * Formats time interval in human-readable form in toString().
 */
class HRInterval {
    periodMs;
    constructor(periodMs) {
        this.periodMs = periodMs;
    }
    toString() {
        let remaining = Math.trunc(this.periodMs / 1000);
        const hours = Math.trunc(remaining / 60 / 60);
        remaining -= hours * 60 * 60;
        const minutes = Math.trunc(remaining / 60);
        const seconds = remaining - minutes * 60;
        return `${hours.toString()
            .padStart(2, '0')}:${minutes.toString()
            .padStart(2, '0')}:${seconds.toString()
            .padStart(2, '0')}`;
    }
}
exports.HRInterval = HRInterval;
