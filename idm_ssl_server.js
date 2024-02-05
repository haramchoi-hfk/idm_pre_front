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
    this.category = "-1";
    this.users = [];
  }
};
var groups = [];
var names = [];
var idnames = [];
var occupied = [0,0,0,0,0,0,0];

const groupExists = (group, name) => {
  return group.name === name;
};

const removeUser = (id) => {
  var user = idnames.find(user => user.id === id);
  if (user) {
    var group = groups.find(group => group.users.includes(user.name));
    if (group) {
      group.users = group.users.filter(name => name !== user.name);
      console.log(`User ${user.socket_id} removed from group ${group.name}`);
    }
    names = names.filter(name => name !== user.name);
    idnames = idnames.filter(user => user.id !== id);
  }
};

const refresh_all_members = (socket) => {
  socket.broadcast.emit("refresh_all_members", groups);
}


//----------------------------------------------------------------------
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("check_id", (id) => {
    console.log("Checking id", id);
    if (names.includes(id)) {
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
      groups.push(newGroup);
    } else {
      groups.find(group => groupExists(group, userInput.room)).users.push(userInput.name);
    }
    names.push(userInput.name);
    idnames.push({ id: socket.id, name: userInput.name });
    socket.join(userInput.room);
    socket.to(userInput.room).emit(
      "new_member", groups.find(group => groupExists(group, userInput.room)).users
    );
    console.log(`user with id - ${userInput.name} (${socket.id}) joined room - ${userInput.room}`);
    console.log(groups.find(group => groupExists(group, userInput.room)));
  });

  socket.on("refresh_members", (room) => {
    console.log("Refreshing members", room);
    var group_exists = groups.find(group => groupExists(group, room));

    if (group_exists) {
      socket.emit("refresh_members", group_exists.users);
      socket.broadcast.emit("select_category", { room: room, category: group_exists.category, occupied: occupied});
    }else{
      socket.emit("refresh_members", []);
    }
  });

  socket.on("select_category", (data) => {
    console.log("got_request_Selecting category", data);
    groups.find(group => groupExists(group, data.room)).category = data.category;
    occupied = data.occupied.flat();
    socket.broadcast.emit("select_category", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    removeUser(socket.id);
    refresh_all_members(socket);
  });
});

