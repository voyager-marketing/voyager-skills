# /new-skill

Scaffold a new skill in the voyager-skills repo.

## Your task

Create a new skill based on $ARGUMENTS (the skill name and description).

### Steps

1. Parse the skill name from $ARGUMENTS. Kebab-case it (e.g., "SEO Audit" becomes "seo-audit").
2. Create the directory structure:
   ```
   skills/<skill-name>/
   ├── SKILL.md
   ├── commands/
   │   └── <skill-name>.md
   ├── presets/     (if applicable)
   └── scripts/     (if applicable)
   ```
3. Generate SKILL.md with proper YAML frontmatter:
   - `name`: the kebab-case skill name
   - `description`: write a comprehensive trigger description based on what the user described. Make it "pushy" so it triggers reliably. Include specific phrases and contexts.
4. Generate the main slash command in `commands/<skill-name>.md`
5. Run `./install.sh` to symlink the new command
6. Report what was created and suggest next steps (test cases, iteration)

### SKILL.md template

Use this structure:

```markdown
---
name: <skill-name>
description: >
  <Comprehensive description of when to trigger. Include specific phrases,
  contexts, and use cases. Be pushy -- err on the side of triggering.>
---

# <Skill Name>

<What this skill does and why it exists.>

## Prerequisites

<What needs to be installed or configured.>

## Usage

<How to use the slash commands.>

## Workflow

<Step-by-step what happens when invoked.>
```
