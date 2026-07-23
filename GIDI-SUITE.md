# Gidi Games Suite 3.0.1

This repository is maintained as one 15-game collection.

## Shared layer

Every game loads `games/shared/gidi-suite.css` and `games/shared/gidi-suite.js`.
The shared layer provides a consistent visual finish, safe-area handling, a stable
mobile viewport, accessible focus states, a home route, a suite revision label,
last-played tracking, and a small non-blocking runtime error notice.

## Targeted fixes in this revision

- Tap Target once again subtracts three seconds for a miss.
- Memory Match blocks a reset while the current pair-resolution timer is active.
- Viewport metadata now permits accessibility zoom while keeping controls resistant
  to accidental double-tap zoom through `touch-action`.
- The root hub always links all 15 games and includes search, category filters, and
  a last-played marker.

## Games

- [Tap Target](games/tap-target/)
- [Crazy Cats](games/crazy-cats/)
- [Memory Match](games/memory-match/)
- [Rush Hour](games/rush-hour/)
- [Tiny Submarine](games/tiny-submarine/)
- [Connect 4](games/connect-4/)
- [Reaction Duel](games/reaction-duel/)
- [Air Hockey](games/air-hockey/)
- [Space Invaders](games/space-invaders/)
- [Word Duel](games/word-duel/)
- [Word Mine](games/word-mine/)
- [Last Letter](games/last-letter/)
- [Word Builder Duel](games/word-builder-duel/)
- [One Letter Race](games/one-letter-race/)
- [Word Territory](games/word-territory/)

## Compatibility target

- iPhone 7 and newer
- iOS 15 Safari
- Viewports down to 320 CSS pixels
- No external runtime dependencies
