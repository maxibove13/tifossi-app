# Implementation Guidelines

## Platform
iOS is the primary platform. Design and test for iOS first.

## Design Fidelity
- Follow Figma designs closely
- Use `raw-components/` folder for reference
- Verify visual appearance matches screenshots

## Simplicity
Prioritize simplicity over complexity. Don't over-engineer.

## Refactoring Rules
When refactoring or cleaning up:
- NEVER change visual appearance or behavior without approval
- Custom components (SVG icons, animations) exist for design reasons - don't replace with generic alternatives
- Verify visual integrity after changes

## Debugging
1. Read `app_structure.md` before searching codebase
2. Check child component styles for unexpected `flex: 1` or layout overrides
3. Investigate beyond the initially reported problem

## Performance
For animation-heavy components:
- Replace expensive components (LinearGradient) with simpler alternatives when equivalent
- Cache device dimensions
- Remove console.log in render methods
- See `style_system.md` for techniques
