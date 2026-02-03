# Typography Guidelines for Frontend Design

## Font Pairing Principles

### Display + Body Font Combinations

Choose distinctive display fonts paired with refined body fonts for maximum impact.

#### Minimalist Aesthetics

- **Display**: Playfair Display, Cormorant Garamond, Lora
- **Body**: Source Sans Pro, Lato, Open Sans
- **Usage**: Clean, elegant interfaces with strong typographic hierarchy

#### Maximalist Aesthetics

- **Display**: Bebas Neue, Oswald, Anton, Impact
- **Body**: Space Mono, JetBrains Mono, Roboto Mono
- **Usage**: Bold, attention-grabbing headlines with monospace contrast

#### Editorial/Magazine

- **Display**: Chronicle Display, Miller Banner, Georgia
- **Body**: Mercury Text, Georgia, Garamond
- **Usage**: Content-heavy layouts with newspaper/magazine feel

#### Retro-Futuristic

- **Display**: Orbitron, Rajdhani, Teko
- **Body**: Exo 2, Nunito, Rajdhani
- **Usage**: Sci-fi, tech interfaces with geometric feel

#### Luxury/Refined

- **Display**: Didot, Bodoni MT, Playfair Display
- **Body**: Gill Sans, Optima, Avenir
- **Usage**: Premium brands, fashion, high-end products

## Typography Best Practices

### Hierarchy Systems

Establish clear typographic hierarchy using:

- **Scale**: Dramatic size differences between levels
- **Weight**: Bold, regular, light variations
- **Case**: All caps, title case, sentence case
- **Color**: Contrast and color for emphasis

### Responsive Typography

Use fluid typography with clamp():

```css
font-size: clamp(1rem, 4vw, 4rem);
```

### Variable Fonts

Leverage variable fonts for advanced typography:

```css
font-variation-settings:
  'wght' 400,
  'slnt' 0;
```

## Font Loading Strategies

### Performance Optimization

1. **Preload critical fonts**
2. **Use font-display: swap**
3. **Subset fonts for performance**
4. **Fallback fonts for reliability**

### Google Fonts Integration

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+Pro:wght@400;600&display=swap"
/>
```

## Common Typography Mistakes to Avoid

1. **Generic system fonts** without consideration
2. **Too many font families** (max 2-3 per design)
3. **Poor contrast ratios** (WCAG AA minimum 4.5:1)
4. **Inconsistent sizing** across breakpoints
5. **Ignoring line height** for readability

## Typography Animation

### Animated Text Effects

- **Glitch effects** for digital aesthetics
- **Typewriter effects** for code/tech interfaces
- **Fade-in animations** for content reveals
- **Text morphing** for dynamic transitions

### CSS Examples

```css
.glitch-text {
  font-family: 'Space Mono', monospace;
  text-shadow:
    2px 2px 0 #ff00ff,
    -2px -2px 0 #00ffff;
  animation: glitch 0.3s infinite;
}

.typewriter {
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden;
  border-right: 2px solid;
  animation: typing 3s steps(40, end);
}
```
