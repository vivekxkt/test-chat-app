
var socket = io();
var username = "";

// Prompt for username
function promptForUsername() {
  username = prompt("Please enter your name:");
  if (username) {
    socket.emit("user joined", username);
  }
}

// Show prompt when the user visits the website
window.onload = promptForUsername;

// Update members list
function updateMembersList(members) {
  var membersPopup = document.getElementById("membersPopup");
  membersPopup.innerHTML = "";

  members.forEach(function (member) {
    var memberElement = document.createElement("div");
    memberElement.className = "member";
    memberElement.textContent = member;
    membersPopup.appendChild(memberElement);
  });
}

// Toggle members popup
function toggleMembersPopup() {
  var membersPopup = document.getElementById("membersPopup");
  membersPopup.style.display = membersPopup.style.display === "block" ? "none" : "block";
}

var membersIcon = document.getElementById("membersIcon");
membersIcon.addEventListener("click", toggleMembersPopup);

var messages = document.getElementById("messages");
var form = document.getElementById("form");
var input = document.getElementById("input");


// Games 
const invokeButton = document.getElementById('invokeButton');
invokeButton.addEventListener('click', () => {
  window.open('https://chat-app-hts9.onrender.com/tictactoe', '_blank');
});

// const invokeButton = document.getElementById('invokeButton');
// invokeButton.addEventListener('click', () => {
//   window.open('http://localhost:3000/tictactoe', '_blank');
// });


form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});

socket.on("chat message", function (data) {
  var item = document.createElement("div");
  item.className = "chat-message";
  if (data.username === username) {
    item.textContent = "You: " + data.message;
  } else {
    item.textContent = data.username + ": " + data.message;
  }
  messages.appendChild(item);
  scrollToBottom();

}); 


socket.on("user joined", function(username) {
  var item = document.createElement("div");
  item.className = "chat-message user-joined";
  item.textContent = username + " ";
  messages.appendChild(item);
  scrollToBottom();
});

socket.on("user left", function(username) {
  var item = document.createElement("div");
  item.className = "chat-message user-left";
  item.textContent = username + " ";
  messages.appendChild(item);
  scrollToBottom();
});

socket.on("typing", function (username) {
  var typingElement = document.getElementById("typingMessage");
  if (!typingElement) {
    typingElement = document.createElement("div");
    typingElement.id = "typingMessage";
    typingElement.textContent = username + " is typing...";
    messages.appendChild(typingElement);
    scrollToBottom();
  } else {
    typingElement.textContent = username + " is typing...";
  }
});

socket.on("stop typing", function () {
  var typingElement = document.getElementById("typingMessage");
  if (typingElement) {
    typingElement.remove();
  }
});

input.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    socket.emit('stop typing');
  }
});

socket.on("active users", function (members) {
  updateMembersList(members);
});

function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

input.addEventListener("input", function () {
  socket.emit("typing", username);
});

input.addEventListener("blur", function () {
  socket.emit("stop typing");
});

  