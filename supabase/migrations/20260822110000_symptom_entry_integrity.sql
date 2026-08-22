-- Durable recovery and atomic, allow-listed entry revisions.

alter table tracker.symptom_entries
  add column if not exists deleted_at timestamptz;

create index if not exists symptom_entries_user_deleted_at_idx
  on tracker.symptom_entries (user_id, deleted_at);

comment on column tracker.symptom_entries.deleted_at is
  'Soft-delete timestamp. Non-null rows appear in the cross-device recovery bin.';

drop policy if exists "Users can insert their symptom entries" on tracker.symptom_entries;
create policy "Users can insert their symptom entries"
  on tracker.symptom_entries
  for insert
  with check (auth.uid() = user_id and source = 'veteran');

create or replace function tracker.protect_symptom_entry_integrity()
returns trigger
language plpgsql
set search_path = tracker, pg_temp
as $$
declare
  v_content_changed boolean;
begin
  if new.occurred_at is not null and new.occurred_at > now() + interval '1 minute' then
    raise exception 'The symptom entry time cannot be in the future.' using errcode = '22023';
  end if;

  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id or new.source is distinct from old.source then
      raise exception 'Entry ownership and source cannot be changed.' using errcode = '42501';
    end if;

    v_content_changed := row(
      new.condition_key, new.condition_label, new.severity, new.occurred_at,
      new.summary, new.impact, new.details
    ) is distinct from row(
      old.condition_key, old.condition_label, old.severity, old.occurred_at,
      old.summary, old.impact, old.details
    );

    if old.source = 'family' and v_content_changed then
      raise exception 'Signed family observations cannot be rewritten.' using errcode = '42501';
    end if;

    if old.source = 'veteran'
      and old.entry_status = 'complete'
      and v_content_changed
      and coalesce(current_setting('tracker.revision_update', true), '') <> '1'
    then
      raise exception 'Completed entries must be edited through the revision workflow.' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_symptom_entry_integrity on tracker.symptom_entries;
create trigger protect_symptom_entry_integrity
before insert or update on tracker.symptom_entries
for each row execute function tracker.protect_symptom_entry_integrity();

drop policy if exists "Users can insert their entry revisions" on tracker.symptom_entry_revisions;
revoke insert on table tracker.symptom_entry_revisions from authenticated;

create or replace function tracker.revise_symptom_entry(
  p_entry_id uuid,
  p_user_id uuid,
  p_before_snapshot jsonb,
  p_payload jsonb
)
returns tracker.symptom_entries
language plpgsql
security definer
set search_path = tracker, pg_temp
as $$
declare
  v_entry tracker.symptom_entries%rowtype;
  v_revision_number integer;
  v_allowed_keys constant text[] := array[
    'condition_key', 'condition_label', 'severity', 'occurred_at',
    'summary', 'impact', 'details'
  ];
begin
  if p_before_snapshot is null or p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Missing revision snapshot or update payload.' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_object_keys(p_payload) as key
    where not (key = any(v_allowed_keys))
  ) then
    raise exception 'The update contains fields that cannot be revised.' using errcode = '22023';
  end if;

  select * into v_entry
  from tracker.symptom_entries
  where id = p_entry_id and user_id = p_user_id and deleted_at is null
  for update;

  if not found then
    raise exception 'Symptom entry not found.' using errcode = 'P0002';
  end if;

  if v_entry.source = 'family' then
    raise exception 'Signed family observations cannot be rewritten.' using errcode = '42501';
  end if;

  if coalesce(v_entry.edit_count, 0) >= 3 then
    raise exception 'This entry has reached the maximum of 3 edits. Log a new entry if you need to add more detail.' using errcode = '22023';
  end if;

  v_revision_number := coalesce(v_entry.edit_count, 0) + 1;

  insert into tracker.symptom_entry_revisions (
    entry_id, user_id, revision_number, snapshot
  ) values (
    p_entry_id,
    p_user_id,
    v_revision_number,
    jsonb_build_object(
      'condition_key', v_entry.condition_key,
      'condition_label', v_entry.condition_label,
      'severity', v_entry.severity,
      'occurred_at', v_entry.occurred_at,
      'summary', v_entry.summary,
      'impact', v_entry.impact,
      'details', v_entry.details
    )
  );

  perform set_config('tracker.revision_update', '1', true);

  update tracker.symptom_entries
  set
    condition_key = case when p_payload ? 'condition_key' then p_payload->>'condition_key' else condition_key end,
    condition_label = case when p_payload ? 'condition_label' then p_payload->>'condition_label' else condition_label end,
    severity = case when p_payload ? 'severity' then (p_payload->>'severity')::integer else severity end,
    occurred_at = case when p_payload ? 'occurred_at' then nullif(p_payload->>'occurred_at', '')::timestamptz else occurred_at end,
    summary = case when p_payload ? 'summary' then nullif(p_payload->>'summary', '') else summary end,
    impact = case when p_payload ? 'impact' then nullif(p_payload->>'impact', '') else impact end,
    details = case when p_payload ? 'details' then coalesce(p_payload->'details', '{}'::jsonb) else details end,
    edit_count = v_revision_number,
    updated_at = now()
  where id = p_entry_id
  returning * into v_entry;

  return v_entry;
end;
$$;

revoke all on function tracker.revise_symptom_entry(uuid, uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function tracker.revise_symptom_entry(uuid, uuid, jsonb, jsonb) to service_role;
