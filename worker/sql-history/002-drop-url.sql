-- The guestbook no longer collects a visitor URL; drop the unused column.
-- Run once per database (local and remote).
ALTER TABLE entries DROP COLUMN url;
