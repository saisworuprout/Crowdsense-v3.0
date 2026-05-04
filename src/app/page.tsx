import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import TripCard from '@/components/ui/TripCard';
import { Trip } from '@/lib/types';
import Link from 'next/link';

const featuredTrips: Trip[] = [
  {
    id: 'tokyo-neon-ramen-run',
    title: 'Tokyo Neon Ramen Run',
    days: 7,
    handle: '@STREETFOOD_NINJA',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTHtenxpXnFJupvPOLXp1rnLGua1J6jBYmKsop3LqfEC7lwm8IPy4twqvNGkRKkPEpaQKVMul0wKffmBKCvdTNCl767oHshC3NonEgDKR7Bf_CGH9jfTrw67bu6L3l_Xhlxwep0E5ZZZ00WnrcENfFRw4XmUUw9Eom9fozigIFQQTowsTa1DhzrlFwZ_C2VsHbbOFtdXsPeTJpRyTOLlGmQ1NKqShGngG47N07J3mIF8io6M2BGAGjo35xBqC8sosK-4azgCZXrxw',
    curator: {
      handle: '@STREETFOOD_NINJA',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOc5f3iVR5RGBGV6DS3wnZWZKN3nwSIP7zk1zXMwlq23wY7M8XW_HKWSye8qIilP8pVYs7aW4Zwc5Rwp0J-646Oy3NnSLBHvbXU05hSiXoIAO_akjTJdbyNWseDMyKI_C-bdGaFEokdu0GNBxPeNAE_e6DAZczKGY-KGnpz8F-HVLJ8Dyz_zxRfJIE1gZS0CBIgyvIi350hlB6_ABwK9XgrPovXn2qyT8ODiDEqcD3fdjwSIrByh0DyNkWcORDOcHEpA6s0dnvQNg'
    }
  },
  {
    id: 'berlin-tresor-weekender',
    title: 'Berlin Tresor Weekender',
    days: 3,
    handle: '@TECHNO_RAT',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCwyivRYeFlQ5bSynbRAn8dwh5vx2dseXwmcnzj72TJefSA1S_IUrjr7gqrsYBGt56aW0caMcCTI8t5WZ-C20v1UNhloR6XH0N4_EnygoRa6NGSShfw93-LzRRg1q0Wbf_UBeTN6RB9S9sHNonlNAmlTHVx228yeJBuElZoFCz611TNRSv8NwDdDMaeqcIaoxMOp6UrwAfDgXBpVhgLjQ77bDxNCnUqpOOPDha-CqdU48qxNsASI6ZnAC2qUqwWKT6b5RJtz69REM',
    curator: {
      handle: '@TECHNO_RAT',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjYSFHJsp9j-8oGtWqwntqLCMWYTD6aIUuz-k9G0h7VXvsIbXRltl6xXJT7sMo9pbaijweeJUNJAmbOOR35fhRcO_EI6Dp_DdKfMmGWbmzriXSowM6A_kfZPi-lWqmDOZy5cjw9j4GWGIvzVvmvCcU-ErRjjdzsOOWRyYe4cZBoVkAFlov49roZUJP7zlzDjmXg8QlLdNl96eNVhPFx5vTys1KhYbeGDNPDc7_hoprdjuF99cHfpu5s_ZTmd-xxgWym5eyCjAqOSU'
    }
  },
  {
    id: 'oaxaca-mezcal-trail-expedition',
    title: 'Oaxaca Mezcal Trail Expedition',
    days: 14,
    handle: '@DESERT_WANDERER',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUK18n3W4Z4VnHt-cQf5xqok68lp4pOinavUdEH1SwX6ArviFY0QIPBqSwrsOWUCueSP-ywmTSOGwLIxuzuWnlGTMJLVngfPZj194-9lo2wSLwU_E8F-dDIDctgm-gnKfkIA5mWy6Dd68XcypAn2okkonRcqPtT_OoAkzMcVr9Fw6gASe-rBkYVfn2ODh28_v0IdDgTDb5h7Qe_5ODV_EYRwn3-HXFKubctqYLt8XFj4XjEvRMk98-Qhf-BQmrguTZRshtCto9hss',
    curator: {
      handle: '@DESERT_WANDERER',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_HtnTxumDizNEkiJOwMzyD6MIS23kAEOfY9x6bi8qYGZTLSMIhbzPMXKc1vInSVPi_hui4O7Fhsog8L5OPxyv6NvaVEIEAQrjn2qrmpCtFfCgg4sj2CADFj4L-6vqeWa-pcgdR7sVJxHHVJqxsDsNR_rXZDUbX8z5fsIFCl2szSK2ilCdmEXdbGY6AGhNZTQLwIxGb-wsrAeq8PJ8s7MhlFR9p5WoJ79s46ssIeAqojiedpVTIAc7801a4iyqYEWIMAw9KKAsmzQ'
    }
  }
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative flex min-h-[calc(100vh-88px)] w-full flex-col items-center justify-center bg-[#FFD700] px-6 py-20 border-b-4 border-cs-black overflow-hidden">
          <div className="landing-motion-bg" aria-hidden="true">
            <div className="landing-globe">
              <div className="landing-globe-line landing-globe-line-a"></div>
              <div className="landing-globe-line landing-globe-line-b"></div>
              <div className="landing-globe-line landing-globe-line-c"></div>
            </div>
            <div className="landing-orbit landing-orbit-a">
              <span className="material-symbols-outlined landing-plane">flight</span>
            </div>
            <div className="landing-orbit landing-orbit-b">
              <span className="material-symbols-outlined landing-plane">flight</span>
            </div>
            <div className="landing-orbit landing-orbit-c">
              <span className="material-symbols-outlined landing-plane">flight</span>
            </div>
            <div className="landing-route landing-route-a"></div>
            <div className="landing-route landing-route-b"></div>
            <div className="landing-route landing-route-c"></div>
          </div>

          <div className="relative z-10 flex max-w-[960px] flex-col items-center gap-8 text-center">
            <h1 className="text-cs-black text-5xl md:text-7xl lg:text-[88px] font-black uppercase leading-[0.9] tracking-[-0.05em] max-w-[800px]">
              PLAN TRIPS.<br />NO BORING STUFF.
            </h1>
            <p className="text-cs-black text-xl md:text-2xl font-bold max-w-[600px]">
              The crowdsourced itinerary builder for people who actually like having fun.
            </p>
            <Link href="/discover">
              <Button variant="primary" className="mt-8">
                START PLANNING
              </Button>
            </Link>
          </div>
        </section>

        {/* Featured Trips Section */}
        <section className="w-full bg-[#00FFFF] px-6 py-24 md:px-10">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-16 flex items-center justify-between border-4 border-cs-black bg-white p-6 shadow-[8px_8px_0px_#000000]">
              <h2 className="text-cs-black text-4xl md:text-5xl font-black uppercase tracking-tighter m-0">COMMUNITY VIBES</h2>
              <span className="material-symbols-outlined text-4xl hidden md:block" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_fire_department
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredTrips.map((trip, index) => (
                <TripCard 
                  key={trip.id} 
                  trip={trip} 
                  accentColor={index === 1 ? 'bg-cs-yellow' : 'bg-white'} 
                />
              ))}
            </div>
            
            <div className="mt-16 flex justify-center">
              <Link href="/discover">
                <Button variant="white" icon="arrow_forward">
                  VIEW MORE TRIPS
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
