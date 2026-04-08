#!/usr/bin/env bash
set -euo pipefail

mode="sync"

if [[ "${1:-}" == "--background" ]]; then
  mode="background"
  shift
fi

strict_mode=1

if [[ "$mode" == "background" ]]; then
  strict_mode=0
fi

if [[ "${CODEX_DOCS_HOOK_DISABLED:-0}" == "1" ]]; then
  exit 0
fi

if [[ "${CODEX_DOCS_HOOK_RUNNING:-0}" == "1" ]]; then
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel)"
git_dir="$(git rev-parse --git-dir)"
cd "$repo_root"

log_file="$git_dir/post-commit-docs.log"

log_line() {
  local message="$1"
  echo "$message" >>"$log_file"
  if [[ "$mode" == "sync" ]]; then
    echo "$message"
  fi
}

fail_or_skip() {
  local message="$1"
  log_line "$message"
  if [[ "$strict_mode" == "1" ]]; then
    return 1
  fi

  return 0
}

if ! command -v codex >/dev/null 2>&1; then
  fail_or_skip "[deliverable-docs] codex not found; skipping refresh."
  exit $?
fi

required_files=(NOTES.md AI_USAGE.md BUGS.md REVIEW.md)
for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    fail_or_skip "[deliverable-docs] missing $file; skipping refresh."
    exit $?
  fi
done

head_sha="$(git rev-parse --short HEAD)"
head_subject="$(git log -1 --pretty=%s)"

prompt="$(cat <<EOF
Update NOTES.md, AI_USAGE.md, BUGS.md, and REVIEW.md to reflect the newest repository changes introduced by commit $head_sha.

Requirements:
- Read the current contents of those four files and inspect the latest commit diff.
- Update only NOTES.md, AI_USAGE.md, BUGS.md, and REVIEW.md.
- Keep the writing concise, factual, and cumulative rather than replacing all prior history.
- Use commit hash $head_sha anywhere the latest commit should be referenced as the fix.
- Do not create a commit, do not push, and do not modify any other files.
- When editing files, use repo-relative paths only.

Latest commit subject: $head_subject
EOF
)"

run_refresh() {
  log_line "[deliverable-docs] refresh start sha=$head_sha subject=$(printf '%q' "$head_subject") mode=$mode"

  if ! CODEX_DOCS_HOOK_RUNNING=1 codex -a never -s danger-full-access exec -C "$repo_root" --output-last-message /dev/null "$prompt" >>"$log_file" 2>&1; then
    fail_or_skip "[deliverable-docs] codex refresh failed for $head_sha; leaving docs unchanged."
    return $?
  fi

  log_line "[deliverable-docs] deliverable docs refreshed in working tree for $head_sha."
}

if [[ "$mode" == "background" ]]; then
  (
    run_refresh
  ) >/dev/null 2>&1 &
  echo "[deliverable-docs] refresh started in background; see $log_file if needed." >&2
  exit 0
fi

run_refresh
