const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// State
let buzzerEnabled = true;
let buzzerPresses = []; // { teamName, timestamp }
let connectedTeams = new Map(); // socketId -> teamName

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Socket.io
io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  // Team joins
  socket.on('team-join', (teamName) => {
    const cleanName = teamName.trim();
    if (!cleanName) {
      socket.emit('join-error', 'Team name cannot be empty.');
      return;
    }

    // Check for duplicate names (case-insensitive)
    const isDuplicate = Array.from(connectedTeams.entries()).some(([id, name]) => {
      return id !== socket.id && name.toLowerCase() === cleanName.toLowerCase();
    });

    if (isDuplicate) {
      socket.emit('join-error', 'This team name is already taken. Please choose another.');
      return;
    }

    connectedTeams.set(socket.id, cleanName);
    console.log(`Team joined: ${cleanName}`);
    
    // Send join success confirmation
    socket.emit('join-success', cleanName);
    
    // Send current buzzer state
    socket.emit('buzzer-state', buzzerEnabled);
    
    // Notify admin
    io.emit('teams-update', Array.from(connectedTeams.values()));
  });

  // Buzzer press
  socket.on('buzzer-press', () => {
    const teamName = connectedTeams.get(socket.id);
    if (!teamName) return;
    if (!buzzerEnabled) return;

    const now = new Date();
    const entry = {
      teamName,
      timestamp: now.toISOString(),
      displayTime: now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        hour12: true
      })
    };

    buzzerPresses.push(entry);
    
    // Sort by timestamp
    buzzerPresses.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    console.log(`Buzzer pressed by: ${teamName} at ${entry.displayTime}`);

    // Notify all admins with updated list
    io.emit('presses-update', buzzerPresses);
    
    // Confirm to the team
    socket.emit('buzzer-confirmed', entry);
  });

  // Admin: Toggle buzzer
  socket.on('toggle-buzzer', (enabled) => {
    buzzerEnabled = enabled;
    console.log(`Buzzer ${enabled ? 'ENABLED' : 'DISABLED'}`);
    io.emit('buzzer-state', buzzerEnabled);
  });

  // Admin: Clear timestamps
  socket.on('clear-presses', () => {
    buzzerPresses = [];
    console.log('Timestamps cleared');
    io.emit('presses-update', buzzerPresses);
  });

  // Admin requests current state
  socket.on('admin-join', () => {
    socket.emit('presses-update', buzzerPresses);
    socket.emit('buzzer-state', buzzerEnabled);
    socket.emit('teams-update', Array.from(connectedTeams.values()));
  });

  // Disconnect
  socket.on('disconnect', () => {
    const teamName = connectedTeams.get(socket.id);
    connectedTeams.delete(socket.id);
    console.log(`Disconnected: ${teamName || socket.id}`);
    io.emit('teams-update', Array.from(connectedTeams.values()));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Zyro Quiz Server running on http://localhost:${PORT}`);
  console.log(`📱 Team page:  http://localhost:${PORT}`);
  console.log(`🔧 Admin page: http://localhost:${PORT}/admin\n`);
});
