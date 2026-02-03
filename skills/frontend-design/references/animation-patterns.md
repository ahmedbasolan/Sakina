# Animation Patterns for Frontend Design

## Animation Principles

### Purposeful Motion

Every animation should serve a purpose:

- **Direct attention** to important elements
- **Provide feedback** for user interactions
- **Create hierarchy** between elements
- **Enhance storytelling** and narrative

### Timing and Easing

Use appropriate timing functions:

- **Ease-out**: Natural deceleration (most common)
- **Ease-in-out**: Smooth acceleration/deceleration
- **Cubic-bezier**: Custom curves for personality
- **Steps**: Discrete animations (typewriter, sprite)

## Animation Categories

### Page Load Animations

#### Staggered Reveals

```css
.stagger-item {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s ease-out forwards;
}

.stagger-item:nth-child(1) {
  animation-delay: 0.1s;
}
.stagger-item:nth-child(2) {
  animation-delay: 0.2s;
}
.stagger-item:nth-child(3) {
  animation-delay: 0.3s;
}
```

#### Hero Animations

- **Text reveals**: Typewriter, fade-in, slide-up
- **Shape morphing**: Logo animations, geometric transitions
- **Background effects**: Gradient shifts, particle systems

### Micro-interactions

#### Hover States

```css
.hover-lift {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.hover-lift:hover {
  transform: translateY(-4px);
}
```

#### Focus States

```css
.focus-glow:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  transform: scale(1.02);
}
```

### Scroll-triggered Animations

#### Intersection Observer Pattern

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  },
  { threshold: 0.1 },
);

document.querySelectorAll('.animate-on-scroll').forEach((el) => {
  observer.observe(el);
});
```

## Advanced Animation Techniques

### CSS-only Solutions

#### Glitch Effects

```css
.glitch {
  position: relative;
  animation: glitch 2s infinite;
}

.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.glitch::before {
  animation: glitch-1 0.5s infinite;
  color: #ff00ff;
  z-index: -1;
}

.glitch::after {
  animation: glitch-2 0.5s infinite;
  color: #00ffff;
  z-index: -2;
}
```

#### Morphing Shapes

```css
.shape-morph {
  animation: morph 8s ease-in-out infinite;
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
}

@keyframes morph {
  0%,
  100% {
    border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  }
  50% {
    border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
  }
}
```

### JavaScript Animations

#### GSAP Examples

```javascript
// Staggered animation with GSAP
gsap.from('.feature-card', {
  duration: 1,
  y: 50,
  opacity: 0,
  stagger: 0.2,
  ease: 'power3.out',
});

// Scroll-triggered animation
gsap.to('.hero-text', {
  scrollTrigger: {
    trigger: '.hero',
    start: 'top center',
    end: 'bottom center',
    scrub: 1,
  },
  y: -100,
  opacity: 0,
});
```

#### Framer Motion (React)

```javascript
const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

<motion.div
  initial="hidden"
  animate="visible"
  variants={variants}
  transition={{ duration: 0.6, delay: 0.2 }}
/>;
```

## Performance Optimization

### Animation Performance

1. **Use transform and opacity** for 60fps animations
2. **Avoid animating layout properties** (width, height, margin)
3. **Use will-change** sparingly for complex animations
4. **Prefer CSS animations** over JavaScript when possible

### Reducing Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Animation Libraries

### CSS Libraries

- **Animate.css**: Pre-built CSS animations
- **Hover.css**: Hover effects library
- **Magic Animations**: Special effects

### JavaScript Libraries

- **GSAP**: Professional animation platform
- **Framer Motion**: React animation library
- **Lottie**: After Effects animations
- **Three.js**: 3D animations and WebGL

## Common Animation Patterns

### Loading States

- **Skeleton screens**: Content placeholders
- **Spinners**: Loading indicators
- **Progress bars**: Step completion

### State Transitions

- **Modal reveals**: Scale and fade
- **Page transitions**: Slide and wipe
- **Navigation**: Slide and morph effects

### Data Visualization

- **Chart animations**: Draw and reveal
- **Number counters**: Counting up effects
- **Progress rings**: Circular progress

## Best Practices

1. **Keep animations short** (0.2-2s typically)
2. **Use meaningful easing** functions
3. **Consider accessibility** with reduced motion
4. **Test performance** on target devices
5. **Animate with purpose**, not just for decoration
