import Link from 'next/link';
import { Trip } from '@/lib/types';

interface TripCardProps {
  trip: Trip;
  accentColor?: string; // e.g. 'bg-cs-yellow', 'bg-cs-cyan', 'bg-primary'
  badgePosition?: 'left' | 'right';
}

export default function TripCard({ trip, accentColor = 'bg-cs-white', badgePosition = 'right' }: TripCardProps) {
  const badgeColors = ['bg-cs-yellow', 'bg-cs-cyan', 'bg-primary'];
  const badgeColor = badgeColors[trip.id.length % badgeColors.length]; // Deterministic random color
  
  return (
    <Link href={`/trip/${trip.id}`} className="block w-full">
      <article className={`${accentColor} border-4 border-cs-black shadow-[8px_8px_0px_#000000] flex flex-col cursor-pointer group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] transition-all min-h-[320px] overflow-hidden`}>
        <div className="h-[200px] w-full border-b-4 border-cs-black overflow-hidden relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            alt={trip.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            src={trip.imageUrl}
          />
          <div className={`absolute top-4 ${badgePosition === 'right' ? 'right-4' : 'left-4'} ${badgeColor} border-4 border-cs-black px-3 py-1 text-sm font-bold uppercase`}>
            {trip.days} DAYS
          </div>
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-2xl lg:text-[28px] font-black uppercase mb-2 leading-tight tracking-[-0.05em]">{trip.title}</h3>
          {trip.desc && <p className="font-semibold text-lg line-clamp-2 mb-4">{trip.desc}</p>}
          
          <div className="mt-auto pt-4 flex items-center gap-4 border-t-4 border-transparent">
            <div className="size-10 border-4 border-cs-black rounded-full overflow-hidden shrink-0 bg-cs-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                alt={`${trip.curator.handle}'s Avatar`} 
                className="w-full h-full object-cover" 
                src={trip.curator.avatar}
              />
            </div>
            <span className="font-bold text-sm uppercase truncate">BY {trip.curator.handle}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
