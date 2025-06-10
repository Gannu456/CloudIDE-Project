const { PassThrough } = require('stream');
const { spawn } = require('child_process');
const { STREAM_EVENTS } = require('../utils/constants');

const activeStreams = new Map();

const setupYouTubeStream = (socket, streamKey) => {
  if (!streamKey || typeof streamKey !== 'string') {
    throw new Error('Invalid YouTube stream key');
  }

  const rtmpUrl = `rtmps://a.rtmp.youtube.com/live2/${streamKey}`;
  const streamBuffer = new PassThrough();

  const options = [
    '-f', 'webm',              // Input format
    '-i', '-',                 // Input from stdin
    '-c:v', 'libx264',         // Video codec
    '-preset', 'veryfast',     // Better balance between speed and compression
    '-tune', 'zerolatency',    // Optimize for low latency
    '-r', '30',                // Frame rate
    '-g', '60',                // Keyframe interval (2x frame rate)
    '-keyint_min', '30',       // Minimum keyframe interval
    '-crf', '23',              // Quality (lower is better, 18-28 is reasonable)
    '-pix_fmt', 'yuv420p',     // Pixel format
    '-profile:v', 'main',      // H.264 profile
    '-b:v', '2500k',           // Video bitrate
    '-maxrate', '2500k',       // Maximum bitrate
    '-bufsize', '5000k',       // Buffer size
    '-c:a', 'aac',             // Audio codec
    '-b:a', '128k',            // Audio bitrate
    '-ar', '44100',            // Audio sample rate
    '-f', 'flv',               // Output format
    rtmpUrl                    // Output URL
  ];

  const ffmpegProcess = spawn('ffmpeg', options);

  ffmpegProcess.stdout.on('data', (data) => {
    console.log(`ffmpeg stdout: ${data}`);
  });

  ffmpegProcess.stderr.on('data', (data) => {
    console.error(`ffmpeg stderr: ${data}`);
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`ffmpeg process exited with code ${code}`);
    if (socket && !socket.disconnected) {
      socket.emit(STREAM_EVENTS.ERROR, `FFmpeg process exited with code ${code}`);
    }
  });

  ffmpegProcess.on('error', (err) => {
    console.error('FFmpeg process error:', err);
    if (socket && !socket.disconnected) {
      socket.emit(STREAM_EVENTS.ERROR, `FFmpeg error: ${err.message}`);
    }
  });

  streamBuffer.pipe(ffmpegProcess.stdin);
  return streamBuffer;
};

const setupStreamHandlers = (socket) => {
  socket.on(STREAM_EVENTS.START, (streamKey) => {
    try {
      if (activeStreams.has(socket.id)) {
        socket.emit(STREAM_EVENTS.ERROR, 'Stream already in progress');
        return;
      }

      const streamBuffer = setupYouTubeStream(socket, streamKey);
      activeStreams.set(socket.id, streamBuffer);
      socket.emit(STREAM_EVENTS.STARTED, true);

    } catch (error) {
      console.error('Stream start error:', error);
      socket.emit(STREAM_EVENTS.ERROR, error.message);
    }
  });

  socket.on(STREAM_EVENTS.DATA, (data) => {
    try {
      const streamBuffer = activeStreams.get(socket.id);
      if (streamBuffer?.writable) {
        if (data instanceof Buffer) {
          streamBuffer.write(data);
        } else if (data instanceof ArrayBuffer) {
          streamBuffer.write(Buffer.from(data));
        } else {
          throw new Error('Invalid stream data type');
        }
      }
    } catch (error) {
      console.error('Stream data error:', error);
      socket.emit(STREAM_EVENTS.ERROR, error.message);
    }
  });

  socket.on(STREAM_EVENTS.STOP, () => {
    try {
      const streamBuffer = activeStreams.get(socket.id);
      if (streamBuffer) {
        streamBuffer.end();
        activeStreams.delete(socket.id);
        socket.emit(STREAM_EVENTS.STOPPED, true);
      }
    } catch (error) {
      console.error('Stream stop error:', error);
      socket.emit(STREAM_EVENTS.ERROR, error.message);
    }
  });

  socket.on('disconnect', () => {
    const streamBuffer = activeStreams.get(socket.id);
    if (streamBuffer) {
      streamBuffer.end();
      activeStreams.delete(socket.id);
    }
  });
};

module.exports = { setupStreamHandlers };






// const { PassThrough } = require('stream');
// const { spawn } = require('child_process');
// const { STREAM_EVENTS } = require('../utils/constants');

// const activeStreams = new Map();

// const setupYouTubeStream = (socket, streamKey) => {
//   if (!streamKey || typeof streamKey !== 'string') {
//     throw new Error('Invalid YouTube stream key');
//   }

//   const rtmpUrl = `rtmps://a.rtmp.youtube.com/live2/${streamKey}`;
//   const streamBuffer = new PassThrough();

//   const options = [
//     '-f', 'webm',
//     '-i', '-',
//     '-c:v', 'libx264',
//     '-preset', 'veryfast',
//     '-tune', 'zerolatency',
//     '-r', '30',
//     '-g', '60',
//     '-keyint_min', '30',
//     '-crf', '23',
//     '-pix_fmt', 'yuv420p',
//     '-profile:v', 'main',
//     '-b:v', '2500k',
//     '-maxrate', '2500k',
//     '-bufsize', '5000k',
//     '-c:a', 'aac',
//     '-b:a', '128k',
//     '-ar', '44100',
//     '-f', 'flv',
//     rtmpUrl
//   ];

//   const ffmpegProcess = spawn('ffmpeg', options);

//   ffmpegProcess.stdout.on('data', (data) => {
//     console.log(`ffmpeg stdout: ${data}`);
//   });

//   ffmpegProcess.stderr.on('data', (data) => {
//     console.error(`ffmpeg stderr: ${data}`);
//   });

//   ffmpegProcess.on('close', (code) => {
//     console.log(`ffmpeg process exited with code ${code}`);
//     if (socket && !socket.disconnected) {
//       socket.emit(STREAM_EVENTS.ERROR, `FFmpeg process exited with code ${code}`);
//     }
//     activeStreams.delete(socket.id);
//   });

//   ffmpegProcess.on('error', (err) => {
//     console.error('FFmpeg process error:', err);
//     if (socket && !socket.disconnected) {
//       socket.emit(STREAM_EVENTS.ERROR, `FFmpeg error: ${err.message}`);
//     }
//     activeStreams.delete(socket.id);
//   });

//   streamBuffer.pipe(ffmpegProcess.stdin);
  
//   // Store both the stream buffer and ffmpeg process
//   activeStreams.set(socket.id, {
//     streamBuffer,
//     ffmpegProcess
//   });
  
//   return streamBuffer;
// };

// const setupStreamHandlers = (socket) => {
//   socket.on(STREAM_EVENTS.START, (streamKey) => {
//     try {
//       if (activeStreams.has(socket.id)) {
//         socket.emit(STREAM_EVENTS.ERROR, 'Stream already in progress');
//         return;
//       }

//       const streamBuffer = setupYouTubeStream(socket, streamKey);
//       socket.emit(STREAM_EVENTS.STARTED, true);

//     } catch (error) {
//       console.error('Stream start error:', error);
//       socket.emit(STREAM_EVENTS.ERROR, error.message);
//     }
//   });

//   socket.on(STREAM_EVENTS.DATA, (data) => {
//     try {
//       const streamData = activeStreams.get(socket.id);
//       if (streamData?.streamBuffer?.writable) {
//         if (data instanceof Buffer) {
//           streamData.streamBuffer.write(data);
//         } else if (data instanceof ArrayBuffer) {
//           streamData.streamBuffer.write(Buffer.from(data));
//         } else {
//           throw new Error('Invalid stream data type');
//         }
//       }
//     } catch (error) {
//       console.error('Stream data error:', error);
//       socket.emit(STREAM_EVENTS.ERROR, error.message);
//     }
//   });

//   socket.on(STREAM_EVENTS.STOP, () => {
//     try {
//       const streamData = activeStreams.get(socket.id);
//       if (streamData) {
//         // End the stream buffer
//         if (streamData.streamBuffer?.writable) {
//           streamData.streamBuffer.end();
//         }
        
//         // Kill the ffmpeg process
//         if (streamData.ffmpegProcess) {
//           streamData.ffmpegProcess.kill('SIGINT');
//         }
        
//         activeStreams.delete(socket.id);
//         socket.emit(STREAM_EVENTS.STOPPED, true);
//       }
//     } catch (error) {
//       console.error('Stream stop error:', error);
//       socket.emit(STREAM_EVENTS.ERROR, error.message);
//     }
//   });

//   socket.on('disconnect', () => {
//     const streamData = activeStreams.get(socket.id);
//     if (streamData) {
//       if (streamData.streamBuffer?.writable) {
//         streamData.streamBuffer.end();
//       }
//       if (streamData.ffmpegProcess) {
//         streamData.ffmpegProcess.kill('SIGINT');
//       }
//       activeStreams.delete(socket.id);
//     }
//   });
// };

// module.exports = { setupStreamHandlers };





