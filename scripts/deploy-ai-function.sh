#!/usr/bin/env bash
# Deploy da Edge Function AI (Gemini no servidor)
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

# Carrega Gemini do .env local sem echo
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env
  set +a
fi

if [[ -z "${EXPO_PUBLIC_GEMINI_API_KEY:-}" ]]; then
  echo "EXPO_PUBLIC_GEMINI_API_KEY ausente no .env"
  exit 1
fi

echo "Linking project $PROJECT_REF..."
"$SUPABASE_BIN" link --project-ref "$PROJECT_REF" --yes

echo "Setting GEMINI_API_KEY secret..."
"$SUPABASE_BIN" secrets set "GEMINI_API_KEY=${EXPO_PUBLIC_GEMINI_API_KEY}" --project-ref "$PROJECT_REF"

echo "Deploying function ai..."
"$SUPABASE_BIN" functions deploy ai --project-ref "$PROJECT_REF" --yes

echo "Done. Function URL:"
echo "https://${PROJECT_REF}.supabase.co/functions/v1/ai"
