# Community Skill Intake

Community skills are reviewed here before they become part of Voyager's operating system.

Raw community skills are not production workflows. They move through this path:

```text
discover -> review -> sandbox -> fork/adapt -> classify -> validate -> promote
```

Use `community/intake.json` to track each candidate. A reviewed skill can then be copied into the appropriate skill root and classified as `imported`, `forked`, or `internal` in its `SKILL.md` frontmatter.

Validate the manifest:

```bash
npm run validate:community
```
