const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;


// Firebase
const admin = require('firebase-admin');
const serviceAccount = require('./keys/serviceAccountKey.json'); // Replace with your service account key file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://chat-app-298bc-default-rtdb.firebaseio.com' // Replace with your Firebase storage bucket URL
});

const db = admin.firestore();

// Serve static files from the "public" directory
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client/index.html');
});



let activeUsers = [];



const { spawn } = require('child_process');

function invokeServer2() {
  const child = spawn('node', ['./Games/RealTimeTicTacToe/server2.js']);

  child.stdout.on('data', (data) => {
    console.log(`Server2 Output: ${data}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`Server2 Error: ${data}`);
  });

  child.on('close', (code) => {
    console.log(`Server2 process exited with code ${code}`);
  });
}

// Call the function to invoke Server2
invokeServer2();

io.on("connection", (socket) => {
  socket.on("user joined", (username) => {
    socket.username = username;
    activeUsers.push(username);
    io.emit("user joined", `${username} joined the room`);
    io.emit("active users", activeUsers);
  });

  socket.on('chat message', (msg) => {
    io.emit("chat message", { username: socket.username, message: msg });
    const chatRef = admin.database().ref('chats'); // Create a reference to 'chats' node in Firebase Realtime Database
    const newChatRef = chatRef.push(); // Generate a unique ID for the new chat message

    const timestamp = Date.now();
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleString();
      
    const chatData = {
      Name: socket.username,
      Message: msg,
      Timestamp: formattedDate,
      IPAddress: socket.request.connection.remoteAddress,
      Device: socket.request.headers['user-agent'],
     
    };
  
    newChatRef.set(chatData); // Save the chat message data to the database
   
  });


  socket.on("disconnect", () => {
    if (socket.username) {
      activeUsers = activeUsers.filter((user) => user !== socket.username);
      io.emit("user left", `${socket.username} left the room`);
      io.emit("active users", activeUsers);
    }
  });

  socket.on("typing", () => {
    socket.broadcast.emit("typing", socket.username);
  });

  socket.on("stop typing", () => {
    socket.broadcast.emit("stop typing");
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
