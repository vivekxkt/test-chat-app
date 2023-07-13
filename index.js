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

app.get('/tictactoe', (req, res) => {
  res.sendFile(__dirname + '/Games/RealTimeTicTacToe/ttt.html');
});





let activeUsers = [];
let arr=[]
let playingArray=[]


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

  //  Game handle 
  
  socket.on("find",(e)=>{

    if(e.name!=null){

        arr.push(e.name)

        if(arr.length>=2){
            let p1obj={
                p1name:arr[0],
                p1value:"X",
                p1move:""
            }
            let p2obj={
                p2name:arr[1],
                p2value:"O",
                p2move:""
            }

            let obj={
                p1:p1obj,
                p2:p2obj,
                sum:1
            }
            playingArray.push(obj)

            arr.splice(0,2)

            io.emit("find",{allPlayers:playingArray})

        }

    }

  })

  socket.on("playing",(e)=>{
      if(e.value=="X"){
          let objToChange=playingArray.find(obj=>obj.p1.p1name===e.name)

          objToChange.p1.p1move=e.id
          objToChange.sum++
      }
      else if(e.value=="O"){
          let objToChange=playingArray.find(obj=>obj.p2.p2name===e.name)

          objToChange.p2.p2move=e.id
          objToChange.sum++
      }

      io.emit("playing",{allPlayers:playingArray})

  })

  socket.on("gameOver",(e)=>{
      playingArray=playingArray.filter(obj=>obj.p1.p1name!==e.name)
      console.log(playingArray)
      console.log("lol")
  })


});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
