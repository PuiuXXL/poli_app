# Poli Chat – baza de date Supabase

Nu mai exista backend propriu; aplicatia Expo scrie/citeste direct din Supabase.

## Setup baze de date
1. Deschide SQL Editor in proiectul Supabase si ruleaza `schema.sql`.
2. Asigura-te ca rolul `anon` are voie sa citeasca/scrie in tabelele `users` si `messages` (vezi politicile de mai jos) sau foloseste o cheie de service daca preferi sa lasi RLS activat.

## Politici (RLS)
- Daca activezi RLS pe tabele, adauga politici de tip `PERMISSIVE` pentru rolul `anon` care permit:
  - `select` pe `users` si `messages`
  - `insert` pe `users` si `messages`
  - Optional `delete`/`update` daca vrei sa gestionezi curatarea mesajelor

## Seed
- `schema.sql` creeaza tabelele si insereaza utilizatorii: Alex (97), Bogdan (37), Cristina (56).

## Conectare din aplicatie
- Aplicatia foloseste `EXPO_PUBLIC_SUPABASE_URL` si `EXPO_PUBLIC_SUPABASE_KEY` (vezi `frontend/.env.example`).
- Cheia implicita din repo este `anon`; daca vrei sa controlezi politicile, seteaza propria cheie in `.env`.
