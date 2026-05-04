'use client';

import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

const AVATAR_OPTIONS = [
  { id: 'explorer', src: '/avatars/explorer.png', label: 'Explorer' },
  { id: 'backpacker', src: '/avatars/backpacker.png', label: 'Backpacker' },
  { id: 'music_traveler', src: '/avatars/music_traveler.png', label: 'Music Lover' },
  { id: 'adventurer', src: '/avatars/adventurer.png', label: 'Adventurer' },
  { id: 'foodie', src: '/avatars/foodie.png', label: 'Foodie' },
  { id: 'photographer', src: '/avatars/photographer.png', label: 'Photographer' },
  { id: 'surfer', src: '/avatars/surfer.png', label: 'Surfer' },
  { id: 'astronaut', src: '/avatars/astronaut.png', label: 'Astronaut' },
];

const BANNER_OPTIONS = [
  { id: 'default', src: '', label: 'Default Pink', preview: '', color: 'bg-[#FF007F]' },
  { id: 'sunset_city', src: '/banners/sunset_city.png', label: 'Sunset City' },
  { id: 'tropical_beach', src: '/banners/tropical_beach.png', label: 'Tropical Beach' },
  { id: 'mountain_adventure', src: '/banners/mountain_adventure.png', label: 'Mountain Adventure' },
  { id: 'neon_tokyo', src: '/banners/neon_tokyo.png', label: 'Neon Tokyo' },
  { id: 'desert_dunes', src: '/banners/desert_dunes.png', label: 'Desert Dunes' },
  { id: 'northern_lights', src: '/banners/northern_lights.png', label: 'Northern Lights' },
];

const GENDER_OPTIONS = [
  { value: '', label: 'PREFER NOT TO SAY' },
  { value: 'male', label: 'MALE' },
  { value: 'female', label: 'FEMALE' },
  { value: 'non-binary', label: 'NON-BINARY' },
  { value: 'other', label: 'OTHER' },
];

export default function EditProfile() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const bannerRef = useRef<HTMLDivElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [selectedBanner, setSelectedBanner] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [userHandle, setUserHandle] = useState('');
  const [uidCopied, setUidCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Pre-fill from existing user metadata
  useEffect(() => {
    if (user) {
      const meta = user.user_metadata || {};
      setDisplayName(meta.name || user.email?.split('@')[0] || '');
      setGender(meta.gender || '');
      setAge(meta.age?.toString() || '');
      setSelectedAvatar(meta.avatar_url || '');
      setSelectedBanner(meta.banner_url || '');

      // Fetch handle/UID
      supabase.from('profiles').select('handle').eq('id', user.id).single()
        .then(({ data }) => { if (data) setUserHandle(data.handle); });
    }
  }, [user]);

  // Scroll to banner section if URL has #banner
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#banner') {
      setTimeout(() => {
        bannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [loading]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: displayName.trim() || undefined,
          gender: gender || null,
          age: age ? parseInt(age, 10) : null,
          avatar_url: selectedAvatar || null,
          banner_url: selectedBanner || null,
        }
      });

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError(updateError.message || 'Failed to save');
        return;
      }

      if (user) {
        await supabase
          .from('profiles')
          .update({ avatar_url: selectedAvatar || null })
          .eq('id', user.id);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cs-yellow">
        <div className="font-display font-black text-4xl uppercase animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body antialiased bg-[#f8f5f7]">
      <Navbar />

      <main className="pb-32 md:pb-12 bg-[#f8f5f7]">
        {/* Header */}
        <section className="w-full bg-cs-black border-b-4 border-cs-black">
          <div className="max-w-3xl mx-auto px-4 py-10 flex items-center gap-4">
            <Link href="/profile" className="group">
              <div className="w-12 h-12 bg-white border-4 border-cs-black shadow-[4px_4px_0px_#00FFFF] flex items-center justify-center group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[6px_6px_0px_#00FFFF] transition-all">
                <span className="material-symbols-outlined text-2xl font-black">arrow_back</span>
              </div>
            </Link>
            <h1 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tighter" style={{ textShadow: '3px 3px 0px #FF007F' }}>
              EDIT PROFILE
            </h1>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 mt-10 space-y-10">

          {/* Banner Selection */}
          <section ref={bannerRef} id="banner" className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 md:p-8">
            <h2 className="font-display font-black uppercase text-2xl mb-2 flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-[#FF007F]">wallpaper</span>
              CHOOSE YOUR BANNER
            </h2>
            <p className="font-bold text-gray-500 mb-6">Set the vibe for your profile header.</p>

            {/* Banner preview */}
            <div className="mb-6 border-4 border-cs-black shadow-[6px_6px_0px_#000000] overflow-hidden">
              <div className={`relative h-[140px] w-full ${!selectedBanner ? 'bg-[#FF007F]' : ''}`}
                style={!selectedBanner ? { backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' } : {}}
              >
                {selectedBanner && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedBanner} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30"></div>
                  </>
                )}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="font-display font-black text-white text-2xl uppercase tracking-tighter" style={{ textShadow: '3px 3px 0px #000' }}>
                    PREVIEW
                  </span>
                </div>
              </div>
            </div>

            {/* Banner grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {BANNER_OPTIONS.map((banner) => (
                <button
                  key={banner.id}
                  onClick={() => setSelectedBanner(banner.src)}
                  className={`relative group cursor-pointer transition-all ${
                    selectedBanner === banner.src
                      ? '-translate-y-1 -translate-x-1'
                      : 'hover:-translate-y-1 hover:-translate-x-1'
                  }`}
                >
                  <div
                    className={`border-4 overflow-hidden aspect-video ${
                      selectedBanner === banner.src
                        ? 'border-[#FF007F] shadow-[6px_6px_0px_#FF007F]'
                        : 'border-cs-black shadow-[4px_4px_0px_#000000] group-hover:shadow-[6px_6px_0px_#000000]'
                    } transition-all`}
                  >
                    {banner.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={banner.src} alt={banner.label} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full bg-[#FF007F] flex items-center justify-center"
                        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                      >
                        <span className="material-symbols-outlined text-white text-xl drop-shadow-lg">auto_awesome</span>
                      </div>
                    )}
                  </div>
                  {selectedBanner === banner.src && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#FF007F] border-2 border-cs-black flex items-center justify-center z-10">
                      <span className="material-symbols-outlined text-white text-sm font-black">check</span>
                    </div>
                  )}
                  <p className="font-display font-bold uppercase text-[10px] text-center mt-1.5 tracking-tight leading-tight">{banner.label}</p>
                </button>
              ))}
            </div>
          </section>
          
          {/* Avatar Selection */}
          <section className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 md:p-8">
            <h2 className="font-display font-black uppercase text-2xl mb-2 flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-[#FF007F]">face</span>
              CHOOSE YOUR AVATAR
            </h2>
            <p className="font-bold text-gray-500 mb-6">Pick a vibe that represents you.</p>
            
            <div className="grid grid-cols-4 gap-4">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.src)}
                  className={`relative group cursor-pointer transition-all ${
                    selectedAvatar === avatar.src
                      ? '-translate-y-2 -translate-x-1'
                      : 'hover:-translate-y-1 hover:-translate-x-1'
                  }`}
                >
                  <div
                    className={`border-4 overflow-hidden aspect-square ${
                      selectedAvatar === avatar.src
                        ? 'border-[#FF007F] shadow-[8px_8px_0px_#FF007F]'
                        : 'border-cs-black shadow-[6px_6px_0px_#000000] group-hover:shadow-[8px_8px_0px_#000000]'
                    } transition-all`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatar.src}
                      alt={avatar.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {selectedAvatar === avatar.src && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FF007F] border-3 border-cs-black flex items-center justify-center z-10">
                      <span className="material-symbols-outlined text-white text-lg font-black">check</span>
                    </div>
                  )}
                  <p className="font-display font-bold uppercase text-xs text-center mt-2 tracking-tight">{avatar.label}</p>
                </button>
              ))}
            </div>

            {selectedAvatar && (
              <button
                onClick={() => setSelectedAvatar('')}
                className="mt-4 text-sm font-bold uppercase text-gray-400 hover:text-[#FF007F] transition-colors cursor-pointer"
              >
                ✕ REMOVE AVATAR (USE INITIAL)
              </button>
            )}
          </section>

          {/* Personal Details */}
          <section className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 md:p-8">
            <h2 className="font-display font-black uppercase text-2xl mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-[#00FFFF]">edit</span>
              YOUR DETAILS
            </h2>

            <div className="space-y-6">
              {/* Display Name */}
              <div>
                <label className="block font-display font-black uppercase text-sm mb-2 tracking-wide">
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="What should we call you?"
                  maxLength={30}
                  className="w-full border-4 border-cs-black p-4 font-bold text-lg uppercase tracking-tight focus:outline-none focus:shadow-[6px_6px_0px_#00FFFF] focus:border-cs-black transition-shadow bg-[#f8f5f7] placeholder:text-gray-400 placeholder:normal-case"
                />
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase">{displayName.length}/30 characters</p>
              </div>

              {/* Gender */}
              <div>
                <label className="block font-display font-black uppercase text-sm mb-2 tracking-wide">
                  GENDER
                </label>
                <div className="flex flex-wrap gap-3">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setGender(opt.value)}
                      className={`px-5 py-3 border-4 font-display font-bold uppercase text-sm tracking-tight transition-all cursor-pointer ${
                        gender === opt.value
                          ? 'border-cs-black bg-[#FF007F] text-white shadow-[4px_4px_0px_#000000]'
                          : 'border-cs-black bg-white text-cs-black hover:bg-gray-50 shadow-[4px_4px_0px_#000000] hover:-translate-y-0.5'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block font-display font-black uppercase text-sm mb-2 tracking-wide">
                  AGE
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 150)) {
                      setAge(val);
                    }
                  }}
                  placeholder="Your age"
                  min="13"
                  max="150"
                  className="w-full max-w-[200px] border-4 border-cs-black p-4 font-bold text-lg tracking-tight focus:outline-none focus:shadow-[6px_6px_0px_#00FFFF] focus:border-cs-black transition-shadow bg-[#f8f5f7] placeholder:text-gray-400"
                />
              </div>

              {/* UID (read-only) */}
              {userHandle && (
                <div>
                  <label className="block font-display font-black uppercase text-sm mb-2 tracking-wide">
                    YOUR UID
                  </label>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 border-4 border-cs-black p-4 font-bold text-lg uppercase tracking-widest bg-cs-black text-[#00FFFF] flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#FF007F]">fingerprint</span>
                      {userHandle}
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(userHandle); setUidCopied(true); setTimeout(() => setUidCopied(false), 2000); }}
                      className="border-4 border-cs-black p-4 bg-white shadow-[4px_4px_0px_#000000] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000000] transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">{uidCopied ? 'check' : 'content_copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Share this UID with friends so they can find you</p>
                </div>
              )}

              {/* Email (read-only) */}
              <div>
                <label className="block font-display font-black uppercase text-sm mb-2 tracking-wide text-gray-400">
                  EMAIL (CAN&apos;T CHANGE)
                </label>
                <div className="w-full border-4 border-gray-200 p-4 font-bold text-lg text-gray-400 bg-gray-100">
                  {user.email}
                </div>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full md:w-auto bg-[#FF007F] text-white font-display font-black uppercase tracking-widest py-5 px-12 border-4 border-cs-black shadow-[8px_8px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] transition-all text-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                saving ? 'animate-pulse' : ''
              }`}
            >
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>

            <Link href="/profile" className="w-full md:w-auto">
              <button className="w-full bg-white text-cs-black font-display font-black uppercase tracking-widest py-5 px-12 border-4 border-cs-black shadow-[8px_8px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] transition-all text-xl cursor-pointer">
                CANCEL
              </button>
            </Link>

            {saved && (
              <div className="flex items-center gap-2 bg-[#00FFFF] border-4 border-cs-black px-6 py-3 shadow-[4px_4px_0px_#000000]">
                <span className="material-symbols-outlined text-xl font-black">check_circle</span>
                <span className="font-display font-black uppercase">SAVED!</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-[#FF007F] text-white border-4 border-cs-black px-6 py-3 shadow-[4px_4px_0px_#000000]">
                <span className="material-symbols-outlined text-xl font-black">error</span>
                <span className="font-display font-black uppercase text-sm">{error}</span>
              </div>
            )}
          </div>

          <div className="h-8"></div>
        </div>
      </main>
    </div>
  );
}
