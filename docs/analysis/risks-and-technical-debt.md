# Risks and Technical Debt

## Verified/current

- Working tree contains uncommitted changes across auth, routing, dashboard, shell and shared components.
- Three baseline unit/component test failures remain and must not be silently attributed to new work.
- Frontend generated API types depend on an external Backend OpenAPI snapshot.
- Live visual QA requires a working browser/runtime and realistic backend or controlled fixtures.
- Unified login currently spans two backend actor-specific endpoints; this adds a fallback request and remains a contract trade-off.
- Dashboard and management UX have undergone iterative changes; reference grammar is not fully validated across all screens.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Backend contract drift | High | Regenerate OpenAPI types and run contract checks after backend changes. |
| Stale/cross-workspace returnTo | High | Validate workspace-specific post-login destinations; test customer/STAFF/ADMIN matrix. |
| Baseline failures obscure regressions | High | Record signatures and compare after every wave. |
| Visual QA without real runtime | Medium | Use controlled fixtures and screenshot review; do not claim live verification without it. |
| Broad refactor scope | Medium | Implement one wave/vertical slice at a time; stop after acceptance gates. |
| Financial UI action ambiguity | High | Preserve backend authority and explicit confirmation for refund/reconcile actions. |

## Out of scope for discovery

No feature implementation, backend migration, dependency change, commit, push or external publication was performed in this discovery pass.
