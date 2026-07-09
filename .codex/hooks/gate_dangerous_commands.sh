#!/usr/bin/env bash
set -euo pipefail

payload="$(cat || true)"
command_text="$payload"

if command -v jq >/dev/null 2>&1; then
  parsed="$(printf '%s' "$payload" | jq -r '.. | .command? // empty' 2>/dev/null | tr '\n' ' ' || true)"
  if [ -n "$parsed" ]; then
    command_text="$parsed"
  fi
fi

normalized="$(printf '%s' "$command_text" | tr '[:upper:]' '[:lower:]')"

deny_patterns=(
  'rm -rf /'
  'rm -fr /'
  'git push --force'
  'git push -f'
  'git reset --hard'
  'docker system prune -a'
  'drop database'
  'dropdb'
  'truncate table'
  'delete from .*production'
)

for pattern in "${deny_patterns[@]}"; do
  if printf '%s' "$normalized" | grep -Eq "$pattern"; then
    printf 'Blocked dangerous command pattern: %s\n' "$pattern" >&2
    exit 2
  fi
done

exit 0
