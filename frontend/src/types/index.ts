export interface Conversation {
    id: string;
    title: string;
    doctor_language: string;
    patient_language: string;
    created_at: string;
    updated_at: string;
    message_count: number;
}

export interface Message {
    id: string;
    conversation_id: string;
    role: 'doctor' | 'patient';
    original_text: string;
    translated_text: string;
    original_language: string;
    translated_language: string;
    audio_url: string | null;
    translated_audio_url: string | null;
    timestamp: string;
}

export interface SearchResult {
    conversation_id: string;
    conversation_title: string;
    message_id: string;
    role: string;
    original_text: string;
    translated_text: string;
    timestamp: string;
    context_before: string;
    context_after: string;
}

export type Role = 'doctor' | 'patient';

export interface Language {
    code: string;
    name: string;
    flag: string;
}

export const LANGUAGES: Language[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
    { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
];
