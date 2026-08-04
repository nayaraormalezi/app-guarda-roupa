# Beta testing — convidados (EAS Internal)

Como gerar um **link de instalação** para outras pessoas testarem o Personal Stylist / Vestia **sem** publicar na App Store / Play Store.

Perfil usado: **`preview`** em [`eas.json`](../eas.json) (`distribution: internal`, Android **APK**).

---

## Pré-requisitos (você, dona do app)

1. Conta [Expo](https://expo.dev) (grátis)
2. CLI: `npx eas-cli@latest` (não precisa instalar `eas` globalmente)
3. Login: `npx eas-cli login`
4. Projeto EAS ligado a este repo: `npx eas-cli init` — grava `extra.eas.projectId` em `app.json`
5. **Android:** basta a conta Expo
6. **iOS (celular físico):** Apple Developer Program (paga) + dispositivos registrados (UDID) **ou** depois TestFlight

---

## 1. Variáveis no EAS (obrigatório para IA / sync)

Use `eas env:set` (o antigo `secret:create` está depreciado). Valores do seu `.env` local — **não** commitar `.env`.

**Opção A (recomendada):** carregar direto do `.env`:

```bash
bash scripts/eas-set-preview-env.sh
```

**Opção B:** um comando por variável, com o valor **real** (não `COLE_AQUI`, não `--force`):

```bash
npx eas-cli env:set --name EXPO_PUBLIC_SUPABASE_URL --value "https://SEU.supabase.co" --environment preview --visibility plaintext
npx eas-cli env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "SUA_ANON_KEY" --environment preview --visibility sensitive
npx eas-cli env:set --name EXPO_PUBLIC_GEMINI_API_KEY --value "SUA_KEY" --environment preview --visibility sensitive
```

Listar: `npx eas-cli env:list --environment preview`

Sem essas variáveis, o build sobe, mas chat/IA e sync ficam sem backend.

---

## 2. Gerar o build de teste

Na pasta do app (onde está o `package.json`):

```bash
cd "/Users/nayaraormalezi/Desktop/App stylist/Personal Stylist App Design"

# Android — APK com link de download (recomendado para convidados)
npm run build:preview:android

# iOS — instalação interna (precisa Apple Developer + devices)
npm run build:preview:ios

# Ambos
npm run build:preview
```

Acompanhe em: https://expo.dev → seu projeto → **Builds**.

Quando terminar, abra o build e copie o **Install / Share** link.

---

## 3. Convidar testers

### Android
1. Envie o link do build Expo.
2. No celular: abrir o link → **Install** → permitir instalar de fontes desconhecidas se o sistema pedir.
3. Abrir o app **Personal Stylist**.

### iOS
1. Cadastre o UDID do iPhone no Apple Developer / deixe o EAS registrar no fluxo de credentials.
2. Envie o link do build Expo.
3. Abrir no Safari → Install / perfil conforme a página Expo.
4. Em **Ajustes → Geral → Gerenciamento de VPN e dispositivo**, confiar no certificado do desenvolvedor se pedido.

**Sem Apple Developer:** use só Android, ou peça aos testers iOS para esperar TestFlight (ver [`APP_STORE.md`](APP_STORE.md)).

---

## 4. Atualizar o app para os mesmos convidados

Cada mudança de código nativo/JS relevante:

```bash
npm run build:preview:android   # novo APK + novo link
# ou iOS
npm run build:preview:ios
```

Envie o **novo** link (ou o mesmo projeto Expo mostra o build mais recente).

---

## Checklist rápido para testers

- [ ] Onboarding (nome, cidade, estilo)
- [ ] Adicionar peça (foto)
- [ ] Look de hoje / trocar / salvar
- [ ] Stylist (se Gemini/Supabase configurados)
- [ ] Planejamento da semana
- [ ] Conta / sync (se Supabase)

---

## Troubleshooting

| Problema | O que fazer |
|----------|-------------|
| `Not logged in` | `npx eas-cli login` |
| `eas.json is not valid` / `ascAppId` vazio | Remova `ascAppId: ""` do `submit` (já corrigido no repo) |
| `eas: command not found` | Use `npm run build:preview:android` (usa `npx eas-cli`) ou `npx eas-cli build ...` |
| `Nonexistent flag: --force` | `env:set` já cria/atualiza; **não** use `--force` |
| Pediu instalar `expo-updates` | Perfil `preview` **não** usa `channel` (já removido). Responda **No** se aparecer de novo |
| Build falha em **Install dependencies** / `ERESOLVE` | O repo tem `.npmrc` com `legacy-peer-deps=true` (Storybook). Confirme que o arquivo está no projeto e rode o build de novo |
| `zsh: number expected` | Não cole comentários `#` misturados com comandos incompletos; rode um comando por vez |
| Falta `projectId` | `npx eas-cli init` na raiz do app |
| App sem IA / login | `bash scripts/eas-set-preview-env.sh` e conferir `env:list` |
| iOS não instala | Device não está no provisioning; registrar UDID e rebuild |
| Android bloqueia APK | Permitir instalação de fontes desconhecidas / Chrome |

## Bundle

`com.nayara.personalstylist`
