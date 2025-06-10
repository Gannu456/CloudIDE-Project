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

// import { FiSave, FiShare2, FiUsers, FiVideo, FiMaximize2, FiMinimize2, FiChevronDown } from "react-icons/fi";

// const Toolbar = ({
//   isCollabMode,
//   language,
//   languages,
//   isFullscreen,
//   onStartClassroom,
//   onShowStreamDialog,
//   onSaveFile,
//   onShareProject,
//   onToggleCollabMode,
//   onLanguageChange,
//   onToggleFullscreen,
// }) => (
//   <div className="bg-blue-600 text-white p-2 flex justify-between items-center shadow-md">
//     <div className="flex items-center space-x-4">
//       <h1 className="font-bold text-lg">CloudIDE Pro</h1>
//       <div className="flex space-x-2">
//         <button
//           onClick={onStartClassroom}
//           className="flex items-center px-3 py-1 rounded hover:bg-blue-700 bg-blue-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
//         >
//           <FiVideo className="mr-2" /> Start Class
//         </button>
//         <button
//           onClick={onShowStreamDialog}
//           className="flex items-center px-3 py-1 rounded hover:bg-red-700 bg-red-600 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
//         >
//           <FiVideo className="mr-2" /> YouTube Stream
//         </button>
//         <button
//           onClick={onSaveFile}
//           className="flex items-center px-3 py-1 rounded hover:bg-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
//         >
//           <FiSave className="mr-2" /> Save
//         </button>
//         <button
//           onClick={onShareProject}
//           className="flex items-center px-3 py-1 rounded hover:bg-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
//         >
//           <FiShare2 className="mr-2" /> Share
//         </button>
//         <button
//           onClick={onToggleCollabMode}
//           className={`flex items-center px-3 py-1 rounded hover:bg-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${
//             isCollabMode ? "bg-blue-500" : ""
//           }`}
//         >
//           <FiUsers className="mr-2" /> Collaborate
//         </button>
//       </div>
//     </div>
//     <div className="flex items-center space-x-4">
//       <div className="relative">
//         <select
//           value={language}
//           onChange={(e) => onLanguageChange(e.target.value)}
//           className="appearance-none bg-blue-500 text-white rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
//         >
//           {Object.entries(languages).map(([key, lang]) => (
//             <option key={key} value={key}>
//               {lang.name}
//             </option>
//           ))}
//         </select>
//         <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
//       </div>
//       <button
//         onClick={onToggleFullscreen}
//         className="p-1 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
//         title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
//       >
//         {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
//       </button>
//     </div>
//   </div>
// );

// export default Toolbar;
