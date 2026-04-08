#!/usr/bin/env bash
set -euo pipefail

push_after=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --push)
      push_after=1
      shift
      ;;
    --)
      shift
      break
      ;;
    --help|-h)
      cat <<'EOF'
Usage:
  bash ./scripts/commit-with-docs.sh [--push] "commit message"

Behavior:
  1. Stages all current changes.
  2. Verifies NOTES.md, AI_USAGE.md, BUGS.md, and REVIEW.md are included when code changes exist.
  3. Creates a single commit with code and deliverable docs together.
  4. Optionally pushes the current branch when --push is provided.
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

message="$*"

if [[ -z "${message// }" || "$message" == "--" ]]; then
  echo "commit message required" >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
git_dir="$(git rev-parse --git-dir)"
cd "$repo_root"

log_file="$git_dir/post-commit-docs.log"

log_line() {
  local message="$1"
  echo "$message" | tee -a "$log_file"
}

git add -A

if [[ -z "$(git diff --cached --name-only)" ]]; then
  echo "no staged changes available for commit" >&2
  exit 1
fi

if ! bash ./scripts/verify-deliverables.sh --staged; then
  log_line "[commit-with-docs] deliverable-doc verification failed before commit."
  echo "update NOTES.md, AI_USAGE.md, BUGS.md, and REVIEW.md before committing code changes." >&2
  exit 1
fi

log_line "[commit-with-docs] creating main commit message=$(printf '%q' "$message")"
CODEX_DOCS_HOOK_DISABLED=1 git commit -m "$message"
main_commit_sha="$(git rev-parse --short HEAD)"
log_line "[commit-with-docs] main commit created sha=$main_commit_sha"

if [[ "$push_after" == "1" ]]; then
  current_branch="$(git branch --show-current)"
  log_line "[commit-with-docs] pushing branch=$current_branch"
  git push origin "$current_branch"
  log_line "[commit-with-docs] push complete branch=$current_branch"
fi
