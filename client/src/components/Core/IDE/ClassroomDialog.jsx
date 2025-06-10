import { useState, useEffect } from 'react';
import { FaTimes, FaVideo, FaUserFriends } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

const ClassroomDialog = ({ roomId, onClose, onJoin }) => {
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const location = useLocation();

  const isInClassroomRoute = location.pathname.startsWith('/classroom');

  const handleJoin = () => {
    if (!name.trim()) return;
    if (!isInClassroomRoute) {
        const url = `/classroom/${roomId}?name=${encodeURIComponent(name)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
      }
    onClose();
  };

  if (isInClassroomRoute) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center">
            <FaVideo className="mr-2 text-blue-500" /> Join Classroom
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Room ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{roomId}</span></p>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your display name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <FaUserFriends className="mr-2" /> Join Classroom
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassroomDialog;