# Icon Design Documentation

## Concept

The favicons and app icons for this project represent the central theological tension explored in the course: the duality between Hebrew and Greek frameworks for understanding God.

## Symbolism

### Hebrew Letters (Left Side - Yellow #ffdd00)
- **Aleph (א)** - First letter of Hebrew alphabet
- **Tav (ת)** - Last letter of Hebrew alphabet
- **Meaning**: Represents the Hebrew framework - concrete, relational, narrative
- **Biblical Connection**: In Hebrew thought, Aleph-Tav appears throughout Scripture as a grammatical marker, but some see it as pointing to Messiah (the First and Last)

### Greek Letters (Right Side - Cyan #00ddff)
- **Alpha (Α)** - First letter of Greek alphabet
- **Omega (Ω)** - Last letter of Greek alphabet
- **Meaning**: Represents the Greek framework - abstract, systematic, categorical
- **Biblical Connection**: Revelation 1:8, 21:6, 22:13 - "I am the Alpha and the Omega"

## Design Rationale

The split design (yellow/cyan, left/right) visually represents:
1. **Duality**: Two distinct approaches to systematic theology
2. **Balance**: Neither framework dominates; both are equally valid
3. **Unity**: Both sides share the same truth (black background, same "first and last" concept)
4. **Navigational Colors**: Match the color-coded link system in the application
   - Yellow links → Hebrew/concrete/narrative concepts
   - Cyan links → Greek/abstract/systematic concepts

## Files

### favicon-simple.svg (32x32)
- Optimized for small browser tab display
- Simplified Aleph and Alpha symbols
- Black borders and high contrast for clarity at small sizes

### favicon.svg (512x512)
- Detailed version showing all four letters: א ת Α Ω
- Hebrew letters in text form (requires appropriate font)
- Includes subtle labels ("Hebrew" / "Greek")
- Best for display at medium-to-large sizes

### icon-512.svg (512x512)
- High-resolution app icon for mobile devices
- Geometric/stylized representations of the letters
- Split-screen design with bold visual impact
- Suitable for:
  - Apple Touch Icon
  - Android PWA icon
  - Open Graph images
  - High-DPI displays

### site.webmanifest
- Progressive Web App manifest
- Defines app name, colors, and icon references
- Enables "Add to Home Screen" on mobile devices

## Color Palette

- **Background**: #000000 (Black) - High contrast, HUD-optimized
- **Hebrew**: #ffdd00 (Yellow/Gold) - Warm, ancient, concrete
- **Greek**: #00ddff (Cyan) - Cool, logical, abstract
- **Divider**: #ffffff (White) - Neutral separator at 30% opacity
- **Labels**: #666666 (Gray) - Subtle, non-intrusive

## Usage

The icons are automatically loaded by modern browsers through the `<link>` tags in `index.html`:

```html
<link rel="icon" type="image/svg+xml" href="favicon-simple.svg">
<link rel="alternate icon" type="image/svg+xml" href="favicon.svg">
<link rel="apple-touch-icon" href="icon-512.svg">
<link rel="manifest" href="site.webmanifest">
```

## Future Enhancements

If raster formats are needed (for broader browser compatibility):
- Convert favicon-simple.svg → favicon.ico (16x16, 32x32, 48x48 embedded)
- Convert icon-512.svg → icon-192.png, icon-512.png for Android PWA
- Create Open Graph image (1200x630) for social media sharing

## Theological Note

The choice of Aleph/Tav and Alpha/Omega is not merely aesthetic. It reflects the core question of the course: **How do we speak about the infinite God who declares Himself both the Beginning and the End?**

- The Hebrew letters remind us that God revealed Himself in history, narrative, relationship
- The Greek letters remind us that human reason seeks to understand, categorize, systematize
- **Both are needed.** Both are limited. Both point to the same Truth.

"I am the Alpha and the Omega, the first and the last, the beginning and the end." (Revelation 22:13)
