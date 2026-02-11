import type { Conversation, Message, SearchResult } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`API Error ${res.status}: ${err}`);
    }
    return res.json();
}

// Conversations
export async function createConversation(
    doctorLanguage: string,
    patientLanguage: string,
    title?: string
): Promise<Conversation> {
    return request('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
            title: title || 'New Conversation',
            doctor_language: doctorLanguage,
            patient_language: patientLanguage,
        }),
    });
}

export async function listConversations(): Promise<Conversation[]> {
    return request('/api/conversations');
}

export async function getConversation(id: string): Promise<Conversation> {
    return request(`/api/conversations/${id}`);
}

export async function renameConversation(id: string, title: string): Promise<Conversation> {
    return request(`/api/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
    });
}

export async function deleteConversation(id: string): Promise<void> {
    return request(`/api/conversations/${id}`, { method: 'DELETE' });
}

// Messages
export async function sendMessage(
    conversationId: string,
    role: string,
    text: string,
    audioUrl?: string
): Promise<Message> {
    return request('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
            conversation_id: conversationId,
            role,
            text,
            audio_url: audioUrl || null,
        }),
    });
}

export async function getMessages(conversationId: string): Promise<Message[]> {
    return request(`/api/conversations/${conversationId}/messages`);
}

// Search
export async function searchConversations(query: string): Promise<SearchResult[]> {
    return request(`/api/conversations/search?q=${encodeURIComponent(query)}`);
}

// Summary
export async function generateSummary(
    conversationId: string
): Promise<{ summary: string; message_count: number }> {
    return request(`/api/conversations/${conversationId}/summary`, {
        method: 'POST',
    });
}

// Audio
export async function uploadAudio(blob: Blob): Promise<{ filename: string; url: string }> {
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    const res = await fetch(`${API_BASE}/api/audio/upload`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Audio upload failed');
    return res.json();
}

export function getAudioUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
}

// WebSocket
export function createWebSocket(conversationId: string): WebSocket {
    const wsBase = API_BASE.replace(/^http/, 'ws');
    return new WebSocket(`${wsBase}/ws/${conversationId}`);
}
