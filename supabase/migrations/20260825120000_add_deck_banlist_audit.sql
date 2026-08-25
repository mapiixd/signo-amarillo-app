alter table public.decks
  add column if not exists banlist_status text not null default 'unchecked'
    check (banlist_status in ('valid', 'invalid', 'unchecked')),
  add column if not exists banlist_issues jsonb not null default '[]'::jsonb,
  add column if not exists banlist_checked_at timestamptz;

create index if not exists idx_decks_banlist_status
  on public.decks (banlist_status);
