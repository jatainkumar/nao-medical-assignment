import { useState, useEffect, type ReactNode } from 'react';
import { generateSummary } from '../services/api';
import { IconClipboard, IconX } from './Icons';

interface SummaryPanelProps {
    conversationId: string;
    onClose: () => void;
}

function renderMarkdown(text: string): ReactNode[] {
    const lines = text.split('\n');
    const elements: ReactNode[] = [];

    lines.forEach((line, i) => {
        if (line.startsWith('## ')) {
            elements.push(<h2 key={i}>{line.slice(3)}</h2>);
        } else if (line.startsWith('- ')) {
            elements.push(<li key={i}>{renderBold(line.slice(2))}</li>);
        } else if (line.trim() === '') {
            elements.push(<br key={i} />);
        } else {
            elements.push(<p key={i} style={{ margin: '4px 0' }}>{renderBold(line)}</p>);
        }
    });

    return elements;
}

function renderBold(text: string) {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
}

export default function SummaryPanel({ conversationId, onClose }: SummaryPanelProps) {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        generateSummary(conversationId)
            .then((data) => {
                setSummary(data.summary);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || 'Failed to generate summary');
                setLoading(false);
            });
    }, [conversationId]);

    return (
        <div className="summary-overlay" onClick={onClose}>
            <div className="summary-panel" onClick={(e) => e.stopPropagation()}>
                <div className="summary-panel__header">
                    <div className="summary-panel__title">
                        <IconClipboard size={18} /> AI Medical Summary
                    </div>
                    <button className="summary-panel__close" onClick={onClose}>
                        <IconX size={18} />
                    </button>
                </div>

                <div className="summary-panel__body">
                    {loading && (
                        <div className="summary-loading">
                            <div className="spinner" />
                            <span>Analyzing conversation and generating medical summary...</span>
                        </div>
                    )}

                    {error && (
                        <div className="summary-loading">
                            <span style={{ color: 'var(--error)' }}>{error}</span>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="summary-content">
                            {renderMarkdown(summary)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
