-- Persist custom condition display labels per user (keys not in the catalog).
alter table tracker.user_profiles
  add column if not exists custom_condition_labels jsonb not null default '{}'::jsonb;

comment on column tracker.user_profiles.custom_condition_labels is
  'Display labels for user-defined custom condition keys (not in catalog).';

notify pgrst, 'reload schema';
