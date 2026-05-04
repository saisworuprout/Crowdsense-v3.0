import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { allTrips } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const { tripId } = await request.json();

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create supabase client with the user's token
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, try to fetch from Supabase
    const { data: originalTrip, error: tripError } = await supabaseClient
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    // If not found in Supabase, check mock data
    let tripDataToClone = originalTrip;
    if (tripError || !originalTrip) {
      const mockTrip = allTrips.find(t => t.id === tripId);
      if (mockTrip) {
        tripDataToClone = {
          title: mockTrip.title,
          destination: mockTrip.title, // Use full title as destination
          vibe: mockTrip.vibe || 'Party',
          mission: mockTrip.desc || '',
          image_url: mockTrip.imageUrl,
          days: mockTrip.days,
          handle: mockTrip.handle,
          is_hot: mockTrip.isHot || false,
          avatar_init: mockTrip.avatarInit || '',
        };
      } else {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }
    }

    // Clone the trip to user's account
    const { data: newTrip, error: cloneTripError } = await supabaseClient
      .from('trips')
      .insert({
        user_id: user.id,
        title: tripDataToClone.title,
        destination: tripDataToClone.destination,
        start_date: null,
        end_date: null,
        vibe: tripDataToClone.vibe,
        mission: tripDataToClone.mission,
        image_url: tripDataToClone.image_url,
        status: 'draft',
        duration_days: tripDataToClone.days || 1,
        curator_handle: tripDataToClone.handle || null,
        curator_avatar: tripDataToClone.avatar_url || null,
        curator_initials: tripDataToClone.avatar_init || null,
      })
      .select()
      .single();

    if (cloneTripError || !newTrip) {
      return NextResponse.json({ error: 'Failed to clone trip' }, { status: 500 });
    }

    // If the original trip had itinerary data in Supabase, clone that too
    if (originalTrip?.id) {
      const { data: originalDays } = await supabaseClient
        .from('itinerary_days')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number', { ascending: true });

      if (originalDays && originalDays.length > 0) {
        for (const day of originalDays) {
          const { data: newDay } = await supabaseClient
            .from('itinerary_days')
            .insert({
              trip_id: newTrip.id,
              day_number: day.day_number,
            })
            .select()
            .single();

          if (newDay) {
            const { data: originalEvents } = await supabaseClient
              .from('itinerary_events')
              .select('*')
              .eq('day_id', day.id);

            if (originalEvents && originalEvents.length > 0) {
              const eventsToInsert = originalEvents.map(ev => ({
                day_id: newDay.id,
                time: ev.time,
                title: ev.title,
                description: ev.description,
                location: ev.location,
                type: ev.type,
              }));
              await supabaseClient.from('itinerary_events').insert(eventsToInsert);
            }
          }
        }
      }
    } else {
      // It's a mock trip, so generate mock itinerary matching the trip details page
      for (let i = 0; i < (tripDataToClone.days || 1); i++) {
        const { data: newDay } = await supabaseClient
          .from('itinerary_days')
          .insert({
            trip_id: newTrip.id,
            day_number: i + 1,
          })
          .select()
          .single();

        if (newDay) {
          const mockEvents = [
            { day_id: newDay.id, time: '10:00 AM', title: 'Local Market Exp.', location: '', description: 'Immersive exploration of the area and its best kept secrets.', type: 'activity' },
            { day_id: newDay.id, time: '02:00 PM', title: 'Historical District', location: '', description: 'Discover popular landmarks and architecture.', type: 'travel' },
            { day_id: newDay.id, time: '07:00 PM', title: 'Street Food Tour', location: '', description: 'Enjoy local cuisine and nightlife.', type: 'dining' }
          ];
          await supabaseClient.from('itinerary_events').insert(mockEvents);
        }
      }
    }

    return NextResponse.json({ success: true, tripId: newTrip.id });
  } catch (error: any) {
    console.error('Clone trip error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}