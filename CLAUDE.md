# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js web application that helps California residents contact their representatives about Palestine. It collects user info, generates AI emails via OpenAI, then uses Puppeteer to automate submission of the representative's contact form. Email submissions are counted in MongoDB.

**Currently supported representatives:**
- Senator Adam Schiff (`app/utils/selectors.ts`)
- Senator Alex Padilla (`app/utils/padilla/selectors.ts`)

## Commands

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run lint      # Run ESLint
npm run start     # Start production server
```

## Architecture

```
User fills form → OpenAI generates email → Puppeteer fills & submits rep's contact form → MongoDB records count
```

**API routes** (`app/api/`):
- `generate/route.ts` — calls OpenAI GPT-3.5-turbo to draft email
- `submit-form/route.ts` — orchestrates Puppeteer automation
- `count-emails/route.ts` — reads email counts from MongoDB

**Automation layer** (`app/utils/`):
- `fillOutForms.ts` — dispatches to the correct representative's fill function based on which rep was selected
- `selectors.ts` — CSS selectors + fill logic for Schiff's contact form
- `padilla/selectors.ts` — CSS selectors + fill logic for Padilla's contact form
- `mango.ts` — MongoDB connection and count operations
- `beCommonUtils.ts` — phone normalization, representative list definition
- `commonUtils.ts` — inserts user name into generated email

**Frontend**: `app/components/Form.tsx` is the main component. It calls `/api/generate`, then on submit calls `/api/submit-form`.

## Adding a New Representative

1. Create `app/utils/<name>/selectors.ts` with CSS selectors and a `fillForm(page, userInfo, emailContent)` function
2. Register the representative in `app/utils/beCommonUtils.ts` representative list
3. Add a dispatch case in `app/utils/fillOutForms.ts`
4. Add the rep to the frontend select options in `app/components/Form.tsx`

## Environment Variables Required

- `OPENAI_API_KEY` — OpenAI API key
- `MONGODB_URI` — MongoDB connection string

## Path Alias

`@/*` resolves to `./app/*` (configured in `tsconfig.json`).
