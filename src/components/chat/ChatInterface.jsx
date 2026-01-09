import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { LLMService } from '../../services/llmService';
import { useAuth } from '../../contexts/AuthContext';

export default function ChatInterface({ activeCase, onSessionStart }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();

    // Initialize Session when Active Case Changes
    useEffect(() => {
        if (!activeCase || !user) return;

        let currentSessionId = null;

        const init = async () => {
            setMessages([]); // Clear previous chat
            const sid = await LLMService.startSession(activeCase.id, user.username);
            setSessionId(sid);
            currentSessionId = sid;
            
            // Notify parent of session start
            if (onSessionStart) {
                onSessionStart(sid);
            }

            // Initial Greeting from Config
            const greeting = activeCase.config?.greeting;
            if (greeting) {
                setMessages([{ role: 'assistant', content: greeting }]);
            }
        };
        init();

        // Cleanup: End session when component unmounts or case changes
        return () => {
            if (currentSessionId) {
                LLMService.endSession(currentSessionId);
            }
        };
    }, [activeCase, user]);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading || !sessionId) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // --- CONSTRUCT COMPREHENSIVE SYSTEM PROMPT ---
        const config = activeCase.config || {};
        const demo = config.demographics || {};

        let richSystemPrompt = `## PERSONA\n`;
        richSystemPrompt += `Role: ${config.persona_type || 'Patient'}\n`;
        richSystemPrompt += `Name: ${config.patient_name || activeCase.name}\n`;
        richSystemPrompt += `Demographics: ${demo.age || 'Unknown'} year old ${demo.gender || 'Unknown'}\n`;

        richSystemPrompt += `\n## INSTRUCTIONS\n`;
        richSystemPrompt += `${activeCase.system_prompt || 'You are a patient.'}\n`;

        if (config.constraints) {
            richSystemPrompt += `\n## CONSTRAINTS\n${config.constraints}\n`;
        }

        // Append Config Pages as Markdown Context if they exist
        if (config.pages && config.pages.length > 0) {
            richSystemPrompt += "\n---\n## PATIENT MEDICAL RECORD (Hidden Context)\n";
            richSystemPrompt += "Only reveal this information if specifically asked or relevant to the history taking.\n";

            config.pages.forEach(page => {
                richSystemPrompt += `\n### ${page.title}\n${page.content}\n`;
            });
        }

        const responseText = await LLMService.sendMessage(
            sessionId,
            [...messages, userMsg],
            richSystemPrompt
        );

        setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
        setLoading(false);
    };

    if (!activeCase) {
        return (
            <div className="flex items-center justify-center h-full text-neutral-500 bg-neutral-900 border-t border-neutral-800">
                <div className="text-center">
                    <p>No Case Selected.</p>
                    <p className="text-xs">Please load a case from settings.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-neutral-900 text-white font-sans border-t border-neutral-800">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 shrink-0">
                                <Bot className="w-4 h-4 text-blue-400" />
                            </div>
                        )}

                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-bl-none'
                            }`}>
                            {msg.content}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-800 shrink-0">
                                <UserIcon className="w-4 h-4 text-blue-400" />
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700">
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        </div>
                        <div className="bg-neutral-800 px-4 py-2 rounded-2xl rounded-bl-none border border-neutral-700 text-neutral-500 text-xs flex items-center">
                            Typing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-neutral-900/90 border-t border-neutral-800">
                <form onSubmit={handleSend} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        placeholder={loading ? "Waiting for response..." : "Type your message..."}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-neutral-600 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 rounded-md hover:bg-blue-500 transition-colors text-white disabled:bg-neutral-700 disabled:text-neutral-500"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
