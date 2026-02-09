"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("./middleware");
const config_1 = require("@repo/backend-common/config");
const types_1 = require("@repo/common/types");
const app = (0, express_1.default)();
const port = 3000;
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
app.post('/signup', (req, res) => {
    const data = types_1.createUserSchema.safeParse(req.body);
    if (!data.success) {
        res.status(400).json({ error: data.error });
    }
});
app.post('/signin', (req, res) => {
    const data = types_1.signInSchema.safeParse(req.body);
    if (!data.success) {
        res.status(400).json({ error: data.error });
    }
    const userId = 1;
    if (!config_1.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    console.log(config_1.JWT_SECRET);
    const token = jsonwebtoken_1.default.sign({ userId }, config_1.JWT_SECRET, { expiresIn: '3h' }, (err, token) => {
        if (err) {
            res.status(500).send('Error signing token');
        }
        else {
            res.json({ token });
        }
    });
    res.json({ token });
});
app.post('/room', middleware_1.middleware, (req, res) => {
    const data = types_1.createRoomSchema.safeParse(req.body);
    if (!data.success) {
        res.status(400).json({ error: data.error });
    }
    res.send('room');
    // db call
});
