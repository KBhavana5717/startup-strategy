import React, { useState } from 'react';
import { Rocket, Send, Sparkles, Brain, Cpu, MessageSquare, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleGenerate = async () => {
    if (!input) return;
    setLoading(true);
    setResult(null);

    // Try both localhost and 127.0.0.1 for Windows compatibility
    const endpoints = ["http://127.0.0.1:8000", "http://localhost:8000"];
    let success = false;

    for (let base of endpoints) {
      try {
        const response = await fetch(`${base}/generate-strategy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ niche: input })
        });
        if (response.ok) {
          const data = await response.json();
          setResult(data);
          success = true;
          break;
        }
      } catch (err) {
        console.log(`Failed connecting to ${base}`);
      }
    }

    if (!success) {
      alert("Backend Not Responding. Please ensure main.py is running!");
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-[#030014] text-slate-200 overflow-x-hidden">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <nav className="flex justify-between items-center mb-24">
          <div className="flex items-center gap-3 font-bold text-2xl tracking-tighter uppercase text-white">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20"><Rocket size={24} /></div>
            Startup Strategy AI
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center mb-24">
          <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="text-7xl font-black mb-8 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent leading-tight">Design your empire.</motion.h1>
          <div className="relative w-full max-w-3xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative flex bg-[#0a0a16] border border-white/10 rounded-[2rem] p-2">
              <input value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerate()} className="flex-1 bg-transparent py-5 px-8 text-xl outline-none placeholder:text-slate-600 text-white" placeholder="e.g. A space-tech startup in Hyderabad..."/>
              <button onClick={handleGenerate} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-10 rounded-2xl font-bold flex items-center gap-2 transition-all disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" /> : "Generate"}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{opacity:0, y:40}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card icon={<Sparkles className="text-emerald-400"/>} title="Roadmap" text={result.strategy} />
              <Card icon={<Brain className="text-blue-400"/>} title="Analysis" text={result.analysis} />
              <Card icon={<Cpu className="text-purple-400"/>} title="Tech Stack" text={result.tech_stack} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const Card = ({ icon, title, text }) => (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/10 transition-all">
    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 border border-white/5">{icon}</div>
    <h3 className="font-bold text-xl text-white mb-4">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm whitespace-pre-line">{text}</p>
  </div>
);