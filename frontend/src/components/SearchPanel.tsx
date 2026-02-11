import { useState, useRef, useEffect } from 'react';
import type { SearchResult } from '../types';
import { searchConversations } from '../services/api';
import { IconSearch, IconX, IconClipboard, IconUserDoctor, IconUserPatient } from './Icons';

interface SearchPanelProps {
    onClose: () => void;
    onNavigate: (conversationId: string) => void;
}

function highlightMatch(text: string, query: string) {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
            ? <mark key={i}>{part}</mark>
            : part
    );
}

export default function SearchPanel({ onClose, onNavigate }: SearchPanelProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const doSearch = (q: string) => {
        if (q.trim().length < 2) {
            setResults([]);
            setSearched(false);
            return;
        }
        setLoading(true);
        setSearched(true);
        searchConversations(q.trim())
            .then(setResults)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleChange = (val: string) => {
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(val), 400);
    };

    return (
        <div className="search-overlay" onClick={onClose}>
            <div className="search-panel" onClick={(e) => e.stopPropagation()}>
                <div className="search-panel__header">
                    <span className="search-panel__header-icon"><IconSearch size={18} /></span>
                    <input
                        ref={inputRef}
                        className="search-panel__input"
                        placeholder="Search conversations..."
                        value={query}
                        onChange={(e) => handleChange(e.target.value)}
                    />
                    <button className="search-panel__close" onClick={onClose}>
                        <IconX size={18} />
                    </button>
                </div>

                <div className="search-results">
                    {loading && (
                        <div className="search-empty">
                            <div className="spinner" style={{ margin: '0 auto' }} />
                        </div>
                    )}

                    {!loading && searched && results.length === 0 && (
                        <div className="search-empty">
                            No results found for "{query}"
                        </div>
                    )}

                    {!loading && results.map((result) => (
                        <div
                            key={result.message_id}
                            className="search-result"
                            onClick={() => onNavigate(result.conversation_id)}
                        >
                            <div className="search-result__conversation">
                                <IconClipboard size={11} /> {result.conversation_title}
                            </div>
                            <div className="search-result__text">
                                <strong>
                                    {result.role === 'doctor'
                                        ? <><IconUserDoctor size={12} /> Doctor</>
                                        : <><IconUserPatient size={12} /> Patient</>
                                    }:
                                </strong>{' '}
                                {highlightMatch(result.original_text, query)}
                            </div>
                            {result.translated_text && (
                                <div className="search-result__context">
                                    Translation: {highlightMatch(result.translated_text, query)}
                                </div>
                            )}
                            {result.context_before && (
                                <div className="search-result__context">
                                    {result.context_before.slice(0, 80)}...
                                </div>
                            )}
                            <div className="search-result__meta">
                                <span>{new Date(result.timestamp).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}

                    {!searched && !loading && (
                        <div className="search-empty">
                            Type at least 2 characters to search across all conversations
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
