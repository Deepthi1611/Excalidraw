"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.Prisma = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_js_1 = require("./generated/prisma/client.js");
var client_js_2 = require("./generated/prisma/client.js");
Object.defineProperty(exports, "Prisma", { enumerable: true, get: function () { return client_js_2.Prisma; } });
dotenv_1.default.config({ path: node_path_1.default.resolve(__dirname, "../.env") });
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables");
}
const adapter = new adapter_pg_1.PrismaPg({ connectionString });
exports.prisma = new client_js_1.PrismaClient({ adapter });
