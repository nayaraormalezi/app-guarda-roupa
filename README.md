# Personal Stylist

App iOS (Expo SDK 54) para organizar o guarda-roupa, montar looks com IA e planejar a semana.

## Rodar

```bash
npm install
cp .env.example .env   # preencha Gemini e/ou Supabase
npx expo start -c
```

## Features
- Closet local + filtros
- Look do dia com troca de peça
- Stylist conversacional (Gemini; Edge Function se Supabase)
- Planejamento semanal com look salvo / usei
- Compras por lacunas + lista de desejos
- Conta Supabase (e-mail / Apple) + sync + Storage
- Notificações opcionais do look de amanhã

## Backend
Veja `supabase/schema.sql` e `supabase/functions/ai`. Detalhes de store em `docs/APP_STORE.md`. Privacidade em `PRIVACY.md`.

## Bundle
`com.nayara.personalstylist`
