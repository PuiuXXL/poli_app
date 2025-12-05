# Poli Chat – structura proiectului

- `frontend/` – aplicatia mobila Expo (login pe nume + chat cu TrustScore) conectata direct la Supabase. Ruleaza cu `npm install` si `npx expo start`.
- `backend/` – SQL + instructiuni Supabase (nu mai exista backend propriu). Ruleaza `schema.sql` in SQL Editor ca sa creezi tabelele si seed-ul (Alex/Bogdan/Cristina).

Note:
- Configureaza cheile in `frontend/.env.example` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`).
- Daca activezi RLS in Supabase, adauga politici pentru rolul `anon` (vezi `backend/README.md`) sau foloseste o cheie de service.
