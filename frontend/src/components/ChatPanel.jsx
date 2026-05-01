import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Map, Zap, Clock, Footprints, Navigation } from 'lucide-react';
import LocationInput from './LocationInput';
import { fetchLocations, navigateCampus } from '../services/api';

export default function ChatPanel({ onRouteFound }) {
  const [locations, setLocations] = useState([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [mode, setMode] = useState('auto'); // auto, walking, golfcart
  
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Sat Sri Akal! 🙏 Main CampusBot hoon. LPU mein kahan jana hai batao?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch available locations on mount
    fetchLocations().then(data => {
      if (data && data.locations) {
        setLocations(data.locations);
      }
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleNavigate = async (e) => {
    e.preventDefault();
    if (!start || !end) return;

    // Add user message
    const userMsg = `${start} se ${end} jana hai.`;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    
    setIsLoading(true);

    try {
      const result = await navigateCampus(start, end, mode);
      
      // Update Map
      onRouteFound(result);

      // Format AI Response
      const botResponse = result.ai_directions;
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: botResponse,
        stats: {
          distance: result.total_distance_m,
          time: result.estimated_walk_minutes,
          mode: result.mode_suggested
        }
      }]);

    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `Arre yaar, error aa gaya: ${err.message}. Try again!` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-navy-900/40 backdrop-blur-xl border-r border-white/5 shadow-[20px_0_40px_-10px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-navy-950/50 flex items-center justify-between z-10 relative">
        <div>
          <h1 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-saffron-400 to-saffron-600">
            LPU Navigator
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">Campus Navigation AI</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-saffron-500/10 flex items-center justify-center border border-saffron-500/20">
          <Bot size={20} className="text-saffron-500" />
        </div>
      </div>

      {/* Input Form */}
      <div className="p-6 bg-navy-900/30 border-b border-white/5 relative z-20">
        <form onSubmit={handleNavigate} className="space-y-4">
          <LocationInput 
            label="From" 
            placeholder="e.g. Main Gate"
            locations={locations}
            value={start}
            onChange={setStart}
          />
          
          <LocationInput 
            label="To" 
            placeholder="e.g. Block 32"
            locations={locations}
            value={end}
            onChange={setEnd}
            icon={Map}
          />

          <div className="flex gap-2 pt-2">
            <button 
              type="button"
              onClick={() => setMode('auto')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${mode === 'auto' ? 'bg-saffron-500/20 border-saffron-500/50 text-saffron-400' : 'bg-navy-800/50 border-white/5 text-gray-400 hover:bg-white/5'}`}
            >
              Auto
            </button>
            <button 
              type="button"
              onClick={() => setMode('walking')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${mode === 'walking' ? 'bg-saffron-500/20 border-saffron-500/50 text-saffron-400' : 'bg-navy-800/50 border-white/5 text-gray-400 hover:bg-white/5'}`}
            >
              Walking
            </button>
            <button 
              type="button"
              onClick={() => setMode('golfcart')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${mode === 'golfcart' ? 'bg-saffron-500/20 border-saffron-500/50 text-saffron-400' : 'bg-navy-800/50 border-white/5 text-gray-400 hover:bg-white/5'}`}
            >
              Golfcart
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !start || !end}
            className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Navigation size={18} />
                <span>Find Route</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10 bg-navy-950/20">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
            
            {msg.role === 'assistant' && (
              <div className="flex items-center gap-2 mb-2 ml-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Bot size={12} className="text-saffron-500" />
                CampusBot
              </div>
            )}
            
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
              msg.role === 'user' 
                ? 'bg-saffron-500 text-navy-950 rounded-tr-sm shadow-[0_4px_20px_rgba(255,153,51,0.2)]' 
                : 'bg-navy-800/80 text-gray-200 border border-white/5 rounded-tl-sm shadow-xl backdrop-blur-md'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
              
              {msg.stats && (
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Footprints size={14} className="text-saffron-500" />
                    <span>{msg.stats.distance}m total</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock size={14} className="text-saffron-500" />
                    <span>~{msg.stats.time} mins walk</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 col-span-2">
                    <Zap size={14} className="text-saffron-500" />
                    <span>Recommended: <strong className="text-white capitalize">{msg.stats.mode}</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start animate-fade-in">
             <div className="bg-navy-800/80 border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4 shadow-xl backdrop-blur-md">
               <div className="flex items-center gap-1.5 h-5">
                 <div className="w-1.5 h-1.5 rounded-full bg-saffron-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-1.5 h-1.5 rounded-full bg-saffron-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-1.5 h-1.5 rounded-full bg-saffron-500 animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
