# Poli Chat – aplicatia mobila (Expo + Supabase)

Login doar cu nume + chat comun conectat direct la Supabase (fara backend propriu).

## Setup rapid
1. Instaleaza dependentele:
   ```bash
   npm install
   ```
2. Configureaza Supabase:
   ```bash
   copy .env.example .env
   # editeaza EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY daca folosesti alte chei
   ```
3. Porneste aplicatia:
   ```bash
   npx expo start
   ```
   - taste: `a` pentru Android emulator, `i` pentru iOS simulator, `w` pentru web, sau scaneaza cu Expo Go.

## Ce face
- Ecran de login (numai nume) → cauta/creeaza utilizatorul in tabela `users` din Supabase si recupereaza TrustScore.
- Ecran de chat comun: lista de mesaje, poll la 4s, trimite mesaje cu userId-ul din login si scrie in tabela `messages`.
- Sectiune de profil: afiseaza nume + TrustScore, cu buton de log out.
- TrustScore-ul utilizatorului este afisat in UI si salvat in Supabase.

Schema si seed: vezi `../backend/schema.sql` (creeaza tabelele `users` si `messages` + insereaza Alex 97, Bogdan 37, Cristina 56). Daca activezi RLS, adauga politici care permit `select/insert` pentru rolul `anon` pe ambele tabele.

Optional: poti seta `EXPO_PUBLIC_TRUST_API_URL` (vezi `.env.example`) pentru un API extern care analizeaza mesajele si intoarce un TrustScore nou. Daca lipseste, app-ul continua fara sa il apeleze.
