-- Rode isto no Supabase: dashboard do projeto > SQL Editor > New query > cola e clica em Run.
-- Cria a tabela que guarda quais discos cada usuário já ouviu, com segurança por linha
-- (cada pessoa só enxerga e altera os próprios registros).

create table if not exists listened_albums (
  user_id uuid references auth.users(id) on delete cascade not null,
  album_id text not null,
  listened_at timestamptz default now() not null,
  rating smallint check (rating between 1 and 5), -- reservado pro próximo passo (avaliação em estrelas)
  primary key (user_id, album_id)
);

alter table listened_albums enable row level security;

create policy "Usuário vê os próprios registros"
  on listened_albums for select
  using (auth.uid() = user_id);

create policy "Usuário insere os próprios registros"
  on listened_albums for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza os próprios registros"
  on listened_albums for update
  using (auth.uid() = user_id);

create policy "Usuário remove os próprios registros"
  on listened_albums for delete
  using (auth.uid() = user_id);
