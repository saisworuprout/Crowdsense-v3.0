-- CROWDSENSE: REAL-TIME CHAT MIGRATION --
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

------------------------------------------------------
-- 1. MESSAGES TABLE
------------------------------------------------------
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookups by conversation participants
CREATE INDEX idx_messages_sender ON public.messages(sender_id, created_at);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id, created_at);
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at);

------------------------------------------------------
-- 2. ROW LEVEL SECURITY
------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages they sent or received
CREATE POLICY "Users can read own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can insert messages as themselves
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can delete their own sent messages
CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);

------------------------------------------------------
-- 3. ENABLE REALTIME
------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
