#!/usr/bin/env python3
"""
Islamic Brand Guidelines Generator
Creates CSS and design assets following Islamic design principles
"""

import argparse
import json
from pathlib import Path

def generate_css_variables():
    """Generate CSS variables for Islamic color palette"""
    return """
/* Islamic Brand Guidelines - Color Palette */
:root {
  /* Primary Colors */
  --islamic-green: #006400;
  --islamic-indigo: #191970;
  --islamic-gold: #FFD700;
  --islamic-white: #FFFFFF;
  
  /* Secondary Colors */
  --islamic-teal: #2ED3C6;
  --islamic-coral: #F88379;
  --islamic-slate: #708090;
  --islamic-cream: #F5F5DC;
  
  /* Accent Colors */
  --islamic-black: #1C1C1C;
  --islamic-orange: #FF8C00;
  --islamic-blue: #87CEEB;
  
  /* Typography */
  --arabic-font: 'Amiri', 'Noto Sans Arabic', serif;
  --english-font: 'Inter', 'Source Sans Pro', sans-serif;
  --display-font: 'Playfair Display', 'Cormorant Garamond', serif;
  
  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  
  /* Shadows */
  --shadow-light: 0 2px 4px rgba(0, 100, 0, 0.1);
  --shadow-medium: 0 4px 8px rgba(0, 100, 0, 0.15);
  --shadow-heavy: 0 8px 16px rgba(0, 100, 0, 0.2);
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}

/* Dark Theme Variables */
[data-theme="dark"] {
  --bg-primary: #0B0F12;
  --bg-secondary: #121A1F;
  --bg-card: #1A2332;
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.70);
  --text-tertiary: rgba(255, 255, 255, 0.45);
  --border-color: rgba(255, 255, 255, 0.08);
}

/* Light Theme Variables */
[data-theme="light"] {
  --bg-primary: var(--islamic-white);
  --bg-secondary: var(--islamic-cream);
  --bg-card: rgba(0, 100, 0, 0.05);
  --text-primary: var(--islamic-black);
  --text-secondary: var(--islamic-slate);
  --text-tertiary: rgba(28, 28, 28, 0.6);
  --border-color: rgba(0, 100, 0, 0.2);
}
"""

def generate_component_styles():
    """Generate component styles following Islamic design principles"""
    return """
/* Islamic Guidance App - Component Styles */

/* Mood Selection Cards */
.mood-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin: var(--spacing-sm);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.mood-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--islamic-green), var(--islamic-teal));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mood-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.mood-card:hover::before {
  opacity: 1;
}

.mood-card.selected {
  border-color: var(--islamic-green);
  background: rgba(0, 100, 0, 0.1);
}

/* Islamic Term Display */
.islamic-term {
  font-family: var(--arabic-font);
  font-size: 1.2rem;
  color: var(--islamic-green);
  text-align: center;
  margin-bottom: var(--spacing-sm);
  direction: rtl;
}

.english-term {
  font-family: var(--english-font);
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
  font-style: italic;
}

/* Guidance Screen Header */
.guidance-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.guidance-title {
  font-family: var(--display-font);
  font-size: 1.5rem;
  color: var(--text-primary);
  text-align: center;
}

/* Quranic Verse Display */
.verse-container {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  margin: var(--spacing-lg);
  position: relative;
  border: 1px solid var(--border-color);
}

.verse-arabic {
  font-family: var(--arabic-font);
  font-size: 1.8rem;
  color: var(--text-primary);
  text-align: center;
  line-height: 2;
  margin-bottom: var(--spacing-md);
  direction: rtl;
}

.verse-translation {
  font-family: var(--english-font);
  font-size: 1.1rem;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
  font-style: italic;
}

.verse-reference {
  font-family: var(--english-font);
  font-size: 0.9rem;
  color: var(--islamic-green);
  text-align: center;
  margin-top: var(--spacing-md);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Action Buttons */
.action-button {
  background: transparent;
  border: 2px solid var(--islamic-green);
  color: var(--islamic-green);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-family: var(--english-font);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.action-button:hover {
  background: var(--islamic-green);
  color: var(--islamic-white);
  transform: translateY(-1px);
  box-shadow: var(--shadow-light);
}

.primary-action {
  background: var(--islamic-green);
  color: var(--islamic-white);
}

.primary-action:hover {
  background: var(--islamic-indigo);
  border-color: var(--islamic-indigo);
}

/* Spiritual Elements */
.spiritual-border {
  border: 2px solid var(--islamic-gold);
  border-radius: var(--radius-lg);
  position: relative;
}

.spiritual-border::before {
  content: '✦';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-primary);
  color: var(--islamic-gold);
  padding: 0 var(--spacing-sm);
  font-size: 1.2rem;
}

/* Geometric Patterns */
.geometric-pattern {
  background-image: 
    radial-gradient(circle at 25% 25%, var(--islamic-green) 2px, transparent 2px),
    radial-gradient(circle at 75% 75%, var(--islamic-teal) 2px, transparent 2px);
  background-size: 20px 20px;
  opacity: 0.1;
}

/* Animations */
@keyframes gentle-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spiritual-glow {
  0%, 100% {
    box-shadow: 0 0 5px var(--islamic-gold);
  }
  50% {
    box-shadow: 0 0 20px var(--islamic-gold);
  }
}

.fade-in {
  animation: gentle-fade-in 0.5s ease-out;
}

.spiritual-glow {
  animation: spiritual-glow 2s ease-in-out infinite;
}

/* Responsive Design */
@media (max-width: 768px) {
  .mood-card {
    margin: var(--spacing-xs);
    padding: var(--spacing-md);
  }
  
  .verse-arabic {
    font-size: 1.5rem;
  }
  
  .verse-translation {
    font-size: 1rem;
  }
  
  .guidance-header {
    padding: var(--spacing-sm) var(--spacing-md);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  :root {
    --border-color: var(--islamic-green);
    --text-secondary: var(--text-primary);
  }
}
"""

def generate_typography_guide():
    """Generate typography guidelines and examples"""
    return {
        "arabic_typography": {
            "primary_font": "Amiri",
            "fallback_fonts": ["Noto Sans Arabic", "Scheherazade"],
            "usage": ["Quranic verses", "Islamic terms", "Arabic content"],
            "sizes": {
                "verse": "1.8rem",
                "term": "1.2rem",
                "caption": "1rem"
            },
            "weights": {
                "regular": 400,
                "bold": 700
            },
            "line_height": {
                "verse": 2.0,
                "term": 1.6,
                "caption": 1.4
            }
        },
        "english_typography": {
            "primary_font": "Inter",
            "fallback_fonts": ["Source Sans Pro", "Lato"],
            "display_font": "Playfair Display",
            "usage": ["Body text", "Navigation", "Headings"],
            "sizes": {
                "h1": "2rem",
                "h2": "1.5rem",
                "body": "1rem",
                "caption": "0.9rem"
            },
            "weights": {
                "light": 300,
                "regular": 400,
                "medium": 500,
                "bold": 600,
                "black": 700
            }
        },
        "typography_rules": [
            "Arabic content should use RTL direction",
            "Maintain adequate line height for readability",
            "Use proper font fallbacks for compatibility",
            "Ensure sufficient contrast for readability",
            "Respect the hierarchy of Islamic content"
        ]
    }

def generate_color_palette():
    """Generate color palette with usage guidelines"""
    return {
        "primary_colors": {
            "islamic_green": {
                "hex": "#006400",
                "usage": ["Primary actions", "Headers", "Important elements"],
                "meaning": "Paradise, growth, tradition"
            },
            "islamic_indigo": {
                "hex": "#191970",
                "usage": ["Secondary actions", "Links", "Spiritual content"],
                "meaning": "Wisdom, spirituality, night prayers"
            },
            "islamic_gold": {
                "hex": "#FFD700",
                "usage": ["Divine elements", "Special occasions", "Accents"],
                "meaning": "Divine light, prosperity, enlightenment"
            },
            "islamic_white": {
                "hex": "#FFFFFF",
                "usage": ["Backgrounds", "Text", "Purity"],
                "meaning": "Purity, peace, clarity"
            }
        },
        "secondary_colors": {
            "islamic_teal": {
                "hex": "#2ED3C6",
                "usage": ["Modern accents", "CTAs", "Highlights"],
                "meaning": "Modern interpretation, growth"
            },
            "islamic_coral": {
                "hex": "#F88379",
                "usage": ["Warm elements", "Community features"],
                "meaning": "Warmth, community, compassion"
            }
        },
        "usage_guidelines": [
            "Primary green should dominate the color hierarchy",
            "Use gold sparingly for divine/spiritual elements",
            "Maintain high contrast for readability",
            "Test colors with Arabic text rendering",
            "Ensure cultural appropriateness of color combinations"
        ]
    }

def main():
    parser = argparse.ArgumentParser(description="Generate Islamic brand guidelines assets")
    parser.add_argument("--output", default=".", help="Output directory")
    parser.add_argument("--css", action="store_true", help="Generate CSS variables")
    parser.add_argument("--components", action="store_true", help="Generate component styles")
    parser.add_argument("--typography", action="store_true", help="Generate typography guide")
    parser.add_argument("--colors", action="store_true", help="Generate color palette")
    parser.add_argument("--all", action="store_true", help="Generate all assets")
    
    args = parser.parse_args()
    
    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)
    
    if args.css or args.all:
        with open(output_path / "islamic-variables.css", "w") as f:
            f.write(generate_css_variables())
        print("✅ Generated CSS variables")
    
    if args.components or args.all:
        with open(output_path / "islamic-components.css", "w") as f:
            f.write(generate_component_styles())
        print("✅ Generated component styles")
    
    if args.typography or args.all:
        with open(output_path / "typography-guide.json", "w") as f:
            json.dump(generate_typography_guide(), f, indent=2)
        print("✅ Generated typography guide")
    
    if args.colors or args.all:
        with open(output_path / "color-palette.json", "w") as f:
            json.dump(generate_color_palette(), f, indent=2)
        print("✅ Generated color palette")
    
    print(f"📁 Assets saved to: {output_path}")

if __name__ == "__main__":
    main()
