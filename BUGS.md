# BUGS

- Integration review found that the initial `/app` layout still rendered a demo-focused notes shell instead of the real org-management shell. Follow-up assigned before merge.
- Integration review found that DB-backed note detail/list/search logic still depended on demo helpers in places, which would break real data mode. Follow-up assigned before merge.
- Integration review found that file and AI API routes initially trusted an `x-user-id` header instead of the authenticated session. Follow-up assigned before merge.
