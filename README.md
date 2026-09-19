# CA for Palestine

CA for Palestine helps Californians advocate directly to Senators Adam Schiff and Alex Padilla. The site currently supports constituent emails and is being extended with constituent-authorized, conversational AI phone calls to the senators' Washington, D.C. offices.

## Product principles

- Every call represents a real person who verified their email and approved the exact script.
- The caller always identifies itself as an AI agent and never impersonates the constituent or another real person.
- The agent stays within a vetted script and approved campaign talking points.
- Senate staff can refuse transcription or ask the campaign to stop automated calls.
- The service minimizes personal data, never stores raw call audio, and deletes call records after 30 days.
- Calls are rate-limited and constrained by a hard daily spending budget.

## Current features

- Generate and customize constituent emails to Schiff or Padilla.
- Submit those emails through the senators' constituent contact forms.
- Display aggregate email-delivery counts.
- Initial voice-call scheduling flow at `/calls`:
  - Select Schiff, Padilla, or both.
  - Edit a vetted campaign script.
  - Provide the name, city, ZIP code, and email the AI is allowed to share.
  - Verify the email using a one-time code.
  - Explicitly authorize AI calling, the disclosed constituent fields, and transcription.
  - Automatically approve unchanged or mildly edited scripts and queue larger edits for review.
  - Assign the earliest weekday D.C. office-hours slot for automatically approved scripts.
- Initial passwordless review queue at `/admin/calls` with approve, reject, and cancel controls.

The app now includes a disabled-by-default Vapi outbound adapter, an authenticated queue runner, Vapi webhooks, retries, transcript-only call artifacts, office stop-request pausing, and a transactional daily authorization budget. It will not place a real call unless `VOICE_CALLS_ENABLED=true` and every provider/destination setting is present. Keep that switch off until the remaining launch gates are complete.

## Voice-call MVP

### Constituent experience

1. The constituent selects Schiff, Padilla, or both.
2. They provide their full name, city, ZIP code, and verified email address. A street address and phone number are not required.
3. They review and may edit a shared vetted script. The script is limited to approximately 250 words and shows an estimated speaking time.
4. They verify their email with a one-time code.
5. They approve the exact script and explicitly authorize:
   - an AI agent to call on their behalf;
   - disclosure of their name, city, ZIP code, and email;
   - live transcription of the conversation; and
   - limited retry attempts.
6. The system assigns the earliest safe call time. Users do not need to manage the schedule.

One successfully delivered call is allowed per verified email, per senator, per Eastern calendar day. An authorization covering both senators creates two independently tracked calls.

### Script and moderation

- Both senators use the same base script, with the senator's name inserted at call time.
- The campaign asks the senators to support divestment from Israel and apartheid. Exact legislative asks and the approved response library must be finalized before launch.
- Unchanged or mildly edited scripts can be approved automatically.
- Larger or risky edits enter an administrator review queue with a stated review time of up to 24 hours.
- Threats, harassment, discriminatory language, unsupported claims, and unrelated requests are rejected.
- Profanity is permitted unless it targets a staff member.
- A rejected submission cannot be scheduled; the constituent must submit a new script.
- During a call, the agent may only use the approved script and centrally maintained talking points. It must not improvise factual claims.

### Scheduling, retries, and budget

- The initial destinations are the senators' Washington, D.C. offices.
- Safe calling hours are Monday through Friday, 9:00 a.m. to 5:00 p.m. Eastern, excluding U.S. federal holidays.
- Automatically approved calls receive the earliest available safe time. Reviewed calls receive a time after approval.
- Busy and unanswered calls return to the queue, with at least 30 minutes between attempts.
- A call may be attempted no more than three times across two business days.
- The system enforces a hard telephony/AI spending limit of $5 per day. Overflow moves to the next safe business window, and affected constituents receive an updated email.
- Live conversations are limited to three minutes. The agent gives a polite closing near the limit.

### Agent behavior

- Calls rotate through a small, approved set of synthetic voices. Voices may not imitate a celebrity, public figure, constituent, or other real person.
- Every live conversation begins by identifying the caller as an AI agent, naming the constituent, disclosing live transcription, and asking permission to continue.
- If staff declines, the agent ends politely, does not retry that constituent's call, and tells the constituent that personal follow-up is required.
- The agent shares only the constituent-approved name, city, ZIP code, and email. It never shares a street address or phone number.
- If staff needs additional information or asks for personal follow-up, the agent records the request in the transcript and explains that the constituent must respond personally.
- After two failed attempts to understand a staffer, the agent apologizes, delivers the approved core message, and ends the call.
- A request from an office to stop automated calls pauses every queued call to that senator pending administrator review.
- Callbacks to the campaign number hear a short campaign explanation and are directed to the website and campaign contact email.

### Outcomes

- A completed live conversation, delivery to a receptionist, or complete voicemail counts as delivered.
- Voicemail contains the complete approved message and identifies the caller as AI.
- Public counters show total delivered calls for each senator.
- The private administrator view distinguishes live, receptionist, and voicemail delivery from failed attempts.

### Notifications and transcripts

Email notifications cover verification, initial scheduling, schedule changes, delivery, final failure, and script rejection.

A completion email includes:

- senator and delivery time;
- delivery outcome;
- a short AI-generated summary;
- a protected transcript link and one-time access code; and
- any staff request requiring personal follow-up.

Live speech-to-text may be processed transiently, but raw call audio is never retained. The transcript, approved script, and constituent details are deleted after 30 days. Anonymous aggregate outcomes and public counters may remain. Transcript access also expires after 30 days.

### Administrator tools

The initial administrator console will use a passwordless code sent to one configured administrator email and provide:

- flagged-script approval and rejection;
- scheduled, active, retrying, delivered, and failed call views;
- transcripts and call summaries;
- manual retry and cancellation;
- global and per-senator queue pause controls;
- default-script and approved-talking-point editing;
- daily budget usage and cap controls;
- live/receptionist/voicemail outcome reporting; and
- prominent office stop-request alerts.

## Launch gates

Real calls must remain disabled until all of the following are complete:

- Select a telephony and conversational-voice provider.
- Confirm current provider pricing fits the $5 daily cap and implement transactional budget enforcement.
- Confirm the D.C. office numbers and published hours.
- Finalize the vetted script, concrete legislative asks, and bounded response library.
- Configure Resend email delivery, MongoDB, the administrator email, campaign website, and contact email.
- Complete a legal and provider-policy review covering automated advocacy calls, AI disclosure, caller identification, live transcription, consent, data retention, and office opt-out handling.
- Exercise the office-wide pause control and failure notifications in a staging environment.
- Confirm TTL deletion and verify that no provider retains call audio or uses campaign calls for model training.

## Local development

Install dependencies and start Next.js:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) for email advocacy or [http://localhost:3000/calls](http://localhost:3000/calls) for the call-scheduling flow.

In development, the verification endpoint returns the one-time code to the UI. Production refuses to create verification codes unless durable Mongo storage and a real email delivery adapter are configured.

### Environment variables

```bash
# Existing email workflow
OPENAI_API_KEY=
MONGODB_USERNAME=
MONGODB_PASSWORD=

# Jev message-topic tagging
TYPESAFE_API_KEY=
JEV_TOPIC_MODEL=jev-latest
JEV_TOPIC_THRESHOLD=0.65

# Jev Ultrafast form-filling A/B test (disabled until all are configured)
JEV_FORM_EXPERIMENT_ENABLED=false
JEV_FORM_TREATMENT_PERCENT=50
JEV_FORM_EXPERIMENT_SALT=replace-with-a-stable-random-value
JEV_FORM_RUNNER_URL=https://jev-runner.example.org
JEV_FORM_RUNNER_TOKEN=

# Voice scheduling
MONGODB_URI=
CALLS_DATABASE_NAME=ca-for-palestine-calls
CALLS_EMAIL_FROM=
CALLS_ADMIN_EMAIL=
CALLS_BASE_URL=http://localhost:3000
CALLS_CODE_SECRET=
CALLS_SESSION_SECRET=
RESEND_API_KEY=

# Disabled-by-default voice execution
VOICE_CALLS_ENABLED=false
VOICE_PROVIDER=vapi
CALLS_WORKER_SECRET=
SCHIFF_DC_PHONE_E164=
PADILLA_DC_PHONE_E164=

# Vapi outbound calling and authenticated webhooks
VAPI_API_KEY=
VAPI_PHONE_NUMBER_ID=
VAPI_WEBHOOK_URL=https://example.org/api/calls/webhooks/vapi
VAPI_WEBHOOK_CREDENTIAL_ID=
VAPI_WEBHOOK_BEARER_TOKEN=
VAPI_OPENAI_MODEL=gpt-4o-mini

# Conservative three-minute reservation: 3 × $0.25 = $0.75 per attempt
VOICE_ESTIMATED_COST_PER_MINUTE_USD=0.25
```

Create a Vapi custom Bearer credential whose token exactly matches `VAPI_WEBHOOK_BEARER_TOKEN`, then put its ID in `VAPI_WEBHOOK_CREDENTIAL_ID`. The queue runner expects `Authorization: Bearer $CALLS_WORKER_SECRET` on `POST /api/calls/worker/run`; invoke it on a short recurring schedule from a trusted scheduler. Each request starts at most one due call. Never commit secrets.

### Jev email experiment

Message-topic tagging calls Jev once with independent yes/no questions for a bounded Palestine/leftism taxonomy. A topic is attached when its probability meets `JEV_TOPIC_THRESHOLD`; a tagging outage never blocks delivery. Stored email metrics contain topic names and experiment metadata, not the constituent's message or identity.

Form filling uses a stable user-level assignment based on a salted hash of the constituent email. The control arm keeps the existing Puppeteer flow. The treatment arm calls the authenticated Python sidecar in `services/jev-form-runner`, which runs `jev-ultrafast` with Browser Harness. The experiment stays entirely on control unless the enable switch, stable random salt, runner URL, and runner token are all configured. Treatment failures do not silently cross over to control, so reliability measurements remain attributable to the assigned arm.

Run the sidecar on a trusted Chrome host by following `services/jev-form-runner/README.md`, then test at a low treatment percentage before moving to 50%. Track delivery success, failure, and `durationMs` by `variant`; independently verify the senators' receipt pages because Jev's own documentation notes that a `DONE` decision still requires outcome verification.

The sidecar reuses `OPENAI_API_KEY` with `gpt-4.1-mini` for the narrow task of copying exact values into text fields. It does not require an OpenRouter account. TypeSafe/Jev still selects each browser action.

The provider payload explicitly disables call recording, provider logging, and PCAP artifacts while enabling the transcript. The rotating synthetic voices are current Vapi voices and never imitate a named person. Vapi still retains call-history metadata according to the account plan, so confirm its current retention and data-use terms before launch.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run test:calls
npm run test:jev
```

## Implementation roadmap

1. Constituent scheduling UI, email verification, safe-window assignment, moderation classification, and queue persistence.
2. Email delivery adapter and expiring verification/transcript access.
3. Administrator review and queue-control console.
4. ✅ Provider adapter, bounded conversational agent, retries, budget ledger, and webhooks (implemented behind the launch switch; staging validation remains).
5. Transcript processing, notifications, 30-day deletion, public call counters, and operational monitoring.
6. Staging exercises, accessibility review, abuse testing, policy/legal review, and controlled launch.
