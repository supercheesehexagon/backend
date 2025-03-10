"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const h3_js_1 = __importDefault(require("h3-js"));
const db_1 = __importDefault(require("./db"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
function setInfoPolygon_10(h3Index) {
    return __awaiter(this, void 0, void 0, function* () {
        const numbers = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10));
        yield db_1.default.query('INSERT INTO polygons (h3_index, level, gold, wood, ore) VALUES ($1, $2, $3, $4, $5)', [h3Index, 10, ...numbers]);
    });
}
function getInfoPolygon_10(h3Index) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield db_1.default.query('SELECT * FROM polygons WHERE h3_index = $1', [h3Index]);
        if (result.rows.length === 0) {
            return { id: 0, h3_index: h3Index, level: 10, gold: 0, wood: 0, ore: 0 };
        }
        return result.rows[0];
    });
}
app.get('/api/polygon/:id/info', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const h3Index = req.params.id;
        let data = yield getInfoPolygon_10(h3Index);
        if (data.id === 0) {
            yield setInfoPolygon_10(h3Index);
            data = yield getInfoPolygon_10(h3Index);
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
}));
function sumChildResources(parentH3Index_1) {
    return __awaiter(this, arguments, void 0, function* (parentH3Index, targetLevel = 10) {
        const children = h3_js_1.default.cellToChildren(parentH3Index, targetLevel);
        const childrenResources = yield Promise.all(children.map(child => getInfoPolygon_10(child)));
        return childrenResources.reduce((acc, { gold, wood, ore }) => ({
            gold: acc.gold + gold,
            wood: acc.wood + wood,
            ore: acc.ore + ore
        }), { gold: 0, wood: 0, ore: 0 });
    });
}
app.get('/api/polygon/:level/:id/info', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const h3Index = req.params.id;
        const data = yield sumChildResources(h3Index);
        res.json(data);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
