-- Reload PostgREST schema cache so new tracker tables/columns are available to the API.
notify pgrst, 'reload schema';
