const http = require("http");             
const express = require("express");
const path = require('path');
const { Server } = require("socket.io");
const app = express();

const server = http.createServer(app); ////server is a real HTTP server
const io = new Server(server);      //io is your Socket.IO server attached to the HTTP server,
                                    //which will handle WebSocket communication with clients.

const users={};
// Socket.io Setup

io.on('connection', (socket) =>{
    console.log("A user Connected:", socket.id);

    // When user sends nickname
    socket.on('set-nickname', nickname =>{
        users[socket.id] = nickname;
    socket.broadcast.emit('message', `${nickname} joined the chat`);
    });

    // Handle chat messages
    socket.on('user-message', message =>{
        const nickname =users[socket.id] ||'Anonymous';
        io.emit('message', `${nickname}: ${message}`);
    });

    // Handle disconnect
    socket.on('disconnect', ()=>{
    const nickname =users[socket.id] || 'Someone';
    socket.broadcast.emit('message', `${nickname} left the chat`);
    delete users[socket.id];
    })
});


app.use(express.static(path.resolve("./public")));
app.get('/', (req,res) => {
    return res.sendFile("/public/index.html");
});

//Starting the Server
server.listen(9000, () => console.log(`Server Started at PORT 9000`));


