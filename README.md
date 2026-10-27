# Sending Vibes 💌

Interactive e-cards people actually remember. Instead of a static card, the person gets a link to a little experience: a "Will you be my Valentine?" question where the **No button runs away**, their photos as a polaroid stack, a mini game, a prize wheel, a typewriter message, music and a big finale.

## What's built

- **Landing page** (`/`): pitch, a laptop that plays a card by itself, a "coming up" strip of the next occasions, playable feature tiles (runaway No, prize wheel, music player), a seasonal occasion showcase, a "Shop the cards" product section, how it works, pricing.
- **Card catalogue** (`/cards`): 78 designs across 21 occasions, with search and filters for occasion, vibe (funny, heartfelt, cute, romantic, festive) and device. Hovering a card shows a play button; new designs get a badge.
- **Occasion pages** (`/occasions` and `/occasions/<occasion>`): every occasion with its designs and when it next comes round. Dates are in `src/lib/calendar.ts`: fixed dates and UK Mother's/Father's Day are worked out automatically, festivals that follow the moon (Diwali, Eid, Holi, Raksha Bandhan) are listed by hand and need adding each year.
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
- **Help** (`/help`), **privacy** (`/privacy`) and a custom 404 page.

### Building blocks

A card is structured data (`src/lib/card.ts`): a list of screens built from a fixed set of blocks.

| Screen | What it does |
|---|---|
| `intro` | An envelope they tap to unseal |
| `question` | Yes/No question. No dodges every tap and the Yes button grows |
| `photos` | Polaroid stack (or a gallery wall on `wide` desktop designs) |
| `message` | Typewriter-style letter |
| `game` | 21 games: `catch-hearts`, `pop-balloons`, `catch-snowflakes`, `catch-stars`, `catch-candy`, `light-diyas`, `blow-candles`, `memory-match`, `unwrap-gift`, `loves-me-not`, `whack-ghosts`, `launch-fireworks`, `release-lanterns`, `bubble-wrap`, `pinata`, `grow-flower`, `throw-colours`, `slot-machine`, `hold-hug`, `shake-it` (phone), `cursor-chase` (desktop) |
| `quiz` | Multiple-choice questions; wrong answers get told off |
| `scratch` | A silver panel scratched away to reveal a message |
| `typeit` | They type a secret password to unlock the next screen |
| `wheel` | A prize wheel. It can spin fairly or be secretly rigged to land on one slice |
| `coupons` | A coupon book; each coupon gets a "redeemed" stamp when tapped |
| `reasons` | A jar of notes they pull out one at a time |
| `slider` | A "how much?" slider that only ever goes up, whichever way they drag |
| `timeline` | Your story, revealed moment by moment |
| `boxes` | Two or three mystery boxes to choose from |
| `finale` | Big ending with hearts, fireworks, confetti, sparkles, snow, stars, petals, bats, Holi colours, lanterns, bubbles or balloons |

### Sound and music

Every card has sound effects and an optional background tune (`music` on the card). Nothing is loaded from files: `src/components/card/sound.ts` synthesises it all with the Web Audio API, and the tunes are either our own or traditional melodies that are out of copyright (Happy Birthday, Jingle Bells, Ode to Joy, Auld Lang Syne, Brahms' Lullaby). Sound starts on the recipient's first tap, there's a mute button on every card, and previews on the homepage stay silent.

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

## Languages

The site (not the cards) can be shown in English, Hindi, Punjabi, Gujarati, Bengali, Urdu, Arabic, Polish, Spanish and French, picked with the globe button in the header.

- Every page lives under `src/app/[lang]/[cur]/`. `src/proxy.ts` serves `/cards` from `/hi/gbp/cards` (etc.) based on the `lang` cookie, or the browser's language on a first visit, so addresses stay the same.
- All site text is in `src/i18n/en.ts`. The other languages in `src/i18n/` are copies with the same keys; TypeScript complains if one is missing a key. Server components use `getI18n()`, client components `useI18n()`.
- English pages are built ahead of time; other languages are built on first visit and then cached.
- Urdu and Arabic pages read right to left. The cards themselves stay in English and left to right.

## Prices and currency

A card is £9.99 in the UK and $9.99 everywhere else (`src/lib/pricing.ts`). The proxy picks the currency from the visitor's country (Vercel's `x-vercel-ip-country` header) on their first visit and keeps it in a `cur` cookie, so pages live under `app/[lang]/[cur]` and are static per currency too. Visitors can switch in the globe menu.

## Live chat (Claude)

The chat bubble in the bottom corner answers questions, suggests designs and helps write card messages. It only appears once this is set (on Vercel, for Production and Preview, then redeploy):

```
ANTHROPIC_API_KEY=sk-ant-...
```

What it knows comes from `src/lib/chat-prompt.ts`, built from the real catalogue. The server route is `src/app/api/chat/route.ts`: messages are capped at 800 characters and each visitor at 20 messages per 10 minutes. Set a monthly spend limit on the key in the Claude Console as the real backstop.

## Roadmap

- [ ] Stripe checkout: every card is paid (£9.99 in the UK, $9.99 elsewhere; AI Custom £14.99 / $14.99)
- [ ] AI editor: "describe what you want" edits to the card's blocks
- [x] More occasions: Christmas, Eid, anniversary, sorry, thank you, congrats
- [x] Quiz, scratch-to-reveal, memory match and more games
- [x] Raksha Bandhan, new baby, Halloween, New Year, Holi, weddings and more
- [x] Background music and sound effects
- [ ] Terms of service and a contact email (the privacy page is there; both need the business details)
- [ ] Moderation for photos and text, a report button, and card expiry or delete
- [ ] Rate limiting on uploads and card creation

## Tech

Next.js 16 (App Router), React 19, Tailwind CSS 4, Zod, Supabase.
