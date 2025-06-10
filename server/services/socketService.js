const { Server: SocketServer } = require("socket.io");
const { setupTerminalHandlers } = require("./terminalService");
const { setupStreamHandlers } = require("./streamService");
const { generateRoomCode } = require("../utils/RoomCodeFunction");
const { v4: uuidv4 } = require("uuid");

const rooms = new Map(); // roomId -> { users: Map<socketId, userData>, initiator: socketId }


const initializeSocket = (server) => {
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });           

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Initialize terminal and stream services
    setupTerminalHandlers(socket);
    setupStreamHandlers(socket);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });

    // Update the create-room handler
socket.on("create-room", (callback) => {
    try {
      let roomId;
      let attempts = 0;
  
      do {
        roomId = generateRoomCode();
        attempts++;
        if (attempts > 10) {
          roomId = uuidv4();
          break;
        }
      } while (rooms.has(roomId));
  
      rooms.set(roomId, {
        users: new Map([
          [
            socket.id,
            {
              id: socket.id,
              name: `User-${socket.id.slice(0, 4)}`,
              video: true,
              audio: true,
              screen: false,
            },
          ],
        ]),
        initiator: socket.id,
        createdAt: new Date(),
      });
  
      console.log(`Room created: ${roomId}`);
      callback({ roomId });
      
      // Immediately join the creator to the room
      socket.join(roomId);
      broadcastRoomState(roomId);
      
    } catch (error) {
      console.error("Error creating room:", error);
      callback({ error: "Failed to create room" });
    }
  });

    // Validate room exists
    socket.on("validate-room", (roomId, callback) => {
      callback(rooms.has(roomId));
    });

    // Get room info
    socket.on("get-room-info", (roomId, callback) => {
      if (!rooms.has(roomId)) {
        return callback({ error: "Room not found" });
      }

      const room = rooms.get(roomId);
      callback({
        roomId,
        userCount: room.users.size,
        initiator: room.initiator,
        createdAt: room.createdAt,
      });
    });

    socket.on("join", (roomId, userName, callback) => {
      if (!rooms.has(roomId)) {
        callback({ error: "Room does not exist" });
        return;
      }

      const room = rooms.get(roomId);

      // Prevent duplicate joins
      if (!room.users.has(socket.id)) {
        room.users.set(socket.id, {
          id: socket.id,
          name: userName || `User-${socket.id.slice(0, 4)}`,
          video: true,
          audio: true,
          screen: false,
        });
      }

      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);

      // Notify all users in the room (including the new joiner)
      broadcastRoomState(roomId);

      // Handle signaling (offer/answer/ICE candidates)
      socket.on("offer", ({ to, offer }) => {
        socket.to(to).emit("offer", { from: socket.id, offer });
      });

      socket.on("answer", ({ to, answer }) => {
        socket.to(to).emit("answer", { from: socket.id, answer });
      });

      socket.on("ice-candidate", ({ to, candidate }) => {
        socket.to(to).emit("ice-candidate", { from: socket.id, candidate });
      });

      // Handle media state changes
      socket.on("media-state", ({ video, audio, screen }) => {
        if (room.users.has(socket.id)) {
          const user = room.users.get(socket.id);
          user.video = video;
          user.audio = audio;
          user.screen = screen;
          socket.to(roomId).emit("media-state-changed", {
            userId: socket.id,
            video,
            audio,
            screen,
          });
        }
      });

      // Handle name changes
      socket.on("update-name", (name) => {
        if (room.users.has(socket.id)) {
          const user = room.users.get(socket.id);
          user.name = name;
          broadcastRoomState(roomId);
        }
      });

      callback({ success: true, roomId });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      handleUserDisconnection(socket.id);
    });

    socket.on("leave-room", (roomId) => {
      handleUserDisconnection(socket.id, roomId);
    });

    // Helper function to broadcast room state to all participants
    function broadcastRoomState(roomId) {
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const usersArray = Array.from(room.users.values());
        io.to(roomId).emit("room-state", {
          users: usersArray,
          initiator: room.initiator,
          roomId,
        });
      }
    }

    // Helper function to handle user disconnection
    function handleUserDisconnection(socketId, specificRoomId = null) {
      const roomsToProcess = specificRoomId
        ? [specificRoomId] // Only process the specific room
        : Array.from(rooms.keys()); // Process all rooms the user might be in (for unexpected disconnects)

      roomsToProcess.forEach((roomId) => {
        if (rooms.has(roomId)) {
          // Double-check existence in case it was deleted by another process
          const room = rooms.get(roomId);

          if (room.users.has(socketId)) {
            room.users.delete(socketId);

            // Notify remaining users about the disconnection
            io.to(roomId).emit("user-disconnected", socketId);
            console.log(
              `User ${socketId} left room ${roomId}. Remaining users: ${room.users.size}`
            );

            if (room.users.size === 0) {
              // Clean up empty room after a delay
              // Use a closure or separate mechanism to cancel if a user re-joins
              // For simplicity, current timeout is okay for immediate cleanup
              setTimeout(() => {
                if (rooms.get(roomId)?.users.size === 0) {
                  // Re-check before deleting
                  rooms.delete(roomId);
                  console.log(`Room ${roomId} deleted due to inactivity`);
                }
              }, 30000); // 30-second delay before cleaning up
            } else {
              // If initiator left, assign new initiator
              if (room.initiator === socketId) {
                const newInitiator = room.users.keys().next().value;
                room.initiator = newInitiator;
                console.log(
                  `Room ${roomId}: Initiator changed to ${newInitiator}`
                );
              }
              broadcastRoomState(roomId);
            }
          }
        }
      });
    }
  });
  return io;
};

module.exports = { initializeSocket };
