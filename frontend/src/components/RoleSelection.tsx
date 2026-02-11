import { useState } from 'react';
import type { Language } from '../types';
import { LANGUAGES } from '../types';
import { IconHeartPulse, IconHistory } from './Icons';

interface RoleSelectionProps {
    onStart: (doctorLang: string, patientLang: string) => void;
    onViewHistory: () => void;
}

export default function RoleSelection({ onStart, onViewHistory }: RoleSelectionProps) {
    const [doctorLang, setDoctorLang] = useState('en');
    const [patientLang, setPatientLang] = useState('hi');

    const handleStart = () => {
        onStart(doctorLang, patientLang);
    };

    return (
        <div className="role-selection">
            <div className="role-selection__card">
                <div className="role-selection__header">
                    <div className="role-selection__logo">
                        <IconHeartPulse size={36} />
                    </div>
                    <h1 className="role-selection__title">Healthcare Translation</h1>
                    <p className="role-selection__subtitle">
                        AI-powered real-time translation for medical consultations
                    </p>
                </div>

                <div className="role-selection__languages">
                    <div className="language-picker">
                        <label className="language-picker__label">Doctor's Language</label>
                        <select
                            className="language-picker__select"
                            value={doctorLang}
                            onChange={(e) => setDoctorLang(e.target.value)}
                        >
                            {LANGUAGES.map((lang: Language) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="language-picker">
                        <label className="language-picker__label">Patient's Language</label>
                        <select
                            className="language-picker__select"
                            value={patientLang}
                            onChange={(e) => setPatientLang(e.target.value)}
                        >
                            {LANGUAGES.map((lang: Language) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button className="role-selection__start" onClick={handleStart}>
                    Start Conversation
                </button>

                <button className="role-selection__history" onClick={onViewHistory}>
                    <IconHistory size={16} /> View Past Conversations
                </button>
            </div>
        </div>
    );
}
