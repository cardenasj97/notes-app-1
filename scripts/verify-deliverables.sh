#!/usr/bin/env bash
set -euo pipefail

mode="range"
range=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --staged)
      mode="staged"
      shift
      ;;
    --range)
      mode="range"
      range="${2:-}"
      shift 2
      ;;
    --help|-h)
      cat <<'EOF'
Usage:
  bash ./scripts/verify-deliverables.sh --staged
  bash ./scripts/verify-deliverables.sh --range <git-range>

Rules:
  - If non-deliverable files changed, NOTES.md, AI_USAGE.md, BUGS.md, and REVIEW.md
    must also be included in the same staged set or outgoing push range.
  - Docs-only changes are always allowed.
EOF
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

doc_files=(NOTES.md AI_USAGE.md BUGS.md REVIEW.md)
doc_paths_re='^(NOTES\.md|AI_USAGE\.md|BUGS\.md|REVIEW\.md)$'

collect_names() {
  local kind="$1"
  if [[ "$kind" == "staged" ]]; then
    git diff --cached --name-only --diff-filter=ACMR
  else
    git diff --name-only --diff-filter=ACMR "$range"
  fi
}

all_changed="$(collect_names "$mode")"

if [[ -z "$all_changed" ]]; then
  exit 0
fi

non_doc_changed="$(printf '%s\n' "$all_changed" | rg -v "$doc_paths_re" || true)"

if [[ -z "$non_doc_changed" ]]; then
  exit 0
fi

missing_docs=()
for file in "${doc_files[@]}"; do
  if ! printf '%s\n' "$all_changed" | rg -qx "$file"; then
    missing_docs+=("$file")
  fi
done

if [[ ${#missing_docs[@]} -eq 0 ]]; then
  exit 0
fi

{
  echo "deliverable docs are stale for this ${mode} change set"
  echo "missing required docs:"
  for file in "${missing_docs[@]}"; do
    echo "  - $file"
  done
  echo "non-deliverable files in scope:"
  printf '%s\n' "$non_doc_changed" | sed 's/^/  - /'
} >&2

exit 1
