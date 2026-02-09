const {WebSocketServer, WebSocket} = require('ws');

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws: WebSocket) {
  console.log('A new client connected!');
  ws.send('Welcome New Client!');
});