import {
  FiSave,
  FiUsers,
  FiVideo,
  FiMaximize2,
  FiMinimize2,
  FiShare2,
  FiArrowLeft,
} from "react-icons/fi";

const Toolbar = ({
  isFullscreen,
  onStartClassroom,
  onShowStreamDialog,
  onSaveFile,
  onToggleFullscreen,
  onBackToDashboard,
  isStreaming,
  stopStreaming,
}) => (
  <div className="flex justify-between items-center px-6 py-3 bg-white rounded-xl shadow border border-gray-100 mb-2">
    <div className="flex items-center space-x-4">
      <button
        onClick={onBackToDashboard}
        className="flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition focus:outline-none focus:ring-2 focus:ring-blue-200 mr-2"
        title="Back to Dashboard"
      >
        <FiArrowLeft className="mr-2" />
      </button>
      <span className="font-bold text-lg text-blue-700 tracking-tight">
        CloudIDE <span className="font-light text-gray-500">Pro</span>
      </span>
      <div className="flex space-x-2">
        <button
          onClick={onStartClassroom}
          className="flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium shadow hover:from-blue-600 hover:to-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <FiVideo className="mr-2" /> Start Class
        </button>
        <button
          onClick={isStreaming ? stopStreaming : onShowStreamDialog}
          className={`flex items-center px-3 py-1.5 rounded-lg text-white text-sm font-medium shadow transition focus:outline-none focus:ring-2 focus:ring-red-200 ${
            isStreaming
              ? "bg-red-600 hover:bg-red-700" // Red when streaming (stop button)
              : "bg-gradient-to-r from-pink-500 to-red-500 hover:from-red-500 hover:to-pink-600" // Gradient when not streaming
          }`}
        >
          <FiVideo className="mr-2" />
          {isStreaming ? "Stop Stream" : "YouTube Stream"}
        </button>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      {/* Share button moved here */}
      <button
        onClick={onSaveFile}
        className="flex items-center px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200 transition focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        <FiSave className="mr-2" /> Save
      </button>
      <button
        onClick={onToggleFullscreen}
        className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition focus:outline-none focus:ring-2 focus:ring-blue-200"
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
      </button>
    </div>
  </div>
);

export default Toolbar;