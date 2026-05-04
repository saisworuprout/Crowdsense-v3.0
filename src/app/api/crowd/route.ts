import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeQuery = searchParams.get('place');

  if (!placeQuery) {
    return NextResponse.json({ error: 'Place query parameter is required' }, { status: 400 });
  }

  try {
    // Generate deterministic mock data based on place name
    // This provides realistic crowd data without requiring a Google API key
    const placeName = placeQuery.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Create a seed from the place name for consistent data
    const seed = placeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePop = (seed % 60) + 20; // 20 to 80

    // Generate 7 days of 24h data
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const popTimes = dayNames.map((name, dayIndex) => {
      const isWeekend = dayIndex === 5 || dayIndex === 6;
      const multiplier = isWeekend ? 1.5 : 1.0;

      const hours = Array(24).fill(0).map((_, hour) => {
        // Places usually closed night times
        if (hour < 6 || hour > 22) return 0;

        // Peak around 1pm and 6pm
        let peakFactor = 0;
        if (hour >= 11 && hour <= 14) peakFactor = 0.8;
        else if (hour >= 17 && hour <= 20) peakFactor = 1.0;
        else peakFactor = 0.5;

        let val = Math.floor(basePop * peakFactor * multiplier);
        
        // Add pseudo-random variation based on seed, hour, and day, so it's not always 3-5 PM
        const pseudoRandomVariation = Math.floor(Math.sin(seed * hour * (dayIndex + 1)) * 15);
        val += pseudoRandomVariation;

        return Math.min(100, Math.max(5, val));
      });

      return { name, data: hours };
    });

    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const currentPopularity = popTimes[currentDay].data[currentHour] || Math.floor(basePop / 2);

    // Wait time corresponds loosely to popularity
    const waitTime = currentPopularity > 50 ? Math.floor(currentPopularity / 3) : 0;

    // Format place name nicely
    const queryParts = placeQuery.split(',').map(s => s.trim());
    const namePart = queryParts[0] || placeQuery;
    const formattedName = namePart
      .split(/[\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .slice(0, 3)
      .join(' ');

    let address = queryParts.length > 1 
      ? queryParts.slice(1).join(', ') 
      : null;

    if (!address) {
      const knownLocations: Record<string, string> = {
        'eiffel tower': 'Paris, France',
        'eifiel tower': 'Paris, France', // handling user typo
        'amber fort': 'Jaipur, India',
        'taj mahal': 'Agra, India',
        'colosseum': 'Rome, Italy',
        'statue of liberty': 'New York, USA',
        'machu picchu': 'Cusco Region, Peru',
        'great wall': 'Beijing, China',
        'petra': "Ma'an, Jordan",
        'acropolis': 'Athens, Greece',
        'christ the redeemer': 'Rio de Janeiro, Brazil',
        'chichen itza': 'Yucatan, Mexico',
        'pyramids': 'Giza, Egypt',
        'burj khalifa': 'Dubai, UAE',
        'louvre': 'Paris, France',
        'big ben': 'London, UK'
      };
      
      const normalizePlace = namePart.toLowerCase();
      for (const [key, val] of Object.entries(knownLocations)) {
        if (normalizePlace.includes(key)) {
          address = val;
          break;
        }
      }
    }

    if (!address) {
      address = `${formattedName} Area`;
    }

    return NextResponse.json({
      name: formattedName,
      address: address,
      current_popularity: currentPopularity,
      populartimes: popTimes,
      current_wait_time: waitTime
    });

  } catch (error) {
    console.error('[CrowdSense API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crowd data', message: 'Could not generate crowd data for this place.' },
      { status: 500 }
    );
  }
}
