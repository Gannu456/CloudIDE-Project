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

// import { useState, useEffect, useRef, useCallback } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { io } from "socket.io-client";
// import { toast } from "react-hot-toast";
// import Editor from "@monaco-editor/react";
// import Split from "react-split";
// import * as Y from "yjs";
// import { WebrtcProvider } from "y-webrtc";
// import { MonacoBinding } from "y-monaco";
// import Peer from "peerjs";

// // Components
// import Terminal from "./Terminal";
// import FileExplorer from "./FileExplorer";
// import YouTubeStreamDialog from "./YouTubeStreamDialog";
// import ConfirmationDialog from "./ConfirmationDialog";
// import LoadingScreen from "./LoadingScreen";
// import Toolbar from "./Toolbar";
// import EditorHeader from "./EditorHeader";

// // Icons
// import {
//   FiSave,
//   FiShare2,
//   FiUsers,
//   FiVideo,
//   FiTerminal,
//   FiMaximize2,
//   FiMinimize2,
//   FiChevronDown,
// } from "react-icons/fi";
// import {
//   SiJavascript,
//   SiPython,
//   SiTypescript,
//   SiHtml5,
//   SiCss3,
// } from "react-icons/si";

// // Constants
// const LANGUAGES = {
//   javascript: {
//     name: "JavaScript",
//     icon: <SiJavascript className="text-yellow-500" />,
//   },
//   python: { name: "Python", icon: <SiPython className="text-blue-500" /> },
//   typescript: {
//     name: "TypeScript",
//     icon: <SiTypescript className="text-blue-600" />,
//   },
//   html: { name: "HTML", icon: <SiHtml5 className="text-orange-600" /> },
//   css: { name: "CSS", icon: <SiCss3 className="text-blue-400" /> },
// };

// const DEFAULT_LANGUAGE = "javascript";
// //const RTMP_URL = "rtmp://a.rtmp.youtube.com/live2"; // REMOVE THIS

// const IDE = () => {
//   // Router hooks
//   const { state } = useLocation();
//   const navigate = useNavigate();

//   // Refs
//   const terminalRef = useRef(null);
//   const socketRef = useRef(null);
//   const mediaRecorderRef = useRef(null);
//   const localStreamRef = useRef(null);

//   // State
//   const [activeFile, setActiveFile] = useState(null);
//   const [code, setCode] = useState("");
//   const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
//   const [rootHandle, setRootHandle] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // Collaboration
//   const [isCollabMode, setIsCollabMode] = useState(false);
//   const [collaborators, setCollaborators] = useState([]);

//   // UI State
//   const [terminalOpen, setTerminalOpen] = useState(true);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [fontSize, setFontSize] = useState(14);

//   // Video/Streaming
//   const [isStreaming, setIsStreaming] = useState(false);
//   const [streamKey, setStreamKey] = useState("");
//   const [showStreamDialog, setShowStreamDialog] = useState(false);
//   const [localStream, setLocalStream] = useState(null);

//   // Dialogs
//   const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
//   const [showSaveConfirm, setShowSaveConfirm] = useState(false);

//   const yDocRef = useRef(null);
//   const providerRef = useRef(null);
//   const bindingRef = useRef(null);
//   const editorRef = useRef(null);

//   // Initialize Yjs when component mounts
//   useEffect(() => {
//     if (!isCollabMode) return;

//     // Initialize Yjs document and provider
//     yDocRef.current = new Y.Doc();
//     providerRef.current = new WebrtcProvider(
//       "your-room-name",
//       yDocRef.current,
//       {
//         signaling: ["wss://y-webrtc-signaling-server.herokuapp.com"],
//         // or use your own signaling server
//       }
//     );

//     return () => {
//       // Cleanup on unmount or when collaboration is turned off
//       if (providerRef.current) {
//         providerRef.current.destroy();
//       }
//       if (yDocRef.current) {
//         yDocRef.current.destroy();
//       }
//     };
//   }, [isCollabMode]);

//   // Handle editor mount
//   const handleEditorDidMount = (editor, monaco) => {
//     editorRef.current = editor;

//     if (isCollabMode && yDocRef.current) {
//       // Get or create shared text type
//       const yText = yDocRef.current.getText("monaco");

//       // Initialize Monaco binding
//       bindingRef.current = new MonacoBinding(
//         yText,
//         editor.getModel(),
//         new Set([editor]),
//         providerRef.current?.awareness
//       );

//       // Set initial content if needed
//       if (code) {
//         yText.insert(0, code);
//       }
//     }
//   };

//   // Update editor when collaboration mode changes
//   useEffect(() => {
//     if (!editorRef.current) return;

//     if (isCollabMode && yDocRef.current) {
//       const yText = yDocRef.current.getText("monaco");
//       bindingRef.current = new MonacoBinding(
//         yText,
//         editorRef.current.getModel(),
//         new Set([editorRef.current]),
//         providerRef.current.awareness
//       );
//     } else {
//       // Clean up binding when leaving collaboration mode
//       if (bindingRef.current) {
//         bindingRef.current.destroy();
//         bindingRef.current = null;
//       }
//     }
//   }, [isCollabMode]);

//   // Update code state when not in collaboration mode
//   const handleEditorChange = (value) => {
//     if (!isCollabMode) {
//       setCode(value);
//     }
//   };

//   // Initialize socket connection
//   useEffect(() => {
//     const socket = io("http://localhost:4002", { withCredentials: true });
//     socketRef.current = socket;

//     socket.on("connect", () => {
//       console.log("Socket connected");
//     });

//     socket.on("stream-status", toast);
//     socket.on("stream-error", handleStreamError);

//     socket.on("disconnect", () => {
//       console.log("Socket disconnected");
//       if (isStreaming) {
//         stopStreaming(); // Stop streaming if socket disconnects
//         toast.error("Socket disconnected.  Stream stopped.");
//       }
//     });

//     return () => socket.disconnect();
//   }, []);

//   // Initialize directory
//   useEffect(() => {
//     const initDirectory = async () => {
//       try {
//         if (state?.dirHandle) {
//           setRootHandle(state.dirHandle);
//           return;
//         }

//         const dirHandle = await window.showDirectoryPicker({
//           id: "my-project-folder",
//           mode: "readwrite",
//         });
//         setRootHandle(dirHandle);
//       } catch (error) {
//         if (error.name !== "AbortError") {
//           console.error("Directory initialization error:", error);
//           toast.error("Could not access directory. Please try again.");
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     initDirectory();
//   }, [state]);

//   // Simulate collaborators (for demo)
//   useEffect(() => {
//     if (isCollabMode) {
//       const timer = setTimeout(() => {
//         setCollaborators([
//           {
//             id: 1,
//             name: "Alex Johnson",
//             color: "bg-blue-500",
//             cursorPos: { line: 5, column: 10 },
//           },
//           {
//             id: 2,
//             name: "Sam Wilson",
//             color: "bg-green-500",
//             cursorPos: { line: 12, column: 4 },
//           },
//         ]);
//       }, 2000);

//       return () => clearTimeout(timer);
//     }
//   }, [isCollabMode]);

//   const handleFileSelect = async (file) => {
//     if (!file.isDirectory && file.handle) {
//       try {
//         const fileHandle = file.handle;
//         const fileData = await fileHandle.getFile();
//         const content = await fileData.text();
//         const fileLanguage = getLanguageFromExtension(file.name);

//         setActiveFile(file);
//         setCode(content);
//         setLanguage(fileLanguage);
//       } catch (error) {
//         toast.error("Failed to load file");
//         console.error("File loading error:", error);
//       }
//     }
//   };

//   const getLanguageFromExtension = (filename) => {
//     if (!filename) return "text";

//     const extension = filename.split(".").pop().toLowerCase();
//     switch (extension) {
//       case "js":
//         return "javascript";
//       case "ts":
//         return "typescript";
//       case "py":
//         return "python";
//       case "html":
//         return "html";
//       case "css":
//         return "css";
//       default:
//         return "text";
//     }
//   };

//   const saveFile = async () => {
//     if (!activeFile?.handle) {
//       toast.error("No file selected to save");
//       return;
//     }

//     try {
//       const writable = await activeFile.handle.createWritable();
//       await writable.write(code);
//       await writable.close();
//       toast.success("File saved successfully");
//     } catch (error) {
//       toast.error("Failed to save file");
//       console.error(error);
//     }
//   };

//   const socket = io("http://localhost:4002");
//   const peer = new Peer();

//   // Update the startClassroom function in IDE.jsx
//   const startClassroom = async () => {
//     try {
//       // Generate a unique room ID
//       const roomId = Math.random().toString(36).substring(2, 8);

//       // Open new tab with classroom route
//       const newWindow = window.open(
//         `/classroom/${roomId}`,
//         "_blank",
//         "noopener,noreferrer"
//       );

//       if (newWindow) {
//         newWindow.focus();
//       } else {
//         toast.error("Please allow popups for this site");
//       }
//     } catch (error) {
//       console.error("Error starting classroom:", error);
//       toast.error("Failed to start classroom");
//     }
//   };

//   const startStreaming = useCallback(async () => {
//     if (!socketRef.current) {
//       toast.error("Socket not connected.  Try again.");
//       return;
//     }

//     try {
//       setShowStreamDialog(false);
//       toast.loading("Starting stream...");

//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 1280, height: 720, frameRate: 30 },
//         audio: true,
//       });

//       localStreamRef.current = stream;

//       const recorder = new MediaRecorder(stream, {
//         mimeType: "video/webm;codecs=vp9,opus",
//         videoBitsPerSecond: 2500000,
//       });

//       recorder.ondataavailable = async (event) => {
//         if (event.data.size > 0 && socketRef.current?.connected) {
//           const buffer = await event.data.arrayBuffer();
//           socketRef.current.emit("stream-data", buffer);
//         }
//       };

//       recorder.start(1000);
//       mediaRecorderRef.current = recorder;
//       socketRef.current.emit("start-stream", streamKey); // Send streamKey to backend

//       setIsStreaming(true);
//       toast.success("Live stream started!");
//     } catch (error) {
//       console.error("Stream start error:", error);
//       toast.error(`Failed to start stream: ${error.message}`);
//       stopStreaming();
//     }
//   }, [streamKey]);

//   const stopStreaming = useCallback(() => {
//     if (mediaRecorderRef.current?.state !== "inactive") {
//       mediaRecorderRef.current?.stop();
//     }

//     localStreamRef.current?.getTracks().forEach((track) => track.stop());
//     if (socketRef.current) {
//       // Check if socket is still connected before emitting
//       socketRef.current?.emit("stop-stream");
//     }

//     mediaRecorderRef.current = null;
//     localStreamRef.current = null;
//     setIsStreaming(false);
//     toast("Live stream stopped");
//   }, []);

//   const handleStreamError = (error) => {
//     toast.error(error);
//     stopStreaming();
//   };

//   const toggleTerminal = () => setTerminalOpen((prev) => !prev);

//   const toggleFullscreen = () => {
//     if (!isFullscreen) {
//       document.documentElement.requestFullscreen().catch(console.log);
//     } else {
//       document.exitFullscreen().catch(console.log);
//     }
//     setIsFullscreen((prev) => !prev);
//   };

//   const handleLeaveConfirm = (confirm) => {
//     setShowLeaveConfirm(false);
//     if (confirm) navigate("/dashboard");
//   };

//   const handleSaveConfirm = async (shouldSave) => {
//     setShowSaveConfirm(false);
//     if (shouldSave) await saveFile();
//     navigate("/dashboard");
//   };

//   if (isLoading) {
//     return <LoadingScreen />;
//   }

//   return (
//     <div
//       className={`flex flex-col h-screen bg-white ${
//         isFullscreen ? "fixed inset-0 z-50" : ""
//       }`}
//     >
//       {/* Toolbar */}
//       <Toolbar
//         isCollabMode={isCollabMode}
//         language={language}
//         languages={LANGUAGES}
//         isFullscreen={isFullscreen}
//         onStartClassroom={startClassroom}
//         onShowStreamDialog={() => setShowStreamDialog(true)}
//         onSaveFile={saveFile}
//         onShareProject={() => {}} // Implement share functionality
//         onToggleCollabMode={() => setIsCollabMode((prev) => !prev)}
//         onLanguageChange={setLanguage}
//         onToggleFullscreen={toggleFullscreen}
//       />

//       {/* Main IDE Area */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* File Explorer */}
//         <FileExplorer
//           onSelectFile={handleFileSelect}
//           selectedFile={activeFile?.path}
//           rootHandle={rootHandle}
//           className="border-r border-gray-200"
//         />

//         {/* Editor and Terminal Area */}
//         <div className="flex-1 flex flex-col overflow-hidden">
//           {/* Editor Header */}
//           {activeFile && (
//             <EditorHeader
//               file={activeFile}
//               language={language}
//               languages={LANGUAGES}
//               collaborators={collaborators}
//               isCollabMode={isCollabMode}
//             />
//           )}

//           {/* Split Editor and Terminal */}
//           <Split
//             direction="vertical"
//             sizes={terminalOpen ? [70, 30] : [100, 0]}
//             minSize={terminalOpen ? [100, 100] : [0, 0]}
//             gutterSize={5}
//             className="flex-1 overflow-hidden"
//           >
//             {/* Editor */}
//             <div className="w-full h-full">
//               <Editor
//                 height="100%"
//                 language={language}
//                 theme="light"
//                 value={code}
//                 onChange={handleEditorChange}
//                 onMount={handleEditorDidMount}
//                 options={{
//                   fontSize,
//                   minimap: { enabled: true },
//                   wordWrap: "on",
//                   renderWhitespace: "selection",
//                   cursorBlinking: "smooth",
//                 }}
//               />
//             </div>

//             {/* Terminal */}
//             {terminalOpen && (
//               <Terminal
//                 currentDirectory={rootHandle?.name || "project"}
//                 key={rootHandle?.name}
//               />
//             )}
//           </Split>
//         </div>
//       </div>

//       {/* Modals and Dialogs */}
//       <ConfirmationDialog
//         isOpen={showLeaveConfirm}
//         title="Leave Editor?"
//         message="Are you sure you want to go back to the dashboard?"
//         onConfirm={() => handleLeaveConfirm(true)}
//         onCancel={() => handleLeaveConfirm(false)}
//       />

//       <ConfirmationDialog
//         isOpen={showSaveConfirm}
//         title="Save Changes?"
//         message="Do you want to save your changes before leaving?"
//         confirmText="Save"
//         onConfirm={() => handleSaveConfirm(true)}
//         onCancel={() => handleSaveConfirm(false)}
//       />

//       <YouTubeStreamDialog
//         isOpen={showStreamDialog}
//         streamKey={streamKey}
//         onStreamKeyChange={setStreamKey}
//         onStartStreaming={startStreaming}
//         onClose={() => setShowStreamDialog(false)}
//       />

//       {isStreaming && (
//         <div className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center text-sm z-50">
//           <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
//           LIVE
//         </div>
//       )}

//     </div>
//   );
// };

// export default IDE;
