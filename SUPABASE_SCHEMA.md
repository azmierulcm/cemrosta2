# Cemrosta Supabase Architecture

## 1. Profiles Table
This table extends the native `auth.users` with crew-specific metadata.
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  rank text, -- e.g., 'Senior First Officer'
  airline text, -- e.g., 'Malaysia Airlines'
  fleet text, -- e.g., 'A350'
  bio text,
  avatar_url text,
  gallery_urls text[], -- Array of 5 photo URLs for the Bento Grid
  created_at timestamp with time zone default now()
);
```

## 2. Marketplace Listings Table
Stores all gear ads created by the crew.
```sql
create table marketplace_listings (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references profiles(id) not null,
  title text not null,
  description text,
  price numeric not null,
  currency text default 'MYR',
  category text, -- 'Headsets', 'Luggage', 'Watches', etc.
  condition text, -- 'New', 'Lightly Used', 'Well Used'
  image_urls text[], -- Array of product image URLs
  status text default 'available', -- 'available', 'sold', 'hidden'
  created_at timestamp with time zone default now()
);
```

## 3. Storage Buckets
Configure these two buckets in your Supabase Dashboard:
1. **`profile-photos`**: 
   - Public access: Yes
   - Folder structure suggested: `[user_id]/gallery/[photo_name].jpg`
2. **`marketplace-images`**:
   - Public access: Yes
   - Folder structure suggested: `[listing_id]/[image_name].jpg`

## 4. Unlocked Patches (Existing Concept)
```sql
create table user_patches (
  user_id uuid references profiles(id) on delete cascade,
  iata_code text not null,
  city_name text,
  country_code text,
  trip_count integer default 1,
  last_visited_at timestamp with time zone default now(),
  primary key (user_id, iata_code)
);
```
