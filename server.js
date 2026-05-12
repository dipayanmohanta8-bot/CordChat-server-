const db = require("./database");

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

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

    /* REGISTER */
    socket.on("register", data => {

        db.run(
            "INSERT INTO users(username,password) VALUES(?,?)",
            [data.username, data.password],
            err => {

                if (err) {
                    socket.emit("register-failed");
                } else {
                    socket.emit("register-success");
                }

            }
        );

    });

    /* LOGIN */
    socket.on("login", data => {

        db.get(
            "SELECT * FROM users WHERE username=? AND password=?",
            [data.username, data.password],
            (err, row) => {

                if (!row) {

                    socket.emit("login-failed");
                    return;

                }

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

            }
        );

    });

    /* GLOBAL CHAT */
    socket.on("chat-message", data => {

        io.emit("chat-message", data);

    });

   /* DM */
socket.on("private-message", data => {

    db.run(
        "INSERT INTO messages(sender,receiver,message) VALUES(?,?,?)",
        [data.from, data.to, data.message]
    );

    const target = users[data.to];

    if (target) {
        target.emit("private-message", data);
    }

});

/* LOAD DM HISTORY */
socket.on("load-dm", data => {

    db.all(
        `
        SELECT * FROM messages
        WHERE
        (sender=? AND receiver=?)
        OR
        (sender=? AND receiver=?)
        ORDER BY id ASC
        `,
        [
            data.user1,
            data.user2,
            data.user2,
            data.user1
        ],
        (err, rows) => {

            socket.emit(
                "dm-history",
                rows || []
            );

        }
    );

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