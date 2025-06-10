const pty = require('node-pty');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { TERMINAL_EVENTS } = require('../utils/constants');

const setupTerminalHandlers = (socket) => {
  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  let currentDir = process.env.HOME || process.env.USERPROFILE;

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: currentDir,
    env: process.env
  });

  socket.on(TERMINAL_EVENTS.SET_DIRECTORY, (dirName) => {
    try {
      const newPath = path.isAbsolute(dirName) 
        ? dirName 
        : path.join(currentDir, dirName);
      
      if (fs.existsSync(newPath) && fs.statSync(newPath).isDirectory()) {
        currentDir = newPath;
        ptyProcess.write(`cd "${newPath}" && clear\r`);
      } else {
        ptyProcess.write(`echo "Error: Directory ${dirName} not found"\r`);
      }
    } catch (error) {
      ptyProcess.write(`echo "Error: ${error.message}"\r`);
    }
  });

  socket.on(TERMINAL_EVENTS.INPUT, (data) => {
    ptyProcess.write(data);
  });

  socket.on(TERMINAL_EVENTS.RESIZE, ({ cols, rows }) => {
    ptyProcess.resize(cols, rows);
  });

  ptyProcess.on('data', (data) => {
    socket.emit(TERMINAL_EVENTS.OUTPUT, data);
  });

  socket.on('disconnect', () => {
    ptyProcess.kill();
  });
};

module.exports = { setupTerminalHandlers };