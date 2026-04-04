create table saved_stacks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  tool_ids    text[] not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index on saved_stacks (user_id);

alter table saved_stacks enable row level security;

-- RLS policies — only applied on Supabase (auth schema required)
DO $outer$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
  ) THEN
    EXECUTE '
      CREATE POLICY "Users can read their own saved stacks"
        ON saved_stacks FOR SELECT
        USING (auth.uid() = user_id)
    ';
    EXECUTE '
      CREATE POLICY "Users can insert their own saved stacks"
        ON saved_stacks FOR INSERT
        WITH CHECK (auth.uid() = user_id)
    ';
    EXECUTE '
      CREATE POLICY "Users can update their own saved stacks"
        ON saved_stacks FOR UPDATE
        USING (auth.uid() = user_id)
    ';
    EXECUTE '
      CREATE POLICY "Users can delete their own saved stacks"
        ON saved_stacks FOR DELETE
        USING (auth.uid() = user_id)
    ';
  END IF;
END $outer$;
