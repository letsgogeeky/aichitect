-- Allow authenticated users to insert their own profile row.
-- Required for the upsert in /auth/callback to succeed.
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
