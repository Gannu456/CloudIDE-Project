import { FiVideo } from "react-icons/fi";
import { useState, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";

const YouTubeStreamDialog = ({
  isOpen,
  streamKey,
  onStreamKeyChange,
  onStartStreaming,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full px-8 py-7 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold focus:outline-none"
          aria-label="Close"
        >
          ×
        </button>
        <div className="flex items-center mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-red-500 to-pink-500 text-white mr-3">
            <FiVideo size={22} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            Start YouTube Live Stream
          </h3>
        </div>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            YouTube Stream Key
          </label>
          <input
            type="password"
            value={streamKey}
            onChange={(e) => onStreamKeyChange(e.target.value)}
            placeholder="Enter your YouTube stream key"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
          />
          <p className="mt-1 text-xs text-gray-500">
            Get this from <span className="font-semibold">YouTube Studio &gt; Go Live</span>
          </p>
          <div className="mt-4 text-sm text-gray-600">
    <p>Recommended settings:</p>
    <ul className="list-disc pl-5 mt-1">
      <li>Resolution: 1280x720 (720p)</li>
      <li>Frame rate: 30 FPS</li>
      <li>Bitrate: 2500-4000 Kbps</li>
    </ul>
  </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
                if (!streamKey || streamKey.length < 10) {
                  toast.error("Please enter a valid YouTube stream key");
                  return;
                }
                onStartStreaming();
              }}
            className={`px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold shadow hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-200 transition flex items-center ${
              !streamKey ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={!streamKey}
          >
            <FiVideo className="inline mr-2" />
            Start Streaming
          </button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeStreamDialog;
