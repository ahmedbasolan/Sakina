# Example reference documentation for skill-creator

# This demonstrates how to create reference documentation

## Skill Structure Reference

### Required Components

#### SKILL.md

Every skill must have a SKILL.md file with:

**YAML Frontmatter (Required)**

```yaml
---
name: skill-name
description: Clear description of when to use this skill
license: Complete terms in LICENSE.txt
---
```

**Markdown Body (Required)**

- Overview of skill functionality
- Usage examples
- Implementation notes
- Resource descriptions

### Optional Components

#### Scripts Directory

- Executable code files
- Use for repeated operations
- Provides deterministic reliability
- Token efficient

#### References Directory

- Documentation for context
- Large reference materials
- Domain knowledge
- API specifications

#### Assets Directory

- Files used in output
- Templates
- Images, icons, fonts
- Boilerplate code

## Best Practices

1. **Focused Scope**: Each skill should address a specific domain
2. **Clear Descriptions**: Frontmatter should clearly indicate usage
3. **Lean Documentation**: Keep SKILL.md concise, use references for details
4. **Modular Design**: Skills should be self-contained
5. **Iterative Development**: Start simple, add complexity as needed

## Common Patterns

### Data Processing Skills

- Include scripts for data transformation
- References for data schemas
- Assets for output templates

### API Integration Skills

- Scripts for API interactions
- References for API documentation
- Error handling patterns

### Content Generation Skills

- Templates in assets/
- Style guides in references/
- Generation scripts
