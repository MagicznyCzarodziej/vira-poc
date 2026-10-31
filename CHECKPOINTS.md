# Project checkpoints

## `checkpoint/kanban-poc-2026-10-31-ref-panel`

Kanban PoC snapshot: revision side panel, searchable ref-link picker (tags/kinds), selection→link flow, **Update link to current** (source field + head revision sync, unpinned @v, panel view sync).

**Restore from tag:**

```bash
cd /Users/deko/dev/whyte
git checkout checkpoint/kanban-poc-2026-10-31-ref-panel -- kanban-poc/
```

**Restore from side copy:**

```bash
cp -R .checkpoints/2026-10-31-kanban-poc-ref-panel/kanban-poc /Users/deko/dev/whyte/
```

**See what the checkpoint contains:**

```bash
git show checkpoint/kanban-poc-2026-10-31-ref-panel --stat
```

---

## `checkpoint/kanban-poc-2026-10-31`

Kanban PoC snapshot: issue ref preview, Q/A versioning, stale links, update-link fix, no preview dividers.

**Restore from tag (keeps other work on disk until you overwrite):**

```bash
cd /Users/deko/dev/whyte
git checkout checkpoint/kanban-poc-2026-10-31 -- kanban-poc/
```

**Restore from side copy:**

```bash
cp -R .checkpoints/2026-10-31-kanban-poc/kanban-poc /Users/deko/dev/whyte/
```

**See what the checkpoint contains:**

```bash
git show checkpoint/kanban-poc-2026-10-31 --stat
```
