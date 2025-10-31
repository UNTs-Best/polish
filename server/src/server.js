import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { initDocumentSocket } from "./sockets/documentSocket.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

initDocumentSocket(io);

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
