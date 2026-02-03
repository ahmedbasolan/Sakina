---
name: skill-creator
description: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations.
license: Complete terms in LICENSE.txt
---

# Skill Creator

## Overview

The skill-creator provides a systematic approach to creating modular, self-contained packages that extend Claude's capabilities with specialized knowledge, workflows, and tools.

## When to Use This Skill

Use this skill when users want to:

- Create a new skill from scratch
- Update an existing skill structure
- Package a skill for distribution
- Understand best practices for skill development

## Core Principles

### Concise is Key

Skills should be focused and specific. Each skill should address a well-defined domain or task.

### Set Appropriate Degrees of Freedom

Skills should provide clear guidance while allowing flexibility for different use cases.

## Skill Anatomy

Every skill consists of:

**Required:**

- `SKILL.md` - Main skill file with YAML frontmatter and markdown instructions

**Optional Resources:**

- `scripts/` - Executable code for deterministic reliability
- `references/` - Documentation loaded as needed into context
- `assets/` - Files used in output (templates, images, etc.)

## Skill Creation Process

### Step 1: Understand with Concrete Examples

Define clear usage examples:

- What functionality should the skill support?
- How would users interact with this skill?
- What triggers the skill activation?

### Step 2: Plan Reusable Contents

Analyze examples to identify:

- **Scripts**: Repeated code that needs reliability
- **References**: Documentation for context
- **Assets**: Templates and output files

### Step 3: Initialize Skill

Use the init script:

```bash
python scripts/init_skill.py <skill-name> --path skills/
```

### Step 4: Edit Skill

- Customize SKILL.md frontmatter and instructions
- Add scripts, references, and assets as planned
- Follow best practices for each resource type

### Step 5: Package Skill

Use the package script:

```bash
python scripts/package_skill.py skills/<skill-name> --path dist/ --validate
```

### Step 6: Iterate

Refine based on real usage and feedback.

## Resource Guidelines

### Scripts (`scripts/`)

**When to include:**

- Same code rewritten repeatedly
- Deterministic reliability needed
- Complex operations requiring token efficiency

**Examples:**

- `scripts/rotate_pdf.py`
- `scripts/process_data.py`

### References (`references/`)

**When to include:**

- Documentation for context during work
- Large reference materials (>10k words)
- Domain knowledge and specifications

**Examples:**

- `references/api_docs.md`
- `references/database_schema.md`
- `references/company_policies.md`

### Assets (`assets/`)

**When to include:**

- Files used in final output
- Templates and boilerplate
- Images, icons, fonts

**Examples:**

- `assets/report_template.docx`
- `assets/logo.png`
- `assets/react_boilerplate/`

## What NOT to Include

Avoid auxiliary documentation files:

- README.md
- INSTALLATION_GUIDE.md
- QUICK_REFERENCE.md
- CHANGELOG.md

Skills should only contain essential files for AI agent functionality.

## Available Tools

This project provides:

- `scripts/init_skill.py` - Initialize new skill structure
- `scripts/package_skill.py` - Package skills for distribution
- Complete documentation and examples

## Best Practices

1. **Clear Frontmatter**: Ensure `name` and `description` clearly indicate when to use the skill
2. **Lean SKILL.md**: Keep core instructions, move detailed info to references
3. **Modular Design**: Each skill should be self-contained and focused
4. **Iterative Development**: Start simple, add complexity based on needs
