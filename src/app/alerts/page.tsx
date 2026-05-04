'use client';

import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { useState } from 'react';

// ============================================================
// API CONFIGURATION
// We now point directly to the Next.js internal API route
// ============================================================
const API_BASE_URL = '/api';

interface PopularTimesDay {
  name: string;
  data: number[];
}

interface PopularTimesData {
  name: string;
  address?: string;
  current_popularity: number | null;
  populartimes: PopularTimesDay[];
  current_wait_time: number | null;
}

// ============================================================
// MOCK DATA - Fallback when API is unavailable
// ============================================================
const MOCK_DATA: PopularTimesData = {
  "name": "Amber Fort",
  "address": "Jaipur, India",
  "current_popularity": 67,
  "populartimes": [
    {"name": "Monday", "data": [0,0,0,0,0,0,8,15,28,45,62,75,82,78,65,55,42,35,20,12,8,4,0,0]},
    {"name": "Tuesday", "data": [0,0,0,0,0,0,10,18,32,48,65,78,85,80,68,58,45,38,22,14,9,5,0,0]},
    {"name": "Wednesday", "data": [0,0,0,0,0,0,12,22,35,52,68,80,88,82,72,62,48,40,25,16,10,6,0,0]},
    {"name": "Thursday", "data": [0,0,0,0,0,0,9,16,30,46,63,76,83,79,66,56,43,36,21,13,8,4,0,0]},
    {"name": "Friday", "data": [0,0,0,0,0,0,15,28,42,58,72,85,92,88,78,68,55,48,32,22,15,10,0,0]},
    {"name": "Saturday", "data": [0,0,0,0,0,0,18,32,48,65,80,92,98,95,88,78,65,55,40,28,20,14,0,0]},
    {"name": "Sunday", "data": [0,0,0,0,0,0,20,35,52,70,82,90,95,92,85,75,62,52,38,25,18,12,0,0]}
  ],
  "current_wait_time": 12
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Returns lowest non-zero consecutive 2-hour window from today's data
 */
function getBestTime(hourlyData: number[]) {
  if (!hourlyData || hourlyData.length === 0) return { start: '9', end: '11', startHour: 9, endHour: 11 };

  let bestWindow = { start: '9', end: '11', startHour: 9, endHour: 11, minAvg: Infinity };

  // Only check 6 AM to 8 PM (index 6 to 20)
  for (let i = 6; i <= 18; i++) {
    const hour1 = hourlyData[i] || 0;
    const hour2 = hourlyData[i + 1] || 0;

    if (hour1 > 0 || hour2 > 0) {
      const avg = (hour1 + hour2) / 2;
      if (avg < bestWindow.minAvg) {
        bestWindow = {
          start: String(i),
          end: String(i + 2),
          startHour: i,
          endHour: i + 2,
          minAvg: avg
        };
      }
    }
  }

  // Format to 12-hour AM/PM
  const formatHour = (h: number) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    if (h > 12) return `${h - 12} PM`;
    return `${h} AM`;
  };

  return {
    start: formatHour(bestWindow.startHour),
    end: formatHour(bestWindow.endHour)
  };
}

/**
 * Returns "Ghost Town" / "Moderate" / "Busy" / "Packed"
 */
function getCrowdLabel(score: number | null | undefined) {
  if (score === 0 || score === undefined || score === null) return 'Unknown';
  if (score < 25) return 'Ghost Town';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'Busy';
  return 'Packed';
}

/**
 * Returns hex color based on crowd score
 * Oatmeal → Sage → Amber → Terracotta
 */
function getCrowdColor(score: number | null | undefined) {
  if (score === 0 || score === undefined || score === null) return '#90EE90'; // Light sage for no data
  if (score < 25) return '#8FBC8F'; // Dark sea green (sage)
  if (score < 50) return '#DAA520'; // Goldenrod (amber)
  if (score < 75) return '#CD853F'; // Peru (terracotta-ish)
  return '#B22222'; // Firebrick (packed)
}

/**
 * Format hour index to readable time (6AM to 10PM)
 */
function formatHourLabel(hourIndex: number) {
  if (hourIndex < 6 || hourIndex > 22) return '';
  const h = hourIndex % 12 || 12;
  const ampm = hourIndex < 12 ? 'A' : 'P';
  return `${h}${ampm}`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function Alerts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [data, setData] = useState<PopularTimesData | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{ hour: number; value: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; value: number } | null>(null);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Get current day index (0=Monday, 6=Sunday in our data)
  const getCurrentDayIndex = () => {
    const today = new Date().getDay(); // 0=Sunday, 1=Monday...
    if (today === 0) return 6; // Sunday = index 6
    return today - 1; // Monday=0, Tuesday=1, etc.
  };

  // Handle search
  const handleScan = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // ============================================================
      // API CALL
      // ============================================================
      console.log(`[CrowdSense] Fetching: ${API_BASE_URL}/crowd?place=${encodeURIComponent(searchQuery)}`);

      const response = await fetch(`${API_BASE_URL}/crowd?place=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      console.log(`[CrowdSense] Response status: ${response.status}`);

      const result = await response.json();
      console.log('[CrowdSense] API Response:', result);

      if (result.error) {
        throw new Error(result.message || result.error);
      }

      setData(result);
      setSelectedDayIndex(getCurrentDayIndex());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[CrowdSense] Error:', message);
      // Fallback to mock data on any error
      setData(MOCK_DATA);
      setSelectedDayIndex(getCurrentDayIndex());
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Use mock data by default on mount
  const displayData = data || MOCK_DATA;

  // Get today's data for the gauge
  const currentDayData = displayData?.populartimes?.[selectedDayIndex]?.data || [];
  const currentHour = new Date().getHours();
  const bestTime = getBestTime(currentDayData);

  // Handle null current_popularity
  const hasLiveData = displayData?.current_popularity !== null && displayData?.current_popularity !== undefined;
  const currentLabel = hasLiveData ? getCrowdLabel(displayData?.current_popularity) : 'LIVE DATA UNAVAILABLE';
  const currentColor = hasLiveData ? getCrowdColor(displayData?.current_popularity) : '#90EE90';

  // Calculate needle rotation for gauge (0-100 maps to -90 to 90 degrees)
  const needleRotation = hasLiveData ? ((displayData!.current_popularity!) / 100) * 180 - 90 : -90;

  // Filter hourly data for bar chart (6 AM to 10 PM only)
  const filteredHourlyData = currentDayData.slice(6, 23);

  // Find max for scaling
  const maxValue = Math.max(...filteredHourlyData.filter((v: number) => v > 0), 50);

  // Generate radar dots based on popularity
  const radarDots = (() => {
    if (isLoading) return [];
    // More dots for high popularity, divided by 5 instead of 10
    const numDots = hasLiveData ? Math.max(1, Math.floor((displayData?.current_popularity || 0) / 4)) : 2;
    const dots = [];
    const colors = ['#FF007F', '#00FFFF', '#00AA00', '#FFD700', '#FF8C00', '#FF00FF'];
    
    let seed = 0;
    if (displayData?.name) {
      for (let i = 0; i < displayData.name.length; i++) {
        seed += displayData.name.charCodeAt(i);
      }
    } else {
      seed = 42;
    }
    seed += displayData?.current_popularity || 0;

    for (let i = 0; i < numDots; i++) {
      const idxSeed = seed * (i + 13);
      const top = (20 + (Math.abs(Math.sin(idxSeed * 11.5)) * 60)).toFixed(2); 
      const left = (20 + (Math.abs(Math.cos(idxSeed * 12.3)) * 60)).toFixed(2);
      const sizePx = 10 + (idxSeed % 8); 
      const color = colors[i % colors.length];
      const animationDelay = `${idxSeed % 2000}ms`;
      const animationDuration = `${1500 + (idxSeed % 1500)}ms`;
      
      dots.push({ 
        id: i, 
        top: `${top}%`, 
        left: `${left}%`, 
        size: sizePx, 
        color, 
        animationDelay, 
        animationDuration 
      });
    }
    return dots;
  })();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFD700' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-12 md:py-20 flex flex-col gap-16 w-full">
        {/* Search State Section */}
        <section className="flex flex-col md:flex-row gap-8 items-stretch">
          {/* Search Card */}
          <div className="flex-1 bg-white border-4 border-black p-8 md:p-12 flex flex-col" style={{ boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)' }}>
            <label className="block font-black text-3xl md:text-5xl uppercase tracking-tighter mb-6 leading-none" htmlFor="destination-search" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              ENTER A DESTINATION OR SPOT
            </label>
            <div className="relative mb-12">
              <input
                className="w-full h-16 md:h-20 bg-white border-4 border-black px-6 text-xl md:text-2xl focus:outline-none transition-colors"
                id="destination-search"
                placeholder="e.g. Amber Fort, Jaipur"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                style={{ fontFamily: 'Archivo, sans-serif' }}
              />
              <button
                aria-label="Scan"
                onClick={handleScan}
                disabled={isLoading}
                className="absolute right-0 top-0 h-full w-16 md:w-20 border-l-4 border-black flex items-center justify-center hover:-translate-x-1 hover:-translate-y-1 transition-all cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: '#FF007F' }}
              >
                {isLoading ? (
                  <span className="material-symbols-outlined text-white text-3xl animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-white text-3xl">radar</span>
                )}
              </button>
            </div>

            {/* Radar Scanner - Shows during loading */}
            <div className="border-t-4 border-black pt-8">
              <p className="font-black text-xl md:text-2xl tracking-tighter uppercase mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {isLoading ? 'Scanning crowd signals...' : 'Ready to scan'}
              </p>
              <div className="relative w-full max-w-[300px] aspect-square mx-auto border-4 border-black flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#f1f1f1', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}>
                {/* Concentric circles */}
                <div className="absolute w-[80%] h-[80%] rounded-full border-4 border-black"></div>
                <div className="absolute w-[50%] h-[50%] rounded-full border-4 border-black"></div>
                <div className="absolute w-[20%] h-[20%] rounded-full border-4 border-black bg-black"></div>

                {/* Crosshairs */}
                <div className="absolute w-full h-1 bg-black"></div>
                <div className="absolute h-full w-1 bg-black"></div>

                {/* Radar sweep animation ALWAYS ON, but faster when loading */}
                <div
                  className="absolute w-full h-full rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,0,127,0.6) 30deg, transparent 60deg)',
                    animation: `spin ${isLoading ? '1s' : '3s'} linear infinite`
                  }}
                ></div>

                {/* Blips */}
                {!isLoading && radarDots.map(dot => (
                  <div key={dot.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: dot.left, top: dot.top }}>
                    {/* Ping ring */}
                    <div 
                      className="absolute inset-0 rounded-full border-2 pointer-events-none" 
                      style={{ 
                        borderColor: dot.color, 
                        animation: `radarPing ${dot.animationDuration} infinite ease-out ${dot.animationDelay}` 
                      }}
                    ></div>
                    {/* Core dot */}
                    <div 
                      className="border-2 border-black" 
                      style={{ 
                        backgroundColor: dot.color, 
                        width: `${dot.size}px`, 
                        height: `${dot.size}px`,
                        animation: `dotPulse 2s infinite ${dot.animationDelay}`
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 border-4 border-black bg-yellow-100">
                <p className="font-bold" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Note: {error}. Showing sample data.
                </p>
              </div>
            )}
          </div>

          {/* Result State */}
          <div className="flex-1 bg-white border-4 border-black p-8 md:p-12 flex flex-col" style={{ boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)' }}>
            <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-start">
              <div>
                <h2 className="font-black text-4xl md:text-6xl tracking-tighter uppercase leading-none mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {displayData?.name || 'AMBER FORT'}
                </h2>
                <p className="text-xl font-bold uppercase" style={{ fontFamily: 'Archivo, sans-serif', color: '#777777' }}>{displayData?.address || searchQuery || 'Jaipur, India'}</p>
              </div>
              <span
                className="text-white font-black text-2xl px-4 py-2 border-4 border-black rotate-3 uppercase"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  backgroundColor: currentColor,
                  boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)'
                }}
              >
                {currentLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Component A — Live Crowd Gauge */}
              <div className="border-4 border-black p-6 flex flex-col items-center justify-center min-h-[250px]" style={{ backgroundColor: '#f1f1f1', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}>
                <p className="font-black text-lg uppercase tracking-tighter mb-4 w-full text-left" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Current Capacity</p>

                {/* Gauge */}
                <div className="relative w-full max-w-[200px] aspect-[2/1] overflow-hidden">
                  {/* Semicircular background */}
                  <div
                    className="w-full h-[200%] rounded-full absolute bottom-0 left-0"
                    style={{
                      border: '12px solid #e0e0e0',
                      borderBottom: 'none',
                      boxSizing: 'border-box'
                    }}
                  ></div>

                  {/* Colored arc overlay */}
                  <div
                    className="w-full h-[200%] rounded-full absolute bottom-0 left-0"
                    style={{
                      border: '12px solid transparent',
                      borderTopColor: currentColor,
                      borderLeftColor: currentColor,
                      borderRightColor: currentColor,
                      borderBottom: 'none',
                      boxSizing: 'border-box'
                    }}
                  ></div>

                  {/* Needle */}
                  <div
                    className="absolute bottom-0 left-1/2 w-1 h-[90%] origin-bottom -translate-x-1/2 transition-transform duration-1000"
                    style={{
                      backgroundColor: '#1C1C1C',
                      transform: `translateX(-50%) rotate(${needleRotation}deg)`,
                      boxShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                    }}
                  ></div>

                  {/* Center cap */}
                  <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-6 h-6 bg-black rounded-full border-4 border-white"></div>
                </div>

                {/* Labels */}
                <div className="flex justify-between w-full mt-2 font-black text-xs uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  <span>GHOST TOWN</span>
                  <span style={{ color: '#B22222' }}>PACKED</span>
                </div>

                {/* Wait time - only show if not null */}
                {displayData?.current_wait_time != null && displayData?.current_wait_time > 0 && (
                  <p className="mt-4 font-bold" style={{ fontFamily: 'Archivo, sans-serif' }}>
                    Avg. wait: {displayData.current_wait_time} min
                  </p>
                )}

                {/* Best time */}
                <p className="mt-2 font-black text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#00AA00' }}>
                  BEST: {bestTime.start} – {bestTime.end}
                </p>
              </div>

              {/* Weekly Heatmap (Component C) */}
              <div className="border-4 border-black p-6" style={{ backgroundColor: '#f1f1f1', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}>
                <p className="font-black text-lg uppercase tracking-tighter mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Weekly Pattern</p>

                {/* Heatmap Grid */}
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(17, 1fr)' }}>
                  {/* Hour labels */}
                  {[...Array(17)].map((_, i) => (
                    <div key={`h-${i}`} className="text-[8px] text-center font-bold">
                      {i === 0 ? '6A' : i === 8 ? '2P' : i === 16 ? '10P' : ''}
                    </div>
                  ))}

                  {/* Cells */}
                  {displayData?.populartimes?.map((day, dayIdx) => (
                    <div key={`day-${dayIdx}`} className="contents">
                      {/* Day label */}
                      <div className="text-[8px] font-bold flex items-center">
                        {day.name.substring(0, 3).toUpperCase()}
                      </div>
                      {/* Hour cells */}
                      {day.data.slice(6, 23).map((value, hourIdx) => {
                        const intensity = value / 100;
                        const cellColor = value === 0 ? '#f5f5dc' : getCrowdColor(value);
                        const isSelected = dayIdx === selectedDayIndex;
                        const isCurrentHour = isSelected && hourIdx + 6 === currentHour;

                        return (
                          <div
                            key={`cell-${dayIdx}-${hourIdx}`}
                            className="h-4 border border-gray-300 cursor-pointer transition-all hover:scale-110 relative"
                            style={{
                              backgroundColor: cellColor,
                              outline: isCurrentHour ? '2px solid #1C1C1C' : 'none',
                              outlineOffset: '-1px'
                            }}
                            onMouseEnter={() => setHoveredCell({ day: day.name, hour: hourIdx + 6, value })}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            {hoveredCell?.day === day.name && hoveredCell?.hour === hourIdx + 6 && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs whitespace-nowrap z-50 border-2 border-white pointer-events-none">
                                {day.name} {formatHourLabel(hourIdx + 6)} — {value}/100
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Component B — Today's Peak Hours Bar Chart */}
            <div className="border-4 border-black p-6 mb-8" style={{ backgroundColor: '#f1f1f1', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}>
              <div className="flex justify-between items-center mb-6">
                <p className="font-black text-xl uppercase tracking-tighter" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Hourly Volume
                </p>

                {/* Day Selector */}
                <div className="flex gap-1">
                  {dayNames.map((day, idx) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`px-2 py-1 font-black text-xs uppercase border-2 border-black transition-all ${
                        selectedDayIndex === idx ? 'text-white' : 'bg-white text-black'
                      }`}
                      style={{
                        fontFamily: 'Space Grotesk, sans-serif',
                        backgroundColor: selectedDayIndex === idx ? '#FF007F' : 'white'
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="h-32 flex items-end justify-between gap-1 md:gap-2 px-2">
                {filteredHourlyData.map((value, idx) => {
                  const hourIndex = idx + 6;
                  const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
                  const isCurrentHour = hourIndex === currentHour;
                  const barColor = value === 0 ? '#e0e0e0' : getCrowdColor(value);

                  return (
                    <div
                      key={idx}
                      className="relative flex-1 flex flex-col items-center justify-end h-full"
                      onMouseEnter={() => setHoveredBar({ hour: hourIndex, value })}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip */}
                      {hoveredBar?.hour === hourIndex && (
                        <div className="absolute bottom-full mb-2 px-2 py-1 bg-black text-white text-xs whitespace-nowrap z-50 border-2 border-white">
                          {value} / 100 — {getCrowdLabel(value)}
                        </div>
                      )}

                      {/* Bar */}
                      <div
                        className="w-full border-2 border-black transition-all duration-300 hover:-translate-y-1"
                        style={{
                          height: `${Math.max(heightPercent, 4)}%`,
                          backgroundColor: barColor,
                          outline: isCurrentHour ? '3px solid #1C1C1C' : 'none',
                          outlineOffset: '-2px',
                          boxShadow: isCurrentHour ? '2px 2px 0px #1C1C1C' : 'none'
                        }}
                      ></div>

                      {/* Hour label */}
                      <div className="text-[8px] mt-1 font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {idx % 3 === 0 ? formatHourLabel(hourIndex) : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendation Badge */}
            <div className="mt-auto inline-block">
              <Link href="/discover">
                <button
                  className="border-4 border-black px-6 py-4 transition-all cursor-pointer hover:-translate-y-1 hover:-translate-x-1"
                  style={{
                    backgroundColor: '#00AA00',
                    boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                    fontFamily: 'Space Grotesk, sans-serif'
                  }}
                >
                  <span className="text-white text-xl md:text-2xl uppercase tracking-tighter">
                    BEST TIME TODAY: {bestTime.start} – {bestTime.end}
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Keyframe for radar spin animation */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes radarPing {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes dotPulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}