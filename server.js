const express = require('express');
const WebSocket = require('ws');
const uuidv4 = require('uuid/v4');

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
  // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${PORT}`));

// Create the WebSockets server
const wss = new WebSocket.Server({ server });

//Broadcast to all
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
  console.log('Client connected');

  //count how many users are connected and sent to client
  const userCount = wss.clients.size;
  const userStatusUpdate = {
    type: "userStatusUpdate",
    content: userCount
  }
  wss.broadcast(JSON.stringify(userStatusUpdate));

  //call back that handles user messages and logs them
  ws.onmessage = function (event) {
    const data = JSON.parse(event.data);
    const id = uuidv4();
    let response = null;
    const type = data.type;
    const content = data.content;
    const imageURL = data.imageURL;
    const colors = ["#00A7E5", "#9500FF", "#00D4A9", "#003EFF"]
    const userColor = colors[Math.floor(Math.random() * colors.length)];


    //create msg or notification object to send back to client
    switch (type) {
      case "incomingMessage":
        const { username } = data;
        response = {
          id,
          username,
          userColor,
          content,
          imageURL,
          type
        }
        break;
      case "incomingNotification":
        const { oldUsername, newName } = data;
        response = {
          id,
          oldUsername,
          newName,
          content,
          type
        }
        break;
      default:
    }

    //send msg back to all connected clients with an added unique ID
    wss.broadcast(JSON.stringify(response))
  }



  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected')
    wss.broadcast(JSON.stringify(userStatusUpdate));
  });
});