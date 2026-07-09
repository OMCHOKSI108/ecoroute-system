#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

run_package_formatter() {
  local dir="$1"
  local package_json="$dir/package.json"

  [ -f "$package_json" ] || return 1

  if command -v node >/dev/null 2>&1; then
    if node -e "const p=require(process.argv[1]); process.exit(p.scripts && p.scripts.format ? 0 : 1)" "$package_json"; then
      (cd "$dir" && npm run format)
      return 0
    fi
    if node -e "const p=require(process.argv[1]); const d={...p.dependencies,...p.devDependencies}; process.exit(d.prettier ? 0 : 1)" "$package_json"; then
      (cd "$dir" && npx prettier --write .)
      return 0
    fi
  fi

  return 1
}

run_package_formatter "$repo_root/backend" && exit 0
run_package_formatter "$repo_root" && exit 0

exit 0
