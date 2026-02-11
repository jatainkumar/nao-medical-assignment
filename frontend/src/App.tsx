import { useState, useCallback } from 'react';
import type { Conversation } from './types';
import { createConversation } from './services/api';
import RoleSelection from './components/RoleSelection';
import ChatView from './components/ChatView';
import ConversationSidebar from './components/ConversationSidebar';
import './index.css';

type View = 'language-select' | 'chat';

export default function App() {
  const [view, setView] = useState<View>('language-select');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleStart = useCallback(async (doctorLang: string, patientLang: string) => {
    try {
      const conv = await createConversation(doctorLang, patientLang);
      setConversation(conv);
      setView('chat');
    } catch (err) {
      console.error('Failed to create conversation:', err);
      alert('Failed to connect to server. Make sure the backend is running.');
    }
  }, []);

  const handleViewHistory = useCallback(() => {
    setHistoryOpen(true);
  }, []);

  const handleSwitchConversation = useCallback(async (conv: Conversation) => {
    setConversation(conv);
    setHistoryOpen(false);
    setView('chat');
  }, []);

  const handleNewConversation = useCallback(() => {
    setView('language-select');
    setConversation(null);
    setHistoryOpen(false);
  }, []);

  const handleBack = useCallback(() => {
    setView('language-select');
    setConversation(null);
    setRefreshTrigger((t) => t + 1);
  }, []);

  const handleConversationUpdate = useCallback((updated: Conversation) => {
    setConversation(updated);
  }, []);

  if (view === 'chat' && conversation) {
    return (
      <ChatView
        conversation={conversation}
        onBack={handleBack}
        onSwitchConversation={handleSwitchConversation}
        onNewConversation={handleNewConversation}
        onConversationUpdate={handleConversationUpdate}
      />
    );
  }

  return (
    <div className="app-container">
      <RoleSelection onStart={handleStart} onViewHistory={handleViewHistory} />
      {historyOpen && (
        <ConversationSidebar
          isOpen={true}
          activeConversationId={null}
          onSelect={handleSwitchConversation}
          onNew={handleNewConversation}
          onClose={() => setHistoryOpen(false)}
          refreshTrigger={refreshTrigger}
          overlay={true}
        />
      )}
    </div>
  );
}
