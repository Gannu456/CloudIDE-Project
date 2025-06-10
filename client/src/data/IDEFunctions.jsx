const handleCreateRoom = () => {
  setIsLoading(true);

  socketRef.current.emit("create-room", (response) => {
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
  setRoomId("");
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
        frameRate: { ideal: 30 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    });

    localStreamRef.current = stream;

    // Create MediaRecorder with proper settings
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9,opus",
      videoBitsPerSecond: 2500000,
    });

    recorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && socketRef.current?.connected) {
        try {
          const buffer = await event.data.arrayBuffer();
          socketRef.current.emit("stream-data", buffer);
        } catch (error) {
          console.error("Error sending stream data:", error);
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
    console.error("Stream start error:", error);
    toast.error(`Failed to start stream: ${error.message}`);
    stopStreaming();
  }
}, [streamKey]);

const stopStreaming = useCallback(() => {
  try {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit("stop-stream");
    }

    mediaRecorderRef.current = null;
    localStreamRef.current = null;
    setIsStreaming(false);
    toast("Live stream stopped");
  } catch (error) {
    console.error("Error stopping stream:", error);
    toast.error("Error stopping stream");
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
