CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  full_name text,
  email text,
  avatar_url text,
  phone text,
  date_of_birth date,
  address text,
  student_id text,
  department text,
  semester text
);

-- Note: The foreign key with ON DELETE CASCADE is usually easier to set during table creation.
-- If you got an error, it's likely because the table 'profiles' already exists.
-- You can manually drop it first if you want to 'reset' it: 
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Safely recreate policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 3. Set up Storage for Avatars
-- Run these in your Supabase SQL Editor if they don't exist:
/*
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow anyone to view avatars (since bucket is public)
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Policy to allow authenticated users to upload their own avatar (prefixed with their UID)
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND 
    name LIKE auth.uid()::text || '-%'
  );

-- Policy to allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    name LIKE auth.uid()::text || '-%'
  );

-- Policy to allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    name LIKE auth.uid()::text || '-%'
  );
*/
