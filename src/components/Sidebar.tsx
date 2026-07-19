import React from 'react';
import { Plus, Bot, Sliders, MessageSquare, Trash2, Laptop, User, LogOut } from 'lucide-react';
import { ChatSession, ModelOption, CreativityOption } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  selectedModel: string;
  onChangeModel: (model: string) => void;
  selectedTemp: number;
  onChangeTemp: (temp: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MODELS: ModelOption[] = [
  { value: 'gemini-3.5-flash', label: '🚀 Fast Mode', description: 'Flash - Cepat & Ringkas' },
  { value: 'gemini-3.1-pro-preview', label: '🧠 Reasoning Mode', description: 'Pro - Detail & Coding' }
];

const CREATIVITY_OPTIONS: CreativityOption[] = [
  { value: 0.2, label: '🎯 Presisi & Akurat', description: 'Formal, ilmiah, pasti' },
  { value: 0.7, label: '🤖 Standar Balanced', description: 'Seimbang, luwes, umum' },
  { value: 1.2, label: '✨ Mode Kreatif', description: 'Imajinatif & puitis' }
];

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  selectedModel,
  onChangeModel,
  selectedTemp,
  onChangeTemp,
  isOpen,
  onClose
}: SidebarProps) {
  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          id="sidebar-overlay"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      <aside 
        id="app-sidebar"
        className={`w-76 bg-[#121214] h-full flex flex-col p-4 border-r border-white/5 fixed lg:relative top-0 left-0 z-50 transition-transform duration-300 transform lg:transform-none lg:flex ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* New Chat Button */}
        <button 
          id="btn-new-chat"
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="flex items-center justify-center gap-3 w-full px-4 py-3.5 text-sm font-medium border border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/[0.08] hover:border-indigo-500/30 text-white transition-all duration-200 shadow-sm hover:shadow-indigo-500/5 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200 text-indigo-400" />
          <span>Chat Baru</span>
        </button>

        {/* Panel Model Selection */}
        <div className="mt-5 bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
              <Bot size={12} className="text-indigo-400" />
              <span>Mode Berpikir AI</span>
            </div>
            <select 
              id="select-model"
              value={selectedModel}
              onChange={(e) => onChangeModel(e.target.value)}
              className="w-full bg-[#1b1b1e] text-xs text-white border border-white/10 rounded-xl p-3 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer transition-all"
            >
              {MODELS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.description.split(' - ')[0]})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
              <Sliders size={12} className="text-indigo-400" />
              <span>Gaya Respons (Temp)</span>
            </div>
            <select 
              id="select-creativity"
              value={selectedTemp}
              onChange={(e) => onChangeTemp(parseFloat(e.target.value))}
              className="w-full bg-[#1b1b1e] text-xs text-white border border-white/10 rounded-xl p-3 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer transition-all"
            >
              {CREATIVITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="text-[10px] text-gray-500 mt-1.5 pl-1 italic">
              {CREATIVITY_OPTIONS.find(o => o.value === selectedTemp)?.description}
            </div>
          </div>
        </div>

        {/* Chat History Section */}
        <div className="flex-1 overflow-y-auto mt-6 space-y-1 pr-1">
          <div className="text-[10px] text-gray-400 font-bold px-3 mb-3 uppercase tracking-widest">
            Riwayat Percakapan
          </div>
          
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500 italic">
              Belum ada percakapan
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  id={`session-item-${session.id}`}
                  className={`flex items-center justify-between group rounded-xl px-3 py-2.5 text-xs transition-all duration-150 cursor-pointer ${
                    session.id === activeSessionId 
                      ? 'bg-indigo-600/10 text-white border border-indigo-500/15' 
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <div 
                    onClick={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 flex-1 min-w-0"
                  >
                    <MessageSquare size={14} className={session.id === activeSessionId ? 'text-indigo-400' : 'text-gray-500'} />
                    <span className="truncate pr-1 font-medium">{session.title}</span>
                  </div>
                  
                  <button 
                    id={`btn-delete-session-${session.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 rounded transition-opacity text-gray-500"
                    title="Hapus percakapan"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center justify-between p-3 hover:bg-white/[0.02] rounded-2xl transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/10 text-sm">
                E
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-200">Elhadi User</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <Laptop size={14} className="text-gray-500" />
          </div>
        </div>
      </aside>
    </>
  );
}
