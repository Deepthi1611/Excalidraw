import fs from "node:fs";
import path from "node:path";
import express from 'express';
import jwt from 'jsonwebtoken';
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { middleware } from './middleware';
import { getJwtSecret } from "@repo/backend-common/config";
import {createUserSchema, signInSchema, createRoomSchema } from "@repo/common/types";
// the name of the file should be same as the name we are exporting it in the package.json of the db package
import { prisma, Prisma } from "@repo/db/client";

function loadDbEnvFile(): void {
  const envPath = path.resolve(__dirname, "../../../packages/db/.env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, "utf8");
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
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;
    if (key) {
      process.env[key] = value;
    }
  }
}

loadDbEnvFile();

const app = express();
const port = 3000;

app.use(express.json());

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }
  const computedHash = scryptSync(password, salt, 64);
  const storedHashBuffer = Buffer.from(hash, "hex");
  if (storedHashBuffer.length !== computedHash.length) {
    return false;
  }
  return timingSafeEqual(storedHashBuffer, computedHash);
}

app.post('/signup', async (req, res) => {
  console.log('Received signup request with body:', req.body);
  const parsedData = createUserSchema.safeParse(req.body);
  
  if (!parsedData.success) {
    console.log('Validation error:', parsedData.error);
    return res.status(400).json({ error: parsedData.error });
  }

  try {
    const hashedPassword = hashPassword(parsedData.data.password);
    const user = await prisma.user.create({
      data: {
        email: parsedData.data.email,
        name: parsedData.data.name,
        password: hashedPassword,
        photo: parsedData.data.photo,
      },
    });

    return res.status(201).json({ message: 'User created', id: user.id });
  } catch (err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
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
    const parsedData = signInSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ error: parsedData.error });
    }

    const user = await prisma.user.findFirst({
      where: { email: parsedData.data.email },
    });

    if (!user || !verifyPassword(parsedData.data.password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const jwtSecret = getJwtSecret();
    if (!jwtSecret) throw new Error("JWT_SECRET is not defined");
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "3h" });
    return res.json({ token });
  } catch (err: unknown) {
    console.error('Error in signin route:', err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({ error: message }); 
  }
});

app.post('/room', middleware, async (req, res) => {
  const parsedData = createRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({ error: parsedData.error });
  }

  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const room = await prisma.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId,
      },
    });
    return res.status(201).json({ id: room.id, slug: room.slug });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "Room already exists" });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({ error: message });
  }
});

// to get existing chats in a room, we will create a GET endpoint. 
// This will be used when a user joins a room, we can fetch the existing chats and show it to the user.
app.get("/chats/:roomId", middleware, async (req, res) => {
  try {
  const roomId = req.params.roomId;
  const chats = await prisma.chat.findMany({
    where: { roomId: Number(roomId) },
    // include: { user: { select: { name: true, photo: true } } },
    orderBy: { id: "desc" },
    take: 50 // limit to last 50 messages for performance
  }) 
  res.json(chats.map(chat => ({
    id: chat.id,
    message: chat.message,
    // user: {
    //   name: chat.user.name,
    //   photo: chat.user.photo,
    // }
  })));
}catch (err: unknown) {
  const message = err instanceof Error ? err.message : "Internal Server Error";
  return res.status(500).json({ error: message });
}
});