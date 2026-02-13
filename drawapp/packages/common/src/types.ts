import z, { email } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  password: z.string(),
  photo: z.string().url().optional(),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createRoomSchema = z.object({
  name: z.string().min(3, "Room name must be at least 3 characters long").max(50, "Room name must be at most 50 characters long"),
});
