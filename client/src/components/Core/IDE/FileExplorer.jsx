import { useState, useRef } from "react";
import { FiFilePlus, FiFolderPlus } from "react-icons/fi";
import FileTreeNode from "./FileTreeNode";

const FileExplorer = ({ onSelectFile, selectedFile, rootHandle: propRootHandle }) => {
  const [isCreating, setIsCreating] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [fileTree, setFileTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rootHandle, setRootHandle] = useState(propRootHandle || null);
  const watcherRef = useRef(null);

  // Load file tree
  const loadFileTree = async (dirHandle) => {
    setLoading(true);
    try {
      const tree = await generateFileTree(dirHandle);
      setFileTree(tree);
    } catch (error) {
      console.error("Error loading file tree:", error);
    } finally {
      setLoading(false);
    }
  };

  // Open directory
  const handleOpenDirectory = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      setRootHandle(dirHandle);
      await loadFileTree(dirHandle);
    } catch (err) {
      console.error("Error accessing directory:", err);
    }
  };

  // New file/folder
  const handleCreateNew = (type) => {
    setIsCreating(type);
    setNewItemName("");
  };

  const confirmCreateNew = async () => {
    if (!newItemName.trim() || !rootHandle) return;
    try {
      if (isCreating === "file") {
        const fileHandle = await rootHandle.getFileHandle(newItemName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write("");
        await writable.close();
      } else if (isCreating === "folder") {
        await rootHandle.getDirectoryHandle(newItemName, { create: true });
      }
      await loadFileTree(rootHandle);
    } catch (error) {
      console.error("Error creating new item:", error);
    }
    setIsCreating(null);
    setNewItemName("");
  };

  // Expand/collapse
  const toggleNode = (nodePath) => {
    const newSet = new Set(expandedNodes);
    if (newSet.has(nodePath)) newSet.delete(nodePath);
    else newSet.add(nodePath);
    setExpandedNodes(newSet);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading file tree...
      </div>
    );
  }

  // No directory open
  if (!fileTree) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <button
          onClick={handleOpenDirectory}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
        >
          Open Directory
        </button>
      </div>
    );
  }

  // Main Explorer UI
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100">
        <span className="text-xs font-bold tracking-widest text-gray-600">EXPLORER</span>
        <div className="flex space-x-2">
          <button
            onClick={() => handleCreateNew("file")}
            className="text-blue-500 hover:bg-blue-100 p-1 rounded transition"
            title="New File"
          >
            <FiFilePlus size={16} />
          </button>
          <button
            onClick={() => handleCreateNew("folder")}
            className="text-blue-500 hover:bg-blue-100 p-1 rounded transition"
            title="New Folder"
          >
            <FiFolderPlus size={16} />
          </button>
        </div>
      </div>

      {/* New file/folder input */}
      {isCreating && (
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmCreateNew()}
            onBlur={confirmCreateNew}
            autoFocus
            className="flex-1 bg-white border border-gray-200 px-2 py-1 text-sm rounded outline-none focus:ring-2 focus:ring-blue-200"
            placeholder={`New ${isCreating} name...`}
          />
        </div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-2">
        <FileTreeNode
          node={fileTree}
          onSelect={onSelectFile}
          selectedFile={selectedFile}
          expandedNodes={expandedNodes}
          onToggle={toggleNode}
          depth={0}
        />
      </div>
    </div>
  );
};

// Helper to generate file tree
async function generateFileTree(dirHandle) {
  const tree = {
    name: dirHandle.name,
    path: dirHandle.name,
    handle: dirHandle,
    isDirectory: true,
    children: [],
  };

  async function buildTree(currentHandle, parentNode) {
    for await (const [name, handle] of currentHandle.entries()) {
      const node = {
        name,
        path: `${parentNode.path}/${name}`,
        handle,
        isDirectory: handle.kind === 'directory',
      };
      if (handle.kind === 'directory') {
        node.children = [];
        await buildTree(handle, node);
      }
      parentNode.children.push(node);
    }
  }

  await buildTree(dirHandle, tree);
  return tree;
}

export default FileExplorer;






// import { useState, useEffect, useRef } from "react";
// import { FiFilePlus, FiFolderPlus } from "react-icons/fi";
// import FileTreeNode from "./FileTreeNode";

// const FileExplorer = ({ onSelectFile, selectedFile }) => {
//   const [isCreating, setIsCreating] = useState(null);
//   const [newItemName, setNewItemName] = useState("");
//   const [expandedNodes, setExpandedNodes] = useState(new Set());
//   const [fileTree, setFileTree] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [rootHandle, setRootHandle] = useState(null);
//   const watcherRef = useRef(null);

//   const loadFileTree = async (dirHandle) => {
//     setLoading(true);
//     try {
//       const tree = await generateFileTree(dirHandle);
//       setFileTree(tree);
//     } catch (error) {
//       console.error("Error loading file tree:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOpenDirectory = async () => {
//     try {
//       const dirHandle = await window.showDirectoryPicker();
//       setRootHandle(dirHandle);
//       await loadFileTree(dirHandle);
//     } catch (err) {
//       console.error("Error accessing directory:", err);
//     }
//   };

//   const handleCreateNew = (type) => {
//     setIsCreating(type);
//     setNewItemName("");
//   };

//   const confirmCreateNew = async () => {
//     if (!newItemName.trim() || !rootHandle) return;
    
//     try {
//       if (isCreating === "file") {
//         const fileHandle = await rootHandle.getFileHandle(newItemName, { create: true });
//         // You might want to write some initial content
//         const writable = await fileHandle.createWritable();
//         await writable.write("");
//         await writable.close();
//       } else if (isCreating === "folder") {
//         await rootHandle.getDirectoryHandle(newItemName, { create: true });
//       }
      
//       // Refresh the tree
//       await loadFileTree(rootHandle);
//     } catch (error) {
//       console.error("Error creating new item:", error);
//     }
    
//     setIsCreating(null);
//     setNewItemName("");
//   };

//   const toggleNode = (nodePath) => {
//     const newSet = new Set(expandedNodes);
//     if (newSet.has(nodePath)) {
//       newSet.delete(nodePath);
//     } else {
//       newSet.add(nodePath);
//     }
//     setExpandedNodes(newSet);
//   };

//   if (loading) {
//     return (
//       <div className="w-64 bg-gray-700 text-white p-4">
//         Loading file tree...
//       </div>
//     );
//   }

//   if (!fileTree) {
//     return (
//       <div className="w-64 bg-gray-700 text-white p-4 flex flex-col">
//         <button 
//           onClick={handleOpenDirectory}
//           className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
//         >
//           Open Directory
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="w-64 bg-gray-700 text-white overflow-y-auto flex flex-col">
//       <div className="p-3 font-medium border-b border-gray-600 flex justify-between items-center">
//         <span>EXPLORER</span>
//         <div className="flex space-x-2">
//           <button
//             onClick={() => handleCreateNew("file")}
//             className="text-gray-300 hover:text-white"
//             title="New File"
//           >
//             <FiFilePlus size={16} />
//           </button>
//           <button
//             onClick={() => handleCreateNew("folder")}
//             className="text-gray-300 hover:text-white"
//             title="New Folder"
//           >
//             <FiFolderPlus size={16} />
//           </button>
//         </div>
//       </div>

//       {isCreating && (
//         <div className="px-2 py-1 border-b border-gray-600 flex">
//           <input
//             type="text"
//             value={newItemName}
//             onChange={(e) => setNewItemName(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && confirmCreateNew()}
//             onBlur={confirmCreateNew}
//             autoFocus
//             className="flex-1 bg-gray-600 text-white px-2 py-1 text-sm rounded"
//             placeholder={`New ${isCreating} name...`}
//           />
//         </div>
//       )}

//       <div className="flex-1 overflow-y-auto p-2">
//         <FileTreeNode
//           node={fileTree}
//           onSelect={onSelectFile}
//           selectedFile={selectedFile}
//           expandedNodes={expandedNodes}
//           onToggle={toggleNode}
//           depth={0}
//         />
//       </div>
//     </div>
//   );
// };

// async function generateFileTree(dirHandle) {
//   const tree = {
//     name: dirHandle.name,
//     path: dirHandle.name,
//     handle: dirHandle,
//     isDirectory: true,
//     children: [],
//   };

//   async function buildTree(currentHandle, parentNode) {
//     for await (const [name, handle] of currentHandle.entries()) {
//       const node = {
//         name,
//         path: `${parentNode.path}/${name}`,
//         handle,
//         isDirectory: handle.kind === 'directory',
//       };

//       if (handle.kind === 'directory') {
//         node.children = [];
//         await buildTree(handle, node);
//       }

//       parentNode.children.push(node);
//     }
//   }

//   await buildTree(dirHandle, tree);
//   return tree;
// }

// export default FileExplorer;
