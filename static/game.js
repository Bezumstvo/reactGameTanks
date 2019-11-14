const socket = io();
let mouseX = mouseY = 0;
const movement = {
  fire: false,
  up: 0,
  down: 0,
  left: 0,
  right: 0,
  mouseX: false,
  mouseY: false
};
document.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
    case 65: // A
      movement.left = true;
      break;
    case 87: // W
      movement.up = true;
      break;
    case 68: // D
      movement.right = true;
      break;
    case 83: // S
      movement.down = true;
      break;
    case 70: // F
     movement.fire = true;
     movement.mouseX = mouseX;
     movement.mouseY = mouseY;
      break;
  }
});
document.addEventListener('keyup', function(event) {
  switch (event.keyCode) {
    case 65: // A
      movement.left = 0;
      break;
    case 87: // W
      movement.up = 0;
      break;
    case 68: // D
      movement.right = 0;
      break;
    case 83: // S
      movement.down = 0;
      break;
    case 70: // F
      movement.fire = false;
      movement.mouseX = false;
      movement.mouseY = false;
  }
});

socket.emit('new player');
setInterval(function() {
  socket.emit('movement', movement);
}, 1000 / 60);

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

socket.on('state', function(players,bullets) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  for (let id in players) {
    let player = players[id];
    context.beginPath();
    context.fillStyle = player.color;
    context.arc(player.x, player.y, 5, 0, 2 * Math.PI);
    context.fill();
  }
  for (let id in bullets) {
    let bullet = bullets[id];
    context.beginPath();
    context.fillStyle = bullet.color;
    context.arc(bullet.x, bullet.y, 2, 0, 2 * Math.PI);
    context.fill();
  }
});

socket.on('hit', function(player) {
  alert('hit to ', player.color);
  console.log('hit to ', player.color);
});
function mousemove(event) {
  if (document.attachEvent != null) {
    mouseX = window.event.clientX;
    mouseY = window.event.clientY;
  } else if (!document.attachEvent && document.addEventListener) {
      mouseX = event.clientX;
      mouseY = event.clientY;
  }
};
(function initMouseGet() {
  if (document.layers) document.captureEvents(Event.MOUSEMOVE);
  document.onmousemove = mousemove;
})()