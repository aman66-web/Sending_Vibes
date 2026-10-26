# Sending Vibes 💌

Interactive e-cards people actually remember. Instead of a static card, the person gets a link to a little experience: a "Will you be my Valentine?" question where the **No button runs away**, their photos as a polaroid stack, a mini game, a typewriter message and a big finale.

## What's built

- **Landing page** (`/`): pitch, playable feature tiles, occasion showcase, a "Shop the cards" product section, how it works, pricing.
- **Card catalogue** (`/cards`): 30 designs across 9 occasions, filterable by occasion, vibe (funny, heartfelt, cute, romantic, festive) and device. Hovering a card shows a play button.
- **Product pages** (`/cards/<slug>`): the design running live in a phone or browser frame, a "try it with your names" box and colour picker that update the preview, a list of what's inside and what can be customised.
- **Full-screen demos** (`/cards/<slug>/play`, plus `/demo/<occasion>` for the three flagship occasions).
- **Card maker** (`/create`): pick an occasion and a design (or arrive from a product page with `?template=`), enter names, then edit every screen with a live preview:
  - change any text, colours (10 themes) and background effect
  - upload up to 6 photos with captions (resized in the browser, location data stripped)
  - write your own quiz questions
  - add, remove and reorder screens
  - unfinished cards are saved in the browser, so a refresh doesn't lose work
- **Share**: after creating, you get an unguessable link with Copy and WhatsApp buttons.
- **Card page** (`/c/<id>`): what the recipient sees. It ends with a "Make your own" button so every card sent advertises the site.

### Building blocks

A card is structured data (`src/lib/card.ts`): a list of screens built from a fixed set of blocks.

| Screen | What it does |
|---|---|
| `intro` | An envelope they tap to unseal |
| `question` | Yes/No question. No dodges every tap and the Yes button grows |
| `photos` | Polaroid stack (or a gallery wall on `wide` desktop designs) |
| `message` | Typewriter-style letter |
| `game` | `catch-hearts`, `pop-balloons`, `catch-snowflakes`, `catch-stars`, `light-diyas`, `blow-candles`, `memory-match`, `unwrap-gift`, `shake-it` (phone), `cursor-chase` (desktop) |
| `quiz` | Multiple-choice questions; wrong answers get told off |
| `scratch` | A silver panel scratched away to reveal a message |
| `typeit` | They type a secret password to unlock the next screen |
| `finale` | Big ending with hearts, fireworks, confetti, sparkles, snow, stars or petals |

### Designs

The designs live in `src/lib/catalog.ts`. Each one is an occasion, a tone, a device target, a theme and a preset list of blocks. Roughly 80% work everywhere, 10% are built for phones (shaking, scratching) and 10% for computers (mouse and keyboard games, wide photo walls). A card opened on the "wrong" kind of device shows a small tip but still works. The planned AI editor will work the same way: it will rearrange and fill in blocks rather than write raw code, so every card always works.

## Running it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no configuration, cards and photos are stored in a local `.data/` folder. This is fine for trying things out, but **it does not work on Vercel**, which needs Supabase (below).

## Production storage (Supabase)

1. Create a Supabase project.
2. Run the SQL files in `supabase/migrations/` in order. They create the `cards` table, the `photos` bucket, and the `create_card` / `get_card` functions the site uses.
3. Set these environment variables (in `.env.local` or on Vercel):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

No secret key is needed. The `cards` table can't be read or listed directly; a card can only be fetched by its exact ID through `get_card`. Photo uploads are insert-only, so existing photos can't be overwritten or listed.

## Roadmap

- [ ] Stripe checkout: Personal (£3.99) and AI Custom (£9.99) tiers
- [ ] AI editor: "describe what you want" edits to the card's blocks
- [x] More occasions: Christmas, Eid, anniversary, sorry, thank you, congrats
- [x] Quiz, scratch-to-reveal, memory match and more games
- [ ] Raksha Bandhan, new baby and other occasions
- [ ] Background music
- [ ] Moderation for photos and text, a report button, and card expiry or delete
- [ ] Rate limiting on uploads and card creation

## Tech

Next.js 16 (App Router), React 19, Tailwind CSS 4, Zod, Supabase.
