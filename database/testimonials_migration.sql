-- Home page carousel testimonials, managed from /admin/reviews & /admin/home-reviews.
-- Public read access is limited to active rows; writes go through the admin
-- server actions (actions/admin/testimonials.ts) using the service-role key,
-- which bypasses RLS.
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  quote text not null,
  initials text,
  product text,
  rating integer not null default 5,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table testimonials enable row level security;

drop policy if exists "public read active testimonials" on testimonials;
create policy "public read active testimonials" on testimonials
  for select using (is_active = true);
