const http = require("http");
const express = require("express");
const path = require('path');
const { Server } = require("socket.io");
const app = express();

const server = http.createServer(app); ////server is a real HTTP server
const io = new Server(server);      //io is your Socket.IO server attached to the HTTP server,
//which will handle WebSocket communication with clients.

const users = {};
const activeNicknames = new Set();
// Socket.io Setup

const broadcastUserList = () => {
    const nicknames = Object.values(users);
    io.emit('users-list', {nicknames, count: nicknames.length});
};


io.on('connection', (socket) => {
    console.log("A user Connected:", socket.id);

    // When user sends nickname
    socket.on('check-nickname', nickname => {
        nickname = nickname?.trim();

        // Validation checks
        if (!nickname || nickname.length > 15) {
            socket.emit('nickname-status', { success: false, reason: 'Nickname must be 1-15 characters long.' });
            return;
        }

        const validChars = /^[a-zA-Z0-9_]+$/;
        if (!validChars.test(nickname)) {
            socket.emit('nickname-status', { success: false, reason: 'Nickname can only contain letters, numbers, and underscores.' });
            return;
        }

        if (activeNicknames.has(nickname) || nickname == "Server" ||  nickname == "server") {
            socket.emit('nickname-status', { success: false, reason: 'Nickname already taken.' });
            return;
        }
        // Valid nickname
        users[socket.id] = nickname;
        activeNicknames.add(nickname);

        socket.emit('nickname-status', { success: true, nickname });
        socket.broadcast.emit('message',
            {
                nickname :"Server",
                message: `${nickname} joined the chat`,
                time: new Date().toLocaleTimeString([],{hour:"2-digit", minute:"2-digit"})
            }
        );
        // Send updated list
        broadcastUserList();
    });

    

    // Handle chat messages
    socket.on('user-message', message => {
        const nickname = users[socket.id] || 'Anonymous';

        const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        io.emit('message', {nickname, message,time});
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const nickname = users[socket.id] || 'Someone';
        socket.broadcast.emit('message',
            {
                nickname:"Server",
                message: `${nickname} left the chat`,
                time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
            }); 
        activeNicknames.delete(nickname);
        delete users[socket.id];
        // Send updated list
        broadcastUserList();
    });

    //Handle file uploads
    socket.on('file-upload',({nickname, fileType, fileName, fileData, time}) =>{
        
        //Broadcast the file to all users
        io.emit('file-message',{
            nickname: users[socket.id] || 'Anonymous',
            fileType,
            fileName,
            fileData,
            time
        });

    });
});


app.use(express.static(path.resolve("./public")));
app.get('/', (req, res) => {
    return res.sendFile("/public/index.html");
});

//Starting the Server
server.listen(9000, () => console.log(`Server Started at PORT 9000`));



