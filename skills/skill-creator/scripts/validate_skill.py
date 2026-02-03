# Example script for skill-creator
# This demonstrates how to create executable scripts for skills

def validate_skill_structure(skill_path):
    """Validate that a skill has proper structure according to guidelines."""
    import os
    from pathlib import Path
    
    skill_dir = Path(skill_path)
    errors = []
    warnings = []
    
    # Check required SKILL.md
    skill_md_path = skill_dir / "SKILL.md"
    if not skill_md_path.exists():
        errors.append("Missing required SKILL.md file")
        return errors, warnings
    
    # Check frontmatter
    with open(skill_md_path, 'r') as f:
        content = f.read()
        if 'name:' not in content:
            errors.append("SKILL.md missing required 'name' field in frontmatter")
        if 'description:' not in content:
            errors.append("SKILL.md missing required 'description' field in frontmatter")
    
    # Check optional directories
    for dir_name in ['scripts', 'references', 'assets']:
        dir_path = skill_dir / dir_name
        if dir_path.exists():
            if not dir_path.is_dir():
                errors.append(f"{dir_name} exists but is not a directory")
            else:
                # Check if directory has files
                files = list(dir_path.iterdir())
                if not files:
                    warnings.append(f"{dir_name} directory is empty")
    
    return errors, warnings

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python validate_skill.py <skill-path>")
        sys.exit(1)
    
    skill_path = sys.argv[1]
    errors, warnings = validate_skill_structure(skill_path)
    
    if errors:
        print("❌ Validation failed:")
        for error in errors:
            print(f"   - {error}")
        sys.exit(1)
    
    if warnings:
        print("⚠️  Warnings:")
        for warning in warnings:
            print(f"   - {warning}")
    
    print("✅ Skill structure is valid")
