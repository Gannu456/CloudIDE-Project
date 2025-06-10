// Classroom.jsx
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import VideoChatNew from './VideoChatNew';

const Classroom = () => {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();
    const [socket, setSocket] = useState(null);
    const navigate = useNavigate();
    const userName = searchParams.get('name') || 'Anonymous';
  
    useEffect(() => {
      if (!userName || userName === 'Anonymous') {
        toast.error('Please enter your name to join the classroom');
        navigate('/ide');
        return;
      }
  
      const newSocket = io('http://localhost:4002', {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
  
      setSocket(newSocket);
  
      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        newSocket.emit('join-room', { roomId, userName });
      });
  
      newSocket.on('connect_error', (err) => {
        toast.error(`Connection error: ${err.message}`);
        navigate('/ide');
      });
  
      return () => {
        if (newSocket.connected) {
          newSocket.emit('leave-room', { roomId });
          newSocket.disconnect();
        }
      };
    }, [roomId, userName, navigate]);
  
    const handleLeave = () => {
      if (socket?.connected) {
        socket.emit('leave-room', { roomId });
        socket.disconnect();
      }
      if (window.opener) {
        window.close();
      } else {
        navigate('/ide');
      }
    };
  
    if (!socket) {
      return (
        <div className="flex items-center justify-center h-screen w-screen">
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Connecting to Classroom...</h2>
            <p>Please wait while we connect you to room {roomId}</p>
          </div>
        </div>
      );
    }
  
    return (
      <div className="h-screen w-screen flex flex-col">
        <VideoChatNew
          roomId={roomId}
          onLeave={handleLeave}
          userName={userName}
          socket={socket}
        />
      </div>
    );
  };

  export default Classroom;