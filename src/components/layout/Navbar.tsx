'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div id="navbar"
      className="relative flex h-auto w-full flex-col bg-cs-yellow group/design-root border-b-4 border-cs-black z-50 sticky top-0"
    >
      <div className="flex h-full grow flex-col w-full">
        <div className="px-4 md:px-10 flex flex-1 justify-center py-0 w-full">
          <div className="flex flex-col w-full flex-1 max-w-[1600px]">
            <header className="flex items-center justify-between whitespace-nowrap py-4">
              <Link href="/" className="flex items-center gap-4 decoration-none text-cs-black">
                <div
                  className="w-8 h-8 font-black text-2xl flex items-center justify-center border-4 border-cs-black bg-white shadow-[4px_4px_0px_#000000]">
                  <span className="material-symbols-outlined text-lg font-black"
                    style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
                </div>
                <h2 className="text-cs-black text-2xl font-black leading-tight tracking-[-0.05em] uppercase m-0">crowdsense</h2>
              </Link>
              <div className="flex flex-1 justify-end gap-8">
                <div className="hidden md:flex items-center gap-6">
                  <Link className="text-cs-black text-lg font-bold leading-normal uppercase hover:bg-cs-cyan px-3 py-1 border-4 border-transparent hover:border-cs-black hover:shadow-brutal transition-all"
                    href="/discover">Discover</Link>
                  <Link className="text-cs-black text-lg font-bold leading-normal uppercase hover:bg-cs-cyan px-3 py-1 border-4 border-transparent hover:border-cs-black hover:shadow-brutal transition-all"
                    href="/explore">Explore</Link>
                  <Link className="text-cs-black text-lg font-bold leading-normal uppercase hover:bg-cs-cyan px-3 py-1 border-4 border-transparent hover:border-cs-black hover:shadow-brutal transition-all"
                    href="/my-trips">My Trips</Link>
                </div>
                {user ? (
                  <div className="flex items-center gap-4">
                     <button onClick={handleLogout} className="text-cs-black font-black uppercase text-sm border-4 border-cs-black bg-white px-3 py-2 hover:bg-[#f90680] hover:text-white shadow-[4px_4px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer">
                        LOGOUT
                     </button>
                     <Link href="/profile" className="bg-center bg-no-repeat aspect-square bg-cover rounded-none w-12 h-12 border-4 border-cs-black shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0 active:shadow-none transition-all cursor-pointer bg-[#00FFFF] flex items-center justify-center overflow-hidden">
                        {user.user_metadata?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-black text-2xl uppercase">{user.user_metadata?.name?.charAt(0) || user.email?.charAt(0) || 'U'}</span>
                        )}
                     </Link>
                  </div>
                ) : (
                  <Link href="/login" prefetch={true}
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-none w-12 h-12 border-4 border-cs-black shadow-[8px_8px_0px_#000000] cursor-pointer bg-white flex items-center justify-center hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] transition-all">
                    <span className="material-symbols-outlined text-3xl font-black text-cs-black">person</span>
                  </Link>
                )}
              </div>
            </header>
          </div>
        </div>
      </div>
    </div>
  );
}
