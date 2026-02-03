#!/usr/bin/env python3
"""
Package a skill for distribution.
Based on Anthropic's skill-creator documentation.
"""

import os
import sys
import argparse
import shutil
import zipfile
from pathlib import Path

def package_skill(skill_path: str, output_path: str):
    """Package a skill directory into a distributable format."""
    
    skill_dir = Path(skill_path)
    skill_name = skill_dir.name
    
    if not skill_dir.exists():
        raise FileNotFoundError(f"Skill directory not found: {skill_path}")
    
    if not (skill_dir / "SKILL.md").exists():
        raise FileNotFoundError(f"SKILL.md not found in {skill_path}")
    
    # Create output directory
    output_dir = Path(output_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create zip package
    package_path = output_dir / f"{skill_name}.zip"
    
    with zipfile.ZipFile(package_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_path in skill_dir.rglob('*'):
            if file_path.is_file():
                # Calculate relative path from skill directory
                arcname = file_path.relative_to(skill_dir.parent)
                zipf.write(file_path, arcname)
    
    print(f"✅ Skill '{skill_name}' packaged successfully")
    print(f"📦 Package location: {package_path}")
    print(f"📊 Package size: {package_path.stat().st_size} bytes")

def validate_skill(skill_path: str):
    """Validate that the skill has proper structure."""
    
    skill_dir = Path(skill_path)
    errors = []
    
    # Check required SKILL.md
    if not (skill_dir / "SKILL.md").exists():
        errors.append("Missing required SKILL.md file")
    
    # Check SKILL.md frontmatter
    skill_md_path = skill_dir / "SKILL.md"
    if skill_md_path.exists():
        with open(skill_md_path, 'r') as f:
            content = f.read()
            if 'name:' not in content:
                errors.append("SKILL.md missing required 'name' field in frontmatter")
            if 'description:' not in content:
                errors.append("SKILL.md missing required 'description' field in frontmatter")
    
    # Check directory structure
    for dir_name in ['scripts', 'references', 'assets']:
        dir_path = skill_dir / dir_name
        if dir_path.exists() and not dir_path.is_dir():
            errors.append(f"{dir_name} exists but is not a directory")
    
    return errors

def main():
    parser = argparse.ArgumentParser(description="Package a skill for distribution")
    parser.add_argument("skill_path", help="Path to the skill directory")
    parser.add_argument("--path", required=True, help="Output directory for the package")
    parser.add_argument("--validate", action="store_true", help="Validate skill structure before packaging")
    
    args = parser.parse_args()
    
    if args.validate:
        errors = validate_skill(args.skill_path)
        if errors:
            print("❌ Skill validation failed:")
            for error in errors:
                print(f"   - {error}")
            sys.exit(1)
        else:
            print("✅ Skill validation passed")
    
    try:
        package_skill(args.skill_path, args.path)
    except Exception as e:
        print(f"❌ Error packaging skill: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
