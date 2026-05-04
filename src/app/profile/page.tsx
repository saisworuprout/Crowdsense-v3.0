'use client';

import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface ProfileTrip {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  image_url: string | null;
}

interface FoundUser {
  id: string;
  handle: string;
  avatar_url: string | null;
}

const DEFAULT_BANNER = {
  bg: 'bg-[#FF007F]',
  style: { backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' } as React.CSSProperties,
};

export default function Profile() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tripCount, setTripCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [nextTrip, setNextTrip] = useState<ProfileTrip | null>(null);
  const [recentTrips, setRecentTrips] = useState<ProfileTrip[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // UID state
  const [userHandle, setUserHandle] = useState('');
  const [copied, setCopied] = useState(false);

  // Friends state
  const [friendsList, setFriendsList] = useState<FoundUser[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
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
    async function fetchProfileData() {
      if (!user) return;
      try {
        // Fetch handle
        const { data: profile } = await supabase
          .from('profiles')
          .select('handle')
          .eq('id', user.id)
          .single();
        if (profile) setUserHandle(profile.handle);

        // Fetch trips
        const { data: trips } = await supabase
          .from('trips')
          .select('id, title, destination, start_date, end_date, status, image_url, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        const allTrips = trips || [];
        setTripCount(allTrips.length);
        setSavedCount(0);

        // Friends from metadata
        const friends: string[] = user.user_metadata?.friends || [];
        setFriendsCount(friends.length);
        fetchFriends(friends);

        const upcomingTrips = allTrips
          .filter(t => t.status === 'upcoming' || (t.start_date && new Date(t.start_date) > new Date()))
          .sort((a, b) => {
            if (a.start_date && b.start_date) return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
            return 0;
          });
        setNextTrip(upcomingTrips.length > 0 ? upcomingTrips[0] : null);
        setRecentTrips(allTrips.slice(0, 2));
      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setDataLoading(false);
      }
    }
    if (!loading && user) fetchProfileData();
  }, [user, loading, fetchFriends]);

  const copyUID = () => {
    navigator.clipboard.writeText(userHandle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchDone(false);
    const query = searchQuery.trim().toLowerCase();
    const { data } = await supabase
      .from('profiles')
      .select('id, handle, avatar_url')
      .ilike('handle', `%${query}%`)
      .neq('id', user!.id)
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
    const updatedFriends = [...currentFriends, friendId];
    await supabase.auth.updateUser({ data: { friends: updatedFriends } });
    setFriendsCount(updatedFriends.length);
    fetchFriends(updatedFriends);
    setAddingFriend(null);
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;
    const currentFriends: string[] = user.user_metadata?.friends || [];
    const updatedFriends = currentFriends.filter(f => f !== friendId);
    await supabase.auth.updateUser({ data: { friends: updatedFriends } });
    setFriendsCount(updatedFriends.length);
    fetchFriends(updatedFriends);
  };

  const isFriend = (id: string) => {
    return (user?.user_metadata?.friends || []).includes(id);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cs-yellow">
        <div className="font-display font-black text-4xl uppercase animate-pulse">Loading...</div>
      </div>
    );
  }

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'TRAVELLER_01';
  const avatarUrl = user.user_metadata?.avatar_url || null;
  const userGender = user.user_metadata?.gender || null;
  const userAge = user.user_metadata?.age || null;
  const bannerUrl = user.user_metadata?.banner_url || null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  return (
    <div className="min-h-screen font-body antialiased bg-[#f8f5f7]">
      <Navbar />
      <main className="pb-32 md:pb-12 bg-[#f8f5f7]">
        {/* Banner */}
        <section
          className={`w-full border-b-4 border-cs-black relative overflow-hidden ${bannerUrl ? '' : DEFAULT_BANNER.bg}`}
          style={bannerUrl ? {} : DEFAULT_BANNER.style}
        >
          {bannerUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerUrl} alt="Profile banner" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30"></div>
            </>
          )}
          <Link href="/profile/edit#banner" className="absolute top-4 right-4 z-20 group">
            <div className="w-10 h-10 bg-white/90 backdrop-blur-sm border-3 border-cs-black shadow-[4px_4px_0px_#000000] flex items-center justify-center group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[6px_6px_0px_#000000] transition-all opacity-0 group-hover:opacity-100 hover:!opacity-100"
              style={{ opacity: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              <span className="material-symbols-outlined text-lg font-black">wallpaper</span>
            </div>
          </Link>

          <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center relative z-10">
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-full border-4 border-cs-black bg-white shadow-[8px_8px_0px_#00FFFF] overflow-hidden flex items-center justify-center text-4xl font-black">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="uppercase">{userName.charAt(0)}</span>
                )}
              </div>
              <Link href="/profile/edit" className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="material-symbols-outlined text-white text-3xl drop-shadow-lg">photo_camera</span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <h1 className="font-display text-5xl md:text-7xl font-black text-white uppercase tracking-tighter text-center" style={{ textShadow: '4px 4px 0px #000' }}>
                {userName}
              </h1>
              <Link href="/profile/edit" className="group">
                <div className="w-12 h-12 bg-white border-4 border-cs-black shadow-[4px_4px_0px_#000000] flex items-center justify-center group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[6px_6px_0px_#000000] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all">
                  <span className="material-symbols-outlined text-xl font-black">edit</span>
                </div>
              </Link>
            </div>

            {/* UID Tag */}
            {userHandle && (
              <button onClick={copyUID} className="mt-4 flex items-center gap-2 bg-cs-black text-white border-3 border-white px-4 py-2 font-display font-bold uppercase text-sm shadow-[3px_3px_0px_#00FFFF] hover:shadow-[5px_5px_0px_#00FFFF] hover:-translate-y-0.5 transition-all cursor-pointer group">
                <span className="material-symbols-outlined text-[#00FFFF] text-lg">fingerprint</span>
                <span className="tracking-widest">{userHandle}</span>
                <span className="material-symbols-outlined text-base opacity-60 group-hover:opacity-100 transition-opacity">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            )}

            {(userGender || userAge) && (
              <div className="flex gap-3 mt-3">
                {userAge && (
                  <span className="bg-white border-3 border-cs-black px-3 py-1 font-display font-bold uppercase text-sm shadow-[3px_3px_0px_#000000]">{userAge} YRS</span>
                )}
                {userGender && (
                  <span className="bg-[#00FFFF] border-3 border-cs-black px-3 py-1 font-display font-bold uppercase text-sm shadow-[3px_3px_0px_#000000]">{userGender}</span>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-20 space-y-12">
          {/* Stats Row */}
          <section className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 md:p-8">
            <div className="grid grid-cols-3 gap-4 text-center divide-x-4 divide-black">
              <div className="flex flex-col">
                <span className="font-display text-4xl md:text-5xl font-black text-[#FF007F]">{dataLoading ? '—' : tripCount}</span>
                <span className="font-display font-bold uppercase tracking-tight mt-2">TRIPS</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-4xl md:text-5xl font-black text-[#FF007F]">{dataLoading ? '—' : savedCount}</span>
                <span className="font-display font-bold uppercase tracking-tight mt-2">SAVED</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-4xl md:text-5xl font-black text-[#FF007F]">{dataLoading ? '—' : friendsCount}</span>
                <span className="font-display font-bold uppercase tracking-tight mt-2">FRIENDS</span>
              </div>
            </div>
          </section>

          {/* Find Friends + Friends List */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Search */}
            <section className="md:col-span-7 bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 md:p-8">
              <h2 className="font-display font-black uppercase text-2xl mb-2 flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-[#FF007F]">person_search</span>
                FIND PEOPLE
              </h2>
              <p className="font-bold text-gray-500 mb-5 text-sm">Search by UID to find and add friends.</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter UID e.g. @john_a3b2"
                  className="flex-1 border-4 border-cs-black p-3 font-bold text-sm uppercase tracking-tight focus:outline-none focus:shadow-[4px_4px_0px_#00FFFF] transition-shadow bg-[#f8f5f7] placeholder:text-gray-400 placeholder:normal-case"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="bg-cs-black text-white font-display font-black uppercase px-6 py-3 border-4 border-cs-black shadow-[4px_4px_0px_#FF007F] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#FF007F] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {searching ? '...' : 'SEARCH'}
                </button>
              </div>

              {/* Search Results */}
              {searchDone && (
                <div className="mt-5 space-y-3">
                  {searchResults.length > 0 ? (
                    searchResults.map((u) => (
                      <div key={u.id} className="flex items-center justify-between border-4 border-cs-black p-3 bg-[#f8f5f7]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border-3 border-cs-black bg-cs-cyan flex items-center justify-center overflow-hidden flex-shrink-0">
                            {u.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={u.avatar_url} alt={u.handle} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black uppercase text-sm">{u.handle.charAt(1)}</span>
                            )}
                          </div>
                          <span className="font-display font-bold uppercase text-sm tracking-tight">{u.handle}</span>
                        </div>
                        {isFriend(u.id) ? (
                          <span className="text-xs font-bold uppercase bg-[#00FFFF] border-2 border-cs-black px-3 py-1">FRIENDS ✓</span>
                        ) : (
                          <button
                            onClick={() => addFriend(u.id)}
                            disabled={addingFriend === u.id}
                            className="text-xs font-black uppercase bg-[#FF007F] text-white border-2 border-cs-black px-3 py-1.5 shadow-[3px_3px_0px_#000000] hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {addingFriend === u.id ? '...' : '+ ADD'}
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">search_off</span>
                      <p className="font-bold text-gray-400 uppercase text-sm">No users found</p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Friends List */}
            <section className="md:col-span-5 bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6">
              <h2 className="font-display font-black uppercase text-xl mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00FFFF]">group</span> YOUR CREW
              </h2>
              {friendsList.length > 0 ? (
                <div className="space-y-3">
                  {friendsList.map((f) => (
                    <div key={f.id} className="flex items-center justify-between border-b-2 border-gray-200 pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 border-3 border-cs-black bg-cs-yellow flex items-center justify-center overflow-hidden flex-shrink-0">
                          {f.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={f.avatar_url} alt={f.handle} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-black uppercase text-xs">{f.handle.charAt(1)}</span>
                          )}
                        </div>
                        <span className="font-display font-bold uppercase text-sm tracking-tight">{f.handle}</span>
                      </div>
                      <button
                        onClick={() => removeFriend(f.id)}
                        className="text-gray-400 hover:text-[#FF007F] transition-colors cursor-pointer"
                        title="Remove friend"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">group_add</span>
                  <p className="font-bold text-gray-400 uppercase text-sm">No friends yet</p>
                  <p className="text-xs text-gray-400 mt-1">Search by UID to add friends</p>
                </div>
              )}
            </section>
          </div>

          {/* Next Adventure & Recent Trips */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <section className="md:col-span-7 bg-[#00FFFF] border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-8 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"></div>
              {nextTrip ? (
                <>
                  <div>
                    <h2 className="font-display font-black uppercase text-xl mb-4 bg-black text-white inline-block px-3 py-1">NEXT ADVENTURE</h2>
                    <h3 className="font-display text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4">
                      {nextTrip.destination.split(',').map((part, i) => (
                        <span key={i}>{part.trim()}{i < nextTrip.destination.split(',').length - 1 && <br/>}</span>
                      ))}
                    </h3>
                    {(nextTrip.start_date || nextTrip.end_date) && (
                      <p className="font-bold text-xl mb-8 flex items-center gap-2">
                        <span className="material-symbols-outlined">calendar_month</span>
                        {formatDate(nextTrip.start_date)}{nextTrip.end_date ? ` - ${formatDate(nextTrip.end_date)}` : ''}
                      </p>
                    )}
                  </div>
                  <Link href={`/trip/${nextTrip.id}`}>
                    <button className="bg-[#FF007F] text-white font-display font-black uppercase tracking-widest py-4 px-8 border-4 border-cs-black shadow-[8px_8px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] transition-all w-full md:w-auto self-start text-xl cursor-pointer">VIEW TRIP</button>
                  </Link>
                </>
              ) : (
                <>
                  <div>
                    <h2 className="font-display font-black uppercase text-xl mb-4 bg-black text-white inline-block px-3 py-1">NEXT ADVENTURE</h2>
                    <h3 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4">NO TRIPS YET</h3>
                    <p className="font-bold text-lg mb-8 opacity-70">Your next adventure starts here. Plan your first trip and watch it show up right here.</p>
                  </div>
                  <Link href="/create">
                    <button className="bg-[#FF007F] text-white font-display font-black uppercase tracking-widest py-4 px-8 border-4 border-cs-black shadow-[8px_8px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] transition-all w-full md:w-auto self-start text-xl cursor-pointer">PLAN A TRIP</button>
                  </Link>
                </>
              )}
            </section>

            <section className="md:col-span-5 flex flex-col gap-8">
              <div className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 flex flex-col gap-4">
                <h2 className="font-display font-black uppercase text-xl mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF007F]">bookmark</span> RECENT TRIPS
                </h2>
                {recentTrips.length > 0 ? (
                  recentTrips.map((trip, idx) => (
                    <Link key={trip.id} href={`/trip/${trip.id}`} className="block">
                      <div className={`flex items-center gap-4 ${idx < recentTrips.length - 1 ? 'border-b-4 border-cs-black pb-4' : ''} hover:bg-gray-50 transition-colors -mx-2 px-2 py-1`}>
                        <div className="w-20 h-20 border-4 border-cs-black bg-cs-cyan flex items-center justify-center flex-shrink-0">
                          {trip.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img alt={trip.title} className="w-full h-full object-cover" src={trip.image_url} />
                          ) : (
                            <span className="material-symbols-outlined text-3xl">flight_takeoff</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-display font-black text-lg uppercase leading-tight">{trip.title}</h4>
                          <p className="text-sm font-bold text-gray-500">{trip.destination.toUpperCase()}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">travel_explore</span>
                    <p className="font-bold text-gray-400 uppercase text-sm">No trips created yet</p>
                    <Link href="/discover" className="mt-3 font-display font-black uppercase text-sm bg-cs-yellow border-2 border-cs-black px-4 py-2 hover:bg-[#FF007F] hover:text-white transition-colors shadow-[4px_4px_0px_#000000]">DISCOVER PLACES</Link>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Activity Feed */}
          <section className="mb-16">
            <h2 className="font-display font-black uppercase text-3xl mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl">history</span> ACTIVITY FEED
            </h2>
            {tripCount > 0 ? (
              <div className="space-y-6">
                {recentTrips.map((trip) => (
                  <div key={`activity-${trip.id}`} className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase bg-cs-yellow px-2 py-1 border-2 border-cs-black mb-2 inline-block">TRIP</span>
                      <h3 className="font-display font-black text-xl uppercase">CREATED &apos;{trip.title}&apos;</h3>
                      <p className="text-sm font-bold text-gray-500 mt-1">{trip.destination.toUpperCase()}</p>
                    </div>
                    <Link href={`/trip/${trip.id}`}>
                      <button className="bg-white border-4 border-cs-black font-display font-bold uppercase px-4 py-2 hover:bg-[#00FFFF] transition-colors w-full md:w-auto shadow-[4px_4px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#000000] active:translate-y-0 active:translate-x-0 active:shadow-none cursor-pointer">VIEW</button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-12 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-7xl text-gray-200 mb-4">schedule</span>
                <h3 className="font-display font-black text-2xl uppercase mb-2 text-gray-400">NO ACTIVITY YET</h3>
                <p className="font-bold text-gray-400 max-w-md">Once you start planning trips, reviewing places, and connecting with friends — it&apos;ll all show up here.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
