# Sending Vibes 💌

Interactive e-cards people actually remember. Instead of a static card, the person gets a link to a little experience: a "Will you be my Valentine?" question where the **No button runs away**, their photos as a polaroid stack, a mini game, a typewriter message and a big finale.

## What's built

- **Landing page** (`/`): pitch, occasions, how it works, pricing.
- **Demos** (`/demo/valentine`, `/demo/diwali`, `/demo/birthday`): try any template without signing up.
- **Card maker** (`/create`): pick an occasion, enter names, then edit every screen with a live phone preview:
  - change any text, colours and background effect
  - upload up to 6 photos with captions (resized in the browser, location data stripped)
  - add, remove and reorder screens (message, photos, mini game, runaway question)
  - unfinished cards are saved in the browser, so a refresh doesn't lose work
- **Share**: after creating, you get an unguessable link with Copy and WhatsApp buttons.
- **Card page** (`/c/<id>`): what the recipient sees. It ends with a "Make your own" button so every card sent advertises the site.

### Building blocks

A card is structured data (`src/lib/card.ts`): a list of screens built from a fixed set of blocks.

| Screen | What it does |
|---|---|
| `intro` | Opening title and button |
| `question` | Yes/No question. No dodges every tap and the Yes button grows |
| `photos` | Polaroid stack, tap to flip through |
| `message` | Typewriter-style letter |
| `game` | `catch-hearts`, `light-diyas` or `blow-candles` |
| `finale` | Big ending with hearts, fireworks, confetti or sparkles |

Templates (`src/lib/templates.ts`) are just preset lists of these blocks. The planned AI editor will work the same way: it will rearrange and fill in blocks rather than write raw code, so every card always works.

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
- [ ] More occasions: Eid, Christmas, anniversary, "sorry", Raksha Bandhan
- [ ] Music, a quiz game, scratch-to-reveal
- [ ] Moderation for photos and text, a report button, and card expiry or delete
- [ ] Rate limiting on uploads and card creation

## Tech

Next.js 16 (App Router), React 19, Tailwind CSS 4, Zod, Supabase.
