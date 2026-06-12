-- Enable Supabase Realtime for the attendance table
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/sqlbimnmhdvesudpxtbi/sql/new)

ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
