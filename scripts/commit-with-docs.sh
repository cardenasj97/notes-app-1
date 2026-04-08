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

message="$*"

if [[ -z "${message// }" || "$message" == "--" ]]; then
  echo "commit message required" >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
git_dir="$(git rev-parse --git-dir)"
cd "$repo_root"

doc_files=(NOTES.md AI_USAGE.md BUGS.md REVIEW.md)
log_file="$git_dir/post-commit-docs.log"

log_line() {
  local message="$1"
  echo "$message" | tee -a "$log_file"
}

git add -A
git restore --staged "${doc_files[@]}" 2>/dev/null || true

if [[ -z "$(git diff --cached --name-only)" ]]; then
  echo "no non-deliverable changes staged for commit" >&2
  exit 1
fi

log_line "[commit-with-docs] creating main commit message=$(printf '%q' "$message")"
CODEX_DOCS_HOOK_DISABLED=1 git commit -m "$message"
main_commit_sha="$(git rev-parse --short HEAD)"
log_line "[commit-with-docs] main commit created sha=$main_commit_sha"

if ! bash ./scripts/refresh-deliverable-docs.sh; then
  log_line "[commit-with-docs] deliverable-doc refresh failed after sha=$main_commit_sha"
  echo "deliverable-doc refresh failed; fix the docs refresh path before pushing." >&2
  exit 1
fi

log_line "[commit-with-docs] deliverable-doc refresh completed for sha=$main_commit_sha"

if ! git diff --quiet -- "${doc_files[@]}"; then
  git add "${doc_files[@]}"
  CODEX_DOCS_HOOK_DISABLED=1 git commit -m "docs: refresh deliverables for $main_commit_sha"
  docs_commit_sha="$(git rev-parse --short HEAD)"
  log_line "[commit-with-docs] docs commit created sha=$docs_commit_sha for main_sha=$main_commit_sha"
else
  log_line "[commit-with-docs] no deliverable-doc changes detected for sha=$main_commit_sha"
fi

if [[ "$push_after" == "1" ]]; then
  current_branch="$(git branch --show-current)"
  log_line "[commit-with-docs] pushing branch=$current_branch"
  git push origin "$current_branch"
  log_line "[commit-with-docs] push complete branch=$current_branch"
fi
