#!/usr/bin/env bash
# Deploy da Edge Function AI (Gemini + Groq fallback)
# Uso:
#   export SUPABASE_ACCESS_TOKEN=sbp_...
#   ./scripts/deploy-ai-function.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SUPABASE_BIN="${SUPABASE_BIN:-$HOME/.local/bin/supabase}"
if [[ ! -x "$SUPABASE_BIN" ]]; then
  SUPABASE_BIN="$(command -v supabase || true)"
fi
if [[ -z "${SUPABASE_BIN}" ]]; then
  echo "Supabase CLI não encontrado."
  exit 1
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Defina SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)"
  exit 1
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-mkeknwjrowkifopqhjkj}"

# Carrega secrets do .env local sem echo
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env
  set +a
fi

echo "Linking project $PROJECT_REF..."
"$SUPABASE_BIN" link --project-ref "$PROJECT_REF" --yes

SECRET_ARGS=()
if [[ -n "${EXPO_PUBLIC_GEMINI_API_KEY:-}" ]]; then
  SECRET_ARGS+=("GEMINI_API_KEY=${EXPO_PUBLIC_GEMINI_API_KEY}")
elif [[ -n "${GEMINI_API_KEY:-}" ]]; then
  SECRET_ARGS+=("GEMINI_API_KEY=${GEMINI_API_KEY}")
fi
if [[ -n "${GROQ_API_KEY:-}" ]]; then
  SECRET_ARGS+=("GROQ_API_KEY=${GROQ_API_KEY}")
fi

if [[ ${#SECRET_ARGS[@]} -eq 0 ]]; then
  echo "Nenhuma chave GEMINI/GROQ no .env — deploy sem atualizar secrets."
else
  echo "Updating secrets (${#SECRET_ARGS[@]})..."
  "$SUPABASE_BIN" secrets set "${SECRET_ARGS[@]}" --project-ref "$PROJECT_REF"
fi

echo "Deploying function ai..."
"$SUPABASE_BIN" functions deploy ai --project-ref "$PROJECT_REF" --yes

echo "Done. Function URL:"
echo "https://${PROJECT_REF}.supabase.co/functions/v1/ai"
