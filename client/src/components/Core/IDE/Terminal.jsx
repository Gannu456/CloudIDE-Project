import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { io } from 'socket.io-client';

const TerminalComponent = ({ dirName }) => {
  const terminalRef = useRef(null);
  const socketRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(new FitAddon());
  const currentDirRef = useRef(null);

  useEffect(() => {
    terminal.current = new Terminal({
      cursorBlink: true,
      fontFamily: 'Menlo, "Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: '#FFFFFF',
        foreground: '#374151',
        cursor: '#3B82F6',
        cursorAccent: '#EFF6FF',
        selection: '#BFDBFE',
        black: '#6B7280',
        red: '#EF4444',
        green: '#22C55E',
        yellow: '#EAB308',
        blue: '#3B82F6',
        magenta: '#8B5CF6',
        cyan: '#06B6D4',
        white: '#64748B',
      },
      scrollback: 1000,
      convertEol: true,
    });

    terminal.current.loadAddon(fitAddon.current);
    terminal.current.open(terminalRef.current);
    fitAddon.current.fit();

    // Socket initialization
    socketRef.current = io('http://localhost:4002', {
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Socket handlers
    socketRef.current.on('connect', () => {
      terminal.current.writeln('\x1b[1;32m✓ Connected to terminal server\x1b[0m\r');
      if (dirName) {
        currentDirRef.current = dirName;
        socketRef.current.emit('setDirectory', dirName);
      }
    });

    socketRef.current.on('output', (data) => {
      terminal.current.write(data);
    });

    socketRef.current.on('disconnect', () => {
      terminal.current.writeln('\x1b[1;31m✗ Disconnected from terminal server\x1b[0m\r');
    });

    socketRef.current.on('reconnect_failed', () => {
      terminal.current.writeln('\x1b[1;31m⚠ Connection failed. Refresh to reconnect\x1b[0m\r');
    });

    terminal.current.onData((data) => {
      socketRef.current.emit('input', data);
    });

    const handleResize = () => {
            fitAddon.current.fit();
            if (socketRef.current.connected) {
              const { cols, rows } = terminal.current;
              socketRef.current.emit('resize', { cols, rows });
            }
          };
      
          window.addEventListener('resize', handleResize);
          handleResize();

    return () => {
      socketRef.current?.disconnect();
      terminal.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (socketRef.current?.connected && dirName && dirName !== currentDirRef.current) {
      currentDirRef.current = dirName;
      socketRef.current.emit('setDirectory', dirName);
      terminal.current?.writeln(`\x1b[1;34m↳ Working directory: ${dirName}\x1b[0m\r`);
    }
  }, [dirName]);

  return (
    <div className="h-full bg-white rounded-b-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">TERMINAL</span>
        <button
          onClick={() => fitAddon.current.fit()}
          className="text-xs text-gray-500 hover:text-blue-600"
        >
          Reconnect
        </button>
      </div>
      <div 
        ref={terminalRef} 
        className="terminal-container p-2 h-[calc(100%-40px)]"
        style={{ fontFamily: 'Menlo, "Fira Code", monospace' }}
      />
    </div>
  );
};

export default TerminalComponent;
