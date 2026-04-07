# BUGS

- `/app` initially rendered a demo-focused notes shell instead of the real org-management shell. Fixed in `dc71c83`.
- The first DB-backed notes path still mixed real queries with demo-only helpers, which would have broken configured mode. Fixed in `b5a11c4`.
- File and AI API routes initially trusted an `x-user-id` header instead of the authenticated session. Fixed in `b5a11c4`.
