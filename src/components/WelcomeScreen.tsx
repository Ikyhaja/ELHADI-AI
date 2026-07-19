import React from 'react';
import { Bot, Lightbulb, Code, BookOpen, Mail } from 'lucide-react';

interface WelcomeScreenProps {
  onQuickAction: (prompt: string) => void;
}

interface TemplatePrompt {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  promptText: string;
}

export default function WelcomeScreen({ onQuickAction }: WelcomeScreenProps) {
  const templates: TemplatePrompt[] = [
    {
      id: 'proker',
      icon: <Lightbulb className="text-yellow-400" size={18} />,
      label: 'Proker Organisasi',
      description: 'Ide kreatif & inovatif untuk proker organisasi mahasiswa.',
      promptText: 'Tolong buatkan draf rancangan Program Kerja (Proker) yang kreatif, inovatif, dan relevan dengan perkembangan teknologi masa kini untuk organisasi kemahasiswaan.'
    },
    {
      id: 'tugas',
      icon: <Code className="text-blue-400" size={18} />,
      label: 'Tugas Kuliah & Coding',
      description: 'Bantu rancang makalah atau perbaiki kode program.',
      promptText: 'Buatkan contoh makalah ilmiah terstruktur mengenai penerapan kecerdasan buatan dalam memecahkan masalah kemacetan lalu lintas perkotaan.'
    },
    {
      id: 'quantum',
      icon: <BookOpen className="text-purple-400" size={18} />,
      label: 'Konsep Sains & Fisika',
      description: 'Penjelasan topik kompleks dengan analogi mudah.',
      promptText: 'Jelaskan konsep Fisika Kuantum secara sederhana dan mudah dipahami oleh orang awam menggunakan analogi sehari-hari.'
    },
    {
      id: 'email',
      icon: <Mail className="text-emerald-400" size={18} />,
      label: 'Email & Tulisan Formal',
      description: 'Draf korespondensi resmi atau pengajuan izin.',
      promptText: 'Tuliskan draf email formal dalam bahasa Indonesia yang sopan untuk mengajukan permohonan magang (internship) di perusahaan teknologi multinasional.'
    }
  ];

  const getHourGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div id="welcome-panel" className="h-full flex flex-col items-center justify-center text-center px-4 max-w-3xl mx-auto my-12 md:my-16">
      {/* Decorative Rotating Robot Container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full animate-pulse-slow"></div>
        <div className="w-20 h-20 bg-white text-black rounded-3xl flex items-center justify-center shadow-2xl relative rotate-3 animate-float">
          <Bot size={40} className="text-gray-900" />
        </div>
      </div>

      {/* Heading Group */}
      <div className="mb-10">
        <h2 id="welcome-greeting" className="text-2xl md:text-4xl font-bold font-display mb-2 text-white tracking-tight">
          {getHourGreeting()}, Elhadi!
        </h2>
        <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto">
          Apa yang bisa saya bantu untuk proyek, tugas kuliah, atau ide kreatif Anda hari ini?
        </p>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
        {templates.map((tmpl) => (
          <button
            key={tmpl.id}
            id={`btn-template-${tmpl.id}`}
            onClick={() => onQuickAction(tmpl.promptText)}
            className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-indigo-500/20 text-left transition-all duration-200 cursor-pointer shadow-sm hover:shadow-indigo-500/5 group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/5 rounded-xl group-hover:bg-indigo-500/10 transition-colors">
                {tmpl.icon}
              </div>
              <h3 className="font-semibold text-sm text-white group-hover:text-indigo-300 transition-colors">
                {tmpl.label}
              </h3>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">
              {tmpl.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
