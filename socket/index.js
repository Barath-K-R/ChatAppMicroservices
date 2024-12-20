import { Server } from "socket.io";

const io = new Server(8800, {
  cors: {
    origin: "http://localhost:3000",
  },
});

let activeUsers = [];

io.on("connection", (socket) => {

  socket.on("new-user-add", (newUserId) => {

    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
      console.log("New User Connected", activeUsers);
    }
    io.emit("get-users", activeUsers);
  });

  socket.on("disconnect", () => {

    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected", activeUsers);

    io.emit("get-users", activeUsers);
  });

  socket.on("send-message", (data) => {
    const { userIds } = data;
    const users = activeUsers.filter((user) => userIds.includes(user.userId));

    if (users.length != 0) {
      users.forEach((user) => {
        console.log("sending to " + user.userId + " to this " + user.socketId);
        io.to(user.socketId).emit("recieve-message", data);
      });
    }
  });

   socket.on("send-thread-message", (threadData) => {
    const { userIds} = threadData;

    console.log("Thread Message Data:", threadData);

    const users = activeUsers.filter((user) => userIds.includes(user.userId));

    if (users.length !== 0) { 
      users.forEach((user) => {
        io.to(user.socketId).emit("recieve-thread-message", {
          threadData
        });
      });
    }
  });
  socket.on("send-reaction", (reactionData) => {
    const { messageId, reaction, userId, recipients,username} = reactionData;

    console.log("Reaction Event Data:", reactionData);

    const users = activeUsers.filter((user) => recipients.includes(user.userId));
    if (users.length !== 0) {
      users.forEach((user) => {
        io.to(user.socketId).emit("recieve-reaction", {
          messageId,
          reaction,
          userId,
          username
        });
      });
    }
  });
  
});
