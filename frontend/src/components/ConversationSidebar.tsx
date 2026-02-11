import { useEffect, useState } from 'react';
import type { Conversation } from '../types';
import { listConversations, deleteConversation } from '../services/api';
import { IconMessageSquare, IconPlus, IconX, IconTrash } from './Icons';

interface ConversationSidebarProps {
    isOpen: boolean;
    activeConversationId: string | null;
    onSelect: (conv: Conversation) => void;
    onNew: () => void;
    onClose: () => void;
    refreshTrigger: number;
    overlay?: boolean;
    onDelete?: (conversationId: string) => void;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z');
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}

export default function ConversationSidebar({
    isOpen,
    activeConversationId,
    onSelect,
    onNew,
    onClose,
    refreshTrigger,
    overlay = false,
    onDelete,
}: ConversationSidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);

    useEffect(() => {
        listConversations()
            .then(setConversations)
            .catch(console.error);
    }, [refreshTrigger]);

    const handleDelete = async (e: React.MouseEvent, convId: string) => {
        e.stopPropagation(); // Don't trigger onSelect
        if (!confirm('Delete this conversation? This cannot be undone.')) return;
        try {
            await deleteConversation(convId);
            setConversations((prev) => prev.filter((c) => c.id !== convId));
            onDelete?.(convId);
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const sidebarClass = overlay
        ? `sidebar sidebar--overlay ${isOpen ? 'sidebar--open' : ''}`
        : `sidebar ${isOpen ? 'sidebar--open' : ''}`;

    const overlayClass = overlay
        ? `sidebar-overlay sidebar-overlay--force ${isOpen ? 'sidebar-overlay--visible' : ''}`
        : `sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`;

    return (
        <>
            <div
                className={overlayClass}
                onClick={onClose}
            />
            <aside className={sidebarClass}>
                <div className="sidebar__header">
                    <div className="sidebar__title">
                        <IconMessageSquare size={16} /> Conversations
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="sidebar__new-btn" onClick={onNew} title="New conversation">
                            <IconPlus size={16} />
                        </button>
                        {overlay && (
                            <button className="sidebar__new-btn" onClick={onClose} title="Close">
                                <IconX size={16} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="sidebar__list">
                    {conversations.length === 0 ? (
                        <div className="sidebar__empty">
                            No conversations yet. Start your first one!
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`sidebar-item ${conv.id === activeConversationId ? 'sidebar-item--active' : ''}`}
                                onClick={() => { onSelect(conv); onClose(); }}
                            >
                                <div className="sidebar-item__row">
                                    <div className="sidebar-item__title">{conv.title}</div>
                                    <button
                                        className="sidebar-item__delete"
                                        onClick={(e) => handleDelete(e, conv.id)}
                                        title="Delete conversation"
                                    >
                                        <IconTrash size={13} />
                                    </button>
                                </div>
                                <div className="sidebar-item__meta">
                                    <span>{conv.message_count} messages</span>
                                    <span>{formatDate(conv.updated_at)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>
        </>
    );
}
