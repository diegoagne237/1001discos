-- Rode isto no Supabase: dashboard do projeto > SQL Editor > New query > cola e clica em Run.
-- Guarda o link do Spotify, a capa e o gênero resolvidos pra cada disco. É uma tabela global
-- (o mesmo disco tem o mesmo link/capa pra qualquer pessoa que usar o app), diferente da
-- listened_albums que é por usuário.

create table if not exists album_metadata (
  album_id text primary key,
  spotify_url text,
  cover_url text,
  genre text,
  updated_at timestamptz default now()
);

alter table album_metadata enable row level security;

create policy "Qualquer um pode ler os metadados"
  on album_metadata for select
  using (true);

create policy "Usuário autenticado pode inserir metadados"
  on album_metadata for insert
  to authenticated
  with check (true);

create policy "Usuário autenticado pode atualizar metadados"
  on album_metadata for update
  to authenticated
  using (true);
