#!/usr/bin/env python3
"""
Component Generator for Frontend Design
Generates boilerplate for various frontend components with distinctive styling
"""

import argparse
import json
from pathlib import Path

def generate_component(component_type, name, aesthetic="minimal"):
    """Generate component boilerplate based on type and aesthetic"""
    
    templates = {
        "react": {
            "minimal": f"""import React from 'react';
import styles from './{name}.module.css';

const {name.title()} = () => {{
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{name.title()}</h1>
      <p className={styles.description}>Distinctive minimal component</p>
    </div>
  );
}};

export default {name.title()};
""",
            "maximalist": f"""import React, {{ useEffect, useState }} from 'react';
import styles from './{name}.module.css';

const {name.title()} = () => {{
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {{
    setTimeout(() => setIsLoaded(true), 100);
  }}, []);

  return (
    <div className={`${{styles.container}} ${{isLoaded ? styles.loaded : ''}}`}>
      <div className={styles.background}>
        <div className={styles.gradient}></div>
        <div className={styles.noise}></div>
      </div>
      <div className={styles.content}>
        <h1 className={styles.title}>{name.title()}</h1>
        <p className={styles.description}>Bold maximalist component</p>
      </div>
    </div>
  );
}};

export default {name.title()};
"""
        },
        "html": {
            "minimal": f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name.title()}</title>
    <link rel="stylesheet" href="{name}.css">
</head>
<body>
    <div class="container">
        <h1 class="title">{name.title()}</h1>
        <p class="description">Distinctive minimal component</p>
    </div>
</body>
</html>
""",
            "maximalist": f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name.title()}</title>
    <link rel="stylesheet" href="{name}.css">
</head>
<body>
    <div class="container">
        <div class="background">
            <div class="gradient"></div>
            <div class="noise"></div>
        </div>
        <div class="content">
            <h1 class="title">{name.title()}</h1>
            <p class="description">Bold maximalist component</p>
        </div>
    </div>
</body>
</html>
"""
        }
    }
    
    css_templates = {
        "minimal": f"""/* {name.title()} - Minimal Aesthetic */
:root {{
  --primary-color: #1a1a1a;
  --secondary-color: #f5f5f5;
  --accent-color: #0066cc;
  --font-display: 'Playfair Display', serif;
  --font-body: 'Source Sans Pro', sans-serif;
}}

.container {{
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: var(--font-body);
  color: var(--primary-color);
}}

.title {{
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 400;
  margin-bottom: 1rem;
  line-height: 1.2;
}}

.description {{
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--secondary-color);
}}
""",
        "maximalist": f"""/* {name.title()} - Maximalist Aesthetic */
:root {{
  --primary-gradient: linear-gradient(45deg, #ff006e, #8338ec, #3a86ff);
  --secondary-color: #ffbe0b;
  --text-light: #ffffff;
  --text-dark: #1a1a1a;
  --font-display: 'Bebas Neue', cursive;
  --font-body: 'Space Mono', monospace;
}}

.container {{
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  font-family: var(--font-body);
}}

.background {{
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
}}

.gradient {{
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: var(--primary-gradient);
  animation: rotate 20s linear infinite;
}}

.noise {{
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9Ii4wNSIvPjwvc3ZnPg==');
  opacity: 0.4;
}}

.content {{
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  text-align: center;
  padding: 2rem;
}}

.title {{
  font-family: var(--font-display);
  font-size: clamp(3rem, 10vw, 8rem);
  font-weight: 400;
  margin-bottom: 1rem;
  color: var(--text-light);
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  animation: glitch 2s infinite;
}}

.description {{
  font-size: 1.2rem;
  line-height: 1.6;
  color: var(--secondary-color);
  max-width: 600px;
  animation: slideIn 1s ease-out;
}}

@keyframes rotate {{
  from {{ transform: rotate(0deg); }}
  to {{ transform: rotate(360deg); }}
}}

@keyframes glitch {{
  0%, 100% {{ text-shadow: 0 0 20px rgba(255, 255, 255, 0.5); }}
  25% {{ text-shadow: -2px 0 #ff006e, 2px 0 #3a86ff; }}
  50% {{ text-shadow: 2px 0 #8338ec, -2px 0 #ffbe0b; }}
  75% {{ text-shadow: 0 0 20px rgba(255, 255, 255, 0.5); }}
}}

@keyframes slideIn {{
  from {{ 
    opacity: 0;
    transform: translateY(30px);
  }}
  to {{ 
    opacity: 1;
    transform: translateY(0);
  }}
}}
"""
    }
    
    # Generate component files
    component_template = templates.get(component_type, {}).get(aesthetic, "")
    css_template = css_templates.get(aesthetic, "")
    
    return {
        "component": component_template,
        "css": css_template
    }

def main():
    parser = argparse.ArgumentParser(description="Generate frontend component boilerplate")
    parser.add_argument("type", choices=["react", "html"], help="Component type")
    parser.add_argument("name", help="Component name")
    parser.add_argument("--aesthetic", choices=["minimal", "maximalist"], default="minimal", help="Design aesthetic")
    parser.add_argument("--output", default=".", help="Output directory")
    
    args = parser.parse_args()
    
    # Generate component
    generated = generate_component(args.type, args.name, args.aesthetic)
    
    # Create output directory
    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Write component file
    if args.type == "react":
        component_file = output_path / f"{args.name}.jsx"
        css_file = output_path / f"{args.name}.module.css"
    else:  # html
        component_file = output_path / f"{args.name}.html"
        css_file = output_path / f"{args.name}.css"
    
    with open(component_file, "w") as f:
        f.write(generated["component"])
    
    with open(css_file, "w") as f:
        f.write(generated["css"])
    
    print(f"✅ Generated {args.aesthetic} {args.type} component: {component_file}")
    print(f"🎨 Generated CSS: {css_file}")

if __name__ == "__main__":
    main()
