# Personal Stylist

App iOS (Expo SDK 54) para organizar o guarda-roupa, montar looks com IA e planejar a semana.

## Rodar

```bash
npm install
cp .env.example .env   # preencha Gemini e/ou Supabase
npx expo start -c
```

## Storybook (design system)

### Web (link / browser) — principal
```bash
npm run storybook          # http://localhost:6006
npm run build-storybook    # gera pasta storybook-static/
```

Publique `storybook-static/` em Vercel, Netlify, GitHub Pages ou Chromatic.

**Link público (GitHub Pages):** https://nayaraormalezi.github.io/app-guarda-roupa/

```bash
npm run deploy-storybook   # rebuild + publica no Pages
```

### Native (opcional, app isolado)
```bash
npm run storybook:native
```
Isso sobe o Expo **só** com Storybook on-device (não misture com o app normal).

Stories em `src/**/*.stories.tsx`. Web: `.storybook/` · Native: `.rnstorybook/`.

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

## Design system
Constituição: `docs/VESTIA_DESIGN_CONSTITUTION.md` · Tokens: `src/theme/`

