'use client';

import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface FoundUser {
  id: string;
  handle: string;
  avatar_url: string | null;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export default function FindCrew() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  // Friends
  const [friendsList, setFriendsList] = useState<FoundUser[]>([]);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);

  // Active chat
  const [activeChatUser, setActiveChatUser] = useState<FoundUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  // User handle
  const [userHandle, setUserHandle] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const fetchFriends = useCallback(async (friendIds: string[]) => {
    if (friendIds.length === 0) { setFriendsList([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, handle, avatar_url')
      .in('id', friendIds);
    setFriendsList(data || []);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('handle').eq('id', user.id).single()
      .then(({ data }) => { if (data) setUserHandle(data.handle); });
    const friends: string[] = user.user_metadata?.friends || [];
    fetchFriends(friends);
  }, [user, fetchFriends]);

  // ===== REALTIME: Subscribe to new messages =====
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Only add if it belongs to the active conversation
          if (
            activeChatUser &&
            (
              (newMsg.sender_id === user.id && newMsg.receiver_id === activeChatUser.id) ||
              (newMsg.sender_id === activeChatUser.id && newMsg.receiver_id === user.id)
            )
          ) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChatUser]);

  // ===== Load message history when opening a chat =====
  const openChat = async (friend: FoundUser) => {
    if (!user) return;
    setActiveChatUser(friend);
    setLoadingMessages(true);
    setMessages([]);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data || []);
    }
    setLoadingMessages(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // ===== Send message via Supabase =====
  const sendMessage = async () => {
    if (!messageInput.trim() || !activeChatUser || !user) return;
    const text = messageInput.trim();
    setMessageInput('');

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: activeChatUser.id,
      content: text,
    });

    if (error) {
      console.error('Error sending message:', error);
      setMessageInput(text); // restore on failure
    }
  };

  // ===== Search =====
  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    setSearchDone(false);
    const { data } = await supabase
      .from('profiles')
      .select('id, handle, avatar_url')
      .ilike('handle', `%${searchQuery.trim().toLowerCase()}%`)
      .neq('id', user.id)
      .limit(5);
    setSearchResults(data || []);
    setSearching(false);
    setSearchDone(true);
  };

  const addFriend = async (friendId: string) => {
    if (!user) return;
    setAddingFriend(friendId);
    const currentFriends: string[] = user.user_metadata?.friends || [];
    if (currentFriends.includes(friendId)) { setAddingFriend(null); return; }
    const updated = [...currentFriends, friendId];
    await supabase.auth.updateUser({ data: { friends: updated } });
    fetchFriends(updated);
    setAddingFriend(null);
  };

  const isFriend = (id: string) => (user?.user_metadata?.friends || []).includes(id);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cs-yellow">
        <div className="font-display font-black text-4xl uppercase animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFD700' }}>
      <Navbar />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row gap-8 pb-24 md:pb-8 pt-8">

        {/* ===== LEFT SIDEBAR ===== */}
        <aside className="w-full md:w-1/4 flex flex-col gap-8">
          {/* Find Friends */}
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-4 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000] transition-all">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight mb-4 border-b-4 border-black pb-2">Find Friends</h2>
            <div className="flex gap-2">
              <input
                className="flex-grow bg-white border-4 border-black px-4 py-2 font-body font-semibold focus:border-[#00FFFF] focus:outline-none"
                placeholder="Enter Friend UID..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="bg-[#FF007F] text-white border-4 border-black px-4 py-2 font-display uppercase hover:bg-[#9f004d] transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined">search</span>
              </button>
            </div>

            {searchDone && (
              <div className="mt-4 space-y-3">
                {searchResults.length > 0 ? searchResults.map((u) => (
                  <div key={u.id} className="flex items-center justify-between border-4 border-black p-2 bg-[#f6f6f6]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border-4 border-black overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatar_url} alt={u.handle} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-display font-black text-sm uppercase">{u.handle.charAt(1)}</span>
                        )}
                      </div>
                      <span className="font-display font-bold uppercase text-sm tracking-tight">{u.handle}</span>
                    </div>
                    {isFriend(u.id) ? (
                      <button onClick={() => openChat(u)} className="text-xs font-black uppercase bg-[#00FFFF] border-2 border-black px-2 py-1 cursor-pointer hover:shadow-[3px_3px_0px_#000] transition-all">CHAT</button>
                    ) : (
                      <button
                        onClick={() => addFriend(u.id)}
                        disabled={addingFriend === u.id}
                        className="text-xs font-black uppercase bg-[#FF007F] text-white border-2 border-black px-2 py-1 shadow-[3px_3px_0px_#000] hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {addingFriend === u.id ? '...' : '+ ADD'}
                      </button>
                    )}
                  </div>
                )) : (
                  <p className="font-body font-bold text-sm text-gray-500 text-center py-2 uppercase">No users found</p>
                )}
              </div>
            )}
          </div>

          {/* My Crew */}
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-4 flex-grow flex flex-col">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight mb-4 border-b-4 border-black pb-2 flex justify-between items-center">
              My Crew
              <span className="material-symbols-outlined text-[#FF007F]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            </h2>
            <div className="flex flex-col gap-4 overflow-y-auto">
              {friendsList.length > 0 ? friendsList.map((f) => (
                <button
                  key={f.id}
                  onClick={() => openChat(f)}
                  className={`border-4 border-black p-4 cursor-pointer group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000] transition-all text-left ${
                    activeChatUser?.id === f.id ? 'bg-[#00FFFF] shadow-[8px_8px_0px_#000]' : 'bg-[#f6f6f6] shadow-[6px_6px_0px_#000] opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border-4 border-black overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                      {f.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.avatar_url} alt={f.handle} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                      ) : (
                        <span className="font-display font-black text-xl uppercase">{f.handle.charAt(1)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-black uppercase leading-tight">{f.handle}</h3>
                      <p className="font-body text-sm font-bold">Tap to chat</p>
                    </div>
                  </div>
                </button>
              )) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">group_add</span>
                  <p className="font-display font-black uppercase text-sm text-gray-400">No crew yet</p>
                  <p className="font-body text-xs text-gray-400 mt-1">Search by UID above to add friends</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ===== MIDDLE: CHAT ===== */}
        <section className="w-full md:w-2/4 bg-white border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col h-[70vh] md:h-[80vh]">
          {activeChatUser ? (
            <>
              {/* Chat Header */}
              <div className="border-b-4 border-black p-4 bg-[#FF007F] text-white flex justify-between items-center flex-shrink-0">
                <div>
                  <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none mb-1">{activeChatUser.handle}</h2>
                  <p className="font-body text-sm font-bold uppercase tracking-widest text-[#00FFFF] flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#00FFFF] rounded-full animate-pulse inline-block"></span>
                    Live Chat
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-10 h-10 border-4 border-black bg-white overflow-hidden flex items-center justify-center">
                    {activeChatUser.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activeChatUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-black text-black">{activeChatUser.handle.charAt(1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="w-10 h-10 border-4 border-black bg-[#FF007F] flex items-center justify-center text-white font-display font-black">ME</div>
                </div>
              </div>

              {/* Chat Messages */}
              <div
                className="flex-grow p-6 flex flex-col gap-6 overflow-y-auto"
                style={{ backgroundImage: "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjRkZGN0VFIj48L3JlY3Q+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0iI0VBRUFFQSI+PC9jaXJjbGU+PC9zdmc+\")" }}
              >
                {loadingMessages ? (
                  <div className="flex-grow flex items-center justify-center">
                    <div className="font-display font-black text-xl uppercase animate-pulse text-gray-400">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-7xl text-gray-200 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                    <h3 className="font-display font-black text-2xl uppercase text-gray-300 mb-2">Start the conversation</h3>
                    <p className="font-body font-bold text-gray-400 text-sm max-w-xs">Say hello to {activeChatUser.handle}. Messages are synced in real-time! ⚡</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    msg.sender_id === user.id ? (
                      /* My Message */
                      <div key={msg.id} className="flex items-start gap-4 flex-row-reverse">
                        <div className="w-12 h-12 border-4 border-black bg-[#FF007F] flex items-center justify-center text-white font-display font-black text-xl flex-shrink-0">ME</div>
                        <div className="flex flex-col items-end">
                          <div className="font-body text-xs font-bold mb-1 uppercase tracking-widest">You <span className="text-gray-500 font-normal">{formatTime(msg.created_at)}</span></div>
                          <div className="bg-[#00FFFF] border-4 border-black p-4 inline-block shadow-[4px_4px_0px_#000]">
                            <p className="font-body font-semibold text-lg">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Their Message */
                      <div key={msg.id} className="flex items-start gap-4">
                        <div className="w-12 h-12 border-4 border-black bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
                          {activeChatUser.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={activeChatUser.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-display font-black text-xl">{activeChatUser.handle.charAt(1).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-body text-xs font-bold mb-1 uppercase tracking-widest">{activeChatUser.handle} <span className="text-gray-500 font-normal">{formatTime(msg.created_at)}</span></div>
                          <div className="bg-white border-4 border-black p-4 inline-block shadow-[4px_4px_0px_#000]">
                            <p className="font-body font-semibold text-lg">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    )
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t-4 border-black p-4 bg-[#e8e8e8] flex-shrink-0">
                <div className="flex gap-2 h-14">
                  <input
                    className="flex-grow bg-white border-4 border-black px-4 font-body font-semibold text-lg focus:border-[#00FFFF] focus:outline-none"
                    placeholder="Type a message..."
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                    className="bg-[#FF007F] text-white border-4 border-black px-8 font-display text-xl font-black uppercase tracking-widest hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    SEND
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No chat selected */
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
              <div
                className="w-24 h-24 border-4 border-black bg-[#00FFFF] flex items-center justify-center mb-6 shadow-[8px_8px_0px_#000] hover:bg-[#FF007F] hover:shadow-[12px_12px_0px_#000] hover:-translate-y-2 hover:-translate-x-1 transition-all duration-300 cursor-default group"
                style={{ animation: 'crewBounce 2.5s ease-in-out infinite' }}
              >
                <span
                  className="material-symbols-outlined text-5xl text-black group-hover:text-white transition-colors duration-300"
                  style={{ fontVariationSettings: "'FILL' 1", animation: 'crewWobble 3s ease-in-out infinite' }}
                >forum</span>
              </div>
              <style jsx>{`
                @keyframes crewBounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-10px); }
                }
                @keyframes crewWobble {
                  0%, 100% { transform: rotate(0deg) scale(1); }
                  25% { transform: rotate(-6deg) scale(1.05); }
                  75% { transform: rotate(6deg) scale(1.05); }
                }
              `}</style>
              <h2 className="font-display text-4xl font-black uppercase tracking-tighter mb-4">Select a Chat</h2>
              <p className="font-body font-bold text-gray-500 max-w-sm text-lg">
                Pick someone from your crew on the left, or search by UID to find new travel buddies.
              </p>
              {userHandle && (
                <div className="mt-8 bg-black text-[#00FFFF] border-4 border-black px-6 py-3 shadow-[6px_6px_0px_#FF007F]">
                  <p className="font-body text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">YOUR UID</p>
                  <p className="font-display text-2xl font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FF007F]">fingerprint</span>
                    {userHandle}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ===== RIGHT SIDEBAR ===== */}
        <aside className="w-full md:w-1/4 flex flex-col gap-8">
          {/* Crew List */}
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-4 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000] transition-all">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight mb-4 border-b-4 border-black pb-2 flex justify-between items-center">
              Crew List
              <div className="w-3 h-3 bg-[#00FFFF] border-2 border-black rounded-full animate-pulse"></div>
            </h2>
            <ul className="flex flex-col gap-4">
              {friendsList.length > 0 ? friendsList.map((f) => (
                <li key={f.id} className="flex items-center gap-3 cursor-pointer hover:bg-[#f6f6f6] -mx-2 px-2 py-1 transition-colors" onClick={() => openChat(f)}>
                  <div className="relative">
                    <div className="w-10 h-10 border-4 border-black overflow-hidden bg-white flex items-center justify-center">
                      {f.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.avatar_url} alt={f.handle} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display font-black uppercase">{f.handle.charAt(1)}</span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00FFFF] border-2 border-black"></div>
                  </div>
                  <span className="font-body font-bold text-lg uppercase">{f.handle.replace('@', '').split('_')[0]}</span>
                </li>
              )) : (
                <li className="flex items-center gap-3 opacity-50">
                  <div className="w-10 h-10 border-4 border-black bg-gray-200 flex items-center justify-center font-display font-black">?</div>
                  <span className="font-body font-bold text-lg uppercase text-gray-400">No crew yet</span>
                </li>
              )}
            </ul>
          </div>

          {/* How It Works */}
          <div className="bg-[#00FFFF] border-4 border-black shadow-[8px_8px_0px_#000] p-4 flex-grow hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000] transition-all">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight mb-4 border-b-4 border-black pb-2">
              How It Works
            </h2>
            <div className="flex flex-col gap-6 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[4px] before:bg-black">
              <div className="relative pl-8">
                <div className="absolute left-0 top-1 w-6 h-6 bg-[#FF007F] border-4 border-black flex items-center justify-center z-10">
                  <span className="font-display font-black text-white text-xs">1</span>
                </div>
                <p className="font-display text-lg font-black leading-tight bg-white border-4 border-black p-2 inline-block shadow-[4px_4px_0px_#000]">Share your UID with friends</p>
              </div>
              <div className="relative pl-8">
                <div className="absolute left-0 top-1 w-6 h-6 bg-[#FFD700] border-4 border-black flex items-center justify-center z-10">
                  <span className="font-display font-black text-black text-xs">2</span>
                </div>
                <p className="font-display text-lg font-black leading-tight bg-white border-4 border-black p-2 inline-block shadow-[4px_4px_0px_#000]">Search &amp; add them to your crew</p>
              </div>
              <div className="relative pl-8">
                <div className="absolute left-0 top-1 w-6 h-6 bg-white border-4 border-black flex items-center justify-center z-10">
                  <span className="font-display font-black text-black text-xs">3</span>
                </div>
                <p className="font-display text-lg font-black leading-tight bg-white border-4 border-black p-2 inline-block shadow-[4px_4px_0px_#000]">Chat in real-time ⚡</p>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
