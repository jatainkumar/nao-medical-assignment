import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { IconMic, IconX, IconSquareStop, IconSend } from './Icons';

interface AudioRecorderProps {
    onSend: (blob: Blob) => void;
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioRecorder({ onSend }: AudioRecorderProps) {
    const { isRecording, audioBlob, startRecording, stopRecording, clearRecording, recordingDuration } =
        useAudioRecorder();

    const handleSend = () => {
        if (audioBlob) {
            onSend(audioBlob);
            clearRecording();
        }
    };

    if (isRecording) {
        return (
            <div className="recording-indicator">
                <div className="recording-dot" />
                <span className="recording-text">Recording...</span>
                <span className="recording-time">{formatDuration(recordingDuration)}</span>
                <div className="recording-actions">
                    <button className="recording-cancel" onClick={() => { stopRecording(); clearRecording(); }}>
                        <IconX size={14} /> Cancel
                    </button>
                    <button className="recording-send" onClick={stopRecording}>
                        <IconSquareStop size={14} /> Stop
                    </button>
                </div>
            </div>
        );
    }

    if (audioBlob) {
        return (
            <div className="recording-indicator">
                <audio controls src={URL.createObjectURL(audioBlob)} style={{ height: 32, flex: 1 }} />
                <div className="recording-actions">
                    <button className="recording-cancel" onClick={clearRecording}>
                        <IconX size={14} /> Discard
                    </button>
                    <button className="recording-send" onClick={handleSend}>
                        <IconSend size={14} /> Send
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            className="chat-input__mic"
            onClick={startRecording}
            title="Record audio message"
        >
            <IconMic size={20} />
        </button>
    );
}
