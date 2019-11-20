// Dependencies.
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);
const params = {
  colors: [
    [false, 'red'],
    [false, 'blue'],
    [false, 'green'],
    [false, 'orange'],
    [false, 'grey'],
    [false, 'yellow'],
    [false, 'black']
  ],
  maxPlayers: 4,
  bulletSpeed: 20,
  bulletTTL: 1000,
  bounce: true,
  hitArea: 20
};
let currNumPlayers = 0;
let stopGame = false;

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(5000, function() {
  console.log('Starting server on port 5000');
});

let players = {};
let bullets = {};
io.on('connection', function(socket) {
  socket.on('new player', function() {
    if (currNumPlayers < params.maxPlayers) {
      let color;
      // find first free color
      let curNumTmp = currNumPlayers;
      while (params.colors[curNumTmp][0]) {
        curNumTmp++;
        if (curNumTmp > params.maxPlayers) curNumTmp = 0;
      }
      color = params.colors[curNumTmp][1];
      params.colors[curNumTmp][0] = true;
      players[socket.id] = {
        x: 300,
        y: 300,
        color: color,
        number: currNumPlayers,
        dx: 0,
        dy: 0
      };
      currNumPlayers++;
      socket.emit('meColor', color);
    }
    socket.on('disconnect', function() {
      // test Viewer / Player
      if (players[socket.id]) {
        // delete disconnect Player
        numberDeletePlayer = players[socket.id].number;
        params.colors[numberDeletePlayer][0] = false;
        delete players[socket.id];
        currNumPlayers--;
      }
    });
  });

  socket.on('movement', function(data) {
    let player = players[socket.id] || {};
    if (data.left === 0 && data.right === 0) {
      player.dx = 0;
    } else {
      if (data.left > 0) {
        player.dx = -1;
      }
      if (data.right > 0) {
        player.dx = 1;
      }
    }
    if (data.up === 0 && data.down === 0) {
      player.dy = 0;
    } else {
      if (data.up > 0) {
        player.dy = -1;
      }
      if (data.down > 0) {
        player.dy = 1;
      }
    }

    if (data.fire) {
      if (!bullets[player.number]) {
        let deltaTmp =
          data.mouseY - player.y === 0
            ? 0
            : Math.abs((data.mouseX - player.x) / (data.mouseY - player.y)) ** 2;
        deltaX_sign =
          data.mouseX - player.x === 0
            ? 0
            : Math.abs(data.mouseX - player.x) / (data.mouseX - player.x);
        deltaY_sign =
          data.mouseY - player.y === 0
            ? 0
            : Math.abs(data.mouseY - player.y) / (data.mouseY - player.y);
        deltaY_value = Math.sqrt(params.bulletSpeed ** 2 / (deltaTmp + 1));
        deltaX_value = Math.sqrt(params.bulletSpeed ** 2 - deltaY_value ** 2);
        bullets[player.number] = {
          x: player.x,
          y: player.y,
          color: player.color,
          deltaX: deltaX_sign * deltaX_value,
          deltaY: deltaY_sign * deltaY_value,
          number: currNumPlayers,
          ttl: new Date().getTime() + params.bulletTTL
        };
      }
    }
  });
  socket.on('gameOver', data => {
    stopGame = data;
    io.sockets.emit('newGame', stopGame);
  });
  socket.on('msg', function(data) {
    let player = players[socket.id] || {};
    const now = new Date();
    const hour = now.getHours() < 10 ? '0' + now.getHours() : now.getHours();
    const min = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
    const sec = now.getSeconds() < 10 ? '0' + now.getSeconds() : now.getSeconds();
    let message = {
      dateTime: hour + ':' + min + ':' + sec,
      msg: data,
      player: player
    };
    io.sockets.emit('message', message);
  });
});

setInterval(function() {
  for (player in players) {
    if (!stopGame) {
      let dx = players[player].dx === 0 ? 0 : players[player].dx / Math.abs(players[player].dx);
      let dy = players[player].dy === 0 ? 0 : players[player].dy / Math.abs(players[player].dy);
      players[player].x += dx;
      players[player].y += dy;
    }
    if (players[player].y < 0) {
      players[player].y = 0;
    }
    if (players[player].x < 0) {
      players[player].x = 0;
    }
    if (players[player].y > 590) {
      players[player].y = 590;
    }
    if (players[player].x > 990) {
      players[player].x = 990;
    }
  }
  for (bullet in bullets) {
    if (!stopGame && new Date().getTime() > bullets[bullet].ttl) {
      delete bullets[bullet];
    } else {
      bullets[bullet].x += Math.round(bullets[bullet].deltaX);
      bullets[bullet].y += Math.round(bullets[bullet].deltaY);
      for (player in players) {
        if (
          bullets[bullet].color != players[player].color &&
          bullets[bullet].x > players[player].x - params.hitArea &&
          bullets[bullet].x < players[player].x + params.hitArea &&
          bullets[bullet].y > players[player].y - params.hitArea &&
          bullets[bullet].y < players[player].y + params.hitArea
        ) {
          stopGame = true;
          io.sockets.emit('hit', players[player]);
        }
      }
      if (params.bounce) {
        if (bullets[bullet].x > 990) {
          bullets[bullet].deltaX = -bullets[bullet].deltaX;
        }
        if (bullets[bullet].x < 0) {
          bullets[bullet].deltaX = -bullets[bullet].deltaX;
        }
        if (bullets[bullet].y > 590) {
          bullets[bullet].deltaY = -bullets[bullet].deltaY;
        }
        if (bullets[bullet].y < 0) {
          bullets[bullet].deltaY = -bullets[bullet].deltaY;
        }
      } else {
        if (
          bullets[bullet].x > 990 ||
          bullets[bullet].x < 0 ||
          bullets[bullet].y > 590 ||
          bullets[bullet].y < 0
        ) {
          delete bullets[bullet];
        }
      }
    }
  }
}, 1000 / 60);

setInterval(function() {
  io.sockets.emit('state', players, bullets);
}, 1000 / 60);
