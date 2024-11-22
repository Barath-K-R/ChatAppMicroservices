import { Server } from "socket.io";

const io = new Server(8800, {
  cors: {
    origin: "http://localhost:3000",
  },
});

let activeUsers = [];

//for connection
io.on("connection", (socket) => {
  // add new User
  socket.on("new-user-add", (newUserId) => {
    // if user is not added previously
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
      console.log("New User Connected", activeUsers);
    }
    // send all active users to new user
    io.emit("get-users", activeUsers);
  });

  //for disconnection
  socket.on("disconnect", () => {
    // remove user from active users
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected", activeUsers);
    // send all active users to all users
    io.emit("get-users", activeUsers);
  });

  // send message to a specific user
  socket.on("send-message", (data) => {
    console.log(data);
    const { userIds } = data;
    console.log(userIds);
    const users = activeUsers.filter((user) => userIds.includes(user.userId));
    console.log(users);
    if (users.length != 0) {
      users.forEach((user) => {
        console.log("sending to " + user + " to this " + user.socketId);
        io.to(user.socketId).emit("recieve-message", data);
      });
    }
  });
});
