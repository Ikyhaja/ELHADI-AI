import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, Trash2, ShieldAlert, Bot, User, Volume2, VolumeX, Copy, 
  Check, Paperclip, Mic, MicOff, Send, X, AlertCircle, Sparkles, Sliders 
} from 'lucide-react';
import { Message } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import WelcomeScreen from './WelcomeScreen';

interface ChatWorkspaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, imageBase64: string | null, imageMimeType: string | null) => void;
  onClearSession: () => void;
  onToggleSidebar: () => void;
  activeModel: string;
  onQuickAction: (prompt: string) => void;
}

export default function ChatWorkspace({
  messages,
  isLoading,
  onSendMessage,
  onClearSession,
  onToggleSidebar,
  activeModel,
  onQuickAction
}: ChatWorkspaceProps) {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; previewUrl: string; name: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micUnsupported, setMicUnsupported] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle textarea height auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  // Initialize Speech Recognition (Speech to Text)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'id-ID';
      rec.interimResults = false;
      rec.continuous = false;

      rec.onresult = (event: any) => {
        const textResult = event.results[0][0].transcript;
        if (textResult) {
          setInputText((prev) => (prev ? prev + ' ' + textResult : textResult));
        }
        setIsListening(false);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setMicUnsupported(true);
    }

    return () => {
      // Cancel speech if speaking on unmount
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleMicToggle = () => {
    if (micUnsupported) {
      alert("Browser Anda tidak mendukung Web Speech Recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        // Cancel speech if speaking
        window.speechSynthesis.cancel();
        setSpeakingId(null);

        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start Speech Recognition:", err);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      const previewUrl = URL.createObjectURL(file);
      
      setSelectedImage({
        base64: base64Data,
        mimeType: file.type,
        previewUrl: previewUrl,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text && !selectedImage) return;

    // Send to parents
    onSendMessage(
      text,
      selectedImage ? selectedImage.base64 : null,
      selectedImage ? selectedImage.mimeType : null
    );

    // Reset local inputs
    setInputText('');
    handleRemoveImage();
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSpeakText = (id: string, text: string) => {
    if (!window.speechSynthesis) {
      alert("Browser Anda tidak mendukung Text-to-Speech.");
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop active speaker

    // Clean text from markdown notations for smoother speech
    const cleanSpeechText = text
      .replace(/[\*\_`#\-]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\|/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = 'id-ID';
    utterance.rate = 1.0;

    utterance.onstart = () => {
      setSpeakingId(id);
    };

    utterance.onend = () => {
      setSpeakingId(null);
    };

    utterance.onerror = () => {
      setSpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const getModelLabel = () => {
    return activeModel === 'gemini-3.1-pro-preview' ? 'Reasoning Pro' : 'Fast Flash';
  };

  return (
    <div id="chat-workspace" className="flex-1 flex flex-col relative h-full bg-[#171719]">
      {/* Workspace Header */}
      <header className="flex items-center justify-between p-4 glass-panel border-b border-white/5 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            id="btn-sidebar-toggle"
            onClick={onToggleSidebar} 
            className="lg:hidden text-gray-400 p-2 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            title="Buka Menu"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg md:text-xl tracking-tight font-display text-white">
              ELHADI <span className="text-indigo-500">AI</span>
            </h1>
            <span className="hidden sm:inline bg-indigo-500/10 text-indigo-400 text-[9px] px-2.5 py-1 rounded-full font-bold border border-indigo-500/20 uppercase tracking-wider">
              {getModelLabel()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-400">
          <button 
            id="btn-clear-chat-screen"
            onClick={onClearSession}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 disabled:opacity-30 disabled:hover:text-gray-400 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
            title="Kosongkan Obrolan"
          >
            <Trash2 size={14} />
            <span className="hidden md:inline font-medium">Kosongkan Obrolan</span>
          </button>
        </div>
      </header>

      {/* Message List area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-16 lg:px-28 space-y-8 pb-36">
        {messages.length === 0 ? (
          <WelcomeScreen onQuickAction={onQuickAction} />
        ) : (
          <div className="space-y-8">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                id={`message-row-${msg.id}`}
                className={`flex gap-4 items-start ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar Icon */}
                <div 
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white shadow-indigo-600/10' 
                      : 'bg-white text-black'
                  }`}
                >
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Message Bubble */}
                <div 
                  className={`flex flex-col max-w-[85%] md:max-w-[75%] ${
                    msg.role === 'user' ? 'items-end' : 'items-start flex-1'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="text-[10px] font-bold text-indigo-400 mb-1.5 uppercase tracking-wider font-display flex items-center gap-1.5">
                      <Sparkles size={10} />
                      <span>ELHADI AI System</span>
                    </div>
                  )}

                  <div 
                    className={`rounded-2xl px-5 py-3.5 text-sm md:text-base ${
                      msg.role === 'user'
                        ? 'bg-indigo-600/15 border border-indigo-500/20 text-gray-100 rounded-tr-none'
                        : 'text-gray-200 leading-relaxed rounded-tl-none w-full'
                    }`}
                  >
                    {/* User attached image rendering */}
                    {msg.imageSrc && (
                      <div className="mb-3 max-w-sm rounded-xl overflow-hidden border border-white/10 shadow-md">
                        <img 
                          src={msg.imageSrc} 
                          alt="Lampiran pengguna" 
                          className="max-h-64 object-contain rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Rendering text */}
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <MarkdownRenderer content={msg.text} />
                    )}

                    {/* Controls panel for assistant messages */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5 text-[11px] text-gray-400">
                        <button 
                          id={`btn-speak-${msg.id}`}
                          onClick={() => handleSpeakText(msg.id, msg.text)}
                          className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                          title="Ucapkan teks"
                        >
                          {speakingId === msg.id ? (
                            <>
                              <VolumeX size={14} className="text-red-400 animate-pulse" />
                              <span className="text-red-400">Hentikan Suara</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={14} />
                              <span>Ucapkan</span>
                            </>
                          )}
                        </button>
                        
                        <button 
                          id={`btn-copy-${msg.id}`}
                          onClick={() => copyToClipboard(msg.id, msg.text)}
                          className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                          title="Salin ke clipboard"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check size={14} className="text-green-400" />
                              <span className="text-green-400 font-semibold">Disalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Salin Respon</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div id="typing-bubble" className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-white text-black rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot size={16} />
                </div>
                <div className="flex gap-1.5 p-3 bg-white/[0.02] border border-white/5 rounded-2xl rounded-tl-none">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full typing-dot"></div>
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full typing-dot"></div>
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full typing-dot"></div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:px-16 lg:px-28 bg-gradient-to-t from-[#171719] via-[#171719] to-transparent">
        <div className="max-w-4xl mx-auto relative">
          
          {/* File input */}
          <input 
            type="file" 
            ref={fileInputRef}
            id="file-uploader"
            accept="image/png, image/jpeg, image/jpg, image/webp" 
            className="hidden" 
            onChange={handleImageSelect}
          />

          {/* Selected Image Preview Panel */}
          {selectedImage && (
            <div id="image-upload-preview-card" className="mb-3 p-2 bg-[#1b1b1e] border border-white/10 rounded-2xl flex items-center gap-3 w-max max-w-full shadow-xl">
              <div className="relative w-14 h-14 bg-black/40 rounded-xl overflow-hidden border border-white/5">
                <img 
                  src={selectedImage.previewUrl} 
                  alt="Review upload" 
                  className="w-full h-full object-cover"
                />
                <button 
                  id="btn-remove-preview-image"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 bg-black/80 hover:bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                  title="Hapus lampiran"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="pr-2">
                <span className="text-xs text-gray-300 block font-medium truncate max-w-[150px]">
                  {selectedImage.name}
                </span>
                <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">
                  {selectedImage.mimeType.split('/')[1]}
                </span>
              </div>
            </div>
          )}

          {/* Form wrapper */}
          <div className="relative flex items-end">
            {/* Attach File Button */}
            <button 
              id="btn-attach-image"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 bottom-3 w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 flex items-center justify-center hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
              title="Unggah Gambar (JPEG/PNG/WEBP)"
            >
              <Paperclip size={16} />
            </button>

            {/* Large Text Area */}
            <textarea 
              id="txt-user-chat-input"
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#1e1e21] text-gray-100 border border-white/10 rounded-2xl py-5 pl-15 pr-26 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none resize-none transition-all shadow-2xl text-sm leading-relaxed"
              placeholder={isListening ? "Mendengarkan suara Anda..." : "Tulis pesan, upload gambar, atau bicara..."}
              disabled={isListening}
            />
            
            {/* Right Buttons group */}
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              {/* Mic Speech Button */}
              <button 
                id="btn-speech-to-text"
                onClick={handleMicToggle}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isListening 
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                    : 'bg-white/[0.03] border-white/5 text-gray-300 hover:bg-white/[0.08] hover:text-white'
                }`}
                title={isListening ? "Hentikan perekaman" : "Gunakan Perekam Suara"}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {/* Submit Send Button */}
              <button 
                id="btn-submit-chat"
                onClick={handleSend}
                disabled={(!inputText.trim() && !selectedImage) || isLoading || isListening}
                className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-indigo-500 active:scale-95 transition-all shadow-lg disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                title="Kirim pesan"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          <p className="text-[9px] text-center text-gray-600 mt-3 uppercase tracking-widest font-semibold font-display opacity-80 select-none">
            Sistem Kecerdasan Buatan Terintegrasi © 2026 ELHADI by ikysaputra. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
