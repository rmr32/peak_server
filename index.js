// Import modules
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;
var server = http.createServer(app);
const Room = require('./models/room');
var io = require('socket.io')(server);


// Middleware
app.use(express.json());

const DB = "mongodb+srv://rmr32:32@cluster0.7g6dgqm.mongodb.net/?retryWrites=true&w=majority";

// io.on("connection", (socket) => {
//     console.log("connected!");
//     socket.on("createRoom", async ({ nickname }) => {
//         try{
//             let room = new Room();
//             let player = {
//                 socketID: socket.ID,
//                 nickname: nickname,
//                 playerType: 'X',
//         };
//         room.players.push(player);
//         room.turn = player;
//         room = await room.save();
//         const roomID = room._id.toString();
//         socket.join(roomID);

//         io.to(roomID).emit("createRoomSuccess", room);
//         } catch(e) {
//             console.log(e);
//         }
// console.log('socketid');
// console.log(socket.ID);
// console.log(socketID);
// console.log(socket._id);
//     });

io.on("connection", (socket) => {
    console.log("connected!");
    socket.on("createRoom", async ({ nickname }) => {

      try {
        // room is created
        let room = new Room();
        let player = {
          socketID: socket.id,
          nickname: nickname,
          playerType: "X",
        };
        room.players.push(player);
        room.turn = player;
        room = await room.save();
        console.log(room);
        const roomId = room._id.toString();
  
        socket.join(roomId);

        io.to(roomId).emit("createRoomSuccess", room);
      } catch (e) {
        console.log(e);
      }
    });

    // socket.on('joinRoom', async ({nickname, roomID}) => {
    //     try {
    //         if(!roomID.match(/^[0-9a-fA-F]{24}$/)) {
    //             socket.emit('errorOccurred', 'Please enter a valid room ID.');
    //         return;
    //         }
    //         let room = await Room.findById(roomID);
    //         if(room.isJoin) {
    //             let player = {
    //                 nickname: nickname,
    //                 socketID: socket.ID,
    //                 playerType: '0',
    //             }
    //             socket.join(roomID);
    //             room.players.push(player);
    //             room.isJoin = false;
    //             room = await room.save();
    //             console.log(room);
    //             io.to(roomID).emit("joinRoomSuccess", room);
    //             io.to(roomID).emit("updatePlayers", room.players);
    //             io.to(roomID).emit('updateRoom', room);
    //         } else {
    //             socket.emit('errorOccurred', 'The game is in progress, try again later.');
    //         }
    //     } catch (e) {
    //         console.log(e);
    //     }
    // });

    socket.on("joinRoom", async ({ nickname, roomId }) => {
        try {
          if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
            socket.emit("errorOccurred", "Please enter a valid room ID.");
            return;
          }
          let room = await Room.findById(roomId);
    
          if (room.isJoin) {
            let player = {
              nickname: nickname,
              socketID: socket.id,
              playerType: "O",
            };
            socket.join(roomId);
            room.players.push(player);
            room.isJoin = false;
            room = await room.save();
            io.to(roomId).emit("joinRoomSuccess", room);
            io.to(roomId).emit("updatePlayers", room.players);
            io.to(roomId).emit("updateRoom", room);
          } else {
            socket.emit(
              "errorOccurred",
              "The game is in progress, try again later."
            );
          }
        } catch (e) {
          console.log(e);
        }
      });

    // For Game
    // socket.on('tap', async ({index, roomID}) => {
    //     console.log('testing tap');
    //     try{
    //         let room = await Room.findById(roomID);          
    //         let choice = room.turn.playerType;
    //         if(room.turnIndex == 0) {
    //             room.turn = room.players[1];
    //             room.turnIndex = 1;
    //         } else {
    //             room.turn = room.players[0];
    //             room.turnIndex = 0;
    //         }
    //         room = await room.save();
    //         io.to(roomID).emit("tapped", {
    //             index,
    //             choice,
    //             room,
    //         });

    //     } catch (e) {
    //         console.log(e);
    //     }
    // });

    socket.on("tap", async ({ index, roomId }) => {
        try {
          let room = await Room.findById(roomId);
    
          let choice = room.turn.playerType; // x or o
          if (room.turnIndex == 0) {
            room.turn = room.players[1];
            room.turnIndex = 1;
          } else {
            room.turn = room.players[0];
            room.turnIndex = 0;
          }
          room = await room.save();
          io.to(roomId).emit("tapped", {
            index,
            choice,
            room,
          });
        } catch (e) {
          console.log(e);
        }
      });
        
    // socket.on('winner', async ({winnerSocketID, roomID}) => {
    //     try{
    //         let room = await Room.findById(roomID);
    //         let player = room.players.find((player) => player.socketID == winnerSocketID);
    //         player.points += 1;
    //         room = await room.save();

    //         if(player.points >= room.maxRounds) {
    //             io.to(roomID).emit('endGame', player);
    //         } else {
    //             io.to(roomID).emit('pointIncrease', player);
    //         }
    //     } catch (e) {
    //         console.log(e);
    //     }
    // })

    socket.on("winner", async ({ winnerSocketId, roomId }) => {
        try {
          let room = await Room.findById(roomId);
          let player = room.players.find(
            (playerr) => playerr.socketID == winnerSocketId
          );
          player.points += 1;
          room = await room.save();
    
          if (player.points >= room.maxRounds) {
            io.to(roomId).emit("endGame", player);
          } else {
            io.to(roomId).emit("pointIncrease", player);
          }
        } catch (e) {
          console.log(e);
        }
      });
});

// mongoose
//   .connect(DB)
//   .then(() => {
//     console.log("Connection successful!");
//   })
//   .catch((e) => {
//     console.log(e);
//   });

// server.listen(port, "0.0.0.0", () => {
//   console.log(`Server started and running on port ${port}`);
// });

mongoose
  .connect(DB)
  .then(() => {
    console.log("Connection successful!");
  })
  .catch((e) => {
    console.log(e);
  });

server.listen(port, "0.0.0.0", () => {
  console.log(`Server started and running on port ${port}`);
});