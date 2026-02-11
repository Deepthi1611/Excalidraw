import express from 'express';
import jwt from 'jsonwebtoken';
import { middleware } from './middleware';
import { JWT_SECRET } from "@repo/backend-common/config";
import {createUserSchema, signInSchema, createRoomSchema } from "@repo/common/types";
// the name of the file should be same as the name we are exporting it in the package.json of the db package
import {prisma} from "@repo/db/client";

const app = express();
const port = 3000;

app.use(express.json());

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});

app.post('/signup', async (req, res) => {
  console.log('Received signup request with body:', req.body);
  const parsedData = createUserSchema.safeParse(req.body);
  
  if (!parsedData.success) {
    console.log('Validation error:', parsedData.error);
    return res.status(400).json({ error: parsedData.error });
  }

  try {
    await prisma.user.create({
      data: {
        email: parsedData.data.email,
        name: parsedData.data.name,
        password: parsedData.data.password,
        photo: parsedData.data.photo,
      },
    });

    return res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error('Error in signup route:', err);
    return res.status(500).send('Internal Server Error');
  }
});

app.post('/signin', (req, res) => {
  try {
  const data = signInSchema.safeParse(req.body);
  if (!data.success) {
    res.status(400).json({ error: data.error });
  }
  const userId = "1";
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
  } catch (err) {
    console.error('Error in signin route:', err);
    res.status(500).send('Internal Server Error'); 
  }
});

app.post('/room', middleware, (req, res) => {
  const data = createRoomSchema.safeParse(req.body);
  if (!data.success) {
    res.status(400).json({ error: data.error });
  }
  res.send('room');
  // db call
});
