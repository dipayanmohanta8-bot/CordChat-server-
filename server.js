const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

let users = {};

function broadcastUsers() {
    io.emit("online-users", Object.keys(users));
}

io.on("connection", socket => {
    console.log("User connected");

    socket.on("login", data => {
        socket.username = data.username;
        users[data.username] = socket;

        socket.emit("login-success", {
            username: data.username
        });

        broadcastUsers();

        io.emit("chat-message", {
            user: "System",
            message: `${data.username} joined CordChat`
        });
    });

    socket.on("chat-message", data => {
        io.emit("chat-message", data);
    });

    socket.on("private-message", data => {
        const target = users[data.to];

        if (target) {
            target.emit("private-message", data);
        }
    });

    socket.on("disconnect", () => {
        if (socket.username) {
            delete users[socket.username];

            io.emit("chat-message", {
                user: "System",
                message: `${socket.username} left CordChat`
            });

            broadcastUsers();
        }
    });
});

server.listen(3000, () => {
    console.log("Bridge server running on port 3000");
});