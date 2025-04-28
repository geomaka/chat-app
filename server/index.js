const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// MongoDB connection
mongoose.connect(process.env.Mongo, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Mongoose Schema
const messageSchema = new mongoose.Schema({
  room: String,
  author: String,
  message: String,
  time: String,
  deleted: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

io.on("connection", (socket) => {
  console.log(`🔵 User connected: ${socket.id}`);

  socket.on("send_message", async (data) => {
    try {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;

      const newMessage = new Message({
        room: data.room,
        author: data.author,
        message: data.message,
        time: formattedTime
      });

      const savedMessage = await newMessage.save();
      io.to(data.room).emit("receive_message", savedMessage); 
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on('join_room', async (room) => {
    socket.join(room);
    console.log(`User with ID: ${socket.id} joined room: ${room}`);

    try {
      const messages = await Message.find({ room: room }).sort({ createdAt: 1 });
      socket.emit('previous_messages', messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  });

  socket.on('delete_message', async (data) => {
    const { messageId, author } = data;

    try {
      const message = await Message.findById(messageId);

      if (!message) {
        socket.emit('delete_error', { error: 'Message not found.' });
        return;
      }

      if (message.author !== author) {
        socket.emit('delete_error', { error: 'You can only delete your own messages.' });
        return;
      }

      const fiveMinutes = 5 * 60 * 1000;
      const now = new Date();

      if (now - message.createdAt > fiveMinutes) {
        socket.emit('delete_error', { error: 'You can only delete messages within 5 minutes.' });
        return;
      }

      message.deleted = true;
      await message.save();

      console.log(`Message soft-deleted: ${messageId}`);

      io.to(message.room).emit('message_deleted', { messageId });

    } catch (err) {
      console.error(' Error deleting message:', err);
      socket.emit('delete_error', { error: 'Server error while deleting message.' });
    }
  });

  socket.on("disconnect", () => {
    console.log(` User disconnected: ${socket.id}`);
  });
});

server.listen(3001, () => {
  console.log(" Server running on port 3001");
});
