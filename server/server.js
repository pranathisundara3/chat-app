import express from 'express';
import "dotenv/config";
import cors from 'cors';
import http from 'http';
import {connectDb} from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import chatRequestRouter from './routes/chatRequestRoutes.js';
import { Server } from "socket.io";

// create express app and http server
const app = express();
const server = http.createServer(app);
//initialize socket.io server

export const io = new Server(server,{
  cors: {
    origin: "*"
  }
});
// store online users
export const userSocketMap={}; //{userId: socketId
// socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected: " + userId);
  if(userId)
    userSocketMap[userId] = socket.id;
  //emit online users to all connected  clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  socket.on("disconnect", () => {
    console.log("User disconnected: " + userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// middleware setup
app.use(express.json({limit: '4mb' }));
app.use(cors());
// routes setup
app.use("/api/status", (req, res) => res.send("server is live"));
app.use("/api/auth", userRouter);
app.use("/api/message", messageRouter);
app.use("/api/chat-request", chatRequestRouter);
//connect to database and start server
await connectDb();
if(process.env.NODE_ENV !== 'production'){
const PORT = process.env.PORT || 5000;

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the old server process or change PORT in .env.`);
      process.exit(1);
    }

    console.error('Server startup error:', error);
    process.exit(1);
  });

  server.listen(PORT, () => console.log("Server is running on port :" + PORT));

}
//export server for vercel deployment
export default server;