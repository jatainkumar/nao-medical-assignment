import { useState, useCallback } from 'react';
import type { Message } from '../types';
import { getAudioUrl } from '../services/api';
import { IconUserDoctor, IconUserPatient, IconMic } from './Icons';

interface MessageBubbleProps {
    message: Message;
    searchQuery?: string;
}

function highlightText(text: string, query?: string) {
    if (!query || !query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
            ? <mark key={i}>{part}</mark>
            : part
    );
}

function formatTime(timestamp: string): string {
    const d = new Date(timestamp.endsWith('Z') || timestamp.includes('+') ? timestamp : timestamp + 'Z');
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Language code to BCP-47 speech synthesis locale
const LANG_TO_LOCALE: Record<string, string> = {
    en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE',
    zh: 'zh-CN', hi: 'hi-IN', ar: 'ar-SA', pt: 'pt-BR',
    ru: 'ru-RU', ja: 'ja-JP', ko: 'ko-KR', it: 'it-IT',
    tr: 'tr-TR', vi: 'vi-VN', th: 'th-TH', bn: 'bn-IN',
    ta: 'ta-IN', te: 'te-IN', ur: 'ur-PK', sw: 'sw-KE',
};

function SpeakButton({ text, lang }: { text: string; lang: string }) {
    const [speaking, setSpeaking] = useState(false);

    const handleSpeak = useCallback(() => {
        if (!('speechSynthesis' in window)) return;

        if (speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = LANG_TO_LOCALE[lang] || lang;
        utterance.rate = 0.9;
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        setSpeaking(true);
    }, [text, lang, speaking]);

    if (!('speechSynthesis' in window)) return null;

    return (
        <button
            className={`speak-btn ${speaking ? 'speak-btn--active' : ''}`}
            onClick={handleSpeak}
            title={speaking ? 'Stop speaking' : 'Listen'}
        >
            {speaking ? (
                <>■ Stop</>
            ) : (
                <>🔊 Listen</>
            )}
        </button>
    );
}

export default function MessageBubble({ message, searchQuery }: MessageBubbleProps) {
    const isDoctor = message.role === 'doctor';

    return (
        <div className={`message-bubble message-bubble--${message.role}`}>
            <div className="message-bubble__wrapper">
                <div className="message-bubble__role">
                    {isDoctor ? <><IconUserDoctor size={13} /> Doctor</> : <><IconUserPatient size={13} /> Patient</>}
                </div>

                {/* Original audio (recorded by sender) */}
                {message.audio_url && (
                    <div className="message-bubble__audio">
                        <div className="message-bubble__audio-label">
                            <IconMic size={12} /> Original audio
                        </div>
                        <audio controls preload="metadata" src={getAudioUrl(message.audio_url)} />
                    </div>
                )}

                <div className="message-bubble__original">
                    {highlightText(message.original_text, searchQuery)}
                </div>

                {message.translated_text && message.original_language !== message.translated_language && (
                    <div className="message-bubble__translated">
                        <div className="message-bubble__translated-label">
                            Translated ({message.translated_language.toUpperCase()})
                        </div>
                        {highlightText(message.translated_text, searchQuery)}

                        {/* TTS: server-generated audio if available, otherwise browser TTS button */}
                        {message.translated_audio_url ? (
                            <div className="message-bubble__audio" style={{ marginTop: 6 }}>
                                <div className="message-bubble__audio-label">
                                    <IconMic size={12} /> Listen to translation
                                </div>
                                <audio controls preload="metadata" src={getAudioUrl(message.translated_audio_url)} />
                            </div>
                        ) : (
                            <div style={{ marginTop: 6 }}>
                                <SpeakButton text={message.translated_text} lang={message.translated_language} />
                            </div>
                        )}
                    </div>
                )}

                <div className="message-bubble__time">{formatTime(message.timestamp)}</div>
            </div>
        </div>
    );
}
