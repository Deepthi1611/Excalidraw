"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.middleware = middleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("@repo/backend-common/config");
function middleware(req, res, next) {
    try {
        const token = req.headers['authorization'] || "";
        const jwtSecret = (0, config_1.getJwtSecret)();
        if (!jwtSecret)
            throw new Error("JWT_SECRET is not defined");
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (decoded) {
            // TO DO: Add type for req.userId
            req.userId = decoded.userId;
            next();
        }
        else {
            res.status(401).send('Unauthorized');
        }
    }
    catch (err) {
        console.error('Error in middleware:', err);
        res.status(401).send('Unauthorized');
    }
}
