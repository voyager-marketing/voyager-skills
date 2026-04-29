---
name: skill-creator
description: Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.
owner: Anthropic (vendored)
last_reviewed: 2026-04-29
---

# Skill Creator

> **Vendored from `/mnt/skills/examples/skill-creator/`.** This is the canonical Anthropic example. Do not edit content here. When upstream changes, re-pull the file verbatim and bump `last_reviewed`. Voyager governance — see `voyager-skills/CLAUDE.md` — depends on this skill being available everywhere as the eval gate (no skill moves Draft → Live without a passing run). See also `voyager-skills/docs/eval-workflow.md`.

A skill for creating new skills and iteratively improving them.

## Core Workflow

1. **Capture Intent** — What should this skill enable Claude to do? When should it trigger? What's the expected output?
2. **Write the SKILL.md** — Draft the skill with frontmatter (name, description) and markdown instructions
3. **Test** — Create 2-3 realistic test prompts and run them
4. **Evaluate** — Review results qualitatively and quantitatively
5. **Improve** — Generalize from feedback, keep instructions lean, explain the why
6. **Repeat** until satisfied

## SKILL.md Structure

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```

## Key Principles

- **Description is the trigger**: The description field determines when Claude invokes the skill. Make it specific and slightly "pushy" — Claude tends to undertrigger.
- **Progressive disclosure**: Keep SKILL.md under 500 lines. Use reference files for large docs.
- **Generalize, don't overfit**: Skills will be used across many prompts. Avoid narrow fixes for specific test cases.
- **Explain the why**: Instead of rigid ALL-CAPS directives, explain reasoning so the model understands importance.
- **Bundle repeated work**: If test runs all independently create similar helper scripts, bundle that script in `scripts/`.

## Writing Style

- Use imperative form in instructions
- Explain why things matter rather than just demanding compliance
- Include examples for output formats
- Start with a draft, review with fresh eyes, then improve

## Skills Location

Voyager skills live in the `voyager-marketing/voyager-skills` repo at `skills/<name>/`. Each skill gets its own directory with a SKILL.md file. The repo's `install.sh` symlinks them into `~/.claude/skills/` for global availability. See `voyager-skills/CLAUDE.md` for governance, lifecycle, and the four-rule contract.
