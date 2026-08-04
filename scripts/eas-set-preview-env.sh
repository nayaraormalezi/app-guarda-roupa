#!/usr/bin/env bash
# Carrega .env local e cria/atualiza variáveis no ambiente EAS "preview".
# Uso (na raiz do app): bash scripts/eas-set-preview-env.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Arquivo .env não encontrado na raiz do projeto."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

set_var() {
  local name="$1"
  local visibility="$2"
  local value="${!name:-}"
  if [[ -z "$value" ]]; then
    echo "Pulando $name (vazio no .env)"
    return
  fi
  echo "Definindo $name ($visibility)..."
  npx eas-cli env:set \
    --name "$name" \
    --value "$value" \
    --environment preview \
    --visibility "$visibility" \
    --non-interactive
}

set_var EXPO_PUBLIC_SUPABASE_URL plaintext
set_var EXPO_PUBLIC_SUPABASE_ANON_KEY sensitive
set_var EXPO_PUBLIC_GEMINI_API_KEY sensitive
set_var EXPO_PUBLIC_USE_SERVER_AI plaintext

echo "OK. Conferir: npx eas-cli env:list --environment preview"
npx eas-cli env:list --environment preview
