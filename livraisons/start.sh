#!/bin/sh
# Démarrage en production (Docker / Railway).
# SEED_DEMO=1 : remplit une base VIDE avec les données de démonstration
# (mot de passe : DEMO_PASSWORD, sinon généré et affiché dans les journaux).
set -e
if [ "$SEED_DEMO" = "1" ]; then
  npx tsx --conditions=react-server scripts/seed.ts
fi
exec npx next start --port "${PORT:-3001}"
