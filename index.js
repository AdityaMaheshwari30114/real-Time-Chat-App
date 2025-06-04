const http = require("http");             
const express = require("express");
const path = require('path');
const { Server } = require("socket.io");
const app = express();

const server = http.createServer(app); ////server is a real HTTP server
const io = new Server(server);      //io is your Socket.IO server attached to the HTTP server,
                                    //which will handle WebSocket communication with clients.

// Socket.io Setup
io.on('connection', (socket) =>{
    socket.on('user-message', message =>{
        io.emit('message', message);
    })
})

app.use(express.static(path.resolve("./public")));
app.get('/', (req,res) => {
    return res.sendFile("/public/index.html");
});

//Starting the Server
server.listen(9000, () => console.log(`Server Started at PORT 9000`));


