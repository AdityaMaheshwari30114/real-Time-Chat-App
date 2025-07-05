window.addEventListener("load", () => {
  const socket = io();

  const sendBtn = document.getElementById("sendBtn");
  const messageInput = document.getElementById("message");
  const allMessages = document.getElementById("messages");
  const fileInput = document.getElementById("fileInput");
  const userList = document.getElementById("userList"); // NEW: For displaying online users

  const user = window.USER;    // { name: "..." }
  const roomId = window.ROOM_ID;

  // Join the community room
  socket.emit("join-room", { roomId, user });

  // ======================
  // Receive Text Message
  // ======================
  socket.on("message", ({ nickname, message, time }) => {
    const p = document.createElement("p");
    p.classList.add("message-line");

    if (nickname === "Server") {
      p.innerHTML = `<span class="msg-text server-msg"><em>${message}</em></span><span class="msg-time">${time}</span>`;
    } else {
      p.innerHTML = `<span class="msg-text"><strong>${nickname}</strong>: ${message}</span><span class="msg-time">${time}</span>`;
    }

    allMessages.appendChild(p);
    allMessages.scrollTop = allMessages.scrollHeight;
  });

  // ======================
  // Send Message
  // ======================
  sendBtn.addEventListener("click", () => {
    const msg = messageInput.value.trim();
    if (msg) {
      socket.emit("room-message", { message: msg });
      messageInput.value = "";
    }
  });

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });

  // ======================
  // File Upload Handler
  // ======================
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert("Only image and PDF files allowed.");
      fileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const fileData = e.target.result;

      socket.emit("room-file-upload", {
        fileType: file.type,
        fileName: file.name,
        fileData
      });

      fileInput.value = '';
    };
    reader.readAsDataURL(file);
  });

  // ======================
  // File Receive Handler
  // ======================
  socket.on("file-message", ({ nickname, fileType, fileName, fileData, time }) => {
    const p = document.createElement("p");
    p.classList.add("message-line");

    const fileContent = document.createElement("span");
    fileContent.classList.add("msg-text");

    if (fileType.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = fileData;
      img.alt = fileName;
      img.style.maxWidth = "200px";
      img.style.display = "block";

      fileContent.innerHTML = `<strong>${nickname}</strong>:<br/>`;
      fileContent.appendChild(img);
    } else if (fileType === "application/pdf") {
      const link = document.createElement("a");
      link.href = fileData;
      link.target = "_blank";
      link.textContent = `📄 ${fileName}`;
      fileContent.innerHTML = `<strong>${nickname}</strong>:<br/>`;
      fileContent.appendChild(link);
    }

    const timeSpan = document.createElement("span");
    timeSpan.classList.add("msg-time");
    timeSpan.innerText = time;

    p.appendChild(fileContent);
    p.appendChild(timeSpan);
    allMessages.appendChild(p);
    allMessages.scrollTop = allMessages.scrollHeight;
  });

  // ======================
  // Room User List Handler (NEW)
  // ======================
  socket.on("users-list", ({ nicknames, count }) => {
    if (userList) {
      userList.innerText = `${count} online: ${nicknames.join(', ')}`;
    }
  });
});
