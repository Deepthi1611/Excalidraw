import z from "zod";

export const createUserSchema = z.object({
  userId: z.string(),
  name: z.string(),
  password: z.string(),
});

export const signInSchema = z.object({
  name: z.string(),
  password: z.string(),
});

export const createRoomSchema = z.object({
  name: z.string().min(3, "Room name must be at least 3 characters long").max(50, "Room name must be at most 50 characters long"),
});