// First code 
// import ChatBox from "../components/ChatBox";
// import { useEffect, useState, useRef, useCallback } from "react";
// import { useParams } from "react-router-dom";
// import CodeEditor from "../components/CodeEditor";
// import { useContext } from "react";
// import { AuthContext } from "../context/AuthContext";
// import io from "socket.io-client";
// import { Play, Terminal, Code, Globe, Users, Settings, Save } from "lucide-react";

// // small debounce (no dependency)
// function debounce(fn, wait = 500) {
//   let t;
//   return (...args) => {
//     clearTimeout(t);
//     t = setTimeout(() => fn(...args), wait);
//   };
// }

// const ProjectEditorPage = () => {
//   const { id } = useParams();
//   const { apiRequest } = useContext(AuthContext);
//   const [project, setProject] = useState(null);
//   const [code, setCode] = useState("");
//   const [language, setLanguage] = useState("javascript");
//   const [output, setOutput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [htmlPreview, setHtmlPreview] = useState(""); // for iframe srcDoc
//   const [isSaving, setIsSaving] = useState(false);

//   const socketRef = useRef();

//   // socket connection & listeners
//   useEffect(() => {
//     socketRef.current = io("http://localhost:3001");
//     socketRef.current.emit("joinProject", id);

//     socketRef.current.on("receiveCode", (newCode) => {
//       // only update editor if remote code differs
//       setCode((prev) => (prev !== newCode ? newCode : prev));
//       if (language === "html") setHtmlPreview(newCode);
//     });

//     socketRef.current.on("receiveOutput", (data) => {
//       setOutput(data);
//     });

//     return () => {
//       socketRef.current.disconnect();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id]);

//   // fetch project
//   useEffect(() => {
//     const fetchProject = async () => {
//       try {
//         const res = await apiRequest(`/projects/${id}`, "GET");
//         if (res.success) {
//           setProject(res.project);
//           setCode(res.project.code || "");
//           if ((res.project.code || "") && language === "html") setHtmlPreview(res.project.code);
//         } else {
//           console.error("fetch project failed", res);
//         }
//       } catch (e) {
//         console.error("fetch project error", e);
//       }
//     };
//     fetchProject();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id]);

//   // autosave (debounced)
//   const saveCodeToServer = useCallback(
//     async (newCode) => {
//       try {
//         setIsSaving(true);
//         await apiRequest(`/projects/${id}/save-code`, "POST", { code: newCode });
//         setTimeout(() => setIsSaving(false), 500);
//       } catch (e) {
//         console.error("save error", e);
//         setIsSaving(false);
//       }
//     },
//     [apiRequest, id]
//   );
//   const debouncedSave = useRef(debounce(saveCodeToServer, 1000)).current;

//   // handle code changes (local typing)
//   const handleCodeChange = (newCode) => {
//     setCode(newCode);
//     if (socketRef.current && socketRef.current.connected) {
//       socketRef.current.emit("codeChange", { projectId: id, code: newCode });
//     }
//     debouncedSave(newCode);

//     if (language === "html") {
//       setHtmlPreview(newCode); // update preview immediately
//     }
//   };

//   // run code -> handle HTML separately
//   const runCode = async () => {
//     if (language === "html") {
//       setOutput("🌐 HTML preview shown below.");
//       return;
//     }

//     setLoading(true);
//     setOutput("");

//     try {
//       const res = await apiRequest("/execute", "POST", {
//         language,
//         code,
//         stdin: "",
//       });

//       console.log("execute response:", res);

//       let resultText = "";

//       if (res && res.success) {
//         // try several shapes
//         if (res.result?.run) {
//           resultText = res.result.run.stdout || res.result.run.stderr || JSON.stringify(res.result.run);
//         } else if (res.result?.stdout || res.result?.stderr) {
//           resultText = res.result.stdout || res.result.stderr;
//         } else if (res.stdout || res.stderr) {
//           resultText = res.stdout || res.stderr;
//         } else {
//           resultText = JSON.stringify(res.result || res);
//         }

//         setOutput(String(resultText));
//         if (socketRef.current) {
//           socketRef.current.emit("codeOutput", { projectId: id, output: String(resultText) });
//         }
//       } else {
//         setOutput("Execution error: " + (res?.message || JSON.stringify(res)));
//       }
//     } catch (err) {
//       console.error("runCode error", err);
//       setOutput("Execution request failed: " + (err.message || err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // when user switches language, adjust preview/editor behavior
//   useEffect(() => {
//     if (language === "html") {
//       setHtmlPreview(code);
//     } else {
//       // clear preview if switching away
//       setHtmlPreview("");
//     }
//   }, [language, code]);

//   const getLanguageIcon = (lang) => {
//     switch (lang) {
//       case "html": return <Globe className="w-4 h-4" />;
//       case "javascript": return <Code className="w-4 h-4" />;
//       default: return <Terminal className="w-4 h-4" />;
//     }
//   };

//   const getLanguageColor = (lang) => {
//     switch (lang) {
//       case "javascript": return "from-yellow-500 to-orange-500";
//       case "python": return "from-blue-500 to-green-500";
//       case "html": return "from-orange-500 to-red-500";
//       case "java": return "from-red-500 to-orange-600";
//       case "cpp": return "from-blue-600 to-purple-600";
//       case "c": return "from-gray-600 to-gray-800";
//       case "php": return "from-purple-500 to-indigo-600";
//       default: return "from-gray-500 to-gray-700";
//     }
//   };

//   if (!project) {
//     return (
//       <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-500 text-lg">Loading project...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
//       {/* Enhanced Header */}
//       <header className="bg-white shadow-lg border-b border-gray-200">
//         <div className="px-6 py-4">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center gap-4">
//               <div className={`p-2 rounded-lg bg-gradient-to-r ${getLanguageColor(language)}`}>
//                 {getLanguageIcon(language)}
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
//                 <div className="flex items-center gap-2 text-sm text-gray-500">
//                   <Users className="w-4 h-4" />
//                   <span>{project.members?.length || 1} collaborators</span>
//                   {isSaving && (
//                     <div className="flex items-center gap-1 text-blue-600">
//                       <Save className="w-3 h-3 animate-pulse" />
//                       <span>Saving...</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
            
//             <div className="flex gap-3 items-center">
//               {/* Language Selector */}
//               <div className="relative">
//                 <select
//                   value={language}
//                   onChange={(e) => setLanguage(e.target.value)}
//                   className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
//                 >
//                   <option value="javascript">JavaScript</option>
//                   <option value="python">Python</option>
//                   <option value="php">PHP</option>
//                   <option value="java">Java</option>
//                   <option value="cpp">C++</option>
//                   <option value="c">C</option>
//                   <option value="html">HTML</option>
//                 </select>
//                 <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
//                   <Settings className="w-4 h-4 text-gray-400" />
//                 </div>
//               </div>

//               {/* Run Button */}
//               <button
//                 onClick={runCode}
//                 disabled={loading}
//                 className={`flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 shadow-lg
//                   ${loading 
//                     ? 'bg-gray-400 cursor-not-allowed' 
//                     : `bg-gradient-to-r ${getLanguageColor(language)} hover:shadow-xl`
//                   }`}
//               >
//                 {loading ? (
//                   <>
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                     Running...
//                   </>
//                 ) : (
//                   <>
//                     <Play className="w-4 h-4" />
//                     Run Code
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="flex-1 p-6 overflow-hidden">
//         <div className="h-full flex flex-col gap-6">
          
//           {/* Code Editor Section */}
//           {/* <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
//             <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-2 flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <div className="flex gap-1">
//                   <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//                   <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
//                   <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                 </div>
//                 <span className="text-gray-300 text-sm font-medium ml-2">
//                   main.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : language}
//                 </span>
//               </div>
//               <div className="text-gray-400 text-xs">
//                 {code.length} characters
//               </div>
//             </div>
//             <div style={{ height: "calc(100% - 40px)"   }}>
//               <CodeEditor code={code} onCodeChange={handleCodeChange} language={language} />
//             </div>
//           </div> */}
// <div className="flex-1 bg-white rounded-2xl shadow-2xl border border-gray-300 overflow-hidden transition-all duration-300">
//   {/* Header */}
//   <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 flex items-center justify-between">
//     {/* File Info */}
//     <div className="flex items-center gap-3">
//       {/* Traffic Lights */}
//       <div className="flex gap-1">
//         <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
//         <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
//         <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
//       </div>
//       {/* Filename */}
//       <span className="text-gray-200 text-sm font-semibold tracking-wide ml-2">
//         main.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : language}
//       </span>
//     </div>

//     {/* Code Length */}
//     <div className="text-gray-400 text-xs font-mono">
//       {code.length} characters
//     </div>
//   </div>

//   {/* Code Editor */}
//   <div className="h-[calc(100%-48px)] bg-gray-50">
//     <CodeEditor
//       code={code}
//       onCodeChange={handleCodeChange}
//       language={language}
//       className="w-full h-full"
//     />
//   </div>
// </div>

//           {/* Output/Preview Section */}
//           <div className="h-64 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
//             <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-2 flex items-center gap-2">
//               {language === "html" ? (
//                 <>
//                   <Globe className="w-4 h-4 text-orange-400" />
//                   <span className="text-gray-300 text-sm font-medium">Live Preview</span>
//                 </>
//               ) : (
//                 <>
//                   <Terminal className="w-4 h-4 text-green-400" />
//                   <span className="text-gray-300 text-sm font-medium">Console Output</span>
//                 </>
//               )}
//             </div>
            
//             <div className="h-[calc(100%-40px)]">
//               {language === "html" ? (
//                 <iframe
//                   title="html-preview"
//                   srcDoc={htmlPreview}
//                   className="w-full h-full border-none bg-white"
//                 />
//               ) : (
//                 <div className="h-full bg-gray-900 text-green-400 p-4 font-mono text-sm overflow-y-auto">
//                   <pre className="whitespace-pre-wrap">
//                     {output || "⚡ Output will appear here after running your code..."}
//                   </pre>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//          <div className="grid grid-cols-3 gap-4">
//   <div className="col-span-2">
//  </div>
//   <div className="col-span-1 h-[70vh]">
//    <ChatBox projectId={id} />
//   </div>
// </div>
// <CodeEditor
//   code={code}
//   onCodeChange={handleCodeChange}
//   language={language}
// />


//       </main>
//     </div>
//   );
// };

// export default ProjectEditorPage;

// third time editting 
// import ChatBox from "../components/ChatBox";
// import React, { useEffect, useState, useRef, useContext } from "react";
// import { useParams } from "react-router-dom";
// import { AuthContext } from "../context/AuthContext";
// import io from "socket.io-client";
// import {
//   Play,
//   Terminal,
//   Code,
//   Globe,
//   Users,
//   Settings,
//   Save,
//   Files,
//   Plus,
//   Upload,
//   Trash,
//   X,
//   Bot,
//   MessageCircle,
// } from "lucide-react";
// // Import the provided CodeEditor component
// import CodeEditor from "../components/CodeEditor";

// // --- Helper functions (kept from original code) ---
// function debounce(fn, wait = 500) {
//   let t;
//   return (...args) => {
//     clearTimeout(t);
//     t = setTimeout(() => fn(...args), wait);
//   };
// }

// const getLanguageFromExtension = (filename) => {
//   const extension = filename.split(".").pop();
//   switch (extension) {
//     case "js":
//     case "jsx":
//       return "javascript";
//     case "ts":
//     case "tsx":
//       return "typescript";
//     case "py":
//       return "python";
//     case "html":
//     case "htm":
//       return "html";
//     case "css":
//       return "css";
//     case "java":
//       return "java";
//     case "cpp":
//     case "c++":
//       return "cpp";
//     case "c":
//       return "c";
//     case "php":
//       return "php";
//     case "json":
//       return "json";
//     case "md":
//       return "markdown";
//     default:
//       return "plaintext";
//   }
// };

// const getDefaultContent = (filename) => {
//   const lang = getLanguageFromExtension(filename);
//   switch (lang) {
//     case "html":
//       return '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Hello World</title>\n</head>\n<body>\n    <div>\n        <h1>🚀 Welcome!</h1>\n        <p>This is a collaborative coding environment.</p>\n    </div>\n</body>\n</html>';
//     case "javascript":
//       return "// Welcome to your new JavaScript file!\nconsole.log('Hello, World!');";
//     case "python":
//       return "# Welcome to your new Python file!\nprint('Hello, World!')";
//     case "css":
//       return "/* Welcome to your new CSS file! */\nbody {\n  font-family: sans-serif;\n  background-color: #f4f4f4;\n}";
//     default:
//       return "// Start coding here!";
//   }
// };

// // --- Main component ---
// const ProjectEditorPage = () => {
//   const { id } = useParams();
//   const { apiRequest, authUser } = useContext(AuthContext);

//   const initialProject = {
//     id: null,
//     title: 'New Project',
//     files: [
//       {
//         id: `file${Date.now()}`,
//         name: 'index.html',
//         content: getDefaultContent('index.html'),
//       },
//     ],
//   };

//   const [project, setProject] = useState(initialProject);
//   const [activeFileId, setActiveFileId] = useState(initialProject.files[0].id);
//   const [output, setOutput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [status, setStatus] = useState("");
//   const [isAddingFile, setIsAddingFile] = useState(false);
//   const [newFileName, setNewFileName] = useState('');
//   const [newFileExtension, setNewFileExtension] = useState('html');
//   const [isUploading, setIsUploading] = useState(false);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
//   const [isChatOpen, setIsChatOpen] = useState(false);
//   const [chatMessages, setChatMessages] = useState([
//     {
//       id: 1,
//       type: 'ai',
//       message: '👋 Hello! I\'m your AI coding assistant. How can I help you today?',
//       timestamp: new Date()
//     }
//   ]);
//   const [chatInput, setChatInput] = useState('');
//   const [isTyping, setIsTyping] = useState(false);
//   const [isFileExplorerCollapsed, setIsFileExplorerCollapsed] = useState(false);
//   const [htmlPreview, setHtmlPreview] = useState("");

//   const activeFile = project.files.find((f) => f.id === activeFileId);
//   const chatEndRef = useRef(null);
//   const socketRef = useRef();
  
//   // Debounce the code change handler
//   const debouncedCodeChange = debounce((newCode) => {
//     // This is the function that will run 500ms after the last change
//     setProject(prevProject => {
//       const newFiles = prevProject.files.map(file =>
//         file.id === activeFileId ? { ...file, content: newCode } : file
//       );
//       return { ...prevProject, files: newFiles };
//     });
    
//     if (socketRef.current && socketRef.current.connected) {
//       socketRef.current.emit("codeChange", { projectId: id, fileId: activeFileId, code: newCode });
//     }
//   }, 500);

//   // --- Real-time Collaboration (WebSockets) ---
//   useEffect(() => {
//     socketRef.current = io("http://localhost:3001");
//     socketRef.current.emit("joinProject", id);

//     socketRef.current.on("receiveCode", ({ fileId, newContent }) => {
//       // Update the content of the specific file
//       setProject((prevProject) => {
//         const newFiles = prevProject.files.map((file) =>
//           file.id === fileId ? { ...file, content: newContent } : file
//         );
//         return { ...prevProject, files: newFiles };
//       });
//       // The CodeEditor component will automatically update its value
//       // when the `code` prop changes, so no manual `setValue` is needed.
//     });

//     socketRef.current.on("receiveOutput", (data) => {
//       setOutput(data);
//     });

//     return () => {
//       socketRef.current.disconnect();
//     };
//   }, [id]);

//   // --- Project Fetch and Save Logic ---
//   const loadProject = async (projectId) => {
//     try {
//       const response = await apiRequest(`/projects/${projectId}/files`, 'GET');
      
//       if (response.success && response.files) {
//         const loadedFiles = response.files.map((file, index) => ({
//           id: file.id ? `file${file.id}` : `file${index}`,
//           name: file.name || file.original_name || `file${index}.txt`,
//           content: file.content || getDefaultContent(file.name || file.original_name || 'file.txt')
//         }));
        
//         setProject(prev => ({
//           ...prev,
//           id: projectId,
//           title: response.project?.name || prev.title,
//           files: loadedFiles.length > 0 ? loadedFiles : prev.files
//         }));
        
//         if (loadedFiles.length > 0) {
//           setActiveFileId(loadedFiles[0].id);
//         }
//         setStatus('Project loaded successfully');
//       } else {
//         setStatus('Failed to load project files');
//       }
//     } catch (error) {
//       console.error('Load error:', error);
//       setStatus('Error loading project');
//     }
//     setTimeout(() => setStatus(''), 3000);
//   };

//   useEffect(() => {
//     if (id) {
//       setProject(prev => ({ ...prev, id }));
//       loadProject(id);
//     }
//   }, [id, apiRequest]);

//   const handleSave = async () => {
//     if (!project.id) {
//       setStatus('No project ID available');
//       setTimeout(() => setStatus(''), 3000);
//       return;
//     }

//     setIsSaving(true);
//     setStatus('Saving...');

//     try {
//       const filesData = project.files.map(file => ({
//         name: file.name,
//         content: file.content,
//         id: file.id?.toString().replace('file', '') || null
//       }));

//       const response = await apiRequest(`/projects/${project.id}/files`, 'POST', {
//         files: filesData
//       });
      
//       if (response.success) {
//         if (response.files) {
//           setProject(prev => ({
//             ...prev,
//             files: prev.files.map((file, index) => {
//               const backendFile = response.files[index];
//               return {
//                 ...file,
//                 id: backendFile?.id ? `file${backendFile.id}` : file.id
//               };
//             })
//           }));
//         }
        
//         setStatus('Saved successfully!');
//       } else {
//         setStatus('Save failed: ' + (response.message || 'Unknown error'));
//       }
//     } catch (error) {
//       console.error('Save error:', error);
//       setStatus('Error saving project');
//     } finally {
//       setIsSaving(false);
//       setTimeout(() => setStatus(''), 3000);
//     }
//   };

//   // --- File Management Handlers ---
//   const handleFileSwitch = (newFileId) => {
//     // Simply change the active file ID. The `CodeEditor` will re-render
//     // with the new file's content automatically.
//     setActiveFileId(newFileId);
//   };

//   const handleCreateFile = () => {
//     if (!newFileName.trim()) return;

//     const fullFileName = `${newFileName.trim()}.${newFileExtension}`;
//     const isFileExists = project.files.some(file => file.name === fullFileName);

//     if (isFileExists) {
//       setStatus(`Error: A file named "${fullFileName}" already exists.`);
//       setTimeout(() => setStatus(''), 3000);
//       return;
//     }

//     const newFile = {
//       id: `file${Date.now()}`,
//       name: fullFileName,
//       content: getDefaultContent(fullFileName),
//     };

//     setProject(prevProject => ({
//       ...prevProject,
//       files: [...prevProject.files, newFile],
//     }));

//     handleFileSwitch(newFile.id);
//     setIsAddingFile(false);
//     setNewFileName('');
//     setStatus(`Created ${fullFileName}`);
//     setTimeout(() => setStatus(''), 2000);
//   };
  
//   const handleDeleteFile = async (fileId) => {
//     if (project.files.length <= 1) {
//       setStatus('Cannot delete the last file');
//       setTimeout(() => setStatus(''), 2000);
//       return;
//     }
    
//     // Optimistically update the UI
//     const fileToDelete = project.files.find(f => f.id === fileId);
//     setProject(prevProject => {
//       const updatedFiles = prevProject.files.filter(file => file.id !== fileId);
//       return { ...prevProject, files: updatedFiles };
//     });
    
//     if (fileId === activeFileId) {
//       const remainingFiles = project.files.filter(file => file.id !== fileId);
//       if (remainingFiles.length > 0) {
//         handleFileSwitch(remainingFiles[0].id);
//       }
//     }
//     setStatus(`Deleting ${fileToDelete.name}...`);
    
//     try {
//       const numericFileId = fileId.toString().replace('file', '');
//       const response = await apiRequest(`/projects/${project.id}/files/${numericFileId}`, 'DELETE');

//       if (response.success) {
//         setStatus('File deleted successfully!');
//       } else {
//         setStatus('Delete failed: ' + (response.message || 'Unknown error'));
//         // Revert UI on failure
//         setProject(prevProject => ({
//           ...prevProject,
//           files: [...prevProject.files, fileToDelete]
//         }));
//       }
//     } catch (error) {
//       console.error('Delete error:', error);
//       setStatus('Error deleting file');
//     } finally {
//       setShowDeleteConfirm(null);
//       setTimeout(() => setStatus(''), 3000);
//     }
//   };

//   const handleFileUpload = async (event) => {
//     const files = Array.from(event.target.files);
//     if (!files.length || !project.id) return;

//     const existingFileNames = new Set(project.files.map(file => file.name));
//     const newFiles = [];
//     const duplicateFileNames = [];

//     for (const file of files) {
//       if (existingFileNames.has(file.name)) {
//         duplicateFileNames.push(file.name);
//       } else {
//         newFiles.push(file);
//       }
//     }

//     if (newFiles.length === 0) {
//       setStatus(`Error: The following file(s) already exist: ${duplicateFileNames.join(', ')}`);
//       setTimeout(() => setStatus(''), 3000);
//       event.target.value = '';
//       return;
//     }

//     setIsUploading(true);
//     setStatus('Uploading files...');

//     try {
//       const formData = new FormData();
//       newFiles.forEach(file => {
//         formData.append('files[]', file);
//       });

//       const response = await apiRequest(
//         `/projects/${project.id}/files/upload`,
//         'POST',
//         formData
//       );

//       if (response.success) {
//         loadProject(project.id);
//         setStatus(`Uploaded ${newFiles.length} file(s) successfully.`);
//       } else {
//         setStatus('Upload failed: ' + (response.message || 'Unknown error'));
//       }
//     } catch (error) {
//       console.error('Upload error:', error);
//       setStatus(`Error uploading files: ${error.message}`);
//     } finally {
//       setIsUploading(false);
//       setTimeout(() => setStatus(''), 3000);
//       event.target.value = '';
//     }
//   };


//   // --- Code Execution and Preview Logic ---
//   const runCode = async () => {
//     if (!activeFile) return;

//     const language = getLanguageFromExtension(activeFile.name);

//     if (language === "html") {
//       setOutput("🌐 HTML preview shown below.");
//       setHtmlPreview(activeFile.content);
//       return;
//     }
    
//     setLoading(true);
//     setOutput("");

//     try {
//       const res = await apiRequest("/execute", "POST", {
//         language,
//         code: activeFile.content,
//         stdin: "",
//       });

//       let resultText = "";
//       if (res && res.success) {
//         if (res.result?.run) {
//           resultText = res.result.run.stdout || res.result.run.stderr || JSON.stringify(res.result.run);
//         } else if (res.result?.stdout || res.result?.stderr) {
//           resultText = res.result.stdout || res.result.stderr;
//         } else if (res.stdout || res.stderr) {
//           resultText = res.stdout || res.stderr;
//         } else {
//           resultText = JSON.stringify(res.result || res);
//         }

//         setOutput(String(resultText));
//         if (socketRef.current) {
//           socketRef.current.emit("codeOutput", { projectId: id, output: String(resultText) });
//         }
//       } else {
//         setOutput("Execution error: " + (res?.message || JSON.stringify(res)));
//       }
//     } catch (err) {
//       setOutput("Execution request failed: " + (err.message || err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- UI Helpers ---
//   const getLanguageIcon = (lang) => {
//     switch (lang) {
//       case "html": return <Globe className="w-4 h-4" />;
//       case "javascript": return <Code className="w-4 h-4" />;
//       default: return <Terminal className="w-4 h-4" />;
//     }
//   };

//   const getLanguageColor = (lang) => {
//     switch (lang) {
//       case "javascript": return "from-yellow-500 to-orange-500";
//       case "python": return "from-blue-500 to-green-500";
//       case "html": return "from-orange-500 to-red-500";
//       case "java": return "from-red-500 to-orange-600";
//       case "cpp": return "from-blue-600 to-purple-600";
//       case "c": return "from-gray-600 to-gray-800";
//       case "php": return "from-purple-500 to-indigo-600";
//       default: return "from-gray-500 to-gray-700";
//     }
//   };

//   // --- Chat Handlers ---
//   const handleSendMessage = async () => {
//     if (!chatInput.trim()) return;

//     const userMessage = {
//       id: Date.now(),
//       type: 'user',
//       message: chatInput,
//       timestamp: new Date()
//     };

//     setChatMessages(prev => [...prev, userMessage]);
//     setChatInput('');
//     setIsTyping(true);

//     const userQuery = chatInput;
//     const systemPrompt = "You are a friendly and knowledgeable AI coding assistant. Provide concise and helpful code-related advice.";
//     const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=`;
    
//     try {
//         const payload = {
//             contents: [{ parts: [{ text: userQuery }] }],
//             systemInstruction: { parts: [{ text: systemPrompt }] },
//         };

//         const response = await fetch(apiUrl, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });

//         const result = await response.json();
//         const aiResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that request.";

//         const aiMessage = {
//             id: Date.now() + 1,
//             type: 'ai',
//             message: aiResponseText,
//             timestamp: new Date()
//         };

//         setChatMessages(prev => [...prev, aiMessage]);
//     } catch (error) {
//         console.error("AI API call failed:", error);
//         setChatMessages(prev => [
//             ...prev,
//             { id: Date.now() + 1, type: 'ai', message: "There was an error communicating with the AI.", timestamp: new Date() }
//         ]);
//     } finally {
//         setIsTyping(false);
//     }
// };

//   // --- UI Render ---
//   if (!project) {
//     return (
//       <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-500 text-lg">Loading project...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
//       {/* Header */}
//       <header className="bg-white shadow-lg border-b border-gray-200">
//         <div className="px-6 py-4">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center gap-4">
//               <div className={`p-2 rounded-lg bg-gradient-to-r ${getLanguageColor(getLanguageFromExtension(activeFile?.name))}`}>
//                 {getLanguageIcon(getLanguageFromExtension(activeFile?.name))}
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-800">{project.title}</h1>
//                 <div className="flex items-center gap-2 text-sm text-gray-500">
//                   <Users className="w-4 h-4" />
//                   <span>1 collaborator</span>
//                   {isSaving && (
//                     <div className="flex items-center gap-1 text-blue-600">
//                       <Save className="w-3 h-3 animate-pulse" />
//                       <span>Saving...</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <div className="flex gap-3 items-center">
//               <button
//                 onClick={runCode}
//                 disabled={loading}
//                 className={`flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 shadow-lg
//                   ${loading
//                     ? "bg-gray-400 cursor-not-allowed"
//                     : `bg-gradient-to-r ${getLanguageColor(getLanguageFromExtension(activeFile?.name))} hover:shadow-xl`
//                   }`}
//               >
//                 {loading ? (
//                   <>
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                     Running...
//                   </>
//                 ) : (
//                   <>
//                     <Play className="w-4 h-4" />
//                     Run Code
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Content Area */}
//     <main className="flex-1 flex overflow-hidden">
//   {/* Left Sidebar: File Explorer */}
//   <div className={`transition-all duration-300 ${isFileExplorerCollapsed ? 'w-12' : 'w-72'} bg-white border-r border-gray-200 flex flex-col`}>
//     <div className="p-4 flex items-center justify-between border-b border-gray-200">
//       {!isFileExplorerCollapsed && <h2 className="text-lg font-bold text-gray-800">Files</h2>}
//       <button
//         onClick={() => setIsFileExplorerCollapsed(!isFileExplorerCollapsed)}
//         className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
//       >
//         <Files className="w-5 h-5" />
//       </button>
//     </div>
//     <div className="flex-1 overflow-y-auto p-2">
//       {!isFileExplorerCollapsed && (
//         <ul className="space-y-1">
//           {project.files.map((file) => (
//             <li key={file.id}>
//               <button
//                 onClick={() => handleFileSwitch(file.id)}
//                 className={`w-full flex items-center justify-between p-2 rounded-lg font-medium transition-all duration-200
//                   ${activeFileId === file.id
//                     ? 'bg-blue-100 text-blue-800'
//                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
//                   }`}
//               >
//                 <span className="truncate flex-1 text-left">{file.name}</span>
//                 <X
//                   className="w-4 h-4 text-gray-500 hover:text-red-500"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     setShowDeleteConfirm(file.id);
//                   }}
//                 />
//               </button>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//     {!isFileExplorerCollapsed && (
//       <div className="p-4 border-t border-gray-200 space-y-2">
//         <button
//           onClick={() => setIsAddingFile(true)}
//           className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all"
//         >
//           <Plus className="w-4 h-4" />
//           New File
//         </button>
//         <label className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-all cursor-pointer">
//           <Upload className="w-4 h-4" />
//           Upload File
//           <input
//             type="file"
//             multiple
//             onChange={handleFileUpload}
//             className="hidden"
//           />
//         </label>
//       </div>
//     )}
//   </div>

//   {/* Center: Code Editor + Output */}
//   <div className="flex-1 flex flex-col gap-6 p-6 overflow-hidden">
//     {/* Code Editor */}
//     <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
//       <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-2 flex items-center justify-between">
//         <span className="text-gray-300 text-sm font-medium">
//           {activeFile?.name || "main.txt"}
//         </span>
//         <div className="text-gray-400 text-xs">{activeFile?.content.length || 0} characters</div>
//       </div>
//       <div style={{ height: "calc(100% - 40px)" }}>
//         <CodeEditor
//           code={activeFile?.content || ""}
//           onCodeChange={debouncedCodeChange}
//           language={getLanguageFromExtension(activeFile?.name)}
//         />
//       </div>
//     </div>

//     {/* Output Panel */}
//     <div className="h-64 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
//       <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
//         <span className="text-gray-700 text-sm font-medium flex items-center gap-2">
//           <Terminal className="w-4 h-4" />
//           Output
//         </span>
//       </div>
//       <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-gray-800">
//         <pre>{output}</pre>
//         {htmlPreview && (
//           <iframe
//             title="HTML Preview"
//             srcDoc={htmlPreview}
//             className="w-full h-full border-none mt-4"
//           />
//         )}
//       </div>
//     </div>
//   </div>

//   {/* Right Sidebar: AI Chat */}
//   <div className={`transition-all duration-300 ${isChatOpen ? 'w-96' : 'w-12'} bg-white border-l border-gray-200 flex flex-col`}>
//     <div
//       className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between cursor-pointer"
//       onClick={() => setIsChatOpen(!isChatOpen)}
//     >
//       <span className="text-gray-700 text-sm font-medium flex items-center gap-2">
//         <Bot className="w-4 h-4" />
//         {isChatOpen && "AI Assistant"}
//       </span>
//       <button className="p-1 rounded-full hover:bg-gray-200">
//         <MessageCircle className="w-4 h-4 text-gray-500" />
//       </button>
//     </div>
//     {isChatOpen && (
//       <>
//         <div className="flex-1 p-4 overflow-y-auto space-y-4">
//           {chatMessages.map((msg, index) => (
//             <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
//               <div
//                 className={`p-3 rounded-xl max-w-[80%] ${
//                   msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
//                 }`}
//               >
//                 <p className="text-sm">{msg.message}</p>
//               </div>
//             </div>
//           ))}
//           {isTyping && (
//             <div className="flex justify-start">
//               <div className="p-3 rounded-xl bg-gray-200 text-gray-800">
//                 <div className="dot-flashing"></div>
//               </div>
//             </div>
//           )}
//           <div ref={chatEndRef} />
//         </div>
//         <div className="p-4 border-t border-gray-200">
//           <div className="flex gap-2">
//             <input
//               type="text"
//               value={chatInput}
//               onChange={(e) => setChatInput(e.target.value)}
//               onKeyPress={(e) => {
//                 if (e.key === 'Enter') handleSendMessage();
//               }}
//               className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               placeholder="Ask for help..."
//               disabled={isTyping}
//             />
//             <button
//               onClick={handleSendMessage}
//               className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all"
//               disabled={isTyping}
//             >
//               Send
//             </button>
//           </div>
//         </div>
//       </>
//     )}
//   </div>
// </main>


//       {/* Status Bar */}
//       {status && (
//         <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 text-white rounded-full shadow-lg text-sm transition-opacity duration-300 animate-fade-in">
//           {status}
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       {showDeleteConfirm && (
//         <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
//             <h3 className="text-lg font-bold mb-2">Confirm Delete</h3>
//             <p className="text-gray-600 mb-4">
//               Are you sure you want to delete <span className="font-semibold">{project.files.find(f => f.id === showDeleteConfirm)?.name}</span>? This action cannot be undone.
//             </p>
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowDeleteConfirm(null)}
//                 className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => handleDeleteFile(showDeleteConfirm)}
//                 className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* New File Modal */}
//       {isAddingFile && (
//         <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
//             <h3 className="text-lg font-bold mb-4">Create New File</h3>
//             <div className="flex items-center gap-2 mb-4">
//               <input
//                 type="text"
//                 value={newFileName}
//                 onChange={(e) => setNewFileName(e.target.value)}
//                 className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="file-name"
//               />
//               <span className="text-gray-500">.</span>
//               <select
//                 value={newFileExtension}
//                 onChange={(e) => setNewFileExtension(e.target.value)}
//                 className="p-2 border border-gray-300 rounded-lg"
//               >
//                 <option value="html">html</option>
//                 <option value="js">js</option>
//                 <option value="py">py</option>
//                 <option value="css">css</option>
//                 <option value="txt">txt</option>
//               </select>
//             </div>
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setIsAddingFile(false)}
//                 className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleCreateFile}
//                 className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600"
//               >
//                 Create
//               </button>
//             </div>
//           </div>
//         </div>
        
//       )}
//     </div>
    
//   );
// };

// export default ProjectEditorPage;
////>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>==============================================
// forth time editing 
import ChatBox from "../components/ChatBox";
import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ChatAssistant from '../components/ChatAssistant'; 
import io from "socket.io-client";
import {
  Play,
  Terminal,
  Code,
  Globe,
  Users,
  Settings,
  Save,
  Files,
  Plus,
  Upload,
  Trash,
  X,
  Bot,
  MessageCircle,
} from "lucide-react";
// Import the provided CodeEditor component
import CodeEditor from "../components/CodeEditor";

// --- Helper functions (kept from original code) ---
function debounce(fn, wait = 500) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// const getLanguageFromExtension = (filename) => {
//   const extension = filename.split(".").pop();
//   switch (extension) {
//     case "js":
//     case "jsx":
//       return "javascript";
//     case "ts":
//     case "tsx":
//       return "typescript";
//     case "py":
//       return "python";
//     case "html":
//     case "htm":
//       return "html";
//     case "css":
//       return "css";
//     case "java":
//       return "java";
//     case "cpp":
//     case "c++":
//       return "cpp";
//     case "c":
//       return "c";
//     case "php":
//       return "php";
//     case "json":
//       return "json";
//     case "md":
//       return "markdown";
//     default:
//       return "plaintext";
//   }
// };

// const getDefaultContent = (filename) => {
//   const lang = getLanguageFromExtension(filename);
//   switch (lang) {
//     case "html":
//       return '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Hello World</title>\n</head>\n<body>\n    <div>\n        <h1>🚀 Welcome!</h1>\n        <p>This is a collaborative coding environment.</p>\n    </div>\n</body>\n</html>';
//     case "javascript":
//       return "// Welcome to your new JavaScript file!\nconsole.log('Hello, World!');";
//     case "python":
//       return "# Welcome to your new Python file!\nprint('Hello, World!')";
//     case "css":
//       return "/* Welcome to your new CSS file! */\nbody {\n  font-family: sans-serif;\n  background-color: #f4f4f4;\n}";
//     default:
//       return "// Start coding here!";
//   }
// };

// --- Main component ---

const getLanguageFromExtension = (filename) => {
   if (!filename || typeof filename !== 'string') {
    return 'plaintext'; // Or whatever fallback language you prefer
  }
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts.pop().toLowerCase();
  }
  return null;
};

const getDefaultContent = (filename) => {
  const lang = getLanguageFromExtension(filename);
  switch (lang) {
    case "html":
    case "htm":
      return '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Hello World</title>\n</head>\n<body>\n    <div>\n        <h1>🚀 Welcome!</h1>\n        <p>This is a collaborative coding environment.</p>\n    </div>\n</body>\n</html>';
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return "// Welcome to your new JavaScript file!\nconsole.log('Hello, World!');";
    case "py":
      return "# Welcome to your new Python file!\nprint('Hello, World!')";
    case "css":
    case "scss":
    case "less":
      return "/* Welcome to your new CSS file! */\nbody {\n    font-family: sans-serif;\n    background-color: #f4f4f4;\n}";
    case "json":
      return '{\n  "message": "Hello, World!"\n}';
    case "md":
    case "mdown":
      return "# Welcome!\n\nThis is a Markdown file. You can write rich text here.\n\n* **Bold text**\n* _Italic text_\n\n```javascript\n// Code blocks are great too\nconsole.log('Hello');\n```";
    case "php":
      return "<?php\n\n// Welcome to your new PHP file!\necho 'Hello, World!';\n";
    case "java":
      return "class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}";
    case "c":
      return "#include <stdio.h>\n\nint main() {\n    printf(\"Hello, World!\");\n    return 0;\n}";
    case "cpp":
    case "cxx":
    case "c++":
      return "#include <iostream>\n\nint main() {\n    std::cout << \"Hello, World!\" << std::endl;\n    return 0;\n}";
    case "go":
      return "package main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Hello, World!\")\n}";
    case "rs":
      return "fn main() {\n    println!(\"Hello, World!\");\n}";
    case "rb":
      return "#!/usr/bin/env ruby\n\nputs \"Hello, World!\"";
    case "sh":
    case "bash":
      return "#!/bin/bash\n\necho \"Hello, World!\"";
    case "kt":
      return "fun main() {\n    println(\"Hello, World!\")\n}";
    case "swift":
      return "import Swift\n\nprint(\"Hello, World!\")";
    case "dart":
      return "void main() {\n    print('Hello, World!');\n}";
    case "yaml":
    case "yml":
      return "message: Hello, World!";
    case "xml":
      return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<message>Hello, World!</message>";
    case "sql":
      return "SELECT 'Hello, World!';";
    case "pl":
      return "use strict;\nuse warnings;\n\nprint \"Hello, World!\\n\";";
    case "txt":
      return "Welcome to your new text file!\nStart writing here...";
    default:
      return "// Start coding here!";
  }
};

const ProjectEditorPage = () => {
  const { id } = useParams();
  const { apiRequest, authUser } = useContext(AuthContext);
  
  const initialProject = {
    id: null,
    title: 'New Project',
    files: [
      {
        id: `temp${Date.now()}`,
        name: 'index.html',
        content: getDefaultContent('index.html'),
        isNew: true
      },
    ],
  };
  
  const [project, setProject] = useState(initialProject);
  const [activeFileId, setActiveFileId] = useState(initialProject.files[0].id);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileExtension, setNewFileExtension] = useState('html');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'ai',
      message: '👋 Hello! I\'m your AI coding assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFileExplorerCollapsed, setIsFileExplorerCollapsed] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState("");
  
  const activeFile = project.files.find((f) => f.id === activeFileId);
  const chatEndRef = useRef(null);
  const socketRef = useRef();
  
  // Debounce the code change handler
  const debouncedCodeChange = debounce((newCode) => {
    setProject(prevProject => {
      const newFiles = prevProject.files.map(file =>
        file.id === activeFileId ? { ...file, content: newCode } : file
      );
      return { ...prevProject, files: newFiles };
    });
    
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("codeChange", { projectId: id, fileId: activeFileId, code: newCode });
    }
  }, 500);

  // --- Real-time Collaboration (WebSockets) ---
  // useEffect(() => {
  //   if (!id) return;
    
  //   socketRef.current = io("http://localhost:3001");
  //   socketRef.current.emit("joinProject", id);
    
  //   socketRef.current.on("receiveCode", ({ fileId, newContent }) => {
  //     setProject((prevProject) => {
  //       const newFiles = prevProject.files.map((file) =>
  //         file.id === fileId ? { ...file, content: newContent } : file
  //       );
  //       return { ...prevProject, files: newFiles };
  //     });
  //   });
    
  //   socketRef.current.on("receiveOutput", (data) => {
  //     setOutput(data);
  //   });
    
  //   return () => {
  //     if (socketRef.current) {
  //       socketRef.current.disconnect();
  //     }
  //   };
  // }, [id]);
 useEffect(() => {
    if (!id) return;
    
    console.log('Attempting to connect to Socket.IO server...');
    
    socketRef.current = io("http://localhost:3001", {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
    });
    
    socketRef.current.on('connect', () => {
        console.log('✅ Connected to server with ID:', socketRef.current.id);
        socketRef.current.emit("joinProject", id);
        setStatus('Connected to collaboration server');
    });
    
    socketRef.current.on('connect_error', (error) => {
        console.error('❌ Socket connection failed:', error);
        setStatus('Failed to connect - real-time features unavailable');
    });
    
    socketRef.current.on('disconnect', (reason) => {
        console.log('⚠️ Disconnected:', reason);
        setStatus('Disconnected from server');
    });
    
    socketRef.current.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected after', attemptNumber, 'attempts');
        socketRef.current.emit("joinProject", id);
        setStatus('Reconnected to server');
    });
    
    socketRef.current.on("receiveCode", ({ fileId, newContent }) => {
        console.log('📝 Received code change for file:', fileId);
        setProject((prevProject) => {
            const newFiles = prevProject.files.map((file) =>
                file.id === fileId ? { ...file, content: newContent } : file
            );
            return { ...prevProject, files: newFiles };
        });
    });
    
    socketRef.current.on("receiveOutput", (data) => {
        console.log('📤 Received output:', data);
        setOutput(data);
    });
    
    return () => {
        if (socketRef.current) {
            console.log('🔌 Disconnecting socket...');
            socketRef.current.disconnect();
        }
    };
}, [id]);

  // --- Project Fetch and Save Logic ---
  const loadProject = async (projectId) => {
    if (!projectId) return;
    
    try {
      const response = await apiRequest(`/projects/${projectId}/files`, 'GET');
      
      if (response.success && response.files) {
        const loadedFiles = response.files.map((file) => ({
          id: file.id.toString(), // Keep as string for consistency
          name: file.name || file.original_name || `file${file.id}.txt`,
          content: file.content || getDefaultContent(file.name || file.original_name || 'file.txt'),
          isNew: false
        }));
        
        setProject(prev => ({
          ...prev,
          id: projectId,
          title: response.project?.name || prev.title,
          files: loadedFiles.length > 0 ? loadedFiles : prev.files
        }));
        
        if (loadedFiles.length > 0) {
          setActiveFileId(loadedFiles[0].id);
        }
        setStatus('Project loaded successfully');
      } else {
        setStatus('Failed to load project files');
      }
    } catch (error) {
      console.error('Load error:', error);
      setStatus('Error loading project');
    }
    setTimeout(() => setStatus(''), 3000);
  };

  useEffect(() => {
    if (id) {
      setProject(prev => ({ ...prev, id }));
      loadProject(id);
    }
  }, [id, apiRequest]);

  const handleSave = async () => {
    if (!project.id) {
      setStatus('No project ID available');
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    
    setIsSaving(true);
    setStatus('Saving...');
    
    try {
      const filesData = project.files.map(file => ({
        name: file.name,
        content: file.content,
        id: file.isNew ? null : file.id // Don't send ID for new files
      }));
      
      const response = await apiRequest(`/projects/${project.id}/files`, 'POST', {
        files: filesData
      });
      
      if (response.success) {
        // Update files with backend IDs if provided
        if (response.files) {
          setProject(prev => ({
            ...prev,
            files: prev.files.map((file, index) => {
              const backendFile = response.files[index];
              return {
                ...file,
                id: backendFile?.id?.toString() || file.id,
                isNew: false
              };
            })
          }));
        }
        
        setStatus('Saved successfully!');
      } else {
        setStatus('Save failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Save error:', error);
      setStatus('Error saving project');
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  // --- File Management Handlers ---
  const handleFileSwitch = (newFileId) => {
    setActiveFileId(newFileId);
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) {
      setStatus('Please enter a file name');
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    
    const fullFileName = `${newFileName.trim()}.${newFileExtension}`;
    const isFileExists = project.files.some(file => file.name === fullFileName);
    
    if (isFileExists) {
      setStatus(`Error: A file named "${fullFileName}" already exists.`);
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    
    const newFile = {
      id: `temp${Date.now()}`, // Use temp ID for new files
      name: fullFileName,
      content: getDefaultContent(fullFileName),
      isNew: true
    };
    
    setProject(prevProject => ({
      ...prevProject,
      files: [...prevProject.files, newFile],
    }));
    
    handleFileSwitch(newFile.id);
    setIsAddingFile(false);
    setNewFileName('');
    setStatus(`Created ${fullFileName}`);
    setTimeout(() => setStatus(''), 2000);
  };

  const handleDeleteFile = async (fileId) => {
    if (project.files.length <= 1) {
      setStatus('Cannot delete the last file');
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    
    const fileToDelete = project.files.find(f => f.id === fileId);
    if (!fileToDelete) {
      setStatus('File not found');
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    
    // If it's a new file (not saved to backend), just remove it locally
    if (fileToDelete.isNew) {
      setProject(prevProject => {
        const updatedFiles = prevProject.files.filter(file => file.id !== fileId);
        return { ...prevProject, files: updatedFiles };
      });
      
      if (fileId === activeFileId) {
        const remainingFiles = project.files.filter(file => file.id !== fileId);
        if (remainingFiles.length > 0) {
          handleFileSwitch(remainingFiles[0].id);
        }
      }
      
      setShowDeleteConfirm(null);
      setStatus(`Deleted ${fileToDelete.name}`);
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    
    // For existing files, delete from backend
    setStatus(`Deleting ${fileToDelete.name}...`);
    
    try {
      const response = await apiRequest(`/projects/${project.id}/files/${fileId}`, 'DELETE');
      
      if (response.success) {
        // Remove from local state
        setProject(prevProject => {
          const updatedFiles = prevProject.files.filter(file => file.id !== fileId);
          return { ...prevProject, files: updatedFiles };
        });
        
        if (fileId === activeFileId) {
          const remainingFiles = project.files.filter(file => file.id !== fileId);
          if (remainingFiles.length > 0) {
            handleFileSwitch(remainingFiles[0].id);
          }
        }
        
        setStatus('File deleted successfully!');
      } else {
        setStatus('Delete failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      setStatus('Error deleting file');
    } finally {
      setShowDeleteConfirm(null);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length || !project.id) return;
    
    const existingFileNames = new Set(project.files.map(file => file.name));
    const newFiles = [];
    const duplicateFileNames = [];
    
    for (const file of files) {
      if (existingFileNames.has(file.name)) {
        duplicateFileNames.push(file.name);
      } else {
        newFiles.push(file);
      }
    }
    
    if (newFiles.length === 0) {
      setStatus(`Error: The following file(s) already exist: ${duplicateFileNames.join(', ')}`);
      setTimeout(() => setStatus(''), 3000);
      event.target.value = '';
      return;
    }
    
    setIsUploading(true);
    setStatus('Uploading files...');
    
    try {
      const formData = new FormData();
      newFiles.forEach(file => {
        formData.append('files[]', file);
      });
      
      const response = await apiRequest(
        `/projects/${project.id}/files/upload`,
        'POST',
        formData
      );
      
      if (response.success) {
        // Reload project to get updated files
        await loadProject(project.id);
        setStatus(`Uploaded ${newFiles.length} file(s) successfully.`);
      } else {
        setStatus('Upload failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setStatus(`Error uploading files: ${error.message}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setStatus(''), 3000);
      event.target.value = '';
    }
  };

  // --- Code Execution and Preview Logic ---
  const runCode = async () => {
    if (!activeFile) return;
    
    const language = getLanguageFromExtension(activeFile.name);
    
    if (language === "html") {
      setOutput("🌐 HTML preview shown below.");
      setHtmlPreview(activeFile.content);
      return;
    }
    
    setLoading(true);
    setOutput("");
    
    try {
      const res = await apiRequest("/execute", "POST", {
        language,
        code: activeFile.content,
        stdin: "",
      });
      
      let resultText = "";
      if (res && res.success) {
        if (res.result?.run) {
          resultText = res.result.run.stdout || res.result.run.stderr || JSON.stringify(res.result.run);
        } else if (res.result?.stdout || res.result?.stderr) {
          resultText = res.result.stdout || res.result.stderr;
        } else if (res.stdout || res.stderr) {
          resultText = res.stdout || res.stderr;
        } else {
          resultText = JSON.stringify(res.result || res);
        }
        
        setOutput(String(resultText));
        
        if (socketRef.current && socketRef.current.connected) {
    socketRef.current.emit("codeOutput", { projectId: id, output: String(resultText) });
}
      } else {
        setOutput("Execution error: " + (res?.message || JSON.stringify(res)));
      }
    } catch (err) {
      setOutput("Execution request failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // --- UI Helpers ---
  const getLanguageIcon = (lang) => {
    switch (lang) {
      case "html": return <Globe className="w-4 h-4" />;
      case "javascript": return <Code className="w-4 h-4" />;
      default: return <Terminal className="w-4 h-4" />;
    }
  };

  const getLanguageColor = (lang) => {
    switch (lang) {
      case "javascript": return "from-yellow-500 to-orange-500";
      case "python": return "from-blue-500 to-green-500";
      case "html": return "from-orange-500 to-red-500";
      case "java": return "from-red-500 to-orange-600";
      case "cpp": return "from-blue-600 to-purple-600";
      case "c": return "from-gray-600 to-gray-800";
      case "php": return "from-purple-500 to-indigo-600";
      default: return "from-gray-500 to-gray-700";
    }
  };

  // --- Chat Handlers ---
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);
    
    const userQuery = chatInput;
    const systemPrompt = "You are a friendly and knowledgeable AI coding assistant. Provide concise and helpful code-related advice.";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=`;
    
    try {
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        const aiResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that request.";
        
        const aiMessage = {
            id: Date.now() + 1,
            type: 'ai',
            message: aiResponseText,
            timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
        console.error("AI API call failed:", error);
        setChatMessages(prev => [
            ...prev,
            { id: Date.now() + 1, type: 'ai', message: "There was an error communicating with the AI.", timestamp: new Date() }
        ]);
    } finally {
        setIsTyping(false);
    }
  };

  // --- UI Render ---
  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Loading project...</p>
        </div>
      </div>
    );
  }

return (
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    {/* Modern Header with Glassmorphism */}
    <header className="relative bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
      <div className="relative px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${getLanguageColor(getLanguageFromExtension(activeFile?.name))} shadow-lg transform hover:scale-105 transition-all duration-300`}>
              {getLanguageIcon(getLanguageFromExtension(activeFile?.name))}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {project.title}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>1 collaborator</span>
                </div>
                {isSaving && (
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                    <Save className="w-3 h-3 animate-pulse" />
                    <span className="font-medium">Saving...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 items-center">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${
                isSaving 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-green-500 to-green-600 hover:shadow-green-200 hover:shadow-xl"
              }`}
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
            
            <button
              onClick={runCode}
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-xl
                ${loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : `bg-gradient-to-r ${getLanguageColor(getLanguageFromExtension(activeFile?.name))} hover:shadow-2xl`
                }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span className="hidden sm:inline">Run Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Main Content Area with Responsive Layout */}
    <main className="flex-1 flex flex-col xl:flex-row overflow-hidden">
      {/* Left Sidebar: File Explorer - Mobile Responsive */}
      <div className={`
        transition-all duration-300 bg-white/70 backdrop-blur-sm border-r border-gray-200/50
        ${isFileExplorerCollapsed 
          ? 'lg:w-16 w-full h-12 lg:h-auto' 
          : 'lg:w-80 w-full lg:max-w-sm'
        }
        ${isFileExplorerCollapsed ? 'lg:flex flex-col' : 'flex flex-col'}
      `}>
        <div className="p-4 flex items-center justify-between border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
          {!isFileExplorerCollapsed && (
            <h2 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Project Files
            </h2>
          )}
          <button
            onClick={() => setIsFileExplorerCollapsed(!isFileExplorerCollapsed)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 transition-all duration-200 hover:scale-105"
          >
            <Files className="w-5 h-5" />
          </button>
        </div>
        
        <div className={`flex-1 overflow-y-auto p-3 ${isFileExplorerCollapsed ? 'hidden lg:block' : 'block'}`}>
          {!isFileExplorerCollapsed && (
            <ul className="space-y-2">
              {project.files.map((file) => (
                <li key={file.id}>
                  <button
                    onClick={() => handleFileSwitch(file.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] group
                      ${activeFileId === file.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'bg-gray-50/80 text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                      }`}
                  >
                    <span className="truncate flex-1 text-left flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${activeFileId === file.id ? 'bg-white' : 'bg-gray-400'}`}></div>
                      {file.name} 
                      {file.isNew && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">new</span>}
                    </span>
                    <X
                      className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                        activeFileId === file.id ? 'text-white hover:text-red-200' : 'text-gray-500 hover:text-red-500'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(file.id);
                      }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {!isFileExplorerCollapsed && (
          <div className="p-4 border-t border-gray-200/50 space-y-3 bg-gradient-to-t from-gray-50/50 to-transparent">
            <button
              onClick={() => setIsAddingFile(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              New File
            </button>
            <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload File
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Center: Code Editor + Output */}
      <div className="flex-1 flex flex-col gap-6 p-4 sm:p-6 overflow-hidden min-w-0">
        {/* Code Editor with Modern Design */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden min-h-0">
          <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-gray-200 text-sm font-medium">
                {activeFile?.name || "main.txt"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-400 text-xs">
              <span>{activeFile?.content.length || 0} chars</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div style={{ height: "calc(100% - 52px)" }}>
            <CodeEditor
              key={activeFileId}
              code={activeFile?.content || ""}
              onCodeChange={debouncedCodeChange}
              language={getLanguageFromExtension(activeFile?.name)}
            />
          </div>
        </div>

        {/* Output Panel with Modern Styling */}
        <div className="h-64 xl:h-80 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 border-b border-gray-200/50 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gray-800 rounded-lg">
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700 text-sm font-bold">Console Output</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-xs text-gray-500">Live</span>
            </div>
          </div>
          <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-900 to-black text-green-400 font-mono text-sm">
            <pre className="whitespace-pre-wrap">{output || "// Output will appear here..."}</pre>
            {htmlPreview && (
              <div className="mt-4 rounded-xl overflow-hidden border border-gray-700">
                <iframe
                  title="HTML Preview"
                  srcDoc={htmlPreview}
                  className="w-full h-64 border-none bg-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Chat - Responsive & Modern */}
      <div className="xl:w-[380px] w-full xl:min-w-[350px] xl:max-w-[400px] border-l border-gray-200/50">
        <div className="h-full bg-white/70 backdrop-blur-sm">
          <ChatBox projectId={id} />
        </div>
      </div>
    </main>

    {/* Enhanced Status Bar */}
    {status && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900/90 backdrop-blur-xl text-white rounded-2xl shadow-2xl text-sm transition-all duration-500 animate-fade-in border border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          {status}
        </div>
      </div>
    )}

    {/* Enhanced Delete Confirmation Modal */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200/50 transform animate-scale-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete File?</h3>
            <p className="text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-800">
                {project.files.find(f => f.id === showDeleteConfirm)?.name}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteFile(showDeleteConfirm)}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Enhanced New File Modal */}
    {isAddingFile && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200/50 transform animate-scale-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Create New File</h3>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50/80 rounded-xl">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCreateFile();
                }}
                className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 font-medium"
                placeholder="Enter filename"
                autoFocus
              />
              <span className="text-gray-400 font-bold">.</span>
              <select
                value={newFileExtension}
                onChange={(e) => setNewFileExtension(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-600 font-medium"
              >
                <option value="txt">txt</option>
                <option value="js">js</option>
                <option value="py">py</option>
                <option value="php">php</option>
                <option value="java">java</option>
                <option value="cpp">cpp</option>
                <option value="c">c</option>
                <option value="html">html</option>
                <option value="css">css</option>
                <option value="json">json</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsAddingFile(false);
                setNewFileName('');
              }}
              className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateFile}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Create File
            </button>
          </div>
        </div>
      </div>
    )}

    <style jsx>{`
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes scale-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      
      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
      
      .animate-scale-in {
        animation: scale-in 0.2s ease-out;
      }
    `}</style>
  </div>
);

//   return (
//     <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
//       {/* Header */}
//       <header className="bg-white shadow-lg border-b border-gray-200">
//         <div className="px-6 py-4">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center gap-4">
//               <div className={`p-2 rounded-lg bg-gradient-to-r ${getLanguageColor(getLanguageFromExtension(activeFile?.name))}`}>
//                 {getLanguageIcon(getLanguageFromExtension(activeFile?.name))}
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-800">{project.title}</h1>
//                 <div className="flex items-center gap-2 text-sm text-gray-500">
//                   <Users className="w-4 h-4" />
//                   <span>1 collaborator</span>
//                   {isSaving && (
//                     <div className="flex items-center gap-1 text-blue-600">
//                       <Save className="w-3 h-3 animate-pulse" />
//                       <span>Saving...</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <div className="flex gap-3 items-center">
//               <button
//                 onClick={handleSave}
//                 disabled={isSaving}
//                 className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 ${
//                   isSaving 
//                     ? "bg-gray-400 cursor-not-allowed" 
//                     : "bg-green-600 hover:bg-green-700"
//                 }`}
//               >
//                 <Save className="w-4 h-4" />
//                 {isSaving ? 'Saving...' : 'Save'}
//               </button>
//               <button
//                 onClick={runCode}
//                 disabled={loading}
//                 className={`flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 shadow-lg
//                   ${loading
//                     ? "bg-gray-400 cursor-not-allowed"
//                     : `bg-gradient-to-r ${getLanguageColor(getLanguageFromExtension(activeFile?.name))} hover:shadow-xl`
//                   }`}
//               >
//                 {loading ? (
//                   <>
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                     Running...
//                   </>
//                 ) : (
//                   <>
//                     <Play className="w-4 h-4" />
//                     Run Code
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Content Area */}
//       <main className="flex-1 flex overflow-hidden">
//         {/* Left Sidebar: File Explorer */}
//         <div className={`transition-all duration-300 ${isFileExplorerCollapsed ? 'w-12' : 'w-72'} bg-white border-r border-gray-200 flex flex-col`}>
//           <div className="p-4 flex items-center justify-between border-b border-gray-200">
//             {!isFileExplorerCollapsed && <h2 className="text-lg font-bold text-gray-800">Files</h2>}
//             <button
//               onClick={() => setIsFileExplorerCollapsed(!isFileExplorerCollapsed)}
//               className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
//             >
//               <Files className="w-5 h-5" />
//             </button>
//           </div>
          
//           <div className="flex-1 overflow-y-auto p-2">
//             {!isFileExplorerCollapsed && (
//               <ul className="space-y-1">
//                 {project.files.map((file) => (
//                   <li key={file.id}>
//                     <button
//                       onClick={() => handleFileSwitch(file.id)}
//                       className={`w-full flex items-center justify-between p-2 rounded-lg font-medium transition-all duration-200
//                         ${activeFileId === file.id
//                           ? 'bg-blue-100 text-blue-800'
//                           : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
//                         }`}
//                     >
//                       <span className="truncate flex-1 text-left">
//                         {file.name} {file.isNew && <span className="text-xs text-orange-500">(new)</span>}
//                       </span>
//                       <X
//                         className="w-4 h-4 text-gray-500 hover:text-red-500"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           setShowDeleteConfirm(file.id);
//                         }}
//                       />
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
          
//           {!isFileExplorerCollapsed && (
//             <div className="p-4 border-t border-gray-200 space-y-2">
//               <button
//                 onClick={() => setIsAddingFile(true)}
//                 className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all"
//               >
//                 <Plus className="w-4 h-4" />
//                 New File
//               </button>
//               <label className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-all cursor-pointer">
//                 <Upload className="w-4 h-4" />
//                 Upload File
//                 <input
//                   type="file"
//                   multiple
//                   onChange={handleFileUpload}
//                   className="hidden"
//                 />
//               </label>
//             </div>
//           )}
//         </div>

//         {/* Center: Code Editor + Output */}
//         <div className="flex-1 flex flex-col gap-6 p-6 overflow-hidden">
//           {/* Code Editor */}
//           <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
//             <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-2 flex items-center justify-between">
//               <span className="text-gray-300 text-sm font-medium">
//                 {activeFile?.name || "main.txt"}
//               </span>
//               <div className="text-gray-400 text-xs">{activeFile?.content.length || 0} characters</div>
//             </div>
//             <div style={{ height: "calc(100% - 40px)" }}>
//               <CodeEditor
//                 key={activeFileId} // Force re-render when file changes
//                 code={activeFile?.content || ""}
//                 onCodeChange={debouncedCodeChange}
//                 language={getLanguageFromExtension(activeFile?.name)}
//               />
//             </div>
//           </div>

//           {/* Output Panel */}
//           <div className="h-64 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
//             <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
//               <span className="text-gray-700 text-sm font-medium flex items-center gap-2">
//                 <Terminal className="w-4 h-4" />
//                 Output
//               </span>
//             </div>
//             <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-gray-800">
//               <pre>{output}</pre>
//               {htmlPreview && (
//                 <iframe
//                   title="HTML Preview"
//                   srcDoc={htmlPreview}
//                   className="w-full h-full border-none mt-4"
//                 />
//               )}
//             </div>
//           </div>
//         </div>
//         <div className="w-[350px]">
//   <ChatBox projectId={id} />
// </div>

//         {/* Right Sidebar: AI Chat */}
//         {/* <div className={`transition-all duration-300 ${isChatOpen ? 'w-96' : 'w-12'} bg-white border-l border-gray-200 flex flex-col`}>
//     <div
//         className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between cursor-pointer"
//         onClick={() => setIsChatOpen(!isChatOpen)}
//     >
//         <span className="text-gray-700 text-sm font-medium flex items-center gap-2">
//             <Bot className="w-4 h-4" />
//             {isChatOpen && "AI Assistant"}
//         </span>
//         <button className="p-1 rounded-full hover:bg-gray-200">
//             <MessageCircle className="w-4 h-4 text-gray-500" />
//         </button>
//     </div>
    
//     {isChatOpen && (
//         <ChatAssistant project={project} activeFile={activeFile} />
//     )}
// </div> */}
//       </main>

//       {/* Status Bar */}
//       {status && (
//         <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 text-white rounded-full shadow-lg text-sm transition-opacity duration-300 animate-fade-in">
//           {status}
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       {showDeleteConfirm && (
//         <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
//             <h3 className="text-lg font-bold mb-2">Confirm Delete</h3>
//             <p className="text-gray-600 mb-4">
//               Are you sure you want to delete <span className="font-semibold">{project.files.find(f => f.id === showDeleteConfirm)?.name}</span>? This action cannot be undone.
//             </p>
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowDeleteConfirm(null)}
//                 className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => handleDeleteFile(showDeleteConfirm)}
//                 className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* New File Modal */}
//       {isAddingFile && (
//         <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
//             <h3 className="text-lg font-bold mb-4">Create New File</h3>
//             <div className="flex items-center gap-2 mb-4">
//               <input
//                 type="text"
//                 value={newFileName}
//                 onChange={(e) => setNewFileName(e.target.value)}
//                 onKeyPress={(e) => {
//                   if (e.key === 'Enter') handleCreateFile();
//                 }}
//                 className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="file-name"
//                 autoFocus
//               />
//               <span className="text-gray-500">.</span>
//               <select
//                 value={newFileExtension}
//                 onChange={(e) => setNewFileExtension(e.target.value)}
//                 className="p-2 border border-gray-300 rounded-lg"
//               >
//                 <option value="txt">txt</option>
                
//                 <option value="js">JavaScript</option>
//   <option value="py">Python</option>
//   <option value="php">PHP</option>
//   <option value="java">Java</option>
//   <option value="cpp">C++</option>
//   <option value="c">C</option>
//   <option value="html">HTML</option>
//   <option value="css">CSS</option>
//   <option value="json">JSON</option>
 
//               </select>
//             </div>
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => {
//                   setIsAddingFile(false);
//                   setNewFileName('');
//                 }}
//                 className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleCreateFile}
//                 className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600"
//               >
//                 Create
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
};

export default ProjectEditorPage;

/////////////////////////////////////////////////>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


// // Secound edited code :
// import React, { useEffect, useState, useRef, useCallback, useContext } from "react";
// import { useParams, useLocation } from "react-router-dom";
// import { AuthContext } from "../context/AuthContext";
// import io from "socket.io-client";
// import {
//   Play,
//   Terminal,
//   Code,
//   Globe,
//   Users,
//   Settings,
//   Save,
//   Files,
//   Plus,
//   Upload,
//   Trash,
//   X,
//   Bot,
//   MessageCircle,
// } from "lucide-react";
// import CodeEditor from "../components/CodeEditor";

// // Helper function to debounce
// function debounce(fn, wait = 500) {
//   let t;
//   return (...args) => {
//     clearTimeout(t);
//     t = setTimeout(() => fn(...args), wait);
//   };
// }

// // Helper function to get language from file extension
// const getLanguageFromExtension = (filename) => {
//   const extension = filename.split(".").pop();
//   switch (extension) {
//     case "js":
//     case "jsx":
//       return "javascript";
//     case "ts":
//     case "tsx":
//       return "typescript";
//     case "py":
//       return "python";
//     case "html":
//     case "htm":
//       return "html";
//     case "css":
//       return "css";
//     case "java":
//       return "java";
//     case "cpp":
//     case "c++":
//       return "cpp";
//     case "c":
//       return "c";
//     case "php":
//       return "php";
//     case "json":
//       return "json";
//     case "md":
//       return "markdown";
//     default:
//       return "plaintext";
//   }
// };

// // Helper function for default file content
// const getDefaultContent = (filename) => {
//   const lang = getLanguageFromExtension(filename);
//   switch (lang) {
//     case "html":
//       return '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Hello World</title>\n</head>\n<body>\n    <div>\n        <h1>🚀 Welcome!</h1>\n        <p>This is a collaborative coding environment.</p>\n    </div>\n</body>\n</html>';
//     case "javascript":
//       return "// Welcome to your new JavaScript file!\nconsole.log('Hello, World!');";
//     case "python":
//       return "# Welcome to your new Python file!\nprint('Hello, World!')";
//     case "css":
//       return "/* Welcome to your new CSS file! */\nbody {\n  font-family: sans-serif;\n  background-color: #f4f4f4;\n}";
//     default:
//       return "// Start coding here!";
//   }
// };

// // Main component
// const ProjectEditorPage = () => {
//   const { id } = useParams();
//   const { apiRequest, authUser } = useContext(AuthContext);

//   const initialProject = {
//     id: null,
//     title: 'New Project',
//     files: [
//       {
//         id: `file${Date.now()}`,
//         name: 'index.html',
//         content: getDefaultContent('index.html'),
//       },
//     ],
//   };

//   const [project, setProject] = useState(initialProject);
//   const [activeFileId, setActiveFileId] = useState(initialProject.files[0].id);
//   const [output, setOutput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [status, setStatus] = useState("");
//   const [isAddingFile, setIsAddingFile] = useState(false);
//   const [newFileName, setNewFileName] = useState('');
//   const [newFileExtension, setNewFileExtension] = useState('html');
//   const [isUploading, setIsUploading] = useState(false);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
//   const [isChatOpen, setIsChatOpen] = useState(false);
//   const [chatMessages, setChatMessages] = useState([
//     {
//       id: 1,
//       type: 'ai',
//       message: '👋 Hello! I\'m your AI coding assistant. How can I help you today?',
//       timestamp: new Date()
//     }
//   ]);
//   const [chatInput, setChatInput] = useState('');
//   const [isTyping, setIsTyping] = useState(false);
//   const [isFileExplorerCollapsed, setIsFileExplorerCollapsed] = useState(false);
//   const [htmlPreview, setHtmlPreview] = useState("");

//   const activeFile = project.files.find((f) => f.id === activeFileId);
//   const editorRef = useRef(null);
//   const monacoEditorRef = useRef(null);
//   const monacoInstanceRef = useRef(null);
//   const contentChangeTimeoutRef = useRef(null);
//   const chatEndRef = useRef(null);
//   const socketRef = useRef();

//   // --- Real-time Collaboration (WebSockets) ---
//   useEffect(() => {
//     socketRef.current = io("http://localhost:3001");
//     socketRef.current.emit("joinProject", id);

//     socketRef.current.on("receiveCode", ({ fileId, newContent }) => {
//       // Update the content of the specific file
//       setProject((prevProject) => {
//         const newFiles = prevProject.files.map((file) =>
//           file.id === fileId ? { ...file, content: newContent } : file
//         );
//         return { ...prevProject, files: newFiles };
//       });

//       // If the received code is for the active file, update the editor
//       if (activeFileId === fileId) {
//         if (monacoEditorRef.current && monacoEditorRef.current.getValue() !== newContent) {
//           monacoEditorRef.current.setValue(newContent);
//         }
//       }
//     });

//     socketRef.current.on("receiveOutput", (data) => {
//       setOutput(data);
//     });

//     return () => {
//       socketRef.current.disconnect();
//     };
//   }, [id, activeFileId]);

//   // --- Monaco Editor Initialization and Management ---
//   useEffect(() => {
//     if (window.monaco) {
//       monacoInstanceRef.current = window.monaco;
//     } else {
//       const script = document.createElement("script");
//       script.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.49.0/min/vs/loader.js";
//       script.async = true;
//       script.onload = () => {
//         window.require.config({
//           paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.49.0/min/vs' }
//         });
//         window.require(['vs/editor/editor.main'], function (monaco) {
//           monacoInstanceRef.current = monaco;
//         });
//       };
//       document.head.appendChild(script);
//     }
//   }, []);

//   // Initialize Monaco Editor when the container ref and instance are ready
//   useEffect(() => {
//     if (!monacoInstanceRef.current || !editorRef.current || monacoEditorRef.current) {
//       return;
//     }

//     const language = getLanguageFromExtension(activeFile?.name || 'index.html');
//     monacoEditorRef.current = monacoInstanceRef.current.editor.create(editorRef.current, {
//       value: activeFile?.content || '',
//       language: language,
//       theme: 'vs-dark',
//       automaticLayout: true,
//       minimap: { enabled: true },
//       fontSize: 14,
//       wordWrap: 'on',
//       lineNumbers: 'on',
//       scrollBeyondLastLine: false,
//       folding: true,
//       bracketMatching: 'always',
//       autoIndent: 'full',
//       formatOnPaste: true,
//       formatOnType: true,
//       selectOnLineNumbers: true,
//       contextmenu: true,
//       smoothScrolling: true,
//     });

//     // Debounced change handler
//     const disposable = monacoEditorRef.current.onDidChangeModelContent(() => {
//       if (contentChangeTimeoutRef.current) {
//         clearTimeout(contentChangeTimeoutRef.current);
//       }
      
//       const currentActiveFileId = activeFileId;
      
//       contentChangeTimeoutRef.current = setTimeout(() => {
//         if (monacoEditorRef.current) {
//           const newCode = monacoEditorRef.current.getValue();
//           setProject(prevProject => {
//             const newFiles = prevProject.files.map(file =>
//               file.id === currentActiveFileId ? { ...file, content: newCode } : file
//             );
//             return { ...prevProject, files: newFiles };
//           });
          
//           if (socketRef.current && socketRef.current.connected) {
//             socketRef.current.emit("codeChange", { projectId: id, fileId: currentActiveFileId, code: newCode });
//           }
//         }
//       }, 500);
//     });

//     setTimeout(() => {
//       if (monacoEditorRef.current) {
//         monacoEditorRef.current.focus();
//       }
//     }, 100);

//     return () => {
//       if (contentChangeTimeoutRef.current) {
//         clearTimeout(contentChangeTimeoutRef.current);
//       }
//       disposable.dispose();
//       if (monacoEditorRef.current) {
//         monacoEditorRef.current.dispose();
//         monacoEditorRef.current = null;
//       }
//     };
//   }, [monacoInstanceRef, activeFileId]);

//   // Update editor value and language when the active file changes
//   useEffect(() => {
//     if (!monacoEditorRef.current || !activeFile) return;
//     const newLanguage = getLanguageFromExtension(activeFile.name);

//     // Update the editor's model value
//     if (monacoEditorRef.current.getValue() !== activeFile.content) {
//       monacoEditorRef.current.setValue(activeFile.content);
//     }
    
//     // Update the editor's language
//     const model = monacoEditorRef.current.getModel();
//     if (model && monacoInstanceRef.current) {
//       monacoInstanceRef.current.editor.setModelLanguage(model, newLanguage);
//     }

//     if (newLanguage === 'html') {
//       setHtmlPreview(activeFile.content);
//     } else {
//       setHtmlPreview('');
//     }

//   }, [activeFileId, activeFile]);

//   // --- Project Fetch and Save Logic ---
//   const loadProject = async (projectId) => {
//     try {
//       const response = await apiRequest(`/projects/${projectId}/files`, 'GET');
      
//       if (response.success && response.files) {
//         const loadedFiles = response.files.map((file, index) => ({
//           id: file.id ? `file${file.id}` : `file${index}`,
//           name: file.name || file.original_name || `file${index}.txt`,
//           content: file.content || getDefaultContent(file.name || file.original_name || 'file.txt')
//         }));
        
//         setProject(prev => ({
//           ...prev,
//           id: projectId,
//           title: response.project?.name || prev.title,
//           files: loadedFiles.length > 0 ? loadedFiles : prev.files
//         }));
        
//         if (loadedFiles.length > 0) {
//           setActiveFileId(loadedFiles[0].id);
//         }
//         setStatus('Project loaded successfully');
//       } else {
//         setStatus('Failed to load project files');
//       }
//     } catch (error) {
//       console.error('Load error:', error);
//       setStatus('Error loading project');
//     }
//     setTimeout(() => setStatus(''), 3000);
//   };

//   useEffect(() => {
//     if (id) {
//       setProject(prev => ({ ...prev, id }));
//       loadProject(id);
//     }
//   }, [id, apiRequest]);

//   const handleSave = async () => {
//     if (!project.id) {
//       setStatus('No project ID available');
//       setTimeout(() => setStatus(''), 3000);
//       return;
//     }

//     setIsSaving(true);
//     setStatus('Saving...');

//     try {
//       const filesData = project.files.map(file => ({
//         name: file.name,
//         content: file.content,
//         id: file.id?.toString().replace('file', '') || null
//       }));

//       const response = await apiRequest(`/projects/${project.id}/files`, 'POST', {
//         files: filesData
//       });
      
//       if (response.success) {
//         if (response.files) {
//           setProject(prev => ({
//             ...prev,
//             files: prev.files.map((file, index) => {
//               const backendFile = response.files[index];
//               return {
//                 ...file,
//                 id: backendFile?.id ? `file${backendFile.id}` : file.id
//               };
//             })
//           }));
//         }
        
//         setStatus('Saved successfully!');
//       } else {
//         setStatus('Save failed: ' + (response.message || 'Unknown error'));
//       }
//     } catch (error) {
//       console.error('Save error:', error);
//       setStatus('Error saving project');
//     } finally {
//       setIsSaving(false);
//       setTimeout(() => setStatus(''), 3000);
//     }
//   };

//   // --- File Management Handlers ---
//   const handleFileSwitch = (newFileId) => {
//     if (monacoEditorRef.current && activeFileId !== newFileId) {
//       const currentContent = monacoEditorRef.current.getValue();
//       setProject(prevProject => {
//         const newFiles = prevProject.files.map(file =>
//           file.id === activeFileId ? { ...file, content: currentContent } : file
//         );
//         return { ...prevProject, files: newFiles };
//       });
//     }
    
//     if (contentChangeTimeoutRef.current) {
//       clearTimeout(contentChangeTimeoutRef.current);
//       contentChangeTimeoutRef.current = null;
//     }

//     setActiveFileId(newFileId);
//   };

//   const handleCreateFile = () => {
//     if (!newFileName.trim()) return;

//     const fullFileName = `${newFileName.trim()}.${newFileExtension}`;
//     const isFileExists = project.files.some(file => file.name === fullFileName);

//     if (isFileExists) {
//       setStatus(`Error: A file named "${fullFileName}" already exists.`);
//       setTimeout(() => setStatus(''), 3000);
//       return;
//     }

//     const newFile = {
//       id: `file${Date.now()}`,
//       name: fullFileName,
//       content: getDefaultContent(fullFileName),
//     };

//     setProject(prevProject => ({
//       ...prevProject,
//       files: [...prevProject.files, newFile],
//     }));

//     handleFileSwitch(newFile.id);
//     setIsAddingFile(false);
//     setNewFileName('');
//     setStatus(`Created ${fullFileName}`);
//     setTimeout(() => setStatus(''), 2000);
//   };
  
//   const handleDeleteFile = async (fileId) => {
//     if (project.files.length <= 1) {
//       setStatus('Cannot delete the last file');
//       setTimeout(() => setStatus(''), 2000);
//       return;
//     }
    
//     // Optimistically update the UI
//     const fileToDelete = project.files.find(f => f.id === fileId);
//     setProject(prevProject => {
//       const updatedFiles = prevProject.files.filter(file => file.id !== fileId);
//       return { ...prevProject, files: updatedFiles };
//     });
    
//     if (fileId === activeFileId) {
//       const remainingFiles = project.files.filter(file => file.id !== fileId);
//       if (remainingFiles.length > 0) {
//         handleFileSwitch(remainingFiles[0].id);
//       }
//     }
//     setStatus(`Deleting ${fileToDelete.name}...`);
    
//     try {
//       const numericFileId = fileId.toString().replace('file', '');
//       const response = await apiRequest(`/projects/${project.id}/files/${numericFileId}`, 'DELETE');

//       if (response.success) {
//         setStatus('File deleted successfully!');
//       } else {
//         setStatus('Delete failed: ' + (response.message || 'Unknown error'));
//         // Revert UI on failure
//         setProject(prevProject => ({
//           ...prevProject,
//           files: [...prevProject.files, fileToDelete]
//         }));
//       }
//     } catch (error) {
//       console.error('Delete error:', error);
//       setStatus('Error deleting file');
//     } finally {
//       setShowDeleteConfirm(null);
//       setTimeout(() => setStatus(''), 3000);
//     }
//   };

//   const handleFileUpload = async (event) => {
//     const files = Array.from(event.target.files);
//     if (!files.length || !project.id) return;

//     const existingFileNames = new Set(project.files.map(file => file.name));
//     const newFiles = [];
//     const duplicateFileNames = [];

//     for (const file of files) {
//       if (existingFileNames.has(file.name)) {
//         duplicateFileNames.push(file.name);
//       } else {
//         newFiles.push(file);
//       }
//     }

//     if (newFiles.length === 0) {
//       setStatus(`Error: The following file(s) already exist: ${duplicateFileNames.join(', ')}`);
//       setTimeout(() => setStatus(''), 3000);
//       event.target.value = '';
//       return;
//     }

//     setIsUploading(true);
//     setStatus('Uploading files...');

//     try {
//       const formData = new FormData();
//       newFiles.forEach(file => {
//         formData.append('files[]', file);
//       });

//       const response = await apiRequest(
//         `/projects/${project.id}/files/upload`,
//         'POST',
//         formData
//       );

//       if (response.success) {
//         loadProject(project.id);
//         setStatus(`Uploaded ${newFiles.length} file(s) successfully.`);
//       } else {
//         setStatus('Upload failed: ' + (response.message || 'Unknown error'));
//       }
//     } catch (error) {
//       console.error('Upload error:', error);
//       setStatus(`Error uploading files: ${error.message}`);
//     } finally {
//       setIsUploading(false);
//       setTimeout(() => setStatus(''), 3000);
//       event.target.value = '';
//     }
//   };


//   // --- Code Execution and Preview Logic ---
//   const runCode = async () => {
//     if (!activeFile) return;

//     const language = getLanguageFromExtension(activeFile.name);

//     if (language === "html") {
//       setOutput("🌐 HTML preview shown below.");
//       setHtmlPreview(activeFile.content);
//       return;
//     }
    
//     setLoading(true);
//     setOutput("");

//     try {
//       const res = await apiRequest("/execute", "POST", {
//         language,
//         code: activeFile.content,
//         stdin: "",
//       });

//       let resultText = "";
//       if (res && res.success) {
//         if (res.result?.run) {
//           resultText = res.result.run.stdout || res.result.run.stderr || JSON.stringify(res.result.run);
//         } else if (res.result?.stdout || res.result?.stderr) {
//           resultText = res.result.stdout || res.result.stderr;
//         } else if (res.stdout || res.stderr) {
//           resultText = res.stdout || res.stderr;
//         } else {
//           resultText = JSON.stringify(res.result || res);
//         }

//         setOutput(String(resultText));
//         if (socketRef.current) {
//           socketRef.current.emit("codeOutput", { projectId: id, output: String(resultText) });
//         }
//       } else {
//         setOutput("Execution error: " + (res?.message || JSON.stringify(res)));
//       }
//     } catch (err) {
//       setOutput("Execution request failed: " + (err.message || err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- UI Helpers ---
//   const getLanguageIcon = (lang) => {
//     switch (lang) {
//       case "html": return <Globe className="w-4 h-4" />;
//       case "javascript": return <Code className="w-4 h-4" />;
//       default: return <Terminal className="w-4 h-4" />;
//     }
//   };

//   const getLanguageColor = (lang) => {
//     switch (lang) {
//       case "javascript": return "from-yellow-500 to-orange-500";
//       case "python": return "from-blue-500 to-green-500";
//       case "html": return "from-orange-500 to-red-500";
//       case "java": return "from-red-500 to-orange-600";
//       case "cpp": return "from-blue-600 to-purple-600";
//       case "c": return "from-gray-600 to-gray-800";
//       case "php": return "from-purple-500 to-indigo-600";
//       default: return "from-gray-500 to-gray-700";
//     }
//   };

//   // --- Chat Handlers ---
//   const handleSendMessage = async () => {
//     if (!chatInput.trim()) return;

//     const userMessage = {
//       id: Date.now(),
//       type: 'user',
//       message: chatInput,
//       timestamp: new Date()
//     };

//     setChatMessages(prev => [...prev, userMessage]);
//     setChatInput('');
//     setIsTyping(true);

//     const userQuery = chatInput;
//     const systemPrompt = "You are a friendly and knowledgeable AI coding assistant. Provide concise and helpful code-related advice.";
//     const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=`;
    
//     try {
//         const payload = {
//             contents: [{ parts: [{ text: userQuery }] }],
//             systemInstruction: { parts: [{ text: systemPrompt }] },
//         };

//         const response = await fetch(apiUrl, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });

//         const result = await response.json();
//         const aiResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that request.";

//         const aiMessage = {
//             id: Date.now() + 1,
//             type: 'ai',
//             message: aiResponseText,
//             timestamp: new Date()
//         };

//         setChatMessages(prev => [...prev, aiMessage]);
//     } catch (error) {
//         console.error("AI API call failed:", error);
//         setChatMessages(prev => [
//             ...prev,
//             { id: Date.now() + 1, type: 'ai', message: "There was an error communicating with the AI.", timestamp: new Date() }
//         ]);
//     } finally {
//         setIsTyping(false);
//     }
// };

//   // --- UI Render ---
//   if (!project) {
//     return (
//       <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-500 text-lg">Loading project...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
//       {/* Header */}
//       <header className="bg-white shadow-lg border-b border-gray-200">
//         <div className="px-6 py-4">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center gap-4">
//               <div className={`p-2 rounded-lg bg-gradient-to-r ${getLanguageColor(getLanguageFromExtension(activeFile?.name))}`}>
//                 {getLanguageIcon(getLanguageFromExtension(activeFile?.name))}
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-800">{project.title}</h1>
//                 <div className="flex items-center gap-2 text-sm text-gray-500">
//                   <Users className="w-4 h-4" />
//                   <span>1 collaborator</span>
//                   {isSaving && (
//                     <div className="flex items-center gap-1 text-blue-600">
//                       <Save className="w-3 h-3 animate-pulse" />
//                       <span>Saving...</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <div className="flex gap-3 items-center">
//               <button
//                 onClick={runCode}
//                 disabled={loading}
//                 className={`flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 shadow-lg
//                   ${loading
//                     ? "bg-gray-400 cursor-not-allowed"
//                     : `bg-gradient-to-r ${getLanguageColor(getLanguageFromExtension(activeFile?.name))} hover:shadow-xl`
//                   }`}
//               >
//                 {loading ? (
//                   <>
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                     Running...
//                   </>
//                 ) : (
//                   <>
//                     <Play className="w-4 h-4" />
//                     Run Code
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Content Area */}
//       <main className="flex-1 flex overflow-hidden">
//         {/* File Explorer and Actions */}
//         <div className={`transition-all duration-300 ${isFileExplorerCollapsed ? 'w-12' : 'w-72'} bg-white border-r border-gray-200 flex flex-col`}>
//           <div className="p-4 flex items-center justify-between border-b border-gray-200">
//             {!isFileExplorerCollapsed && <h2 className="text-lg font-bold text-gray-800">Files</h2>}
//             <button
//               onClick={() => setIsFileExplorerCollapsed(!isFileExplorerCollapsed)}
//               className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
//             >
//               <Files className="w-5 h-5" />
//             </button>
//           </div>
//           <div className="flex-1 overflow-y-auto p-2">
//             {!isFileExplorerCollapsed && (
//               <ul className="space-y-1">
//                 {project.files.map((file) => (
//                   <li key={file.id}>
//                     <button
//                       onClick={() => handleFileSwitch(file.id)}
//                       className={`w-full flex items-center justify-between p-2 rounded-lg font-medium transition-all duration-200
//                         ${activeFileId === file.id
//                           ? 'bg-blue-100 text-blue-800'
//                           : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
//                         }`}
//                     >
//                       <span className="truncate flex-1 text-left">{file.name}</span>
//                       <X
//                         className="w-4 h-4 text-gray-500 hover:text-red-500"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           setShowDeleteConfirm(file.id);
//                         }}
//                       />
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//           {!isFileExplorerCollapsed && (
//             <div className="p-4 border-t border-gray-200 space-y-2">
//               <button
//                 onClick={() => setIsAddingFile(true)}
//                 className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all"
//               >
//                 <Plus className="w-4 h-4" />
//                 New File
//               </button>
//               <label className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-all cursor-pointer">
//                 <Upload className="w-4 h-4" />
//                 Upload File
//                 <input type="file" multiple onChange={handleFileUpload} className="hidden" />
//               </label>
//             </div>
//           )}
//         </div>

//         {/* Editor and Output */}
//         <div className="flex-1 flex flex-col overflow-hidden p-6">
//           <div className="flex-1 flex flex-col gap-6">
//             <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
//               <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-2 flex items-center justify-between">
//                 <span className="text-gray-300 text-sm font-medium">
//                   {activeFile?.name || 'No File Selected'}
//                 </span>
//                 <div className="text-gray-400 text-xs">{activeFile?.content?.length || 0} characters</div>
//               </div>
//               <div ref={editorRef} style={{ height: "calc(100% - 40px)" 
                
//               }}></div>
//             </div>

//             <div className="h-64 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
//               <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-2 flex items-center gap-2">
//                 {getLanguageFromExtension(activeFile?.name) === "html" ? (
//                   <>
//                     <Globe className="w-4 h-4 text-orange-400" />
//                     <span className="text-gray-300 text-sm font-medium">Live Preview</span>
//                   </>
//                 ) : (
//                   <>
//                     <Terminal className="w-4 h-4 text-green-400" />
//                     <span className="text-gray-300 text-sm font-medium">Console Output</span>
//                   </>
//                 )}
//               </div>
//               <div className="h-[calc(100%-40px)]">
//                 {getLanguageFromExtension(activeFile?.name) === "html" ? (
//                   <iframe
//                     title="html-preview"
//                     srcDoc={htmlPreview}
//                     className="w-full h-full border-none bg-white"
//                   />
//                 ) : (
//                   <div className="h-full bg-gray-900 text-green-400 p-4 font-mono text-sm overflow-y-auto">
//                     <pre className="whitespace-pre-wrap">
//                       {output || "⚡ Output will appear here after running your code..."}
//                     </pre>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* AI Chatbox */}
//         <div className={`transition-all duration-300 ${isChatOpen ? 'w-80' : 'w-12'} bg-white border-l border-gray-200 flex flex-col relative`}>
//           <div className="p-4 flex items-center justify-between border-b border-gray-200">
//             {!isChatOpen && <button onClick={() => setIsChatOpen(true)} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"><MessageCircle className="w-5 h-5" /></button>}
//             {isChatOpen && <h2 className="text-lg font-bold text-gray-800">AI Assistant</h2>}
//             {isChatOpen && <button onClick={() => setIsChatOpen(false)} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"><X className="w-5 h-5" /></button>}
//           </div>
//           {isChatOpen && (
//             <div className="flex-1 flex flex-col justify-end p-4 overflow-y-auto">
//               <div className="space-y-4">
//                 {chatMessages.map((msg, index) => (
//                   <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
//                     <div className={`max-w-[75%] rounded-lg p-3 ${msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
//                       {msg.message}
//                     </div>
//                   </div>
//                 ))}
//                 {isTyping && (
//                   <div className="flex justify-start">
//                     <div className="bg-gray-200 text-gray-800 rounded-lg p-3">
//                       <div className="flex items-center space-x-2">
//                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
//                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//               <div ref={chatEndRef} />
//             </div>
//           )}
//           {isChatOpen && (
//             <div className="p-4 border-t border-gray-200">
//               <div className="flex gap-2">
//                 <input
//                   type="text"
//                   value={chatInput}
//                   onChange={(e) => setChatInput(e.target.value)}
//                   onKeyPress={(e) => {
//                     if (e.key === 'Enter') handleSendMessage();
//                   }}
//                   placeholder="Ask for help..."
//                   className="flex-1 rounded-lg px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
//                 />
//                 <button
//                   onClick={handleSendMessage}
//                   className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all"
//                 >
//                   <Bot className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </main>

//       {/* Modals */}
//       {isAddingFile && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
//             <h3 className="text-xl font-bold text-gray-800 mb-4">Create New File</h3>
//             <div className="space-y-4">
//               <input
//                 type="text"
//                 value={newFileName}
//                 onChange={(e) => setNewFileName(e.target.value)}
//                 placeholder="File name"
//                 className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
//               />
//               <select
//                 value={newFileExtension}
//                 onChange={(e) => setNewFileExtension(e.target.value)}
//                 className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="html">.html</option>
//                 <option value="js">.js</option>
//                 <option value="py">.py</option>
//                 <option value="css">.css</option>
//                 <option value="json">.json</option>
//               </select>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => setIsAddingFile(false)}
//                   className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-all"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleCreateFile}
//                   className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all"
//                 >
//                   Create
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//       {showDeleteConfirm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
//             <h3 className="text-xl font-bold text-red-600 mb-2">Confirm Delete</h3>
//             <p className="text-gray-600 mb-4">Are you sure you want to delete this file?</p>
//             <div className="flex justify-end gap-2">
//               <button
//                 onClick={() => setShowDeleteConfirm(null)}
//                 className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-all"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => handleDeleteFile(showDeleteConfirm)}
//                 className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-all"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProjectEditorPage;



