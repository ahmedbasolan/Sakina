---
name: islamic-brand-guidelines
description: Applies Islamic design principles and culturally appropriate visual identity to the Islamic Guidance App. Use this skill for UI design, color schemes, typography, and visual elements that respect Islamic traditions and cultural sensitivities. Ensures professional, respectful, and spiritually appropriate design choices.
license: Complete terms in LICENSE.txt
---

# Islamic Brand Guidelines

## Overview

This skill provides comprehensive design guidelines specifically tailored for Islamic applications, ensuring cultural sensitivity, spiritual appropriateness, and professional visual identity for the Islamic Guidance App.

**Keywords**: Islamic design, cultural sensitivity, spiritual design, Islamic colors, Arabic typography, Muslim UI, halal design, Islamic aesthetics, cultural branding

## Islamic Design Principles

### Core Values

- **Respect**: Honor Islamic traditions and teachings
- **Purity**: Clean, uncluttered design reflecting spiritual clarity
- **Serenity**: Calm, peaceful visual environment
- **Wisdom**: Thoughtful, meaningful design choices
- **Community**: Inclusive design for diverse Muslim community

### Cultural Sensitivity Guidelines

- Avoid imagery that may be considered inappropriate in Islamic contexts
- Use geometric patterns and calligraphy instead of figurative imagery
- Ensure color choices are culturally appropriate
- Consider Arabic text rendering and RTL support
- Respect diverse Islamic traditions and practices

## Islamic Color Palette

### Primary Colors

**Deep Emerald Green** `#006400` - Traditional Islamic color, represents paradise and growth
**Rich Indigo** `#191970` - Wisdom, spirituality, night prayers
**Warm Gold** `#FFD700` - Divine light, prosperity, enlightenment
**Pure White** `#FFFFFF` - Purity, peace, clarity

### Secondary Colors

**Soft Teal** `#2ED3C6` - Modern interpretation of traditional colors
**Coral Rose** `#F88379` - Warmth, community, compassion
**Slate Gray** `#708090` - Stability, seriousness, tradition
**Cream** `#F5F5DC` - Parchment, ancient texts, warmth

### Accent Colors

**Calligraphy Black** `#1C1C1C` - Text, important elements
**Sunset Orange** `#FF8C00** - Energy, action, important CTAs
**Sky Blue** `#87CEEB` - Hope, tranquility, divine connection

### Color Usage Rules

- **Primary**: Deep Emerald Green for headers, important elements
- **Background**: Pure White or Cream for main content areas
- **Text**: Calligraphy Black for readability
- **Accents**: Warm Gold for divine/spiritual elements
- **CTAs**: Sunset Orange for important actions
- **Avoid**: Excessive red (associated with warnings/danger)

## Typography Guidelines

### Arabic Typography

**Primary Arabic Font**: Amiri, Noto Sans Arabic, or Scheherazade

- Use for Quranic verses, Islamic terms, Arabic content
- Ensure proper RTL (right-to-left) rendering
- Maintain adequate line height for Arabic text

**Fallback Options**: System Arabic fonts, Google Fonts Arabic alternatives

### English Typography

**Primary English Font**: Inter, Source Sans Pro, or Lato

- Clean, modern sans-serif for English content
- Excellent readability at small sizes
- Pairs well with Arabic typography

**Display Font**: Playfair Display, Cormorant Garamond

- For headings, titles, special occasions
- Elegant serif that complements Arabic calligraphy

### Typography Hierarchy

1. **Quranic Verses**: Arabic, larger size, special styling
2. **Islamic Terms**: Arabic with English translations
3. **Headings**: English display font, proper spacing
4. **Body Text**: Clean English font, optimal readability
5. **Captions**: Smaller size, clear contrast

### Text Direction Rules

- Arabic content: RTL (right-to-left)
- English content: LTR (left-to-right)
- Mixed content: Auto-detect and handle appropriately
- Maintain consistent alignment within content blocks

## Visual Elements

### Geometric Patterns

**Islamic Geometric Art**: Star patterns, arabesques, tessellations

- Use for backgrounds, decorative elements
- Maintain mathematical precision
- Ensure patterns don't interfere with readability

**Pattern Usage Rules**:

- Subtle opacity (10-20%) for backgrounds
- Higher contrast for decorative borders
- Avoid overwhelming content

### Calligraphy Elements

**Islamic Calligraphy**: Thuluth, Naskh, or Diwani styles

- Use for headers, special sections
- Ensure readability alongside modern typography
- Consider digital rendering quality

### Iconography

**Symbolic Icons**: Crescent, star, geometric shapes

- Avoid figurative representations
- Use simple, clean line art
- Ensure cultural appropriateness

## Layout Principles

### Spatial Harmony

- **Generous White Space**: Reflects spiritual clarity
- **Balanced Composition**: Asymmetrical but harmonious
- **Grid-Based Layout**: Order, structure, predictability
- **Modular Design**: Flexible, scalable components

### Content Hierarchy

1. **Divine Content**: Quranic verses, Hadith (highest importance)
2. **Spiritual Guidance**: Explanations, interpretations
3. **User Actions**: Save, share, navigation
4. **Supporting Elements**: Metadata, timestamps

### Responsive Design

- **Mobile-First**: Primary use case for mobile devices
- **Tablet Support**: Larger screens for reading Quranic content
- **Accessibility**: WCAG compliance for all users

## Component Guidelines

### Mood Selection Cards

- **Colors**: Soft gradients with primary palette
- **Typography**: Clear English with Arabic terms
- **Icons**: Simple geometric shapes
- **States**: Subtle hover, respectful transitions

### Guidance Screen

- **Header**: Islamic term display, clean navigation
- **Content**: Quranic verse prominence, clear typography
- **Actions**: Save/share with appropriate iconography
- **Background**: Subtle patterns, high contrast

### Navigation Elements

- **Top Bar**: Clean, minimal, respectful
- **Bottom Actions**: Clear CTAs, appropriate spacing
- **Transitions**: Smooth, respectful animations

## Animation Guidelines

### Motion Principles

- **Gentle Transitions**: Reflect spiritual serenity
- **Meaningful Motion**: Every animation has purpose
- **Respectful Timing**: Not too fast, not too slow
- **Cultural Sensitivity**: Avoid flashy, distracting effects

### Recommended Animations

- **Fade In**: Content revelation (0.3-0.5s)
- **Slide Up**: Bottom sheet, modals (0.4s)
- **Scale**: Buttons, interactive elements (0.2s)
- **Glow**: Divine/spiritual elements (2s infinite)

### Animation Restrictions

- **No Shake/Glitch**: Disrespectful to sacred content
- **No Bounce**: Too playful for spiritual context
- **No Fast Flashes**: Can cause discomfort
- **Minimal Rotation**: Use sparingly and gently

## Content Guidelines

### Islamic Content Handling

- **Quranic Verses**: Proper formatting, respect, accuracy
- **Hadith**: Proper attribution, source citation
- **Islamic Terms**: Accurate translations, proper context
- **Scholarly Content**: Respectful presentation, citations

### Language Rules

- **Arabic First**: Islamic terms in Arabic first
- **Translation**: Clear, accurate English translations
- **Transliteration**: When needed, use standard systems
- **Context**: Provide cultural/spiritual context

## Technical Implementation

### CSS Variables

```css
:root {
  --islamic-green: #006400;
  --islamic-indigo: #191970;
  --islamic-gold: #ffd700;
  --islamic-white: #ffffff;
  --islamic-teal: #2ed3c6;
  --islamic-coral: #f88379;
  --islamic-slate: #708090;
  --islamic-cream: #f5f5dc;
  --arabic-font: 'Amiri', 'Noto Sans Arabic', serif;
  --english-font: 'Inter', 'Source Sans Pro', sans-serif;
  --display-font: 'Playfair Display', 'Cormorant Garamond', serif;
}
```

### Component Examples

- Mood cards with Islamic color schemes
- Guidance screens with proper typography
- Navigation with cultural sensitivity
- Animations that respect spiritual context

## Quality Assurance

### Cultural Review Checklist

- [ ] Colors are culturally appropriate
- [ ] Typography handles Arabic correctly
- [ ] No inappropriate imagery
- [ ] Islamic terms are accurate
- [ ] Layout respects content hierarchy
- [ ] Animations are respectful
- [ ] Accessibility standards met

### Testing Requirements

- **Arabic Text Rendering**: Test on various devices
- **RTL Support**: Verify right-to-left functionality
- **Color Contrast**: Ensure readability
- **Cultural Sensitivity**: Review with Islamic knowledge
- **Performance**: Smooth animations, fast loading

## Usage Examples

### Applying to Islamic Guidance App

1. **Color Scheme**: Deep emerald green, pure white, gold accents
2. **Typography**: Amiri for Arabic, Inter for English
3. **Layout**: Clean, spacious, respectful hierarchy
4. **Animations**: Gentle fades, respectful transitions
5. **Icons**: Geometric, culturally appropriate

### Common Use Cases

- Designing new screens/components
- Reviewing existing designs
- Creating marketing materials
- Developing brand assets
- Ensuring cultural consistency
