-- CROWDSENSE V2: SQL SCHEMA DEFINITION --
-- Purpose: Execute this entire script inside the Supabase SQL Editor.

------------------------------------------------------
-- 1. PROFILES TABLE
------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  handle text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- TRIGGER FUNCTION: Automatically generate a profile on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, handle, avatar_url)
  VALUES (
    new.id,
    -- Simple auto-generated handle based on email prefix + random string
    '@' || split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


------------------------------------------------------
-- 2. TRIPS TABLE
------------------------------------------------------
CREATE TABLE public.trips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  destination text NOT NULL,
  start_date date,
  end_date date,
  vibe text,
  mission text,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'upcoming', 'past')),
  duration_days integer DEFAULT 1,
  curator_handle text,
  curator_avatar text,
  curator_initials text
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trips are viewable by everyone."
  ON public.trips FOR SELECT USING (true);

CREATE POLICY "Users can insert their own trips."
  ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips."
  ON public.trips FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips."
  ON public.trips FOR DELETE USING (auth.uid() = user_id);


------------------------------------------------------
-- 3. ITINERARY DAYS TABLE
------------------------------------------------------
CREATE TABLE public.itinerary_days (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(trip_id, day_number)
);

ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Itinerary days are viewable by everyone."
  ON public.itinerary_days FOR SELECT USING (true);

CREATE POLICY "Users can manage itinerary days for their own trips."
  ON public.itinerary_days FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips WHERE id = itinerary_days.trip_id AND user_id = auth.uid()
    )
  );


------------------------------------------------------
-- 4. ITINERARY EVENTS TABLE
------------------------------------------------------
CREATE TABLE public.itinerary_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id uuid REFERENCES public.itinerary_days(id) ON DELETE CASCADE NOT NULL,
  time text,
  title text NOT NULL,
  description text,
  location text,
  type text CHECK (type IN ('travel', 'stay', 'dining', 'activity')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.itinerary_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Itinerary events are viewable by everyone."
  ON public.itinerary_events FOR SELECT USING (true);

CREATE POLICY "Users can manage itinerary events for their own trips."
  ON public.itinerary_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.itinerary_days
      JOIN public.trips ON trips.id = itinerary_days.trip_id
      WHERE itinerary_days.id = itinerary_events.day_id AND trips.user_id = auth.uid()
    )
  );

------------------------------------------------------
-- 5. BUDGETS TABLE
------------------------------------------------------
CREATE TABLE public.budgets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_amount numeric DEFAULT 0 NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  active_members jsonb DEFAULT '[]'::jsonb NOT NULL,
  upfront_payments jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Budgets are viewable by everyone."
  ON public.budgets FOR SELECT USING (true);

CREATE POLICY "Users can manage budgets for their own trips."
  ON public.budgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips WHERE id = budgets.trip_id AND user_id = auth.uid()
    )
  );

------------------------------------------------------
-- 6. BUDGET CATEGORIES TABLE
------------------------------------------------------
CREATE TABLE public.budget_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  allocated_amount numeric DEFAULT 0 NOT NULL,
  percentage numeric DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Budget categories are viewable by everyone."
  ON public.budget_categories FOR SELECT USING (true);

CREATE POLICY "Users can manage budget categories for their own trips."
  ON public.budget_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.budgets
      JOIN public.trips ON trips.id = budgets.trip_id
      WHERE budgets.id = budget_categories.budget_id AND trips.user_id = auth.uid()
    )
  );

------------------------------------------------------
-- 7. EXPENSES TABLE
------------------------------------------------------
CREATE TABLE public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  description text,
  paid_by text NOT NULL,
  date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expenses are viewable by everyone."
  ON public.expenses FOR SELECT USING (true);

CREATE POLICY "Users can manage expenses for their own trips."
  ON public.expenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.budgets
      JOIN public.trips ON trips.id = budgets.trip_id
      WHERE budgets.id = expenses.budget_id AND trips.user_id = auth.uid()
    )
  );

------------------------------------------------------
-- 8. EXPENSE SPLITS TABLE
------------------------------------------------------
CREATE TABLE public.expense_splits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id uuid REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
  member text NOT NULL,
  amount_owed numeric NOT NULL,
  settled boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expense splits are viewable by everyone."
  ON public.expense_splits FOR SELECT USING (true);

CREATE POLICY "Users can manage expense splits for their own trips."
  ON public.expense_splits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      JOIN public.budgets ON budgets.id = expenses.budget_id
      JOIN public.trips ON trips.id = budgets.trip_id
      WHERE expenses.id = expense_splits.expense_id AND trips.user_id = auth.uid()
    )
  );
