-- Create tables for Family Expense Tracker

-- 1. Profiles (linked to Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Spaces
create table spaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  mode text check (mode in ('individual', 'group')) not null,
  invite_code text unique,
  owner_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Space Members (Join table)
create table space_members (
  space_id uuid references spaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (space_id, user_id)
);

-- 4. Categories
create table categories (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references spaces(id) on delete cascade not null,
  name text not null,
  icon text not null,
  tone text check (tone in ('emerald', 'amber', 'rose', 'sky', 'slate')) not null,
  is_default boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Expenses
create table expenses (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references spaces(id) on delete cascade not null,
  title text not null,
  amount decimal not null,
  category_id uuid references categories(id) on delete set null,
  paid_by uuid references profiles(id) on delete set null,
  date date not null,
  month text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Contributions
create table contributions (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references spaces(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  amount decimal not null,
  month text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table spaces enable row level security;
alter table space_members enable row level security;
alter table categories enable row level security;
alter table expenses enable row level security;
alter table contributions enable row level security;

-- Basic Policies (Simplified - users can see what they are members of)
create policy "Users can see their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can see spaces they belong to" on spaces for select using (
  exists (select 1 from space_members where space_id = spaces.id and user_id = auth.uid())
);
-- ... more policies can be added for insert/update/delete ...
