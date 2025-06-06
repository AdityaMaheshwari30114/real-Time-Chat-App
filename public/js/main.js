window.addEventListener('load', () => {
            const socket = io(); //connects to the server using WebSocket.
            const sendBtn = document.getElementById("sendBtn");
            const messageInput = document.getElementById("message");
            const allMessages = document.getElementById('messages');
            const userList = document.getElementById('userList');


            function askNickname() {
                let nickname = prompt("Enter your nickname (max 15 characters, no symbols):");
                if (!nickname || nickname.trim() === "") nickname = "Anonymous";
                socket.emit('check-nickname', nickname);
            }

            //Receive updated list from user
            socket.on('users-list', (data)=>{
                userList.innerHTML="";
                const { nicknames, count } = data;
                userList.innerText = `${count} online : ${nicknames.join(', ')}`;
            });

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
            socket.on("message", ({nickname, message, time}) => {
                const p = document.createElement('p');
                p.classList.add("message-line");
                if (nickname === "Server") {
                    p.innerHTML = `<span class="msg-text server-msg"><em>${message}</em></span><span class="msg-time">${time}</span>`;
                } else {
                p.innerHTML = `<span class="msg-text"><strong>${nickname}</strong>: ${message}</span><span class="msg-time">${time}</span>`;
                }
                allMessages.appendChild(p);
                allMessages.scrollTop = allMessages.scrollHeight;
            });

            //Sending Messages to Server
            sendBtn.addEventListener('click', e => {
                const message = messageInput.value.trim();
                console.log(message);
                if(message !=""){
                    socket.emit("user-message", message);
                    messageInput.value = '';
                }
            })

            //send msg by Enter key
            messageInput.addEventListener("keypress", e => {   
                if (e.key === "Enter") sendBtn.click();
            });

        });

