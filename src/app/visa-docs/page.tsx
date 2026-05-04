'use client';

import { useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';

type VisaType = 'visa-free' | 'eta' | 'visa-required';

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  optional?: boolean;
};

type RouteResult = {
  originInput: string;
  destinationInput: string;
  originCountry: string;
  destinationCountry: string;
  tripType: 'domestic' | 'international';
  visaType?: VisaType;
};

type DestinationHealth = {
  country: string;
  aliases: string[];
  advisories: ChecklistItem[];
};

const placeAliases: Record<string, string[]> = {
  japan: ['japan', 'tokyo', 'kyoto', 'osaka', 'hiroshima', 'sapporo', 'nara', 'yokohama', 'fukuoka'],
  'united states': ['united states', 'usa', 'us', 'new york', 'los angeles', 'san francisco', 'chicago', 'miami', 'seattle', 'boston'],
  france: ['france', 'paris', 'nice', 'lyon', 'marseille'],
  italy: ['italy', 'rome', 'milan', 'venice', 'florence', 'naples'],
  spain: ['spain', 'barcelona', 'madrid', 'seville', 'valencia'],
  germany: ['germany', 'berlin', 'munich', 'hamburg', 'frankfurt'],
  netherlands: ['netherlands', 'amsterdam', 'rotterdam'],
  'united arab emirates': ['united arab emirates', 'uae', 'dubai', 'abu dhabi', 'sharjah'],
  thailand: ['thailand', 'bangkok', 'phuket', 'chiang mai', 'krabi', 'pattaya'],
  india: ['india', 'delhi', 'new delhi', 'mumbai', 'goa', 'jaipur', 'varanasi', 'kolkata', 'chennai', 'bengaluru', 'bangalore', 'hyderabad']
};

const schengenCountries = ['france', 'italy', 'spain', 'germany', 'netherlands'];

const visaLookup: Record<string, { visaFree: string[]; eta: string[]; visaRequired: string[]; processingTime?: string }> = {
  japan: {
    visaFree: ['united states', 'france', 'italy', 'spain', 'germany', 'netherlands', 'united arab emirates'],
    eta: [],
    visaRequired: ['india', 'thailand'],
    processingTime: '5-7 Business Days'
  },
  'united states': {
    visaFree: [],
    eta: ['japan', 'france', 'italy', 'spain', 'germany', 'netherlands'],
    visaRequired: ['india', 'thailand', 'united arab emirates'],
    processingTime: 'Visa interviews can take several weeks'
  },
  'united arab emirates': {
    visaFree: ['united states', 'japan', 'france', 'italy', 'spain', 'germany', 'netherlands'],
    eta: ['india', 'thailand'],
    visaRequired: [],
    processingTime: '2-5 Business Days'
  },
  thailand: {
    visaFree: ['united states', 'japan', 'france', 'italy', 'spain', 'germany', 'netherlands'],
    eta: ['india'],
    visaRequired: [],
    processingTime: 'Same day to 7 Business Days'
  },
  india: {
    visaFree: [],
    eta: ['united states', 'japan', 'france', 'italy', 'spain', 'germany', 'netherlands', 'united arab emirates', 'thailand'],
    visaRequired: [],
    processingTime: '3-5 Business Days'
  },
  schengen: {
    visaFree: ['united states', 'japan', 'united arab emirates'],
    eta: [],
    visaRequired: ['india', 'thailand'],
    processingTime: '15 Business Days is common after appointment'
  }
};

const healthData: DestinationHealth[] = [
  {
    country: 'japan',
    aliases: placeAliases.japan,
    advisories: [
      { id: 'routine-vaccines', title: 'Routine Vaccines', description: 'Keep routine vaccinations current before departure.', icon: 'vaccines' },
      { id: 'travel-insurance-health', title: 'Travel Medical Coverage', description: 'Carry medical coverage for clinics, medicine, and emergencies.', icon: 'health_and_safety' }
    ]
  },
  {
    country: 'united states',
    aliases: placeAliases['united states'],
    advisories: [
      { id: 'travel-insurance-health', title: 'Travel Medical Coverage', description: 'Healthcare can be expensive; carry strong coverage.', icon: 'health_and_safety' }
    ]
  },
  {
    country: 'india',
    aliases: placeAliases.india,
    advisories: [
      { id: 'routine-vaccines', title: 'Routine Vaccines', description: 'Keep routine vaccinations current before travel.', icon: 'vaccines' },
      { id: 'food-water', title: 'Food & Water Precautions', description: 'Pack basic medication and avoid unsafe water sources.', icon: 'water_drop' }
    ]
  },
  {
    country: 'thailand',
    aliases: placeAliases.thailand,
    advisories: [
      { id: 'routine-vaccines', title: 'Routine Vaccines', description: 'Keep routine vaccines up to date.', icon: 'vaccines' },
      { id: 'mosquito-precautions', title: 'Mosquito Precautions', description: 'Pack repellent for tropical areas.', icon: 'pest_control' }
    ]
  },
  {
    country: 'united arab emirates',
    aliases: placeAliases['united arab emirates'],
    advisories: [
      { id: 'travel-insurance-health', title: 'Travel Medical Coverage', description: 'Recommended for medical emergencies and delays.', icon: 'health_and_safety' }
    ]
  },
  {
    country: 'schengen',
    aliases: ['schengen', ...schengenCountries, 'paris', 'rome', 'barcelona', 'berlin', 'amsterdam'],
    advisories: [
      { id: 'insurance-certificate', title: 'Insurance Certificate', description: 'Carry proof of medical travel insurance.', icon: 'verified_user' }
    ]
  }
];

const domesticDocuments: ChecklistItem[] = [
  { id: 'government-id', title: 'Government ID', description: 'Valid domestic photo ID for flights, hotels, and checkpoints.', icon: 'badge' },
  { id: 'travel-booking', title: 'Travel Booking Confirmation', description: 'Train, bus, flight, or route booking confirmation.', icon: 'confirmation_number' },
  { id: 'accommodation-proof', title: 'Accommodation Proof', description: 'Hotel, rental, or host confirmation if staying overnight.', icon: 'hotel', optional: true }
];

const visaFreeDocuments: ChecklistItem[] = [
  { id: 'passport', title: 'Passport', description: 'Valid passport for international entry.', icon: 'badge' },
  { id: 'return-ticket', title: 'Return Ticket', description: 'Confirmed onward or return travel proof.', icon: 'confirmation_number' },
  { id: 'travel-insurance', title: 'Travel Insurance', description: 'Medical and trip coverage for the destination.', icon: 'health_and_safety', optional: true },
  { id: 'proof-of-funds', title: 'Proof of Funds', description: 'Bank statement, card, or cash proof if requested.', icon: 'account_balance', optional: true }
];

const etaDocuments: ChecklistItem[] = [
  { id: 'passport', title: 'Passport', description: 'Valid passport for international entry.', icon: 'badge' },
  { id: 'eta-approval', title: 'ETA Approval Email', description: 'Printed or digital pre-arrival approval.', icon: 'approval' },
  { id: 'return-ticket', title: 'Return Ticket', description: 'Confirmed onward or return travel proof.', icon: 'confirmation_number' },
  { id: 'travel-insurance', title: 'Travel Insurance', description: 'Medical and trip coverage for the destination.', icon: 'health_and_safety' }
];

const visaRequiredDocuments: ChecklistItem[] = [
  { id: 'passport', title: 'Passport', description: 'Valid passport with blank visa pages.', icon: 'badge' },
  { id: 'visa-stamp', title: 'Visa Stamp', description: 'Approved embassy visa sticker or stamped visa.', icon: 'fact_check' },
  { id: 'return-ticket', title: 'Return Ticket', description: 'Confirmed onward or return travel proof.', icon: 'confirmation_number' },
  { id: 'proof-of-funds', title: 'Proof of Funds', description: 'Recent bank statements showing sufficient funds.', icon: 'account_balance' },
  { id: 'travel-insurance', title: 'Travel Insurance', description: 'Medical and trip coverage for the destination.', icon: 'health_and_safety' },
  { id: 'hotel-booking', title: 'Hotel Booking', description: 'Accommodation proof for the full stay.', icon: 'hotel' },
  { id: 'employment-income-proof', title: 'Employment/Income Proof', description: 'Salary slips, employment letter, or business income proof.', icon: 'work' },
  { id: 'noc-letter', title: 'NOC Letter', description: 'No-objection letter from employer, school, or sponsor if needed.', icon: 'description' }
];

const normalize = (value: string) => value.trim().toLowerCase();

const resolvePlaceCountry = (place: string) => {
  const normalizedPlace = normalize(place);
  if (!normalizedPlace) return '';

  const match = Object.entries(placeAliases).find(([, aliases]) => (
    aliases.some(alias => normalizedPlace.includes(alias))
  ));

  if (match) return match[0];
  if (schengenCountries.some(country => normalizedPlace.includes(country))) return normalizedPlace;

  return normalizedPlace;
};

const getVisaLookupKey = (country: string) => (
  schengenCountries.includes(country) ? 'schengen' : country
);

const getVisaType = (originCountry: string, destinationCountry: string): VisaType => {
  const lookup = visaLookup[getVisaLookupKey(destinationCountry)];
  if (!lookup) return 'visa-required';
  if (lookup.visaFree.includes(originCountry)) return 'visa-free';
  if (lookup.eta.includes(originCountry)) return 'eta';
  return 'visa-required';
};

const getDocumentsForVisaType = (visaType: VisaType) => {
  if (visaType === 'visa-free') return visaFreeDocuments;
  if (visaType === 'eta') return etaDocuments;
  return visaRequiredDocuments;
};

const getHealthAdvisories = (destinationCountry: string) => {
  const lookupKey = getVisaLookupKey(destinationCountry);
  return healthData.find(item => item.country === lookupKey)?.advisories || [
    { id: 'routine-vaccines', title: 'Routine Vaccines', description: 'Confirm routine travel vaccines are up to date.', icon: 'vaccines' }
  ];
};

const getVisaPresentation = (result: RouteResult) => {
  if (result.visaType === 'visa-free') {
    return {
      badge: 'VISA FREE',
      summary: 'No application needed before travel.',
      detail: 'Carry entry documents and be ready for standard border checks.',
      className: 'bg-green-500 text-cs-black'
    };
  }

  if (result.visaType === 'eta') {
    return {
      badge: 'ETA REQUIRED',
      summary: 'Pre-arrival online application required.',
      detail: `Processing Time: ${visaLookup[getVisaLookupKey(result.destinationCountry)]?.processingTime || 'Check official guidance'}`,
      className: 'bg-orange-400 text-cs-black'
    };
  }

  return {
    badge: 'VISA REQUIRED',
    summary: 'Full embassy or consulate application required.',
    detail: `Processing Time: ${visaLookup[getVisaLookupKey(result.destinationCountry)]?.processingTime || 'Check official guidance'}`,
    className: 'bg-[#f90680] text-white'
  };
};

export default function VisaDocsPage() {
  const [nationality, setNationality] = useState('');
  const [destination, setDestination] = useState('');
  const [checkedDocs, setCheckedDocs] = useState<string[]>([]);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);

  const documents = useMemo(() => {
    if (!routeResult) return [];
    if (routeResult.tripType === 'domestic') return domesticDocuments;
    return getDocumentsForVisaType(routeResult.visaType || 'visa-required');
  }, [routeResult]);

  const healthAdvisories = useMemo(() => (
    routeResult?.tripType === 'international'
      ? getHealthAdvisories(routeResult.destinationCountry)
      : []
  ), [routeResult]);

  const completedCount = checkedDocs.filter(id => documents.some(doc => doc.id === id)).length;

  const handleGenerate = () => {
    const originCountry = resolvePlaceCountry(nationality);
    const destinationCountry = resolvePlaceCountry(destination);
    if (!originCountry || !destinationCountry) return;

    const tripType = originCountry === destinationCountry ? 'domestic' : 'international';
    setCheckedDocs([]);
    setRouteResult({
      originInput: nationality.trim(),
      destinationInput: destination.trim(),
      originCountry,
      destinationCountry,
      tripType,
      visaType: tripType === 'international' ? getVisaType(originCountry, destinationCountry) : undefined
    });
  };

  const toggleDocument = (id: string) => {
    setCheckedDocs(prev => (
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    ));
  };

  const visaPresentation = routeResult?.tripType === 'international'
    ? getVisaPresentation(routeResult)
    : null;

  return (
    <div className="bg-cs-yellow min-h-screen font-body text-cs-black pb-24 selection:bg-cs-black selection:text-[#f90680]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-12">
        <header className="flex flex-col gap-4">
          <button
            onClick={() => window.history.back()}
            className="inline-flex self-start items-center gap-2 bg-white border-4 border-cs-black px-4 py-2 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 transition-all"
          >
            <span className="material-symbols-outlined text-cs-black font-bold">arrow_back</span>
            Back
          </button>
          <h1 className="font-display font-black text-6xl md:text-8xl tracking-tighter uppercase leading-none text-black">
            VISA &<br className="md:hidden" /> DOCS
          </h1>
          <p className="font-bold text-xl max-w-3xl border-l-8 border-[#f90680] pl-5 text-cs-black/80">
            Pick your country and destination. CrowdSense will show only the docs that fit the route.
          </p>
        </header>

        <section className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block font-display font-black text-xl uppercase mb-3 tracking-tight">Nationality</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-3xl z-10">public</span>
                <input
                  className="w-full border-4 border-cs-black bg-gray-100 p-4 pl-14 text-xl font-bold uppercase outline-none focus:border-cs-cyan"
                  placeholder="User country"
                  value={nationality}
                  onChange={event => setNationality(event.target.value)}
                  type="text"
                />
              </div>
            </div>

            <div>
              <label className="block font-display font-black text-xl uppercase mb-3 tracking-tight">Destination</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-3xl z-10">flight_land</span>
                <input
                  className="w-full border-4 border-cs-black bg-gray-100 p-4 pl-14 text-xl font-bold uppercase outline-none focus:border-cs-cyan"
                  placeholder="Travel country"
                  value={destination}
                  onChange={event => setDestination(event.target.value)}
                  type="text"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-5 text-2xl font-display font-black uppercase tracking-tight flex items-center justify-center gap-2 bg-[#f90680] text-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all"
          >
            Generate Checklist
            <span className="material-symbols-outlined text-3xl">arrow_forward</span>
          </button>
        </section>

        {!routeResult ? (
          <section className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-8 md:p-12 min-h-80 flex flex-col items-center justify-center text-center gap-4">
            <span className="material-symbols-outlined text-7xl text-[#f90680]">travel_explore</span>
            <h2 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tighter">
              Choose Your Destinations, We Will Guide You Through Docs
            </h2>
          </section>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 flex flex-col gap-8">
              {routeResult.tripType === 'domestic' ? (
                <div className="bg-cs-cyan border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <h2 className="font-display font-black text-4xl uppercase tracking-tighter">No Visa Required</h2>
                  </div>
                  <p className="font-bold text-lg uppercase">
                    Domestic trip detected: {routeResult.originInput} to {routeResult.destinationInput}.
                  </p>
                </div>
              ) : visaPresentation && (
                <div className="bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 md:p-8 flex flex-col min-h-[360px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="material-symbols-outlined text-9xl">fact_check</span>
                  </div>
                  <h2 className="font-display font-black text-3xl uppercase tracking-tighter mb-6 relative z-10">Visa Status</h2>
                  <div className="flex-grow flex items-center justify-center py-10 relative z-10">
                    <div className={`${visaPresentation.className} border-4 border-cs-black px-6 py-4 -rotate-3`}>
                      <span className="font-display font-black text-4xl uppercase tracking-tighter block text-center">{visaPresentation.badge}</span>
                    </div>
                  </div>
                  <div className="mt-auto pt-6 border-t-4 border-cs-black relative z-10">
                    <p className="font-bold text-lg uppercase">{visaPresentation.summary}</p>
                    <p className="font-bold text-cs-black/60 mt-2">{visaPresentation.detail}</p>
                  </div>
                </div>
              )}

              {routeResult.tripType === 'international' && (
                <div className="bg-cs-cyan border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 md:p-8 flex flex-col relative overflow-hidden group">
                  <div className="absolute -right-10 -bottom-10 opacity-20 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[150px]">health_and_safety</span>
                  </div>
                  <h2 className="font-display font-black text-3xl uppercase tracking-tighter mb-6 relative z-10">Health & Safety</h2>
                  <ul className="space-y-4 relative z-10">
                    {healthAdvisories.map(item => (
                      <li key={item.id} className="flex items-start gap-4 bg-white border-4 border-cs-black p-3 hover:-translate-y-1 transition-transform">
                        <div className="w-10 h-10 border-4 border-cs-black flex items-center justify-center bg-white flex-shrink-0">
                          <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                        </div>
                        <div>
                          <span className="font-bold text-lg uppercase leading-tight block">{item.title}</span>
                          <span className="font-bold text-sm text-cs-black/60 block mt-1">{item.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="lg:col-span-8 bg-white border-4 border-cs-black shadow-[8px_8px_0px_#000000] p-6 md:p-10">
              <div className="flex justify-between items-end gap-4 mb-8 border-b-4 border-cs-black pb-4">
                <h2 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tighter">Required Documents</h2>
                <span className="font-display font-black text-2xl text-cs-black bg-[#ff709e] px-3 py-1 border-2 border-cs-black whitespace-nowrap">
                  {completedCount}/{documents.length}
                </span>
              </div>

              <div className="space-y-4">
                {documents.map(doc => {
                  const checked = checkedDocs.includes(doc.id);

                  return (
                    <label key={doc.id} className="flex items-start gap-4 md:gap-6 group cursor-pointer p-4 hover:bg-gray-100 transition-colors">
                      <div className="relative mt-1">
                        <input
                          className="sr-only"
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDocument(doc.id)}
                        />
                        <div className={`w-11 h-11 border-4 border-cs-black transition-colors flex items-center justify-center ${checked ? 'bg-[#f90680]' : 'bg-white'}`}>
                          <span className={`material-symbols-outlined text-white text-3xl font-bold transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}>check</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="material-symbols-outlined text-3xl text-cs-black group-hover:text-[#f90680]">{doc.icon}</span>
                          <h3 className="font-display font-black text-2xl uppercase group-hover:text-[#f90680] transition-colors tracking-tight">{doc.title}</h3>
                          {doc.optional && (
                            <span className="bg-cs-cyan border-2 border-cs-black px-2 py-1 font-black text-xs uppercase">Optional</span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-cs-black/60 mt-1">{doc.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {routeResult.tripType === 'international' && (
                <div className="mt-8 border-4 border-cs-black bg-cs-yellow p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-3xl text-[#f90680] flex-shrink-0">warning</span>
                  <p className="font-bold text-sm uppercase leading-snug">
                    Planning guide only. Visa and health rules change often, so verify final requirements with the official embassy, consulate, or government travel site before booking.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
