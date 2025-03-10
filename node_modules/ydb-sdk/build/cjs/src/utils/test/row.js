"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Row = void 0;
const types_1 = require("../../types");
class Row extends types_1.TypedData {
    constructor(data) {
        super(data);
        this.id = data.id;
        this.title = data.title;
    }
}
exports.Row = Row;
__decorate([
    (0, types_1.declareType)(types_1.Types.UINT64)
], Row.prototype, "id", void 0);
__decorate([
    (0, types_1.declareType)(types_1.Types.UTF8)
], Row.prototype, "title", void 0);
