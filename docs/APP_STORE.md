# App Store / TestFlight — Personal Stylist

## Pré-requisitos
1. Conta Apple Developer
2. `eas login` e `eas build:configure` (preenche `extra.eas.projectId`)
3. Schema + Edge Function no Supabase (`supabase/schema.sql`, `supabase/functions/ai`)
4. Secrets: `GEMINI_API_KEY` no Supabase; `EXPO_PUBLIC_SUPABASE_*` no EAS Secrets
5. URL pública da política: hospede `PRIVACY.md` (ou `app/privacy`) e coloque no App Store Connect

## Build
```bash
eas build --platform ios --profile preview   # TestFlight interno / ad hoc
eas build --platform ios --profile production
eas submit --platform ios --profile production
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
