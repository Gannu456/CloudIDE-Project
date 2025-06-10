import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";

import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhone,
  FaUserFriends,
  FaDesktop,
  FaTimes,
  FaCheck,
} from "react-icons/fa";

const VideoChatNew = ({ roomId, onLeave, initialUserName }) => {
  const [users, setUsers] = useState([]);
  const [localMediaState, setLocalMediaState] = useState({
    video: true,
    audio: true,
    screen: false,
  });
  const [userName, setUserName] = useState(initialUserName);
  const [isSettingName, setIsSettingName] = useState(true);
  const [notification, setNotification] = useState("");
  const [roomInfo, setRoomInfo] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({});

  const localVideoRef = useRef();
  const peerConnections = useRef({});
  const localStream = useRef(null); // Holds the primary camera/mic stream
  const screenStream = useRef(null); // Holds the screen share stream
  const socketRef = useRef(null);
  const currentMediaStream = useRef(null); // Tracks the currently active local stream (camera or screen)

  // Show notification temporarily
  const showNotification = useCallback((message, duration = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(""), duration);
  }, []); // useCallback for stable function reference

  // Helper function to add tracks to a peer connection
  const addTracksToPeerConnection = useCallback((pc, stream) => {
    if (!stream) {
      console.warn("Attempted to add null stream to peer connection.");
      return;
    }
    stream.getTracks().forEach((track) => {
      // Find an existing sender for this track kind and replace, or add new
      const existingSender = pc
        .getSenders()
        .find((sender) => sender.track && sender.track.kind === track.kind);
      if (existingSender) {
        // console.log(`Replacing track for kind: ${track.kind} on PC for ${pc.peerId}`);
        existingSender
          .replaceTrack(track)
          .catch((e) => console.error("Error replacing track:", e));
      } else {
        // console.log(`Adding new track for kind: ${track.kind} on PC for ${pc.peerId}`);
        pc.addTrack(track, stream);
      }
    });
  }, []);

  // Helper function to remove all tracks from a peer connection
  const removeAllTracksFromPeerConnection = useCallback((pc) => {
    pc.getSenders().forEach((sender) => {
      if (sender.track) {
        pc.removeTrack(sender);
      }
    });
  }, []);

  // Initialize socket and media
  useEffect(() => {
    const initializeApp = async () => {
      try {
        socketRef.current = io("http://localhost:4002", {
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        if (!userName) {
          const defaultName = `User-${userName}`;
          setUserName(defaultName);
          setIsSettingName(true);
        } else {
          setIsSettingName(false);
        }

        setupSocketEvents(); // Setup socket events first

        // Get room info and then initialize media and join
        socketRef.current.emit("get-room-info", roomId, (info) => {
          if (info.error) {
            showNotification(info.error);
            onLeave();
            return;
          }
          setRoomInfo(info);
          initializeMediaAndJoin();
        });
      } catch (error) {
        console.error("Initialization error:", error);
        showNotification("Failed to initialize app");
        onLeave();
      }
    };

    initializeApp();

    return () => {
      cleanupConnections();
    };
  }, [roomId, onLeave, userName, showNotification]); // Added showNotification to deps

  const initializeMediaAndJoin = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStream.current = stream;
      currentMediaStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socketRef.current.emit(
        "join",
        roomId,
        userName || `User-${Math.floor(Math.random() * 1000)}`,
        (response) => {
          if (response.error) {
            showNotification(response.error);
            onLeave();
          } else {
            console.log("Successfully joined room:", response.roomId);
          }
        }
      );
    } catch (error) {
      console.error("Error getting user media:", error);
      showNotification(
        "Could not access camera/microphone. Joining without media."
      );
      // Still attempt to join even if media fails
      socketRef.current.emit(
        "join",
        roomId,
        userName || `User-${Math.floor(Math.random() * 1000)}`,
        (response) => {
          if (response.error) {
            showNotification(response.error);
            onLeave();
          } else {
            console.log("Joined room without media:", response.roomId);
          }
        }
      );
    }
  };

  const setupSocketEvents = useCallback(() => {
    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      showNotification("Disconnected from server. Reconnecting...");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      showNotification("Connection error. Please check your network.");
    });

    socket.on("room-state", ({ users: currentUsers, initiator }) => {
      setUsers(currentUsers);

      currentUsers.forEach((user) => {
        if (user.id !== socket.id && !peerConnections.current[user.id]) {
          // If a new user joins, create PC and immediately try to send current local stream
          createPeerConnection(user.id, currentMediaStream.current);
          // If local stream exists and this peer is the initiator, create offer
          if (currentMediaStream.current && socket.id === initiator) {
            const pc = peerConnections.current[user.id];
            pc.createOffer()
              .then((offer) => pc.setLocalDescription(offer))
              .then(() => {
                socket.emit("offer", {
                  to: user.id,
                  offer: pc.localDescription,
                });
              })
              .catch((err) =>
                console.error("Offer creation error on new user join:", err)
              );
          }
        }
      });

      Object.keys(peerConnections.current).forEach((userId) => {
        if (!currentUsers.some((user) => user.id === userId)) {
          cleanupPeerConnection(userId);
        }
      });
    });

    socket.on("user-disconnected", (userId) => {
      cleanupPeerConnection(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      // Try to find the user's name for a better notification
      const disconnectedUserName =
        users.find((u) => u.id === userId)?.name || "A user";
      showNotification(`${disconnectedUserName} has left the room.`);
    });

    socket.on("media-state-changed", ({ userId, video, audio, screen }) => {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, video, audio, screen } : user
        )
      );
    });

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
  }, [showNotification, users, roomId]); // Added users and roomId to deps for setupSocketEvents

  const createPeerConnection = useCallback(
    (userId, stream) => {
      const servers = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      };

      const pc = new RTCPeerConnection(servers);
      // Attach userId to pc for easier debugging and lookup
      pc.peerId = userId;
      peerConnections.current[userId] = pc;

      if (stream) {
        addTracksToPeerConnection(pc, stream);
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("ice-candidate", {
            to: userId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        console.log(`Received remote track from ${userId}`, event.streams[0]);
        if (event.streams && event.streams[0]) {
          setRemoteStreams((prev) => ({
            ...prev,
            [userId]: event.streams[0],
          }));
        }
      };

      pc.onnegotiationneeded = async () => {
        const localSocketId = socketRef.current.id;
        const remoteSocketId = userId;

        if (localSocketId < remoteSocketId) {
          try {
            console.log(`Negotiation needed for ${userId}. Creating offer...`);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current.emit("offer", {
              to: userId,
              offer: pc.localDescription,
            });
          } catch (err) {
            console.error(`Error creating offer for ${userId}:`, err);
          }
        } else {
          console.log(
            `Negotiation needed for ${userId}. Waiting for remote offer (glare resolved).`
          );
        }
      };
    },
    [addTracksToPeerConnection]
  ); 

  const cleanupPeerConnection = useCallback((userId) => {
    setRemoteStreams((prev) => {
      const newStreams = { ...prev };
      delete newStreams[userId];
      return newStreams;
    });
    if (peerConnections.current[userId]) {
      console.log(`Closing peer connection for ${userId}`);
      peerConnections.current[userId].close();
      delete peerConnections.current[userId];
    }
  }, []);

  const cleanupConnections = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }

    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
      screenStream.current = null;
    }
    currentMediaStream.current = null;

    Object.keys(peerConnections.current).forEach(cleanupPeerConnection);
    peerConnections.current = {};

    if (socketRef.current) {
      socketRef.current.emit("leave-room", roomId);
      socketRef.current.off("room-state");
      socketRef.current.off("user-disconnected");
      socketRef.current.off("media-state-changed");
      socketRef.current.off("offer");
      socketRef.current.off("answer");
      socketRef.current.off("ice-candidate");
      socketRef.current.disconnect();
    }
  }, [roomId, cleanupPeerConnection]); // useCallback for stable function reference

  const handleOffer = useCallback(
    async ({ from, offer }) => {
      try {
        if (!peerConnections.current[from]) {
          createPeerConnection(from, currentMediaStream.current);
        }
        const pc = peerConnections.current[from];

        if (
          pc.signalingState !== "stable" &&
          pc.signalingState !== "have-local-offer"
        ) {
          console.warn(
            `Received offer from ${from} in signalingState: ${pc.signalingState}. Ignoring or handling with glare resolution.`
          );
        }

        console.log(
          `Setting remote offer from ${from}. Current state: ${pc.signalingState}`
        );
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log(
          `Sending answer to ${from}. New state: ${pc.signalingState}`
        );
        socketRef.current.emit("answer", { to: from, answer });
      } catch (err) {
        console.error(`Error handling offer from ${from}:`, err);
      }
    },
    [createPeerConnection, currentMediaStream]
  ); // Add currentMediaStream to deps

  const handleAnswer = useCallback(async ({ from, answer }) => {
    try {
      const pc = peerConnections.current[from];
      if (pc) {
        // Critical: Ensure signaling state is 'have-local-offer' when receiving an answer
        if (pc.signalingState === "have-local-offer") {
          console.log(
            `Setting remote answer from ${from}. Current state: ${pc.signalingState}`
          );
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log(
            `Answer processed for ${from}. New state: ${pc.signalingState}`
          );
        } else {
          console.warn(
            `Received answer from ${from} in unexpected signalingState: ${pc.signalingState}. Expected 'have-local-offer'. Ignoring.`
          );
        }
      } else {
        console.warn(
          `No peer connection found for ${from} when handling answer.`
        );
      }
    } catch (err) {
      console.error(`Error handling answer from ${from}:`, err);
    }
  }, []);

  const handleIceCandidate = useCallback(async ({ from, candidate }) => {
    try {
      const pc = peerConnections.current[from];
      if (pc && candidate) {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          console.warn(
            `Received ICE candidate from ${from} before remote description was set. Buffering or ignoring.`
          );
        }
      }
    } catch (err) {
      console.error(`Error adding ICE candidate from ${from}:`, err);
    }
  }, []);

  const toggleAudio = () => {
    if (localStream.current) {
      const audioTracks = localStream.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newState = !audioTracks[0].enabled;
        audioTracks[0].enabled = newState;
        setLocalMediaState((prev) => ({ ...prev, audio: newState }));
        socketRef.current.emit("media-state", {
          audio: newState,
          video: localMediaState.video,
          screen: isScreenSharing,
        });
      }
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTracks = localStream.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !videoTracks[0].enabled;
        videoTracks[0].enabled = newState;
        setLocalMediaState((prev) => ({ ...prev, video: newState }));
        socketRef.current.emit("media-state", {
          video: newState,
          audio: localMediaState.audio,
          screen: isScreenSharing,
        });
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        if (screenStream.current) {
          screenStream.current.getTracks().forEach((track) => track.stop());
          screenStream.current = null;
        }

        if (localStream.current) {
          localVideoRef.current.srcObject = localStream.current;
          currentMediaStream.current = localStream.current;
        } else {
          localVideoRef.current.srcObject = null;
          currentMediaStream.current = null;
        }

        setIsScreenSharing(false);
        socketRef.current.emit("media-state", {
          video: localMediaState.video,
          audio: localMediaState.audio,
          screen: false,
        });

        renegotiateAllPeers(currentMediaStream.current);
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        stream.getVideoTracks()[0].onended = () => {
          if (isScreenSharing) {
            // Only toggle off if still screen sharing
            toggleScreenShare();
          }
        };

        screenStream.current = stream;
        localVideoRef.current.srcObject = stream;
        currentMediaStream.current = stream;

        setIsScreenSharing(true);
        socketRef.current.emit("media-state", {
          video: localMediaState.video, // Camera video state remains as is
          audio: localMediaState.audio, // Camera audio state remains as is
          screen: true,
        });

        renegotiateAllPeers(screenStream.current);
      }
    } catch (error) {
      console.error("Screen sharing error:", error);
      showNotification("Failed to start screen sharing");
    }
  };

  const renegotiateAllPeers = useCallback(
    (newStream) => {
      console.log("Renegotiating all peers with new stream:", newStream);
      Object.keys(peerConnections.current).forEach((userId) => {
        const pc = peerConnections.current[userId];

        // Remove existing tracks from the PC
        removeAllTracksFromPeerConnection(pc);

        if (newStream) {
          addTracksToPeerConnection(pc, newStream);
        }
        console.log(`Triggering renegotiation for user ${userId}.`);
      });
    },
    [addTracksToPeerConnection, removeAllTracksFromPeerConnection]
  );

  const handleLeaveRoom = () => {
    cleanupConnections();
    onLeave();
    window.close();
  };

  const updateUserName = () => {
    if (userName.trim()) {
      socketRef.current.emit("update-name", userName);
      setIsSettingName(false);
      showNotification("Name updated successfully");
    } else {
      showNotification("Please enter a valid name");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-2 py-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white rounded-lg shadow-lg px-6 py-3 flex items-center z-50">
          <span>{notification}</span>
          <button
            onClick={() => setNotification("")}
            className="ml-4 text-white hover:text-gray-100"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Room Header */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-bold text-blue-700">Room: {roomId}</h3>
          {roomInfo && (
            <span className="flex items-center text-gray-500 text-sm font-medium">
              <FaUserFriends className="mr-1" /> {users.length} participant
              {users.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Name Dialog */}
      {isSettingName && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-xs w-full flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Enter Your Name
            </h3>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your display name"
              maxLength="20"
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <div className="flex w-full justify-between">
              <button
                onClick={updateUserName}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                <FaCheck className="mr-2" /> Confirm
              </button>
              <button
                onClick={() => {
                  if (!userName.trim())
                    setUserName(`User-${Math.floor(Math.random() * 1000)}`);
                  setIsSettingName(false);
                }}
                className="flex items-center px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition"
              >
                <FaTimes className="mr-2" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="relative bg-white rounded-xl shadow border border-gray-100 flex flex-col items-center justify-center p-4">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`rounded-xl w-full aspect-video bg-gray-200 object-cover border ${
              !localMediaState.video && !isScreenSharing ? "opacity-40" : ""
            }`}
          />
          {isScreenSharing && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs shadow">
              Screen Sharing
            </div>
          )}
          {!localMediaState.video && !isScreenSharing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl text-white text-lg font-semibold">
              Camera Off
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-white/80 text-gray-800 px-3 py-1 rounded-full text-xs flex items-center shadow">
            You ({userName})
            <button
              onClick={() => setIsSettingName(true)}
              className="ml-2 text-blue-600 hover:text-blue-800"
              title="Change name"
            >
              ✏️
            </button>
          </div>
        </div>

        {/* Remote Videos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {users
            .filter((user) => user.id !== socketRef.current?.id)
            .map((user) => (
              <div
                key={user.id}
                className={`relative bg-white rounded-xl shadow border border-gray-100 flex flex-col items-center justify-center p-2`}
              >
                <video
                  autoPlay
                  playsInline
                  className={`rounded-xl w-full aspect-video bg-gray-200 object-cover border ${
                    !user.video && !user.screen ? "opacity-40" : ""
                  }`}
                  ref={(el) => {
                    if (el && remoteStreams[user.id]) {
                      el.srcObject = remoteStreams[user.id];
                    } else if (el) {
                      el.srcObject = null;
                    }
                  }}
                />
                {user.screen && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs shadow">
                    Screen Share
                  </div>
                )}
                {!user.video && !user.screen && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl text-white text-lg font-semibold">
                    Camera Off
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-white/80 text-gray-800 px-3 py-1 rounded-full text-xs flex items-center shadow">
                  {user.name}
                  {!user.audio && (
                    <span className="ml-2 text-red-500 font-semibold">
                      (Muted)
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 bg-white rounded-xl shadow border border-gray-100 px-6 py-3">
        <button
          onClick={toggleAudio}
          className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition ${
            !localMediaState.audio
              ? "bg-red-100 text-red-600"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
          title={
            localMediaState.audio ? "Mute microphone" : "Unmute microphone"
          }
        >
          {localMediaState.audio ? (
            <FaMicrophone size={20} />
          ) : (
            <FaMicrophoneSlash size={20} />
          )}
          <span className="text-xs mt-1">
            {localMediaState.audio ? "Mute" : "Unmute"}
          </span>
        </button>
        <button
          onClick={toggleVideo}
          className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition ${
            !localMediaState.video
              ? "bg-red-100 text-red-600"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
          title={localMediaState.video ? "Turn off camera" : "Turn on camera"}
        >
          {localMediaState.video ? (
            <FaVideo size={20} />
          ) : (
            <FaVideoSlash size={20} />
          )}
          <span className="text-xs mt-1">
            {localMediaState.video ? "Stop Video" : "Start Video"}
          </span>
        </button>
        <button
          onClick={toggleScreenShare}
          className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition ${
            isScreenSharing
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
          title={
            isScreenSharing ? "Stop screen sharing" : "Start screen sharing"
          }
        >
          <FaDesktop size={20} />
          <span className="text-xs mt-1">
            {isScreenSharing ? "Stop Share" : "Share Screen"}
          </span>
        </button>
        <button
          onClick={handleLeaveRoom}
          className="flex flex-col items-center justify-center px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          title="Leave call"
        >
          <FaPhone size={20} />
          <span className="text-xs mt-1">Leave</span>
        </button>
      </div>
    </div>
  );
};

export default VideoChatNew;
