const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const socketIO = require('socket.io');

// Use CORS with default settings
app.use(cors());

// Serve static files from 'public' directory
app.use(express.static('out'));

// HTTPS server options with SSL certificates
const options = {
    key: fs.readFileSync('/etc/nginx/ssl/cert.key'),
    cert: fs.readFileSync('/etc/nginx/ssl/cert.pem')
};

// Create an HTTPS server that integrates with the Express app
var server = https.createServer(options, app).listen(8080, ()=>{
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server is listening at https://' + host + ':' + port);
});

var io = socketIO(server);


//----------------------------------------------------------------------

class Group {
  constructor() {
    this.name = "";
    this.category = "";
    this.users = [];
  }
};
var groups = [];
var ids = [];

const groupExists = (group, name) => {
  return group.name === name;
};

//----------------------------------------------------------------------
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("check_id", (id) => {
    console.log("Checking id", id);
    if (ids.includes(id)) {
      socket.emit("is_duplicated_id", { id: id, is_duplicated: true });
    } else {
      socket.emit("is_duplicated_id", { id: id, is_duplicated: false });
    }
  });

  socket.on("join_room", (userInput) => {
    if (!groups.some(group => groupExists(group, userInput.room))) {
      var newGroup = new Group();
      newGroup.name = userInput.room;
      newGroup.users.push(userInput.name);
      ids.push(userInput.name);
      groups.push(newGroup);
    } else {
      groups.find(group => groupExists(group, userInput.room)).users.push(userInput.name);
      ids.push(userInput.name);
    }
    socket.join(userInput.room);
    socket.to(userInput.room).emit(
      "new_member", groups.find(group => groupExists(group, userInput.room)).users
    );
    console.log(`user with id - ${userInput.name} (${socket.id}) joined room - ${userInput.room}`);
    console.log(groups.find(group => groupExists(group, userInput.room)));
  });

  socket.on("send_msg", (data) => {
    console.log(data, "DATA");
    //This will send a message to a specific room ID
    socket.to(data.roomId).emit("receive_msg", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

