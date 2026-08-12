-- Rode no Supabase: SQL Editor > New query > cola e Run.
-- Aditivo — não mexe em dados existentes, só adiciona duas colunas novas.

alter table listened_albums add column if not exists favorite boolean not null default false;
alter table listened_albums add column if not exists comment text;
