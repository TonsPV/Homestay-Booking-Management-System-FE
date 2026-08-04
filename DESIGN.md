# Homestay Green Design System

## Visual thesis

Homestay Green presents a stay as a calm arrival sequence rather than a catalog.
Public surfaces pair real room photography with precise booking controls and
quiet, editorial pacing. Operational surfaces remain denser and inherit only
the shared semantic tokens and control behavior.

## Palette and material

- Canvas is a soft mineral neutral; cards are clean white surfaces.
- Deep slate carries immersive hero and closing regions.
- Blue is reserved for primary navigation and booking actions.
- Green communicates real availability only; amber warning and red error.
- Depth comes from soft offset shadows and image layering, not decorative
  borders or glass effects.

## Typography

- Display copy uses a humanist system display stack with compact tracking,
  strong weight, and short line lengths.
- Interface and body copy use the workhorse sans stack already defined by the
  application.
- Public headings use a clear 64/48/36/28 scale on desktop and 44/36/28/24 on
  mobile; body copy remains 16–18px with generous leading.

## Composition

- The homepage is an arrival path: inspiration, immediate search, verified
  confidence, room choice, experience, visual proof, and decisive close.
- Photography owns large uninterrupted fields. Controls attach to the image or
  decision they affect instead of floating between unrelated sections.
- Public card radii stay between 12–16px. Sections alternate immersive,
  editorial, and decision-dense passages to pace the scroll.

## Controls and state

- Primary controls are blue, 44px minimum height, and name the next action.
- Booking search exposes dates and guests first; optional refinement belongs on
  the search-results surface.
- Loading uses layout-matched skeletons. Error and empty states preserve the
  next useful action.
- Focus is always visible, dynamic result text uses polite announcements, and
  reduced-motion users receive static imagery and transitions.

## Imagery and motion

- Use approved property room images from the Backend wherever possible. If the
  current media is unsuitable, a curated marketing image may be used only with
  a visible illustrative label; never fabricate guest, award, rating, booking,
  room-size, or availability evidence.
- One slow hero image reveal and restrained section entrances form the motion
  signature. Hover zoom and elevation are subtle and disabled for reduced
  motion.
- Images below the first viewport are lazy-loaded and always have meaningful
  alt text or empty alt text when decorative.
