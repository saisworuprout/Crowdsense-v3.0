export interface User {
  id: string;
  handle: string;
  email: string;
}

export interface Curator {
  handle: string;
  avatar: string;
}

export interface ItineraryEvent {
  id: string;
  time: string;
  title: string;
  location: string;
  description: string;
  type?: 'dining' | 'activity' | 'travel' | 'leisure';
}

export interface ItineraryDay {
  dayNumber: number;
  events: ItineraryEvent[];
}

export interface Trip {
  id: string;
  title: string;
  desc?: string;
  days: number;
  handle: string;
  vibe?: string;
  imageUrl: string;
  curator: Curator;
  itinerary?: ItineraryDay[];
  avatarInit?: string;
  isHot?: boolean;
}
