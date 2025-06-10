import { FiFile, FiFolder, FiChevronRight, FiChevronDown } from "react-icons/fi";

const FileTreeNode = ({
  node,
  depth = 0,
  onSelect,
  selectedFile,
  onToggle,
  expandedNodes,
}) => {
  const isExpanded = expandedNodes.has(node.path);
  const isSelected = selectedFile === node.path;

  const handleClick = (e) => {
    e.stopPropagation();
    if (node.isDirectory) {
      onToggle(node.path);
    } else {
      onSelect({
        path: node.path,
        handle: node.handle,
      });
    }
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 rounded-lg cursor-pointer transition
        ${isSelected ? "bg-blue-50 border border-blue-400" : "hover:bg-gray-100"}
        `}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
        onClick={handleClick}
      >
        {node.isDirectory && (
          <span className="mr-1 text-gray-400">
            {isExpanded ? <FiChevronDown size={15} /> : <FiChevronRight size={15} />}
          </span>
        )}
        <span className="mr-2 text-gray-500">
          {node.isDirectory ? <FiFolder size={15} /> : <FiFile size={15} />}
        </span>
        <span className={`truncate font-medium ${isSelected ? "text-blue-700" : "text-gray-800"}`}>
          {node.name}
        </span>
      </div>
      {node.isDirectory && isExpanded && node.children?.map((child) => (
        <FileTreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          onSelect={onSelect}
          selectedFile={selectedFile}
          onToggle={onToggle}
          expandedNodes={expandedNodes}
        />
      ))}
    </div>
  );
};

export default FileTreeNode;






// import { FiFile, FiFolder, FiChevronRight, FiChevronDown } from "react-icons/fi";

// const FileTreeNode = ({
//   node,
//   depth = 0,
//   onSelect,
//   selectedFile,
//   onToggle,
//   expandedNodes,
// }) => {
//   const isExpanded = expandedNodes.has(node.path);
//   const isSelected = selectedFile === node.path;

//   const handleClick = (e) => {
//     e.stopPropagation();
    
//     if (node.isDirectory) {
//       onToggle(node.path);
//     } else {
//       onSelect({
//         path: node.path,
//         handle: node.handle
//       });
//     }
//   };

//   return (
//     <div className="select-none">
//       <div
//         className={`flex items-center py-1 px-2 hover:bg-gray-600 ${isSelected ? "bg-blue-600" : ""}`}
//         style={{ paddingLeft: `${depth * 12 + 12}px` }}
//         onClick={handleClick}
//       >
//         {node.isDirectory && (
//           <span className="mr-1">
//             {isExpanded ? (
//               <FiChevronDown size={14} />
//             ) : (
//               <FiChevronRight size={14} />
//             )}
//           </span>
//         )}
//         <span className="mr-2">
//           {node.isDirectory ? (
//             <FiFolder size={14} />
//           ) : (
//             <FiFile size={14} />
//           )}
//         </span>
//         <span className="truncate">{node.name}</span>
//       </div>

//       {node.isDirectory && isExpanded && node.children?.map((child) => (
//         <FileTreeNode
//           key={child.path}
//           node={child}
//           depth={depth + 1}
//           onSelect={onSelect}
//           selectedFile={selectedFile}
//           onToggle={onToggle}
//           expandedNodes={expandedNodes}
//         />
//       ))}
//     </div>
//   );
// };

// export default FileTreeNode;
