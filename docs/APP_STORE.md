# App Store / TestFlight — Personal Stylist

## Beta / convidados (antes da loja)

Para enviar o app a testers por **link de instalação** (Android APK + iOS interno), siga:

**[`docs/BETA_TESTING.md`](BETA_TESTING.md)**

```bash
npx eas-cli login
npx eas-cli init
npm run build:preview:android
```

---

## Pré-requisitos (produção / TestFlight)
1. Conta Apple Developer
2. `npx eas-cli login` e `npx eas-cli init` (preenche `extra.eas.projectId`)
3. Schema + Edge Function no Supabase (`supabase/schema.sql`, `supabase/functions/ai`)
4. Env: `GEMINI_API_KEY` no Supabase; `EXPO_PUBLIC_*` via `npx eas-cli env:set` (ver BETA_TESTING.md)
5. URL pública da política: hospede `PRIVACY.md` (ou `app/privacy`) e coloque no App Store Connect

## Build
```bash
npm run build:preview:ios          # distribuição interna / ad hoc
npm run build:production:ios
npx eas-cli submit --platform ios --profile production
```

## Assets
- Ícone: `assets/images/icon.png` (1024×1024)
- Splash: `assets/images/splash-icon.png`
- Screenshots: Home, Closet, Look do dia, Stylist, Planejamento (6.7" e 6.1")

## Privacy Nutrition Labels (resumo)
- Contato: e-mail (se conta)
- Fotos / arquivos: fotos do closet (para funcionalidade do app)
- Localização aproximada: cidade para clima (não precisa GPS em background)
- Dados de uso do produto: looks / preferências (se sync)
- Não usado para tracking de terceiros

## Checklist TestFlight
- [ ] Onboarding (nome, cidade, estilo)
- [ ] Adicionar peça + análise IA
- [ ] Look do dia: ocasião, trocar peça, salvar, usar
- [ ] Stylist: pedir look e ver peças reais
- [ ] Planejamento: salvar look + marcar usei
- [ ] Compras: gaps + desejo
- [ ] Conta: login e sync (se configurado)
- [ ] Notificação look de amanhã
- [ ] Offline: app abre com cache local

## Bundle
`com.nayara.personalstylist`
