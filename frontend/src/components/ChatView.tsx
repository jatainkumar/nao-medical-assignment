import { useState, useEffect, useRef } from 'react';
import type { Message, Role, Conversation } from '../types';
import { LANGUAGES } from '../types';
import { sendMessage, getMessages, uploadAudio, createWebSocket, renameConversation } from '../services/api';
import MessageBubble from './MessageBubble';
import AudioRecorder from './AudioRecorder';
import SearchPanel from './SearchPanel';
import SummaryPanel from './SummaryPanel';
import ConversationSidebar from './ConversationSidebar';
import {
    IconArrowLeft, IconMenu, IconSearch, IconClipboard, IconSend,
    IconLanguages, IconMessageSquare, IconUserDoctor, IconUserPatient, IconEdit
} from './Icons';

interface ChatViewProps {
    conversation: Conversation;
    onBack: () => void;
    onSwitchConversation: (conv: Conversation) => void;
    onNewConversation: () => void;
    onConversationUpdate?: (conv: Conversation) => void;
}

export default function ChatView({
    conversation,
    onBack,
    onSwitchConversation,
    onNewConversation,
    onConversationUpdate,
}: ChatViewProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [currentRole, setCurrentRole] = useState<Role>('doctor');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState(conversation.title);
    const [currentTitle, setCurrentTitle] = useState(conversation.title);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const doctorLangName = LANGUAGES.find((l) => l.code === conversation.doctor_language)?.name || conversation.doctor_language;
    const patientLangName = LANGUAGES.find((l) => l.code === conversation.patient_language)?.name || conversation.patient_language;

    // Sync title when conversation prop changes (e.g. from sidebar switch)
    useEffect(() => {
        setCurrentTitle(conversation.title);
        setEditTitle(conversation.title);
    }, [conversation.title, conversation.id]);

    // Load messages
    useEffect(() => {
        getMessages(conversation.id).then(setMessages).catch(console.error);
    }, [conversation.id]);

    // WebSocket connection
    useEffect(() => {
        const ws = createWebSocket(conversation.id);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const msg: Message = JSON.parse(event.data);
                setMessages((prev) => {
                    if (prev.some((m) => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            } catch {
                // pong or non-JSON
            }
        };

        const interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send('ping');
            }
        }, 30000);

        return () => {
            clearInterval(interval);
            ws.close();
        };
    }, [conversation.id]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus title input when editing
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    // Send text message
    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || sending) return;

        setInputText('');
        setSending(true);

        try {
            const msg = await sendMessage(conversation.id, currentRole, text);
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            setRefreshTrigger((t) => t + 1);
        } catch (err) {
            console.error('Send failed:', err);
            setInputText(text);
        } finally {
            setSending(false);
        }
    };

    // Send audio
    const handleAudioSend = async (blob: Blob) => {
        setSending(true);
        try {
            const upload = await uploadAudio(blob);
            const msg = await sendMessage(
                conversation.id,
                currentRole,
                '',
                upload.url
            );
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            setRefreshTrigger((t) => t + 1);
        } catch (err) {
            console.error('Audio send failed:', err);
        } finally {
            setSending(false);
        }
    };

    // Rename conversation
    const handleRename = async () => {
        const trimmed = editTitle.trim();
        if (!trimmed || trimmed === currentTitle) {
            setIsEditingTitle(false);
            setEditTitle(currentTitle);
            return;
        }
        try {
            const updated = await renameConversation(conversation.id, trimmed);
            setCurrentTitle(updated.title);
            setIsEditingTitle(false);
            setRefreshTrigger((t) => t + 1);
            onConversationUpdate?.({ ...conversation, title: updated.title });
        } catch (err) {
            console.error('Rename failed:', err);
            setIsEditingTitle(false);
        }
    };

    // Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
        }
    };

    const handleSearchNavigate = (conversationId: string) => {
        setShowSearch(false);
        if (conversationId !== conversation.id) {
            // Would need to load conversation
        }
    };

    return (
        <div className="chat-layout">
            <ConversationSidebar
                isOpen={sidebarOpen}
                activeConversationId={conversation.id}
                onSelect={onSwitchConversation}
                onNew={onNewConversation}
                onClose={() => setSidebarOpen(false)}
                refreshTrigger={refreshTrigger}
                onDelete={(deletedId) => {
                    if (deletedId === conversation.id) {
                        onBack();
                    }
                }}
            />

            <div className="chat-main">
                {/* Header */}
                <div className="chat-header">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <IconMenu size={20} />
                    </button>
                    <button className="chat-header__back" onClick={onBack}>
                        <IconArrowLeft size={18} />
                    </button>
                    <div className="chat-header__info">
                        <div className="chat-header__title">
                            {isEditingTitle ? (
                                <input
                                    ref={titleInputRef}
                                    className="chat-header__title-input"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onBlur={handleRename}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRename();
                                        if (e.key === 'Escape') {
                                            setIsEditingTitle(false);
                                            setEditTitle(currentTitle);
                                        }
                                    }}
                                />
                            ) : (
                                <span
                                    className="chat-header__title-text"
                                    onClick={() => {
                                        setEditTitle(currentTitle);
                                        setIsEditingTitle(true);
                                    }}
                                >
                                    {currentTitle}
                                    <IconEdit size={12} />
                                </span>
                            )}
                        </div>
                        <div className="chat-header__meta">
                            <IconLanguages size={12} />
                            {doctorLangName} &harr; {patientLangName}
                        </div>
                    </div>
                    <div className="chat-header__actions">
                        <button
                            className="header-btn"
                            onClick={() => setShowSearch(true)}
                        >
                            <IconSearch size={15} /> <span>Search</span>
                        </button>
                        <button
                            className="header-btn"
                            onClick={() => setShowSummary(true)}
                            disabled={messages.length === 0}
                        >
                            <IconClipboard size={15} /> <span>Summary</span>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div className="chat-messages__empty">
                            <div className="chat-messages__empty-icon">
                                <IconMessageSquare size={40} />
                            </div>
                            <p>No messages yet</p>
                            <p style={{ fontSize: '0.85rem' }}>
                                Select who is speaking below, then type or record your message
                            </p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                    {sending && (
                        <div className="sending-indicator">
                            <div className="sending-dots">
                                <span /><span /><span />
                            </div>
                            Translating...
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="chat-input">
                    {/* Role toggle + Audio */}
                    <div className="chat-input__toolbar">
                        <div className="role-toggle">
                            <button
                                className={`role-toggle__btn role-toggle__btn--doctor ${currentRole === 'doctor' ? 'role-toggle__btn--active' : ''}`}
                                onClick={() => setCurrentRole('doctor')}
                            >
                                <IconUserDoctor size={14} /> Doctor
                            </button>
                            <button
                                className={`role-toggle__btn role-toggle__btn--patient ${currentRole === 'patient' ? 'role-toggle__btn--active' : ''}`}
                                onClick={() => setCurrentRole('patient')}
                            >
                                <IconUserPatient size={14} /> Patient
                            </button>
                        </div>
                        <AudioRecorder onSend={handleAudioSend} />
                    </div>

                    <div className="chat-input__row">
                        <textarea
                            ref={textareaRef}
                            className="chat-input__field"
                            placeholder={`Speaking as ${currentRole === 'doctor' ? 'Doctor' : 'Patient'}... (Enter to send)`}
                            value={inputText}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={sending}
                        />
                        <button
                            className="chat-input__send"
                            onClick={handleSend}
                            disabled={!inputText.trim() || sending}
                        >
                            <IconSend size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Panels */}
            {showSearch && (
                <SearchPanel
                    onClose={() => setShowSearch(false)}
                    onNavigate={handleSearchNavigate}
                />
            )}
            {showSummary && (
                <SummaryPanel
                    conversationId={conversation.id}
                    onClose={() => setShowSummary(false)}
                />
            )}
        </div>
    );
}
