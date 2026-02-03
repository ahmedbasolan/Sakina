# Skill Creator

Welcome to the Skill Creator system for Windsurf! This implements Anthropic's official skill creation methodology.

## Quick Start

### Create a New Skill

```bash
python scripts/init_skill.py <skill-name> --path skills/
```

Example:

```bash
python scripts/init_skill.py islamic-content-analyzer --path skills/
```

### Package an Existing Skill

```bash
python scripts/package_skill.py skills/<skill-name> --path dist/ --validate
```

## Skill Structure

Based on Anthropic's skill-creator documentation, every skill consists of:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (name, description)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation for context
    └── assets/           - Files used in output (templates, icons, etc.)
```

## Skill Creation Process

1. **Understand the Skill** - Define concrete usage examples
2. **Plan Resources** - Identify reusable scripts, references, assets
3. **Initialize** - Use `init_skill.py` to create structure
4. **Implement** - Edit SKILL.md and add resources
5. **Package** - Use `package_skill.py` for distribution
6. **Iterate** - Refine based on usage

## Best Practices

### SKILL.md

- Clear frontmatter with `name` and `description`
- Focus on when the skill should be used
- Include concrete usage examples
- Keep procedural instructions, move detailed info to references/

### Scripts/

- Use for repeated code or deterministic reliability
- Example: `scripts/rotate_pdf.py`
- Token efficient and reliable

### References/

- Documentation loaded as needed into context
- Example: `references/api_docs.md`, `references/schemas.md`
- Keep SKILL.md lean, use references for detailed info

### Assets/

- Files used in output, not loaded into context
- Example: `assets/template.html`, `assets/logo.png`
- Templates, images, boilerplate code

## What NOT to Include

Don't create auxiliary files like:

- README.md
- INSTALLATION_GUIDE.md
- QUICK_REFERENCE.md
- CHANGELOG.md

Skills should only contain essential files for AI agent functionality.

## Example Skills

Check the `skills/` directory for examples of properly structured skills.

## Documentation

Full documentation based on Anthropic's skill-creator:

- [Skill Creator Guide](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md)
