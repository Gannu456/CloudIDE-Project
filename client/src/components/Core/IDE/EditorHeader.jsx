import { getLanguageData } from "../../../data/LanguageIcons";

const EditorHeader = ({
  file,
}) => {
    const langData = getLanguageData(file.path);
    return (
  <div className="flex items-center justify-between px-4 py-2 bg-white rounded-t-xl border-b border-gray-100 shadow-sm">
    <div className="flex items-center min-w-0">
      <div className="flex items-center px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-100">
        <span className="mr-2 text-xl">
        {langData.icon}
        </span>
      </div>
      <div className="ml-4 items-center text-xs text-gray-500 truncate max-w-xs hidden sm:flex">
          <span className="mr-2">{langData.icon}</span>
          <span>{langData.name}</span>
          <span className="mx-2 text-gray-300">|</span>
          <span className="truncate">{file.path}</span>
        </div>
    </div>
  </div>
)};

export default EditorHeader;






// import { FiCode } from "react-icons/fi";

// const EditorHeader = ({ file, language, languages, collaborators, isCollabMode }) => (
//   <div className="bg-gray-50 border-b border-gray-200 flex items-center justify-between overflow-x-auto">
//     <div className="flex items-center">
//       <div className="flex items-center px-4 py-2 bg-white border-r border-gray-200">
//         <span className="mr-2">
//           {languages[language]?.icon || <FiCode />}
//         </span>
//         <span className="text-gray-800 font-medium">
//           {file.name}
//         </span>
//       </div>
//       <div className="ml-4 text-sm text-gray-500 truncate">
//         {file.path}
//       </div>
//     </div>

//     {isCollabMode && collaborators.length > 0 && (
//       <div className="px-4 flex items-center">
//         {collaborators.map((collab) => (
//           <div key={collab.id} className="flex items-center ml-3">
//             <div className={`w-2 h-2 rounded-full ${collab.color}`}></div>
//             <span className="ml-1 text-xs text-gray-600">
//               {collab.name}
//             </span>
//           </div>
//         ))}
//       </div>
//     )}
//   </div>
// );

// export default EditorHeader;