"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroyDriver = destroyDriver;
async function destroyDriver(driver) {
    if (driver) {
        await driver.destroy();
    }
}
