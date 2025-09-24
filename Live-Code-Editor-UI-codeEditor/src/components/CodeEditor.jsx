// import React, { useRef, useState, useEffect } from "react";
// import Editor from "@monaco-editor/react";
// import io from "socket.io-client";

// // Connect socket server
// const socket = io("http://localhost:3001");

// export default function CodeEditor({ code, onCodeChange, language, projectId, currentUser }) {
//   const editorRef = useRef(null);
//   const [aiSuggestion, setAiSuggestion] = useState("");
//   const debounceTimer = useRef(null);
//   const [typingUser, setTypingUser] = useState(null);
//   const [isTyping, setIsTyping] = useState(false);

//   // --------- SOCKET JOIN ----------
//   useEffect(() => {
//     if (!projectId || !currentUser) return;

//     socket.emit("joinProject", projectId);

//     socket.on("userTyping", (user) => {
//       setTypingUser(user);
//     });

//     socket.on("userStopTyping", (user) => {
//       setTypingUser(null);
//     });

//     return () => {
//       socket.off("userTyping");
//       socket.off("userStopTyping");
//     };
//   }, [projectId, currentUser]);

//   // --------- MONACO MOUNT ----------
//   const handleEditorDidMount = (editor, monaco) => {
//     editorRef.current = editor;

//     editor.onDidChangeModelContent(() => {
//       const value = editor.getValue();
//       onCodeChange(value);

//       setIsTyping(true);
//       socket.emit("typing", { projectId, user: currentUser });

//       clearTimeout(debounceTimer.current);
//       debounceTimer.current = setTimeout(() => {
//         setIsTyping(false);
//         socket.emit("stopTyping", { projectId, user: currentUser });
//       }, 1000);

//       debounceGetAISuggestion(value);
//     });

//     editor.onDidChangeCursorPosition((e) => {
//       socket.emit("cursorMove", { projectId, user: currentUser, position: e.position });
//     });

//     editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
//       if (aiSuggestion) {
//         editor.executeEdits("", [
//           { range: editor.getSelection(), text: aiSuggestion, forceMoveMarkers: true },
//         ]);
//         setAiSuggestion("");
//       }
//     });
//   };

//   // --------- AI SUGGESTION ----------
//   const debounceGetAISuggestion = (codeValue) => {
//     if (debounceTimer.current) clearTimeout(debounceTimer.current);
//     debounceTimer.current = setTimeout(() => {
//       if (codeValue.trim()) getAISuggestion(codeValue);
//     }, 1200);
//   };

//   const getAISuggestion = async (codeSnippet) => {
//     try {
//       const token = localStorage.getItem("token");
//       const res = await fetch("http://localhost:8000/api/ai-autocomplete", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ code: codeSnippet }),
//       });

//       if (!res.ok) throw new Error("Request failed");
//       const data = await res.json();
//       setAiSuggestion(data.suggestion || "");
//     } catch (err) {
//       console.error("AI error:", err.message);
//       setAiSuggestion("");
//     }
//   };

//   return (
//     <div style={{ position: "relative" }}>
//       <Editor
//         height="400px"
//         theme="vs-dark"
//         defaultLanguage={language}
//         value={code}
//         onMount={handleEditorDidMount}
//       />

//       {isTyping && (
//         <div style={{ color: "yellow", marginTop: 5 }}>Saving...</div>
//       )}

//       {typingUser && (
//         <div style={{ color: "lightgreen", marginTop: 5 }}>
//           {typingUser.name} is editing...
//         </div>
//       )}

//       {/* AI Suggestion box */}
//       {aiSuggestion && (
//         <div
//           style={{
//             position: "absolute",
//             bottom: 10,
//             right: 10,
//             backgroundColor: "#252526",
//             color: "#dcdcaa",
//             padding: "8px 12px",
//             borderRadius: 6,
//             fontFamily: "monospace",
//             fontSize: 13,
//             maxWidth: "60%",
//             whiteSpace: "pre-wrap",
//           }}
//         >
//           <div style={{ display: "flex", justifyContent: "space-between" }}>
//             <strong>AI Suggestion</strong>
//             <button
//               onClick={() => setAiSuggestion("")}
//               style={{
//                 background: "transparent",
//                 border: "none",
//                 color: "#f87171",
//                 cursor: "pointer",
//                 fontWeight: "bold",
//                 fontSize: "14px",
//               }}
//             >
//               ✖
//             </button>
//           </div>
//           <pre style={{ margin: 0 }}>{aiSuggestion}</pre>
//           <small style={{ display: "block", marginTop: 4 }}>
//             Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to insert
//           </small>
//         </div>
//       )}
//     </div>
//   );
// }




//>>>>>>>>>>>>>>>>>>>>>>>mine 
import React, { useRef, useState } from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditor({ code, onCodeChange, language }) {
  const editorRef = useRef(null);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef(null);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      onCodeChange(value);
      debounceGetAISuggestion(value);
    });

    // Tab → accept suggestion
    editor.addCommand(
      window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Tab,
      () => {
        acceptSuggestion();
      }
    );

    // Escape → dismiss suggestion
    editor.addCommand(
      window.monaco.KeyCode.Escape,
      () => {
        setAiSuggestion("");
      }
    );
  };

  const debounceGetAISuggestion = (codeValue) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      if (codeValue.trim()) {
        getAISuggestion(codeValue);
      }
    }, 1000);
  };

  const getAISuggestion = async (codeSnippet) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/ai-autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: codeSnippet }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server returned error:", errorText);
        throw new Error("Request failed");
      }

      const data = await res.json();
      setAiSuggestion(data.suggestion || "");
    } catch (err) {
      console.error("AI error:", err.message);
      setAiSuggestion("");
    } finally {
      setIsLoading(false);
    }
  };

  const acceptSuggestion = () => {
    if (aiSuggestion && editorRef.current) {
      const editor = editorRef.current;
      const position = editor.getPosition();
      
      editor.executeEdits("", [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text: aiSuggestion,
          forceMoveMarkers: true,
        },
      ]);
      
      // Move cursor to end of inserted text
      const newPosition = {
        lineNumber: position.lineNumber,
        column: position.column + aiSuggestion.length,
      };
      editor.setPosition(newPosition);
      editor.focus();
      
      setAiSuggestion("");
    }
  };

  const dismissSuggestion = () => {
    setAiSuggestion("");
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
      <Editor
        height="400px"
        theme="vs-dark"
        defaultLanguage={language}
        value={code}
        onMount={handleEditorDidMount}
      //   options={{
      //     fontSize: 14,
      // minimap: { enabled: false },
      // quickSuggestions: false,
      // suggest: { showInlineSuggestions: false },
      // padding: { top: 10 },
      //     suggest: {
      //       showInlineSuggestions: false, // We'll handle our own UI
      //     },
      //     quickSuggestions: false,
      //   }}
      options={{
  fontSize: 14,
  minimap: { enabled: false },
  quickSuggestions: false,
  suggest: {
    showInlineSuggestions: false, // We'll handle our own UI
  },
  padding: { top: 10 },
}}

      />

      {/* VS Code-style inline suggestion */}
      {aiSuggestion && (
  <div className="absolute inset-0 z-10 pointer-events-none flex justify-end items-start p-4">
    <div className="w-full max-w-lg bg-gray-800 text-white rounded-lg shadow-lg p-4 relative overflow-hidden pointer-events-auto">
       {/* Close Button */}
      <button
        onClick={dismissSuggestion}
        className="absolute top-2 right-2 text-white/70 hover:text-white text-sm font-bold"
        aria-label="Close suggestion"
        color="red"
      >
        ×
      </button>
      {/* Scrollable suggestion text */}
      <div className="max-h-80 overflow-y-auto pr-2 font-mono text-sm whitespace-pre-wrap">
        {aiSuggestion}
      </div>

      {/* Bubble tail */}
      <div className="absolute bottom-0 right-4 w-3 h-3 bg-gray-800 rotate-45"></div>

     
     
    </div>
  </div>
    
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            background: "rgba(30, 30, 30, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.7)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              borderTop: "2px solid rgba(255, 255, 255, 0.8)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          AI is thinking...
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}



// import React, { useRef, useState, useEffect } from "react";
// import Editor from "@monaco-editor/react";

// export default function CodeEditor({ code, onCodeChange, language }) {
//   const editorRef = useRef(null);
//   const [aiSuggestion, setAiSuggestion] = useState("");
//   const debounceTimer = useRef(null);

//   const handleEditorDidMount = (editor) => {
//     editorRef.current = editor;

//     editor.onDidChangeModelContent(() => {
//       const value = editor.getValue();
//       onCodeChange(value);
//       debounceGetAISuggestion(value);
//     });

//     // Ctrl+Enter → insert suggestion
//     editor.addCommand(
//       window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter,
//       () => {
//         if (aiSuggestion) {
//           editor.executeEdits("", [
//             {
//               range: editor.getSelection(),
//               text: aiSuggestion,
//               forceMoveMarkers: true,
//             },
//           ]);
//           setAiSuggestion(""); // clear after insert
//         }
//       }
//     );
//   };

//   // Debounce
//   const debounceGetAISuggestion = (codeValue) => {
//     if (debounceTimer.current) {
//       clearTimeout(debounceTimer.current);
//     }
//     debounceTimer.current = setTimeout(() => {
//       if (codeValue.trim()) {
//         getAISuggestion(codeValue);
//       }
//     }, 1200);
//   };

//   // Call Laravel API
//   const getAISuggestion = async (codeSnippet) => {
//     try {
//       const token = localStorage.getItem("token"); 
//       const res = await fetch("http://localhost:8000/api/ai-autocomplete", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ code: codeSnippet }),
//       });

//       if (!res.ok) {
//         const errorText = await res.text();
//         console.error("Server returned error:", errorText);
//         throw new Error("Request failed");
//       }

//       const data = await res.json();
//       setAiSuggestion(data.suggestion || "");
//     } catch (err) {
//       console.error("AI error:", err.message);
//       setAiSuggestion("");
//     }
//   };

//   return (
//     <div style={{ position: "relative" }}>
//       <Editor
//         height="400px"
//         theme="vs-dark"
//         defaultLanguage={language}
//         value={code}
//         onMount={handleEditorDidMount}
//       />

//       {aiSuggestion && (
//         <div
//           style={{
//             position: "absolute",
//             bottom: 10,
//             right: 10,
//             backgroundColor: "#252526",
//             color: "#dcdcaa",
//             padding: "8px 12px",
//             borderRadius: 6,
//             fontFamily: "monospace",
//             fontSize: 13,
//             maxWidth: "60%",
//             whiteSpace: "pre-wrap",
//           }}
//         >
//           <div style={{ display: "flex", justifyContent: "space-between" }}>
//             <strong>AI Suggestion</strong>
//             <button
//               onClick={() => setAiSuggestion("")}
//               style={{
//                 background: "transparent",
//                 border: "none",
//                 color: "#f87171",
//                 cursor: "pointer",
//                 fontWeight: "bold",
//                 fontSize: "14px",
//               }}
//             >
//               ✖
//             </button>
//           </div>
//           <pre style={{ margin: 0 }}>{aiSuggestion}</pre>
//           <small style={{ display: "block", marginTop: 4 }}>
//             Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to insert
//           </small>
//         </div>
//       )}
//     </div>
//   );
// }
