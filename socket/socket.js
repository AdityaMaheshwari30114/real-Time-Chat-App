const users = {};
const activeNicknames = new Set();
const socketToRoom = {};
const roomIdToUsers = {};  // track users per community

function setupSocket(io) {

    const broadcastUserList = () => {
        const nicknames = Object.values(users);
        io.emit('users-list', { nicknames, count: nicknames.length });
    };

    io.on('connection', (socket) => {
        console.log("A user Connected:", socket.id);

        // Global Chat Logic
        socket.on('check-nickname', nickname => {
            nickname = nickname?.trim();

            const validChars = /^[a-zA-Z0-9_]+$/;
            if (!nickname || nickname.length > 15 || !validChars.test(nickname) || nickname.toLowerCase() === "server" || activeNicknames.has(nickname)) {
                socket.emit('nickname-status', { success: false, reason: 'Invalid or taken nickname.' });
                return;
            }

            users[socket.id] = nickname;
            activeNicknames.add(nickname);

            socket.emit('nickname-status', { success: true, nickname });
            socket.broadcast.emit('message', {
                nickname: "Server",
                message: `${nickname} joined the chat`,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            });

            broadcastUserList();
        });

        // message - Handle chat messages for global chat only (no room joined)
        socket.on('user-message', message => {
            const nickname = users[socket.id] || 'Anonymous';
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // io.emit('message', { nickname, message, time }); **to all

            // Only emit to users not in any community room
            const rooms = Array.from(socket.rooms);
            const isInRoom = rooms.some(r => r !== socket.id); // if socket is in any custom room

            if (!isInRoom) {
                io.to(socket.id).emit('message', { nickname, message, time }); // send to sender
                socket.broadcast.emit('message', { nickname, message, time }); // send to others not in room
            }
        });

        // Global file upload
        socket.on('file-upload', ({ fileType, fileName, fileData, time }) => {
            const nickname = users[socket.id] || 'Anonymous';
            io.emit('file-message', {
                nickname,
                fileType,
                fileName,
                fileData,
                time
            });
        });

        // Community (Room) Chat Logic 

        socket.on("join-room", ({ roomId, user }) => {
            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.user = user;
            socketToRoom[socket.id] = roomId;

            if (!roomIdToUsers[roomId]) roomIdToUsers[roomId] = new Set();
            roomIdToUsers[roomId].add(user.name);

            socket.to(roomId).emit("message", {
                nickname: "Server",
                message: `${user.name} joined the room`,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            });

            // Send room user list
            io.to(roomId).emit("users-list", {
                nicknames: Array.from(roomIdToUsers[roomId]),
                count: roomIdToUsers[roomId].size
            });
        });

        // Room message
        socket.on("room-message", ({ message }) => {
            const { roomId, user } = socket.data;
            if (!roomId || !user) return;
            io.to(roomId).emit("message", {
                nickname: user.name,
                message,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            });
        });

        // Room file upload
        socket.on("room-file-upload", ({ fileType, fileName, fileData }) => {
            const { roomId, user } = socket.data;
            if (!roomId || !user) return;
            io.to(roomId).emit("file-message", {
                nickname: user.name,
                fileType,
                fileName,
                fileData,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            });
        });

        //Disconnect 
        socket.on("disconnect", () => {
            const nickname = users[socket.id];
            const roomId = socketToRoom[socket.id];
            const user = socket.data?.user;

            // Leave global
            if (nickname) {
                delete users[socket.id];
                activeNicknames.delete(nickname);
                socket.broadcast.emit("message", {
                    nickname: "Server",
                    message: `${nickname} left the chat`,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                });
                broadcastUserList();
            }

            // Leave room
            if (roomId && user) {
                socket.leave(roomId);
                roomIdToUsers[roomId]?.delete(user.name);
                io.to(roomId).emit("message", {
                    nickname: "Server",
                    message: `${user.name} left the room`,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                });

                io.to(roomId).emit("users-list", {
                    nicknames: Array.from(roomIdToUsers[roomId] || []),
                    count: roomIdToUsers[roomId]?.size || 0
                });

                delete socketToRoom[socket.id];
            }
        });
    });
}

module.exports = setupSocket;
