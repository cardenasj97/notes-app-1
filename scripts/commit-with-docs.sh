#!/usr/bin/env bash
set -euo pipefail

push_after=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --push)
      push_after=1
      shift
      ;;
    --help|-h)
      cat <<'EOF'
Usage:
  bash ./scripts/commit-with-docs.sh [--push] "commit message"

Behavior:
  1. Stages all non-deliverable changes.
  2. Creates the main code commit.
  3. Runs Codex to refresh NOTES.md, AI_USAGE.md, BUGS.md, and REVIEW.md.
  4. Creates a second docs commit if those files changed.
  5. Optionally pushes the current branch when --push is provided.
EOF
      exit 0
      ;;
    *)
      break
      ;;
  esac
done

if [[ $# -lt 1 ]]; then
  echo "commit message required" >&2
  exit 1
fi

message="$1"
repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

doc_files=(NOTES.md AI_USAGE.md BUGS.md REVIEW.md)

git add -A
git restore --staged "${doc_files[@]}" 2>/dev/null || true

if [[ -z "$(git diff --cached --name-only)" ]]; then
  echo "no non-deliverable changes staged for commit" >&2
  exit 1
fi

CODEX_DOCS_HOOK_DISABLED=1 git commit -m "$message"

bash ./scripts/refresh-deliverable-docs.sh

if ! git diff --quiet -- "${doc_files[@]}"; then
  git add "${doc_files[@]}"
  CODEX_DOCS_HOOK_DISABLED=1 git commit -m "docs: refresh deliverables for $(git rev-parse --short HEAD~1)"
fi

if [[ "$push_after" == "1" ]]; then
  current_branch="$(git branch --show-current)"
  git push origin "$current_branch"
fi
