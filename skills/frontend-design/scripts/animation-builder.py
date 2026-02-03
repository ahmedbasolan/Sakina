#!/usr/bin/env python3
"""
Animation Builder for Frontend Design
Creates CSS animations with distinctive effects
"""

import argparse
import json
from pathlib import Path

def generate_animation(animation_type, name, duration="2s"):
    """Generate CSS animation based on type"""
    
    animations = {
        "glitch": f"""@keyframes {name} {{
  0%, 100% {{
    transform: translate(0);
    filter: hue-rotate(0deg);
  }}
  20% {{
    transform: translate(-2px, 2px);
    filter: hue-rotate(90deg);
  }}
  40% {{
    transform: translate(-2px, -2px);
    filter: hue-rotate(180deg);
  }}
  60% {{
    transform: translate(2px, 2px);
    filter: hue-rotate(270deg);
  }}
  80% {{
    transform: translate(2px, -2px);
    filter: hue-rotate(360deg);
  }}
}}

.{name} {{
  animation: {name} {duration} infinite;
}}
""",
        "fade-in": f"""@keyframes {name} {{
  from {{
    opacity: 0;
    transform: translateY(20px);
  }}
  to {{
    opacity: 1;
    transform: translateY(0);
  }}
}}

.{name} {{
  animation: {name} {duration} ease-out;
}}
""",
        "slide-in": f"""@keyframes {name} {{
  from {{
    transform: translateX(-100%);
    opacity: 0;
  }}
  to {{
    transform: translateX(0);
    opacity: 1;
  }}
}}

.{name} {{
  animation: {name} {duration} cubic-bezier(0.25, 0.46, 0.45, 0.94);
}}
""",
        "rotate": f"""@keyframes {name} {{
  from {{
    transform: rotate(0deg);
  }}
  to {{
    transform: rotate(360deg);
  }}
}}

.{name} {{
  animation: {name} {duration} linear infinite;
}}
""",
        "pulse": f"""@keyframes {name} {{
  0%, 100% {{
    transform: scale(1);
    opacity: 1;
  }}
  50% {{
    transform: scale(1.05);
    opacity: 0.8;
  }}
}}

.{name} {{
  animation: {name} {duration} ease-in-out infinite;
}}
""",
        "typewriter": f"""@keyframes {name} {{
  from {{
    width: 0;
  }}
  to {{
    width: 100%;
  }}
}}

.{name} {{
  overflow: hidden;
  white-space: nowrap;
  animation: {name} {duration} steps(40, end);
}}

.{name}::after {{
  content: '|';
  animation: blink 1s infinite;
}}

@keyframes blink {{
  0%, 50% {{ opacity: 1; }}
  51%, 100% {{ opacity: 0; }}
}}
""",
        "bounce": f"""@keyframes {name} {{
  0%, 20%, 53%, 80%, 100% {{
    transform: translate3d(0, 0, 0);
  }}
  40%, 43% {{
    transform: translate3d(0, -30px, 0);
  }}
  70% {{
    transform: translate3d(0, -15px, 0);
  }}
  90% {{
    transform: translate3d(0, -4px, 0);
  }}
}}

.{name} {{
  animation: {name} {duration} ease-in-out;
}}
"""
    }
    
    return animations.get(animation_type, "")

def main():
    parser = argparse.ArgumentParser(description="Generate CSS animations")
    parser.add_argument("type", choices=["glitch", "fade-in", "slide-in", "rotate", "pulse", "typewriter", "bounce"], help="Animation type")
    parser.add_argument("name", help="Animation name")
    parser.add_argument("--duration", default="2s", help="Animation duration")
    parser.add_argument("--output", default=".", help="Output directory")
    
    args = parser.parse_args()
    
    # Generate animation
    animation_css = generate_animation(args.type, args.name, args.duration)
    
    if not animation_css:
        print(f"❌ Unknown animation type: {args.type}")
        return
    
    # Create output directory
    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Write animation file
    animation_file = output_path / f"{args.name}.css"
    
    with open(animation_file, "w") as f:
        f.write(f"/* {args.name.title()} Animation - {args.type} */\n\n")
        f.write(animation_css)
    
    print(f"✅ Generated {args.type} animation: {animation_file}")

if __name__ == "__main__":
    main()
