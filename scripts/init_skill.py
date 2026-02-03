#!/usr/bin/env python3
"""
Initialize a new skill directory with proper structure.
Based on Anthropic's skill-creator documentation.
"""

import os
import sys
import argparse
from pathlib import Path

def create_skill_directory(skill_name: str, output_path: str):
    """Create a new skill directory with all required files and structure."""
    
    # Create main skill directory
    skill_path = Path(output_path) / skill_name
    skill_path.mkdir(parents=True, exist_ok=True)
    
    # Create resource directories
    (skill_path / "scripts").mkdir(exist_ok=True)
    (skill_path / "references").mkdir(exist_ok=True)
    (skill_path / "assets").mkdir(exist_ok=True)
    
    # Create SKILL.md with template
    skill_md_content = f"""---
name: {skill_name}
description: TODO: Add clear description of when this skill should be used and what it provides
license: Complete terms in LICENSE.txt
---

# {skill_name.title()} Skill

## Overview
TODO: Describe what this skill does and when it should be triggered.

## Usage Examples
TODO: Add concrete examples of how users would interact with this skill.
Example: "When users ask for [specific functionality], this skill provides [specific capabilities]."

## Core Functionality
TODO: Outline the main workflows and capabilities this skill enables.

## Available Resources

### Scripts
TODO: List any executable scripts in the scripts/ directory and their purposes.

### References  
TODO: List any reference documentation in the references/ directory.

### Assets
TODO: List any assets/templates in the assets/ directory.

## Implementation Notes
TODO: Add any important implementation details, constraints, or best practices.
"""

    with open(skill_path / "SKILL.md", "w") as f:
        f.write(skill_md_content)
    
    # Create example files in each directory
    example_script = f'''#!/usr/bin/env python3
"""
Example script for {skill_name} skill.
TODO: Replace with your actual implementation.
'''
    
    with open(skill_path / "scripts" / "example.py", "w") as f:
        f.write(example_script)

def main():
    parser = argparse.ArgumentParser(description="Initialize a new skill directory")
    parser.add_argument("skill_name", help="Name of the skill to create")
    parser.add_argument("--path", required=True, help="Output directory for the skill")
    
    args = parser.parse_args()
    
    try:
        create_skill_directory(args.skill_name, args.path)
        print(f"✅ Skill '{args.skill_name}' created successfully at {args.path}/{args.skill_name}")
        print(f"📁 Next steps:")
        print(f"   1. Edit {args.skill_name}/SKILL.md with your skill description")
        print(f"   2. Add scripts to {args.skill_name}/scripts/")
        print(f"   3. Add references to {args.skill_name}/references/")
        print(f"   4. Add assets to {args.skill_name}/assets/")
    except Exception as e:
        print(f"❌ Error creating skill: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
