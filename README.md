## TRYGO + Spec Kit

This repository is initialized with [GitHub Spec Kit](https://github.com/github/spec-kit) release `v0.0.79` using the `cursor-agent` template.

- Generated assets live under `.specify/` (project memory, reusable scripts, and spec templates) and `.cursor/commands/` (slash-command definitions for Cursor).
- Spec Kit created an initial git history; run `git status` before committing further changes.
- The CLI is available via `~/Library/Python/3.9/bin/uvx`; add that directory to your `PATH` for convenience.

### Recommended Next Steps

- `/speckit.constitution` – capture guiding principles for TRYGO.
- `/speckit.specify` – draft the baseline product spec.
- `/speckit.plan` – produce implementation plans from the spec.
- `/speckit.tasks` – break the plan into actionable tasks.
- `/speckit.implement` – execute tasks via the Spec Kit workflow.

If you need to rerun the initializer or update templates, execute:

```
~/Library/Python/3.9/bin/uvx --from git+https://github.com/github/spec-kit.git specify update
```



