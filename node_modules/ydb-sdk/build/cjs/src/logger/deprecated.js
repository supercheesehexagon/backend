"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFallbackLogFunction = exports.FallbackLogger = exports.setDefaultLogger = exports.getLogger = exports.setupLogger = void 0;
const get_default_logger_1 = require("./get-default-logger");
/**
 * @deprecated
 * After refactoring the only logger that is in use, is the logger passed in object creation settings of Driver.  As
 * fallback logger there use SimpleLogger.
 */
const setupLogger = (_) => {
    // nothing
};
exports.setupLogger = setupLogger;
/**
 * @deprecated
 * After refactoring the only logger that is in use, is the logger passed in object creation settings of Driver.  As
 * fallback logger there use SimpleLogger.
 */
const getLogger = () => {
    return (0, get_default_logger_1.getDefaultLogger)();
};
exports.getLogger = getLogger;
/**
 * @deprecated
 * After refactoring the only logger that is in use, is the logger passed in object creation settings of Driver.  As
 * fallback logger there use SimpleLogger.
 */
const setDefaultLogger = () => {
    // nothing
};
exports.setDefaultLogger = setDefaultLogger;
/**
 * @deprecated
 * After refactoring the only logger that is in use, is the logger passed in object creation settings of Driver.  As
 * fallback logger there use SimpleLogger.
 */
const FallbackLogger = () => {
    // nothing
};
exports.FallbackLogger = FallbackLogger;
/**
 * @deprecated
 * After refactoring the only logger that is in use, is the logger passed in object creation settings of Driver.  As
 * fallback logger there use SimpleLogger.
 */
const getFallbackLogFunction = () => {
    // nothing
};
exports.getFallbackLogFunction = getFallbackLogFunction;
