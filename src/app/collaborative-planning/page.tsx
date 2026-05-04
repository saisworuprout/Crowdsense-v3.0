'use client';

import Navbar from '@/components/layout/Navbar';
import { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  isOwn: boolean;
}

interface Destination {
  id: number;
  name: string;
  votes: number;
  emoji: string;
  gradient: string;
  isWinning?: boolean;
  votedByUser?: boolean;
}

export default function CollaborativePlanning() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { id: Date.now(), text: inputValue, isOwn: true }]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleAddDestination = (name: string) => {
    const emoji = getEmojiForPlace(name);
    const gradient = getGradientForPlace(name);
    const newDest: Destination = {
      id: Date.now(),
      name: name.toUpperCase(),
      votes: 0,
      emoji,
      gradient,
    };
    const updated = [...destinations, newDest].sort((a, b) => b.votes - a.votes);
    setDestinations(updated.map((d, i) => ({ ...d, isWinning: i === 0 })));
    setShowVoteModal(false);
    setSearchQuery('');
  };

  const getEmojiForPlace = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('beach') || lower.includes('goa') || lower.includes('maldives') || lower.includes('bali')) return '🏖️';
    if (lower.includes('mountain') || lower.includes('hill') || lower.includes('coorg') || lower.includes('himachal')) return '🏔️';
    if (lower.includes('temple') || lower.includes('fort') || lower.includes('monument')) return '🛕';
    if (lower.includes('city') || lower.includes('york') || lower.includes('london') || lower.includes('tokyo')) return '🏙️';
    if (lower.includes('village') || lower.includes('rustic') || lower.includes('countryside')) return '🏘️';
    if (lower.includes('lake') || lower.includes('river') || lower.includes('pond')) return '🏞️';
    if (lower.includes('forest') || lower.includes('jungle') || lower.includes('safari')) return '🌿';
    if (lower.includes('desert') || lower.includes('sand')) return '🏜️';
    return '📍';
  };

  const getGradientForPlace = (name: string): string => {
    const gradients = [
      'from-[#FF007F] to-[#9f004d]',
      'from-[#00FFFF] to-[#009999]',
      'from-green-400 to-green-600',
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-orange-400 to-orange-600',
      'from-yellow-400 to-yellow-600',
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  const handleVote = (id: number) => {
    setDestinations(destinations.map(d => {
      if (d.id === id && !d.votedByUser) {
        return { ...d, votes: d.votes + 1, votedByUser: true };
      }
      return d;
    }).sort((a, b) => b.votes - a.votes).map((d, i) => ({ ...d, isWinning: i === 0 })));
  };

  const handleSearchPlace = () => {
    if (searchQuery.trim()) {
      handleAddDestination(searchQuery.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFD700' }}>
      <Navbar />

      {/* Vote Modal - Google Maps Style Search */}
      {showVoteModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setShowVoteModal(false)}>
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="border-b-4 border-black bg-[#FF007F] p-6 flex justify-between items-center">
              <h3 className="font-black text-3xl text-white uppercase m-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>SEARCH YOUR NOISE</h3>
              <button onClick={() => setShowVoteModal(false)} className="w-12 h-12 border-4 border-black bg-white flex items-center justify-center hover:bg-gray-100 transition-colors">
                <span className="material-symbols-outlined text-black font-black">close</span>
              </button>
            </div>

            {/* Google Maps Style Search Bar */}
            <div className="p-6 border-b-4 border-black bg-gray-100">
              <div className="flex border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white focus-within:border-[#00FFFF] transition-colors">
                <div className="p-3 border-r-4 border-black bg-gray-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-500">search</span>
                </div>
                <input
                  className="flex-1 bg-white border-none p-4 text-black placeholder:text-black/50 focus:ring-0 text-lg"
                  placeholder="Search for any place in the world..."
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchPlace()}
                  style={{ fontFamily: 'Archivo, sans-serif' }}
                  autoFocus
                />
                <button
                  onClick={handleSearchPlace}
                  className="bg-[#FF007F] border-l-4 border-black px-6 flex items-center justify-center hover:bg-[#9f004d] transition-colors"
                >
                  <span className="material-symbols-outlined text-white">add_location</span>
                </button>
              </div>
              <p className="mt-3 text-sm text-black/60 font-bold uppercase" style={{ fontFamily: 'Archivo, sans-serif' }}>
                Search and add any destination • Vote for your favorite places
              </p>
            </div>

            {/* Suggestions / Recent */}
            <div className="flex-1 overflow-y-auto p-6">
              <h4 className="font-black text-xl uppercase mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>POPULAR DESTINATIONS</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['Goa, India', 'Manali, Himachal Pradesh', 'Jaipur, Rajasthan', 'Kerala, India', 'Mysore, Karnataka', 'Agra, Uttar Pradesh', 'Dubai, UAE', 'Bali, Indonesia', 'Paris, France', 'Tokyo, Japan'].map(place => (
                  <button
                    key={place}
                    onClick={() => handleAddDestination(place)}
                    className="flex items-center gap-3 border-4 border-black p-4 bg-white hover:bg-[#00FFFF] transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-2xl text-black">place</span>
                    <span className="font-bold text-black uppercase" style={{ fontFamily: 'Archivo, sans-serif' }}>{place}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row gap-8 p-4 md:p-8 lg:p-12 items-start">
        {/* Center Content Canvas */}
        <div className="flex-1 flex flex-col gap-12 w-full lg:w-auto">
          {/* Trip Header Bar */}
          <header className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-black mb-2 leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                VOTE YOUR NOISE
              </h1>
              <div className="flex items-center gap-2 mt-4">
                <span className="w-4 h-4 bg-green-500 border-2 border-black block"></span>
                <span className="font-bold uppercase tracking-wider text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>3 ONLINE NOW</span>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-4">
              <div className="flex -space-x-4 border-4 border-black p-2 bg-gray-100">
                <div className="w-12 h-12 border-4 border-black bg-[#FF007F] flex items-center justify-center text-white font-bold">M</div>
                <div className="w-12 h-12 border-4 border-black bg-[#00FFFF] flex items-center justify-center text-black font-bold">S</div>
                <div className="w-12 h-12 border-4 border-black bg-[#FFD700] flex items-center justify-center text-black font-bold">A</div>
                <div className="w-12 h-12 border-4 border-black bg-white flex items-center justify-center text-black font-bold">R</div>
              </div>
              <button className="font-black border-b-4 border-black hover:text-[#FF007F] transition-colors pb-1 text-xl flex items-center gap-2 uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <span className="material-symbols-outlined">person_add</span>
                INVITE FRIENDS
              </button>
            </div>
          </header>

          {/* Destination Vote Section */}
          <section className="flex flex-col gap-6">
            <h2 className="text-3xl md:text-4xl font-black text-white bg-[#FF007F] inline-block self-start px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase tracking-tighter" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              VOTE FOR DESTINATION
            </h2>

            {destinations.length === 0 ? (
              <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
                <span className="material-symbols-outlined text-8xl text-black/20 mb-4">add_location_alt</span>
                <h3 className="text-3xl font-black uppercase text-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>NO DESTINATIONS YET</h3>
                <p className="text-xl text-black/60 mb-6" style={{ fontFamily: 'Archivo, sans-serif' }}>Search and add places to start voting on your trip!</p>
                <button
                  onClick={() => setShowVoteModal(true)}
                  className="bg-[#FF007F] text-white border-4 border-black font-black text-2xl px-8 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-2 hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all uppercase flex items-center gap-2 mx-auto"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  <span className="material-symbols-outlined">add_location</span>
                  ADD DESTINATION
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {destinations.map((dest) => (
                    <div key={dest.id} className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col relative group transition-transform hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] duration-200">
                      <div className={`w-full h-48 bg-gradient-to-b ${dest.gradient} border-b-4 border-black flex items-center justify-center transition-all`}>
                        <span className="text-white text-6xl">{dest.emoji}</span>
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <h3 className="text-2xl font-black text-black mb-4 uppercase tracking-tight opacity-70 group-hover:opacity-100" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{dest.name}</h3>
                        <div>
                          <div className="h-8 bg-gray-100 border-4 border-black w-full relative mb-2">
                            <div className="h-full bg-[#00FFFF] border-r-4 border-black absolute top-0 left-0 transition-all duration-500" style={{ width: `${dest.votes > 0 ? Math.min((dest.votes / Math.max(...destinations.map(d => d.votes), 1)) * 100, 100) : 0}%` }}></div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-black text-black">{dest.votes} {dest.votes === 1 ? 'VOTE' : 'VOTES'}</span>
                            <button
                              onClick={() => handleVote(dest.id)}
                              disabled={dest.votedByUser}
                              className={`flex items-center gap-1 border-2 border-black px-3 py-1 font-bold text-sm uppercase transition-all ${dest.votedByUser ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#00FFFF] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                            >
                              <span className={`material-symbols-outlined text-lg ${dest.votedByUser ? 'text-gray-500' : 'text-black'}`}>{dest.votedByUser ? 'check' : 'thumb_up'}</span>
                              {dest.votedByUser ? 'VOTED' : 'VOTE'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setShowVoteModal(true)}
                    className="bg-[#FF007F] text-white border-4 border-black font-black text-2xl px-8 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-2 hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 uppercase flex items-center gap-2"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    <span className="material-symbols-outlined">add_location</span>
                    ADD MORE PLACES
                  </button>
                </div>
              </>
            )}
          </section>
        </div>

        {/* Live Chat Sidebar (Right side) */}
        <aside className="w-full lg:w-96 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[600px] lg:h-[calc(100vh-140px)] lg:sticky lg:top-[120px]">
          <div className="border-b-4 border-black bg-[#ff709e] p-4 flex justify-between items-center">
            <h3 className="font-black text-2xl text-black uppercase m-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>TRIP CHAT</h3>
            <span className="material-symbols-outlined text-black">forum</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <span className="material-symbols-outlined text-6xl text-black/20 mb-2">chat_bubble</span>
                <p className="text-black/50 font-bold uppercase text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>NO MESSAGES YET</p>
                <p className="text-black/40 text-xs mt-1" style={{ fontFamily: 'Archivo, sans-serif' }}>Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map(msg => (
                  <div key={msg.id} className={`flex items-end gap-3 max-w-[85%] ${msg.isOwn ? 'self-end flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 border-2 border-black ${msg.isOwn ? 'bg-white' : 'bg-[#FF007F]'}`}></div>
                    <div className={`${msg.isOwn ? 'bg-[#00FFFF]' : 'bg-white'} border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black text-sm relative ${msg.isOwn ? 'font-bold' : ''}`} style={{ fontFamily: 'Archivo, sans-serif' }}>
                      <div className={`absolute w-3 h-3 ${msg.isOwn ? 'bg-[#00FFFF] border-b-2 border-r-2 border-black -right-[2px] bottom-2 -rotate-45' : 'bg-white border-b-2 border-l-2 border-black -left-[2px] bottom-2 rotate-45'}`}></div>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 border-t-4 border-black bg-white">
            <div className="flex border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-within:border-[#00FFFF] transition-colors group">
              <input
                className="flex-1 bg-white border-none p-3 text-black placeholder:text-black/50 focus:ring-0 uppercase text-sm"
                placeholder="SAY SOMETHING..."
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ fontFamily: 'Archivo, sans-serif' }}
              />
              <button
                onClick={handleSendMessage}
                className="bg-[#FF007F] border-l-4 border-black px-4 flex items-center justify-center hover:bg-[#9f004d] transition-colors"
              >
                <span className="material-symbols-outlined text-white">send</span>
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}