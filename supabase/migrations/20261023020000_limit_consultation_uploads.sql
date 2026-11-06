-- Limit each anonymous consultation upload folder to the two floor-plan files
-- supported by the form, even when a client bypasses the browser UI.
create or replace function public.can_upload_consultation_floor_plan(object_name text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, storage
as $$
declare
  request_folder text;
  object_filename text;
  existing_count integer;
begin
  request_folder := (storage.foldername(object_name))[1];
  object_filename := split_part(object_name, '/', 2);

  if request_folder is null
    or request_folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or object_name !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[12]-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|jpg|jpeg|png)$'
  then
    return false;
  end if;

  -- Serialize uploads for a folder so parallel requests cannot exceed the cap.
  perform pg_advisory_xact_lock(hashtextextended(request_folder, 73022));

  select count(*)::integer
    into existing_count
    from storage.objects
    where bucket_id = 'consultation-floor-plans'
      and (storage.foldername(name))[1] = request_folder;

  return existing_count < 2;
end;
$$;

revoke all on function public.can_upload_consultation_floor_plan(text) from public;
grant execute on function public.can_upload_consultation_floor_plan(text) to anon, authenticated;

drop policy if exists "Anyone can upload consultation floor plans" on storage.objects;
create policy "Anyone can upload up to two consultation floor plans"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'consultation-floor-plans'
    and public.can_upload_consultation_floor_plan(name)
  );
