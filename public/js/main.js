window.addEventListener('load', () => {
            const socket = io(); //connects to the server using WebSocket.
            const sendBtn = document.getElementById("sendBtn");
            const messageInput = document.getElementById("message");
            const allMessages = document.getElementById('messages');
            const userList = document.getElementById('userList');

            const fileInput = document.getElementById("fileInput");



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

            //Handle File Selection
            fileInput.addEventListener('change', ()=>{
                const file = fileInput.files[0];

                if(!file) return;

                const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'application/pdf'];

                if(!allowedTypes.includes(file.type)){
                    alert("Only image and pdf files are allowed.");
                    fileInput.value ="";
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    const fileData = e.target.result;

                    socket.emit('file-upload', {
                        nickname : "Anonymous",
                        fileType : file.type,
                        fileName : file.name,
                        fileData,  //base64 string
                        time: new Date().toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'}),
                    });
                    fileInput.value = '';
                };
                reader.readAsDataURL(file); // convert file to base64
            });

            // Handle and display incoming File messages
            socket.on('file-message', ({nickname, fileType, fileName, fileData, time})=>{
                const p = document.createElement('p');
                p.classList.add('message-line');

                const fileContent = document.createElement('span');
                fileContent.classList.add('msg-text');

                if(fileType.startsWith("image/")){
                    const img = document.createElement('img');
                    img.src = fileData;
                    img.alt = fileName;
                    img.style.maxWidth = "200px";
                    img.style.display = "block";

                    fileContent.innerHTML = `<strong>${nickname}</strong>:<br/>`;
                    fileContent.appendChild(img);
                }
                else if(fileType === "application/pdf"){
                    const link = document.createElement('a');
                    
                    link.href = fileData;
                    link.target = "_blank";
                    link.textContent = `📄 ${fileName}`;

                    fileContent.innerHTML = `<strong>${nickname}</strong>:<br/>`
                    fileContent.appendChild(link);
                }

                const timeSpan = document.createElement('span');
                timeSpan.classList.add("msg-time");
                timeSpan.innerText = time;

                p.appendChild(fileContent);
                p.appendChild(timeSpan);
                allMessages.appendChild(p);
                allMessages.scrollTop = allMessages.scrollHeight;
            });

        });

