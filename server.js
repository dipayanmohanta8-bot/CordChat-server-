const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

/* health route */
app.get("/", (req, res) => {
    res.send("CordChat server is running");
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
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
        if (target) target.emit("private-message", data);
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

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("CordChat server running on port " + PORT);
});
