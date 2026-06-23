-- Rename imported_data table to new_data
ALTER TABLE IF EXISTS imported_data RENAME TO new_data;

-- Refresh schema cache for PostgREST (handled automatically by Supabase)
