window.addEventListener('load', () => {
            const socket = io(); //connects to the server using WebSocket.
            const sendBtn = document.getElementById("sendBtn");
            const messageInput = document.getElementById("message");
            const allMessages = document.getElementById('messages');


            function askNickname() {
                let nickname = prompt("Enter your nickname (max 15 characters, no symbols):");
                if (!nickname || nickname.trim() === "") nickname = "Anonymous";
                socket.emit('check-nickname', nickname);
            }

            // Handle nickname validation response
            socket.on('nickname-status', data => {
                if (data.success) {
                    console.log("Nickname accepted:", data.nickname);
                } else {
                    alert(`Nickname rejected: ${data.reason}`);
                    askNickname(); // Retry
                }
            });
            askNickname();


            //Receiving Messages from Server
            socket.on("message", (message) => {
                const p = document.createElement('p');
                p.innerText = message;
                allMessages.appendChild(p);
            });

            //Sending Messages to Server
            sendBtn.addEventListener('click', e => {
                const message = messageInput.value;
                console.log(message);

                socket.emit("user-message", message);
                messageInput.value = '';
            })
        });

