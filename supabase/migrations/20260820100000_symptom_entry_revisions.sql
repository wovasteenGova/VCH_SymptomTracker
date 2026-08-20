-- Entry edit history: up to 3 revisions per veteran log for full-history PDF export.
-- Snapshots store the pre-edit state at each save.

alter table tracker.symptom_entries
  add column if not exists edit_count integer not null default 0;

alter table tracker.symptom_entries
  drop constraint if exists symptom_entries_edit_count_check;

alter table tracker.symptom_entries
  add constraint symptom_entries_edit_count_check
  check (edit_count >= 0 and edit_count <= 3);

comment on column tracker.symptom_entries.edit_count is
  'Successful veteran edits after create. Max 3; each save that changes data increments.';

create table if not exists tracker.symptom_entry_revisions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references tracker.symptom_entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  revision_number smallint not null check (revision_number >= 1 and revision_number <= 3),
  revised_at timestamptz not null default now(),
  snapshot jsonb not null,
  unique (entry_id, revision_number)
);

create index if not exists symptom_entry_revisions_entry_id_idx
  on tracker.symptom_entry_revisions (entry_id);

comment on table tracker.symptom_entry_revisions is
  'Pre-edit snapshots for veteran symptom logs. One row per successful edit (max 3 per entry).';

alter table tracker.symptom_entry_revisions enable row level security;

drop policy if exists "Users can view their entry revisions" on tracker.symptom_entry_revisions;
create policy "Users can view their entry revisions"
  on tracker.symptom_entry_revisions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their entry revisions" on tracker.symptom_entry_revisions;
create policy "Users can insert their entry revisions"
  on tracker.symptom_entry_revisions
  for insert
  with check (auth.uid() = user_id);

grant select, insert on table tracker.symptom_entry_revisions to authenticated;
