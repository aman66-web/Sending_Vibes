# Handover: Envelette

Hi Claude, I'm Aman. This project (Envelette) was built with Claude Code in a cloud session. I'm moving to you, in the Claude desktop app on my Mac, because you can also work my desktop and Chrome. This file is everything you need to carry on.

## 1. About me and how to work with me

- **I'm not technical.** Talk to me in plain words, and give me at most 2 or 3 numbered steps at a time.
- **Do things yourself** wherever a tool lets you: code, terminal, Git, Vercel, Supabase, and clicking in my Chrome and apps (Stripe, Google Cloud, ImprovMX and so on). Only ask me for what you truly can't do.
- **I type my own passwords and two-factor codes.** Never ask me to paste a password, API key, secret or token into the chat, and never write one into a file.
- **Ask me before anything that costs money**, including:
  - paid plans or upgrades
  - real payments
  - Higgsfield image or video generations, which use credits
- **Ask me before deleting anything** in the database (Supabase) or in Stripe.
- **Use the branch below and open a pull request for changes.** Merge into `main` (which is live) only when I've asked you to get something live. I usually do want finished work live, so ask me once if you're unsure.
- Don't put AI model names or IDs in commit messages or pull request text.
- **Never decrypt or print environment variable values** (in Vercel or anywhere else).

## 2. Set up first

1. **Repository:** GitHub `aman66-web/Sending_Vibes`. `main` is the live site. Work on the branch **`claude/admiring-ride-ky8h78`**.
2. **Folder on my Mac:** I already have a copy in **`Sending_Vibes` in my home folder** (`~/Sending_Vibes`). Open that folder in the desktop app. Don't use anything inside `Library` or a hidden folder.
   - Then run `git status` first. If it shows local changes, tell me before touching them.
   - Then run `git fetch origin` and `git checkout claude/admiring-ride-ky8h78` and `git pull`.
   - If that folder is a mess, clone a fresh copy into `~/Documents/Envelette` instead.
3. **Install and run:** Node 22, then `npm install`, then `npm run dev` and open http://localhost:3000.
   - With no settings it stores cards in a local `.data/` folder; that's fine for trying things.
   - Checks: `npx tsc --noEmit` (it includes all 10 languages) and `npm run lint`.
   - The design checks are `npx tsx scripts/check-designs.ts`, `check-kit.ts`, `check-vary.ts`, `check-occasions.ts` and `check-art-a/b/c.ts`.
4. **Read first:**
   - `AGENTS.md`: this is Next.js 16, so read the guides in `node_modules/next/dist/docs/` before writing Next code.
   - `README.md`, for setup. Its roadmap list is out of date.
   - `src/i18n/en.ts`, which holds all the site's English text.
   - `supabase/migrations/`.

## 3. The project in short

- **What it is:** Envelette (https://envelette.com) sells **interactive e-cards**. You make a card, pay (£9.99 in the UK, $9.99 elsewhere), and send the link. The person opens an envelope, then games, questions (the "No" button runs away), messages, photos and a finale.
- **Two ways to make one:**
  - **Personalised:** a few tap-first questions, then the AI writes and designs it.
  - **Ready-made:** pick one of 93 designs and the AI fills it in.

  Both cost the same.
- **Who it's for:** people sending cards to family and friends. Many buyers are older and on phones, so everything must be easy for a grandparent.
- **Languages:** the site is in 10: English, Hindi, Punjabi, Gujarati, Bengali, Urdu, Arabic, Polish, Spanish and French. The cards themselves are in English.
- **The business:** run by MARTZEY LTD, registered in England and Wales, company no. 14466643. It's shown in the footer.
- **Live now (main):** everything up to pull request #44 (see section 5).
- **Only on the branch:** pull request **#46** (Stripe catalogue prices), which is open and not merged.

## 4. Accounts and services

**Never write secrets here.** Each secret's location is given below, never its value.

| Service | What it's for | Names and IDs | Where secrets live |
|---|---|---|---|
| **GitHub** | Code | `aman66-web/Sending_Vibes` | n/a |
| **Vercel** | Hosting and DNS | Team **aman-moneysave** (`team_deL8xyIWtPARtg0Mp2WOz62S`), project **sending-vibes** (`prj_rZnuWfvE9H8p8uhVASsh8uklqh8B`) | **Vercel env vars, Production only** (see below) |
| **Supabase** | Database, card storage, sign-in | Project **sending-vibes**, ref `vzvazrljybgepyaybrql` | `SUPABASE_SECRET_KEY` in Vercel |
| **Stripe** | Payments | **Envelette** live account `acct_1UVCRoEArpZsfEzv`, plus its sandbox "Sending Vibes sandbox" | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in Vercel |
| **Resend** | All emails, from `Envelette <cards@envelette.com>` | Domain `envelette.com` | `RESEND_API_KEY` in Vercel (full access) |
| **Anthropic API** | AI that writes cards, and the chat bubble | n/a | `ANTHROPIC_API_KEY` in Vercel |
| **Google Cloud** | "Continue with Google" | OAuth client `371908396331-u6rfker9iodt0r92bli6ci0ms0kevkp8` (a public ID) | Client secret in Supabase's Google settings |
| **ImprovMX** | Forwarding hello@envelette.com | My existing ImprovMX account (used for preflightpass.com) | n/a |
| **Microsoft 365** | My work inbox amanm@martzey.com, where owner alerts and test emails go | n/a | n/a |
| **Higgsfield** | Optional demo photos | n/a | Costs credits, so ask me first |

**Vercel and DNS:**
- Production deploys automatically from `main`. Every branch gets a preview, but previews have no payment or email secrets.
- envelette.com's DNS is on Vercel (`ns1/ns2.vercel-dns.com`): mail goes to ImprovMX MX records, and the Resend records are `resend._domainkey` and `send.envelette.com`.
- There's also a DMARC record and a Google site verification TXT record.

**Vercel env vars:**
- **Secrets, in Production:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`.
- **Not secret:** `EMAIL_FROM`, `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (all environments), `OWNER_ALERT_EMAIL=amanm@martzey.com`, `GOOGLE_CLIENT_ID`.

**Supabase:**
- Migrations `0001` to `0009` are applied to production.
- Sign-in uses a 6-digit email code (Authentication → Email → "Email OTP Length" = 6) and Google.

**Stripe:**
- Business name **Envelette**, website envelette.com, statement descriptor ENVELETTE, brand colour #c23a27.
- The webhook goes to `https://envelette.com/api/stripe/webhook`.
- **Adaptive Pricing is ON.**
- The product catalogue is empty until #46 is merged; after that, the site makes its own products `envelette_card` and `envelette_custom_card`.

**Do NOT touch these.** They're my other businesses and share some logins:
- In Stripe: **CaseSpar**, **Fragrance Quarter**, **Preflight Pass (Martzey)**, and the **CLARIFO DEVELOPERS LTD** organisation with everything in it.
- In ImprovMX: the domain **preflightpass.com**.
- On GitHub: the repo `aman66-web/perfume-theme`, which isn't this project.

## 5. What's been done

- **Built from scratch** (it started as "Sending Vibes", then was renamed Envelette and moved to envelette.com):
  - designs, games and screens
  - a Canva-style editor
  - the basket, Stripe checkout and Resend emails
  - Google and email sign-in, and a "My cards" page
  - the 10 languages, the live chat, the FAQ, and the home and occasion pages
- **Pull request #43 (merged 30 Oct):**
  - questions that set the card's "vibe" before it's made
  - every card unique
  - 93 art-directed designs and 222 ready-made screens
  - a safer, easier editor
  - replies and "card opened" emails to the buyer
  - rate limits (migrations 0007–0009)
- **Pull request #44 (merged 30 Oct):**
  - the buyer can email a card to **up to 10 addresses**, with **their own message** in the email
  - they can book it for a **day, time and time zone**
  - a **"Send it now"** button for booked cards, on the thank-you and My cards pages
  - a **loading screen** after paying
  - after signing in, a **"Ready to make …'s card?"** step, so nothing is made until they press the button
  - the Screens tab's groups fold like drawers, with a new **"Yes or no? (the No button runs away)"** group
- **Pull request #45 (closed, not needed):** the site making its own 6-digit codes. I changed Supabase's setting to 6 instead.
- **Pull request #46 (open):** checkout uses catalogue prices that the site makes in Stripe itself (see section 6).
- **Decisions and why:**
  - **6-digit codes** come from the Supabase setting: it's simpler.
  - **Google sign-in** goes through the site itself, so Google says "continue to envelette.com". The branding is verified and published.
  - **Owner alerts** go to amanm@martzey.com.
  - **"Send it now"** only shows once every email is booked. For older orders, it only moves an email when exactly one matches, so it can never send someone else's card.

## 6. Where we left off

**Finished and checked on the live site (30–31 Oct):**
- Google sign-in says "continue to envelette.com".
- Sign-in codes are 6 digits.
- The "Ready to make" step works.
- The basket accepts several addresses, a message and a time zone.
- Stripe's page says "Envelette".
- "Send it now" delivered a test card. It landed in Outlook's **Junk** folder, and I moved it to the inbox.

**Half done: test promotion codes.**
- My 100%-off test codes (ENVTEST2, ENVTEST3, ENVTEST4) are refused on the site's checkout ("This promotion code is invalid"). Yet ENVTEST4 is accepted on a Stripe Payment Link in the same account.
- The likely cause is that the site describes its price inline, while Payment Links use catalogue products. Pull request **#46** fixes that.
- It's **not merged yet**, and whether it fixes the codes isn't confirmed.

**Waiting on me (hello@envelette.com doesn't work yet):**
- envelette.com was never added to ImprovMX, and my free ImprovMX account allows only one domain (preflightpass.com).
- I need to sign up for a **new free ImprovMX account with amanm@martzey.com** myself.

## 7. What's next, in order

1. **(Claude) Get #46 live.** Ask me once, then merge it into `main`. Wait for Vercel's production deploy.
2. **(Claude) Try a test code on a fresh checkout,** without paying. Use ENVTEST4: 3 uses, expires 7 Nov.
   - **If it's accepted:** finish a test order end-to-end:
     - a ready-made card emailed to amanm@martzey.com and amanm875@outlook.com
     - with a message, booked 2 days ahead at 10:00 India time
     - pay £0, press "Send it now", and check it arrives
   - **If it's still refused:** tell me. Either we contact Stripe support, or I do one real £9.99 purchase and refund it.
3. **(Me, then Claude) hello@envelette.com:**
   - I make the free ImprovMX account with amanm@martzey.com and sign in in Chrome.
   - Then you add envelette.com, add an alias "hello" forwarding to amanm@martzey.com, and test it. The DNS is already set.
4. **(Claude, in my Chrome) Archive the test codes** ENVTEST100, ENVTEST2, ENVTEST3 and ENVTEST4 in Stripe (live → Product catalogue → Coupons), once testing is done. Archive only those.
5. **(Claude) Suggest to me:** a line on the thank-you page saying "If it's not in their inbox, ask them to check Junk or Spam". New text needs all 9 translations.
6. **(Claude) Small fixes I'd like:**
   - a mini game you've won replays if you go Back before pressing Next
   - on 4 designs, the bottom-corner stickers touch the "From … · made with Envelette" line
   - two badly formed web addresses show a bare error page instead of the friendly one
   - one sticker sits under the Back button on a demo page
   - a 12px coupon label is too small
7. **(Optional, ask me first, as it costs credits)** Realistic demo photos with Higgsfield.

## 8. Known problems and warnings

- **Translations:** every new or changed piece of English text in `src/i18n/en.ts` needs translating into all 9 other language files. TypeScript fails the build if a key is missing. Keep the tone warm and plain.
- **Formatting:** don't run Prettier on whole files. This repo isn't uniformly formatted, and doing it creates huge diffs. Format only what you change, matching the long-line style around it.
- **After a squash-merge:** force-push is blocked. To start the branch fresh, run `git fetch origin main claude/admiring-ride-ky8h78`, then `git reset --hard origin/main`, then `git merge -s ours origin/claude/admiring-ride-ky8h78 -m "Merge earlier branch history"`, then `git push`.
- **Stripe's "Link" popup:** at checkout it asks "Confirm it's you" and texts my phone. Click **"Pay without Link"**; I can ignore the text.
- **Limits:**
  - Resend can book an email up to **30 days** ahead, so the basket allows 29.
  - The site allows **10 checkouts per 10 minutes** per network.
  - Sign-in codes are limited to **5 an hour** per email.
  - The AI has a daily allowance per account.
  - ImprovMX's free plan allows **1 domain**.
- **Email deliverability:** new-domain emails can land in Junk (Outlook did this). The SPF, DKIM and DMARC records are set correctly, and it improves over time.
- **Unpaid test orders** in the database (status "pending") expire by themselves. Nothing to clean up.
- **One unexplained browser error:** a visitor's browser once reported "removeChild" on `/occasions/birthday`, and I couldn't reproduce it. It's probably a browser extension or auto-translate. Watch for it again.
- **Supabase:** auth settings (code length, providers) can only be changed in the Supabase dashboard, not over its API from the cloud. Database changes go through migrations.
- **Old browser tests:** the earlier cloud session's browser tests (Playwright) lived in its own temporary folder and **aren't in this repo**. Write fresh checks as needed. Use phones and computers, and stand-ins for Stripe, Resend and the AI.

**To start:** please tell me, in 2 or 3 plain lines, where the project stands and what you'll do first.
