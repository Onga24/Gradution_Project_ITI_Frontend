import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Lightbulb, Bug, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Install this package for rendering markdown

// const ChatAssistant = ({ project, activeFile }) => {
//     const [chatInput, setChatInput] = useState("");
//     const [isTyping, setIsTyping] = useState(false);
//     const chatEndRef = useRef(null);
//     const [chatMessages, setChatMessages] = useState([
//         {
//             id: 1,
//             type: 'ai',
//             message: '👋 Hello! I\'m your AI coding assistant. What would you like to work on?',
//             timestamp: new Date()
//         }
//     ]);

//     const scrollToBottom = () => {
//         chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     };

//     useEffect(() => {
//         scrollToBottom();
//     }, [chatMessages]);

//     const handleSendMessage = async () => {
//         if (!chatInput.trim()) return;

//         const userMessage = {
//             id: Date.now(),
//             type: 'user',
//             message: chatInput,
//             timestamp: new Date()
//         };

//         setChatMessages(prev => [...prev, userMessage]);
//         const currentMessage = chatInput;
//         setChatInput('');
//         setIsTyping(true);

//         try {
//             const response = await fetch('/api/ai/chat', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
//                 },
//                 body: JSON.stringify({
//                     message: currentMessage,
//                     currentFile: activeFile,
//                     allFiles: project.files,
//                 }),
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Network response was not ok');
//             }

//             const data = await response.json();

//             setChatMessages(prev => [
//                 ...prev,
//                 {
//                     id: Date.now() + 1,
//                     type: "ai",
//                     message: data.message,
//                     timestamp: new Date()
//                 }
//             ]);
//         } catch (error) {
//             console.error('Error sending message to AI:', error);
//             setChatMessages(prev => [
//                 ...prev,
//                 {
//                     id: Date.now() + 1,
//                     type: "ai",
//                     message: `Sorry, there was an error. ${error.message}`,
//                     timestamp: new Date()
//                 }
//             ]);
//         } finally {
//             setIsTyping(false);
//         }
//     };

//     const handleQuickAction = (action) => {
//         setChatInput(action);
//         handleSendMessage();
//     };

//     const handleKeyPress = (e) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             handleSendMessage();
//             e.preventDefault();
//         }
//     };

//     return (
//         <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 flex flex-col" style={{ height: '400px' }}>
//             <div className="flex items-center justify-between p-4 border-b border-gray-700">
//                 <div className="flex items-center space-x-2">
//                     <Bot className="h-6 w-6 text-sky-400" />
//                     <h3 className="text-lg font-semibold text-gray-50">AI Coding Assistant</h3>
//                 </div>
//                 <div className="flex space-x-2">
//                     <button
//                         onClick={() => handleQuickAction('analyze my code')}
//                         className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
//                         title="Analyze Code"
//                     >
//                         <Code className="h-4 w-4" />
//                     </button>
//                     <button
//                         onClick={() => handleQuickAction('give me a tip')}
//                         className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-white"
//                         title="Get Tip"
//                     >
//                         <Lightbulb className="h-4 w-4" />
//                     </button>
//                     <button
//                         onClick={() => handleQuickAction('help with error')}
//                         className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white"
//                         title="Debug Help"
//                     >
//                         <Bug className="h-4 w-4" />
//                     </button>
//                 </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4 space-y-4">
//                 {chatMessages.map((msg) => (
//                     <div
//                         key={msg.id}
//                         className={`flex items-start space-x-3 ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
//                     >
//                         <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'user' ? 'bg-sky-600' : 'bg-gray-700'}`}>
//                             {msg.type === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-sky-400" />}
//                         </div>
//                         <div className={`flex-1 ${msg.type === 'user' ? 'text-right' : ''}`}>
//                             <div className={`inline-block p-3 rounded-lg max-w-xs lg:max-w-md ${msg.type === 'user' ? 'bg-sky-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
//                                 <ReactMarkdown className="text-sm whitespace-pre-line">{msg.message}</ReactMarkdown>
//                                 <div className="text-xs opacity-70 mt-1">
//                                     {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 ))}

//                 {isTyping && (
//                     <div className="flex items-start space-x-3">
//                         <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
//                             <Bot className="h-4 w-4 text-sky-400" />
//                         </div>
//                         <div className="bg-gray-700 p-3 rounded-lg">
//                             <div className="flex space-x-1">
//                                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 <div ref={chatEndRef} />
//             </div>

//             <div className="p-4 border-t border-gray-700">
//                 <div className="flex space-x-2">
//                     <input
//                         type="text"
//                         value={chatInput}
//                         onChange={(e) => setChatInput(e.target.value)}
//                         onKeyPress={handleKeyPress}
//                         placeholder="Ask me about your code, request tips, or get debugging help..."
//                         className="flex-1 p-3 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
//                         disabled={isTyping}
//                     />
//                     <button
//                         onClick={handleSendMessage}
//                         disabled={!chatInput.trim() || isTyping}
//                         className="px-4 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//                     >
//                         <Send className="h-4 w-4" />
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ChatAssistant;


export default function ChatAssistant({ project, activeFile }) {
    const [chatInput, setChatInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);
    const [chatMessages, setChatMessages] = useState([
        {
            id: 1,
            type: 'ai',
            message: '👋 Hello! I\'m your AI coding assistant. What would you like to work on?',
            timestamp: new Date()
        }
    ]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            message: chatInput,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMessage]);
        const currentMessage = chatInput;
        setChatInput('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    message: currentMessage,
                    currentFile: activeFile,
                    allFiles: project.files,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Network response was not ok');
            }

            const data = await response.json();

            setChatMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    type: "ai",
                    message: data.message,
                    timestamp: new Date()
                }
            ]);
        } catch (error) {
            console.error('Error sending message to AI:', error);
            setChatMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    type: "ai",
                    message: `Sorry, there was an error. ${error.message}`,
                    timestamp: new Date()
                }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleQuickAction = (action) => {
        setChatInput(action);
        handleSendMessage();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSendMessage();
            e.preventDefault();
        }
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 flex flex-col" style={{ height: '400px' }}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                    <Bot className="h-6 w-6 text-sky-400" />
                    <h3 className="text-lg font-semibold text-gray-50">AI Coding Assistant</h3>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleQuickAction('analyze my code')}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
                        title="Analyze Code"
                    >
                        <Code className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleQuickAction('give me a tip')}
                        className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-white"
                        title="Get Tip"
                    >
                        <Lightbulb className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleQuickAction('help with error')}
                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white"
                        title="Debug Help"
                    >
                        <Bug className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-start space-x-3 ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'user' ? 'bg-sky-600' : 'bg-gray-700'}`}>
                            {msg.type === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-sky-400" />}
                        </div>
                        <div className={`flex-1 ${msg.type === 'user' ? 'text-right' : ''}`}>
                         <div className={`inline-block p-3 rounded-lg max-w-xs lg:max-w-md ${msg.type === 'user' ? 'bg-sky-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
    {/* Corrected code here: className is now on the wrapper div, not the ReactMarkdown component */}
    <div className="text-sm whitespace-pre-line">
        <ReactMarkdown>{msg.message}</ReactMarkdown>
    </div>
    <div className="text-xs opacity-70 mt-1">
        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </div>
</div>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-sky-400" />
                        </div>
                        <div className="bg-gray-700 p-3 rounded-lg">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me about your code, request tips, or get debugging help..."
                        className="flex-1 p-3 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                        disabled={isTyping}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isTyping}
                        className="px-4 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

  

