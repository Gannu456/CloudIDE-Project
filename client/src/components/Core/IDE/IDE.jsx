import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import Editor from "@monaco-editor/react";
import Split from "react-split";
import { getLanguageData } from "../../../data/LanguageIcons";

// Components
import Terminal from "./Terminal";
import FileExplorer from "./FileExplorer";
import YouTubeStreamDialog from "./YouTubeStreamDialog";
import LoadingScreen from "./LoadingScreen";
import Toolbar from "./Toolbar";
import EditorHeader from "./EditorHeader";
import VideoChatNew from "./VideoChatNew";
import ClassroomDialog from "./ClassroomDialog";

const IDE = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Refs
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const localStreamRef = useRef(null);

  // State
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode] = useState("");
  const [rootHandle, setRootHandle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Video/Streaming
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamKey, setStreamKey] = useState("");
  const [showStreamDialog, setShowStreamDialog] = useState(false);

  const [showClassroom, setShowClassroom] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);

  const langData = getLanguageData(activeFile?.path);

  const handleEditorChange = (value) => {
    setCode(value);
  };

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:4002', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const socket = io("http://localhost:4002", { withCredentials: true });
    socketRef.current = socket;
    socket.on("connect", () => console.log("Socket connected"));
    socket.on("stream-status", toast);
    socket.on("stream-error", handleStreamError);
    socket.on("disconnect", () => {
      if (isStreaming) stopStreaming();
      toast.error("Socket disconnected. Stream stopped.");
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const initDirectory = async () => {
      try {
        if (state?.dirHandle) {
          setRootHandle(state.dirHandle);
          return;
        }
        const dirHandle = await window.showDirectoryPicker({
          id: "my-project-folder",
          mode: "readwrite",
        });
        setRootHandle(dirHandle);
      } catch (error) {
        if (error.name !== "AbortError") {
          toast.error("Could not access directory. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    initDirectory();
  }, [state]);

  const handleCreateRoom = () => {
    setIsLoading(true);

    socketRef.current.emit('create-room', (response) => {
      if (response.error) {
        setIsLoading(false);
        return;
      }

      setRoomId(response.roomId);
      setJoined(true);
      setIsLoading(false);
    });
  };

  const handleLeaveRoom = () => {
    setJoined(false);
    setIsLoading(false);
    setRoomId('');
  };

  const handleFileSelect = async (file) => {
    if (!file.isDirectory && file.handle) {
      try {
        const fileHandle = file.handle;
        const fileData = await fileHandle.getFile();
        const content = await fileData.text();
        setActiveFile(file);
        setCode(content);
      } catch (error) {
        toast.error("Failed to load file");
      }
    }
  };

  const saveFile = async () => {
    if (!activeFile?.handle) {
      toast.error("No file selected to save");
      return;
    }
    try {
      const writable = await activeFile.handle.createWritable();
      await writable.write(code);
      await writable.close();
      toast.success("File saved successfully");
    } catch (error) {
      toast.error("Failed to save file");
    }
  };

  const startClassroom = async () => {
    try {
      // Create room first
      const response = await new Promise((resolve) => {
        socketRef.current.emit("create-room", resolve);
      });
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
  
      const roomId = response.roomId;
      setRoomId(roomId);
      setShowClassroom(true);
    } catch (error) {
      toast.error("Failed to start classroom");
    }
  };

  const startStreaming = useCallback(async () => {
    if (!socketRef.current) {
      toast.error("Socket not connected. Try again.");
      return;
    }
  
    try {
      setShowStreamDialog(false);
      // Get user media with proper constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
  
      localStreamRef.current = stream;
  
      // Create MediaRecorder with proper settings
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000,
      });
  
      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socketRef.current?.connected) {
          try {
            const buffer = await event.data.arrayBuffer();
            socketRef.current.emit("stream-data", buffer);
          } catch (error) {
            console.error('Error sending stream data:', error);
          }
        }
      };
  
      // Start recording in 1-second chunks
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
  
      // Notify server
      socketRef.current.emit("start-stream", streamKey);
      setIsStreaming(true);
      toast.success("Live stream started!");

    } catch (error) {
      console.error('Stream start error:', error);
      toast.error(`Failed to start stream: ${error.message}`);
      stopStreaming();
    }
  }, [streamKey]);
  
  const stopStreaming = useCallback(() => {
    try {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (socketRef.current?.connected) {
        socketRef.current.emit("stop-stream");
      }
      
      mediaRecorderRef.current = null;
      localStreamRef.current = null;
      setIsStreaming(false);
      toast("Live stream stopped");
    } catch (error) {
      console.error('Error stopping stream:', error);
      toast.error('Error stopping stream');
    }
  }, []);

  const handleStreamError = (error) => {
    toast.error(error);
    stopStreaming();
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen().catch(console.log);
    } else {
      document.exitFullscreen().catch(console.log);
    }
    setIsFullscreen((prev) => !prev);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div
      className={`flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Toolbar */}
      <div className="px-6 pt-6 pb-2">
        <Toolbar
          language={langData.name}
          isFullscreen={isFullscreen}
          onStartClassroom={startClassroom}
          onShowStreamDialog={() => setShowStreamDialog(true)}
          onSaveFile={saveFile}
          onToggleFullscreen={toggleFullscreen}
          onBackToDashboard={() => navigate("/dashboard")}
          isStreaming={isStreaming}
          stopStreaming={stopStreaming}
        />
      </div>

      {/* Main IDE Area */}
      <div className="flex flex-1 overflow-hidden px-4 pb-4">
        {/* File Explorer */}
        <div className="w-64 mr-4 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <FileExplorer
            onSelectFile={handleFileSelect}
            selectedFile={activeFile?.path}
            rootHandle={rootHandle}
            className="flex-1"
          />
        </div>

        {/* Editor and Terminal Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Editor Header */}
          {activeFile && (
            <div className="border-b border-gray-100 px-4 py-2">
              <EditorHeader
                file={activeFile}
              />
            </div>
          )}

          {/* Split Editor and Terminal */}
          <Split
            sizes={[70, 30]} 
            direction="vertical"
            gutterSize={5}
            className="flex-1 overflow-hidden"
          >
            {/* Editor */}
            <div className="w-full h-full">
              <Editor
                height="100%"
                language={langData.name}
                theme="vs-dark"
                value={code}
                onChange={handleEditorChange}
                options={{
                  fontSize: 15,
                  minimap: { enabled: true },
                  wordWrap: "on",
                  renderWhitespace: "selection",
                  cursorBlinking: "smooth",
                }}
              />
            </div>

            {/* Terminal */}
              <div className="border-t border-gray-100 bg-gray-50 px-2 py-1">
                <Terminal
                  currentDirectory={rootHandle?.name || "project"}
                  key={rootHandle?.name}
                />
              </div>
          </Split>
        </div>
      </div>

      <YouTubeStreamDialog
        isOpen={showStreamDialog}
        streamKey={streamKey}
        onStreamKeyChange={setStreamKey}
        onStartStreaming={startStreaming}
        onClose={() => setShowStreamDialog(false)}
      />

      {showClassroom && (
        <ClassroomDialog
          roomId={roomId}
          onClose={() => setShowClassroom(false)}
          onJoin={handleCreateRoom}
        />
      )}
    </div>
  );
};

export default IDE;
