const {WebSocketServer, WebSocket} = require('ws');
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request } from "express";
import { JWT_SECRET } from "@repo/backend-common/config"

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws: WebSocket, req: Request) {
  try {
  console.log('A new client connected!');
  const url = req.url;
  if(!url){
    return;
  }
  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";
  console.log('Token:', token);

  if(!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  const decoded = jwt.verify(token, JWT_SECRET);

  if(!decoded || !(decoded as JwtPayload).userId) { 
    ws.close(1008, 'Invalid token');
    return;
  }

  ws.send('Welcome New Client!');
} catch (err) {
  console.error('Error during WebSocket connection:', err);
  ws.close(1011, 'Internal Server Error');
}
});