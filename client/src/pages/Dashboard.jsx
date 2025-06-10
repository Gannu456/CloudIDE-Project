import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FiFolder,
  FiCode,
  FiUpload,
  FiGitBranch,
  FiUsers,
  FiSettings,
  FiClock,
  FiStar,
} from "react-icons/fi";
import { io } from "socket.io-client";

import { FaChalkboardTeacher, FaTimes, FaSignOutAlt } from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenIDE = async () => {
    if (!("showDirectoryPicker" in window)) {
      toast.error("This browser does not support directory access.");
      return;
    }

    try {
      setIsLoading(true);

      const dirHandle = await window.showDirectoryPicker({
        mode: "readwrite",
        id: "my-project-folder", // Consistent ID for permission persistence
      });

      const permission = await dirHandle.requestPermission({
        mode: "readwrite",
      });
      if (permission !== "granted") {
        throw new Error("Permission denied");
      }

      navigate("/ide", { state: { dirHandle } });
    } catch (error) {
      console.error("Directory access error:", error);

      if (error.name === "AbortError") {
        toast("Directory selection was cancelled.");
      } else if (error.message.includes("not allowed")) {
        toast.error("Please allow directory access in your browser settings.");
      } else {
        toast.error("Failed to open directory. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sample recent projects data
  const recentProjects = [
    {
      id: 1,
      name: "E-commerce Dashboard",
      lastModified: "2 hours ago",
      language: "JavaScript",
    },
    {
      id: 2,
      name: "API Service",
      lastModified: "1 day ago",
      language: "Python",
    },
    {
      id: 3,
      name: "Mobile App UI",
      lastModified: "3 days ago",
      language: "TypeScript",
    },
  ];

  // Sample quick actions
  const quickActions = [
    {
      icon: <FaChalkboardTeacher size={20} />,
      label: "Join Classroom",
      action: () => handleJoinClassroom(),
    },
    {
      icon: <FiGitBranch size={20} />,
      label: "Start Classroom",
      action: () => toast.success("Branch creation clicked"),
    },
    {
      icon: <FiUsers size={20} />,
      label: "Collaborate on a Project",
      action: () => toast.success("Invite clicked"),
    },
    {
      icon: <FiSettings size={20} />,
      label: "Settings",
      action: () => navigate("/settings"),
    },
  ];

  const [showClassroomDialog, setShowClassroomDialog] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io("http://localhost:4002", {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleJoinClassroom = () => {
    setShowClassroomDialog(true);
  };

  const validateAndJoinRoom = () => {
    if (!roomIdInput.trim() || !displayName.trim()) {
      toast.error("Please enter both room ID and your name");
      return;
    }

    setIsJoining(true);

    // First validate if room exists
    socketRef.current.emit("validate-room", roomIdInput, (exists) => {
      if (!exists) {
        toast.error("Classroom does not exist");
        setIsJoining(false);
        return;
      }

      // Room exists, proceed to join
      const url = `/classroom/${roomIdInput}?name=${encodeURIComponent(
        displayName
      )}`;
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");

      if (!newWindow) {
        toast.error("Please allow popups for this site");
        setIsJoining(false);
        return;
      }

      // Check if window loaded successfully
      const checkWindow = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkWindow);
          setIsJoining(false);
          return;
        }

        try {
          // If we can access the location, window loaded
          if (newWindow.location.href) {
            clearInterval(checkWindow);
            setShowClassroomDialog(false);
            setIsJoining(false);
            setRoomIdInput("");
            setDisplayName("");
          }
        } catch (e) {
          // Still loading or cross-origin error
        }
      }, 100);

      // Timeout in case window fails to load
      setTimeout(() => {
        clearInterval(checkWindow);
        if (!newWindow.closed) {
          newWindow.close();
          toast.error("Failed to join classroom");
          setIsJoining(false);
        }
      }, 5000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back,{" "}
              <span className="text-blue-600">{user?.name || "User"}</span>!
            </h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your projects today.
            </p>
          </div>
          <button
            onClick={handleOpenIDE}
            disabled={isLoading}
            className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading...
              </span>
            ) : (
              <>
                <FiCode className="mr-2" />
                Launch Cloud IDE
              </>
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                <FiFolder size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm font-medium">Projects</h3>
                <p className="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-50 text-green-600">
                <FiGitBranch size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm font-medium">
                  Active Branches
                </h3>
                <p className="text-2xl font-semibold text-gray-900">5</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-50 text-purple-600">
                <FiUsers size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm font-medium">
                  Collaborators
                </h3>
                <p className="text-2xl font-semibold text-gray-900">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-50 text-yellow-600">
                <FiClock size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm font-medium">
                  Active Sessions
                </h3>
                <p className="text-2xl font-semibold text-gray-900">2</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Projects
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-md bg-gray-100 text-gray-600">
                      {/* {getLanguageIcon(project.language)} */}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <FiClock className="mr-1" size={14} />
                        {project.lastModified}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-yellow-500">
                    <FiStar />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Quick Actions
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600 mb-2">
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {action.label}
                  </span>
                </button>
              ))}
              
              {/* Classroom Join Dialog */}
              {showClassroomDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold flex items-center">
                        <FaChalkboardTeacher className="mr-2 text-blue-500" />{" "}
                        Join Classroom
                      </h3>
                      <button
                        onClick={() => setShowClassroomDialog(false)}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={isJoining}
                      >
                        <FaTimes />
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Classroom ID
                      </label>
                      <input
                        type="text"
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value)}
                        placeholder="Enter classroom ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isJoining}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isJoining}
                        onKeyPress={(e) =>
                          e.key === "Enter" && validateAndJoinRoom()
                        }
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowClassroomDialog(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        disabled={isJoining}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={validateAndJoinRoom}
                        disabled={
                          !roomIdInput.trim() ||
                          !displayName.trim() ||
                          isJoining
                        }
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                      >
                        {isJoining ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Joining...
                          </>
                        ) : (
                          <>
                            <FaSignOutAlt className="mr-2" />
                            Join Classroom
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <h3 className="font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="p-1.5 rounded-full bg-green-100 text-green-600 mt-1">
                  <FiGitBranch size={14} />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">You</span> created a new
                    branch <span className="font-medium">feature/auth</span>
                  </p>
                  <p className="text-xs text-gray-500">30 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-1.5 rounded-full bg-blue-100 text-blue-600 mt-1">
                  <FiCode size={14} />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">You</span> pushed 3 new
                    commits to <span className="font-medium">main</span>
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
