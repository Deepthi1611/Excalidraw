import express from 'express';
import jwt from 'jsonwebtoken';
import { middleware } from './middleware';
import { JWT_SECRET } from "@repo/backend-common/config";
import {createUserSchema, signInSchema, createRoomSchema } from "@repo/common/types";

const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

app.post('/signup', (req, res) => {
  const data = createUserSchema.safeParse(req.body);
  if (!data.success) {
    res.status(400).json({ error: data.error });
  }
});

app.post('/signin', (req, res) => {
  const data = signInSchema.safeParse(req.body);
  if (!data.success) {
    res.status(400).json({ error: data.error });
  }
  const userId = 1;
  if(!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  console.log(JWT_SECRET)
  const token = jwt.sign({ userId }, JWT_SECRET , { expiresIn: '3h' }, (err, token) => {
    if (err) {
      res.status(500).send('Error signing token');
    } else {
      res.json({ token });
    }
  });
  res.json({ token });
});

app.post('/room', middleware, (req, res) => {
  const data = createRoomSchema.safeParse(req.body);
  if (!data.success) {
    res.status(400).json({ error: data.error });
  }
  res.send('room');
  // db call
});