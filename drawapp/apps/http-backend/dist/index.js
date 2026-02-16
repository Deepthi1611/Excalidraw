"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_crypto_1 = require("node:crypto");
const middleware_1 = require("./middleware");
const config_1 = require("@repo/backend-common/config");
const types_1 = require("@repo/common/types");
// the name of the file should be same as the name we are exporting it in the package.json of the db package
const client_1 = require("@repo/db/client");
function loadDbEnvFile() {
    const envPath = node_path_1.default.resolve(__dirname, "../../../packages/db/.env");
    if (!node_fs_1.default.existsSync(envPath)) {
        return;
    }
    const raw = node_fs_1.default.readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) {
            continue;
        }
        const key = trimmed.slice(0, eqIndex).trim();
        const rawValue = trimmed.slice(eqIndex + 1).trim();
        const value = (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
            (rawValue.startsWith("'") && rawValue.endsWith("'"))
            ? rawValue.slice(1, -1)
            : rawValue;
        if (key) {
            process.env[key] = value;
        }
    }
}
loadDbEnvFile();
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`);
});
function hashPassword(password) {
    const salt = (0, node_crypto_1.randomBytes)(16).toString("hex");
    const hash = (0, node_crypto_1.scryptSync)(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}
function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) {
        return false;
    }
    const computedHash = (0, node_crypto_1.scryptSync)(password, salt, 64);
    const storedHashBuffer = Buffer.from(hash, "hex");
    if (storedHashBuffer.length !== computedHash.length) {
        return false;
    }
    return (0, node_crypto_1.timingSafeEqual)(storedHashBuffer, computedHash);
}
app.post('/signup', async (req, res) => {
    console.log('Received signup request with body:', req.body);
    const parsedData = types_1.createUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        console.log('Validation error:', parsedData.error);
        return res.status(400).json({ error: parsedData.error });
    }
    try {
        const hashedPassword = hashPassword(parsedData.data.password);
        const user = await client_1.prisma.user.create({
            data: {
                email: parsedData.data.email,
                name: parsedData.data.name,
                password: hashedPassword,
                photo: parsedData.data.photo,
            },
        });
        return res.status(201).json({ message: 'User created', id: user.id });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2002") {
                return res.status(409).json({ error: "Email already exists" });
            }
            return res.status(400).json({ error: `Database error: ${err.code}` });
        }
        const message = err instanceof Error ? err.message : "Internal Server Error";
        console.error("Signup error:", message);
        return res.status(500).json({ error: message });
    }
});
app.post('/signin', async (req, res) => {
    try {
        const parsedData = types_1.signInSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({ error: parsedData.error });
        }
        const user = await client_1.prisma.user.findFirst({
            where: { email: parsedData.data.email },
        });
        if (!user || !verifyPassword(parsedData.data.password, user.password)) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const jwtSecret = (0, config_1.getJwtSecret)();
        if (!jwtSecret)
            throw new Error("JWT_SECRET is not defined");
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, jwtSecret, { expiresIn: "3h" });
        return res.json({ token });
    }
    catch (err) {
        console.error('Error in signin route:', err);
        const message = err instanceof Error ? err.message : "Internal Server Error";
        return res.status(500).json({ error: message });
    }
});
app.post('/room', middleware_1.middleware, async (req, res) => {
    const parsedData = types_1.createRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({ error: parsedData.error });
    }
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const room = await client_1.prisma.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId,
            },
        });
        return res.status(201).json({ id: room.id, slug: room.slug });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            return res.status(409).json({ error: "Room already exists" });
        }
        const message = err instanceof Error ? err.message : "Internal Server Error";
        return res.status(500).json({ error: message });
    }
});
// to get existing chats in a room, we will create a GET endpoint. 
// This will be used when a user joins a room, we can fetch the existing chats and show it to the user.
app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const chats = await client_1.prisma.chat.findMany({
            where: { roomId: Number(roomId) },
            // include: { user: { select: { name: true, photo: true } } },
            orderBy: { id: "desc" },
            take: 50 // limit to last 50 messages for performance
        });
        res.json(chats.map(chat => ({
            id: chat.id,
            message: chat.message,
            // user: {
            //   name: chat.user.name,
            //   photo: chat.user.photo,
            // }
        })));
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Internal Server Error";
        return res.status(500).json({ error: message });
    }
});
// to get room by slug, we will create a GET endpoint. 
// This will be used when a user tries to join a room by slug, we can fetch the room details and show it to the user.
app.get("/room/:slug", async (req, res) => {
    try {
        const slug = req.params.slug;
        console.log(`Fetching room with slug: ${slug}`);
        const room = await client_1.prisma.room.findUnique({ where: { slug } });
        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }
        return res.json({ id: room.id, slug: room.slug });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Internal Server Error";
        return res.status(500).json({ error: message });
    }
});
