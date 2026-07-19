import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWorkspace from './components/ChatWorkspace';
import { ChatSession, Message } from './types';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [selectedTemp, setSelectedTemp] = useState<number>(0.7);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load state from LocalStorage on mount
  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem('elhadi_sessions');
      const storedActiveId = localStorage.getItem('elhadi_active_id');
      const storedModel = localStorage.getItem('elhadi_model');
      const storedTemp = localStorage.getItem('elhadi_temp');

      if (storedModel) setSelectedModel(storedModel);
      if (storedTemp) setSelectedTemp(parseFloat(storedTemp));

      if (storedSessions) {
        const parsed = JSON.parse(storedSessions) as ChatSession[];
        setSessions(parsed);
        if (storedActiveId && parsed.some(s => s.id === storedActiveId)) {
          setActiveSessionId(storedActiveId);
        } else if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        } else {
          // Initialize a clean session if empty
          initDefaultSession();
        }
      } else {
        initDefaultSession();
      }
    } catch (err) {
      console.error('Failed to parse localStorage:', err);
      initDefaultSession();
    }
  }, []);

  // Save changes to LocalStorage whenever sessions or settings update
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('elhadi_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('elhadi_active_id', activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    localStorage.setItem('elhadi_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('elhadi_temp', selectedTemp.toString());
  }, [selectedTemp]);

  const initDefaultSession = () => {
    const newId = Date.now().toString();
    const defaultSession: ChatSession = {
      id: newId,
      title: 'Percakapan Baru',
      messages: [],
      model: 'gemini-3.5-flash',
      temperature: 0.7,
      createdAt: new Date().toISOString()
    };
    setSessions([defaultSession]);
    setActiveSessionId(newId);
  };

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'Percakapan Baru',
      messages: [],
      model: selectedModel,
      temperature: selectedTemp,
      createdAt: new Date().toISOString()
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    const session = sessions.find(s => s.id === id);
    if (session) {
      setSelectedModel(session.model);
      setSelectedTemp(session.temperature);
    }
  };

  const handleDeleteSession = (id: string) => {
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    
    if (filtered.length === 0) {
      // Re-initialize if all deleted
      const newId = Date.now().toString();
      const defaultSession: ChatSession = {
        id: newId,
        title: 'Percakapan Baru',
        messages: [],
        model: selectedModel,
        temperature: selectedTemp,
        createdAt: new Date().toISOString()
      };
      setSessions([defaultSession]);
      setActiveSessionId(newId);
    } else if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleClearSession = () => {
    setSessions((prev) => 
      prev.map((s) => s.id === activeSessionId ? { ...s, messages: [], title: 'Percakapan Baru' } : s)
    );
  };

  const handleSendMessage = async (
    text: string, 
    imageBase64: string | null = null, 
    imageMimeType: string | null = null
  ) => {
    if (!text && !imageBase64) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text,
      imageSrc: imageBase64 ? `data:${imageMimeType};base64,${imageBase64}` : null,
      timestamp: new Date().toISOString()
    };

    // Update active session locally
    let currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;

    const updatedMessages = [...currentSession.messages, userMessage];
    
    // Set first message as the title if it was named "Percakapan Baru"
    let newTitle = currentSession.title;
    if (currentSession.title === 'Percakapan Baru' && text) {
      newTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
    }

    setSessions((prev) => 
      prev.map((s) => 
        s.id === activeSessionId 
          ? { ...s, messages: updatedMessages, title: newTitle, model: selectedModel, temperature: selectedTemp } 
          : s
      )
    );

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          imageBase64: imageBase64,
          imageMimeType: imageMimeType,
          model: selectedModel,
          temperature: selectedTemp
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: data.text,
          timestamp: new Date().toISOString()
        };

        setSessions((prev) => 
          prev.map((s) => 
            s.id === activeSessionId 
              ? { ...s, messages: [...updatedMessages, assistantMessage] } 
              : s
          )
        );
      } else {
        throw new Error(data.error || 'Terjadi kesalahan internal pada sistem AI.');
      }
    } catch (error: any) {
      console.error('Failed to communicate with AI server:', error);
      
      const errorMessage: Message = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        text: `**Gagal terhubung dengan server AI.**\n\nDetail Kesalahan: *${error.message}*\n\nSilakan pastikan bahwa:\n1. Kunci API **GEMINI_API_KEY** telah terkonfigurasi dengan benar di panel **Settings > Secrets**.\n2. Koneksi internet Anda stabil.\n3. Server Anda tidak sedang mengalami gangguan.`,
        timestamp: new Date().toISOString()
      };

      setSessions((prev) => 
        prev.map((s) => 
          s.id === activeSessionId 
            ? { ...s, messages: [...updatedMessages, errorMessage] } 
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (promptText: string) => {
    handleSendMessage(promptText);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || { messages: [], model: selectedModel };

  return (
    <div id="app-root-container" className="flex h-screen overflow-hidden bg-[#171719] text-gray-100">
      {/* LEFT RAIL: SIDEBAR */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        selectedModel={selectedModel}
        onChangeModel={setSelectedModel}
        selectedTemp={selectedTemp}
        onChangeTemp={setSelectedTemp}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* RIGHT WORKSPACE: CHAT AREA */}
      <main className="flex-1 flex flex-col relative h-full min-w-0">
        <ChatWorkspace
          messages={activeSession.messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onClearSession={handleClearSession}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeModel={selectedModel}
          onQuickAction={handleQuickAction}
        />
      </main>
    </div>
  );
}
