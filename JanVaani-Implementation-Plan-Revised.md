# JanVaani Implementation Plan (Revised)

*Prepared 15 October 2026. This version is designed for a transparent, Kannada-first demo that can grow into a safer production system.*

## Goal

JanVaani helps a citizen prepare an **application draft** for a Karnataka public service through a browser simulator first, with a real WhatsApp channel only if time permits. It is not an official government portal, does not submit applications automatically, and must clearly identify simulated or mocked behaviour.

## Product principles

1. **One engine, many channels.** The browser simulator and WhatsApp send the same normalized `IncomingMessage` into one pipeline.
2. **Rules decide; language models explain.** Deterministic rules produce eligibility and document findings. LLMs may extract, translate, summarize, or phrase a Kannada reply, but never decide pass/fail.
3. **Show provenance.** Each processing step records whether it used `live`, `mock`, or `deterministic` execution. The UI displays this trace and a DEMO MODE badge whenever any user-visible result relies on mock data.
4. **Collect the minimum.** Consent is required before any audio or image upload. Raw media is discarded after extraction by default; logs and the inspector must redact personal identifiers.
5. **No implied authority.** Generated PDFs are titled **Application Draft**, never official application, certificate, approval, or submission.

## Current repository state

- API: Express 4 + Zod 4; health endpoint plus two chatbot-oriented stub routes.
- Web: one static React welcome page.
- Existing middleware and test patterns are useful; existing citizen-question and service-lookup schemas are not the target product contract.

## Target architecture

```text
apps/api/src/
  config.ts                         validated environment and feature flags
  channels/
    channel.ts                       sendText, sendAudio, fetchMedia
    simulator.ts                     browser HTTP adapter
    whatsapp.ts                      verified webhook, media fetch and send
  providers/
    sarvam/{stt,tts,llm}.ts          live and mock implementations
    ocr.ts                           image extraction with confidence values
    audio.ts                         ffmpeg conversion boundary
  domain/
    services/income-certificate.ts   rules and required documents as data
    rules/{engine,names,dates}.ts    deterministic validation
    form/draft.ts                    application slots and missing fields
    conversation.ts                  explicit state machine
    draft-pdf.ts                     clearly labelled draft output
  routes/
    messages.ts                      POST /api/messages
    whatsapp-webhook.ts              GET verify, POST receive
    demo-admin.ts                    protected demo-only simulated status update
  store.ts                           message de-duplication and demo state
fixtures/documents/                 synthetic, watermarked documents only
evals/catch-rate.ts                 reproducible evaluation report
apps/web/src/                       simulator and redacted inspector
```

### Core contracts

- `IncomingMessage`: `id`, `channel`, `conversationId`, `receivedAt`, `kind` (`text | audio | image`), payload reference, and language hint.
- `ProcessingTrace`: one record per step, including `step`, `mode` (`live | mock | deterministic`), provider/version where applicable, timestamp, and safe error summary.
- `ApplicationDraft`: typed slots, field sources, missing fields, confidence/needs-confirmation flags, and rule findings.
- Incoming message IDs are stored before processing. Duplicate webhook deliveries return safely without sending duplicate replies.

## Delivery phases

### Phase 0 — Foundation, safety, and reset

- Rewrite the README around application preparation, Kannada-first interaction, limitations, and explicit demo mode.
- Add `.env.example`; validate required environment values at startup; keep secrets out of source control.
- Replace chatbot schemas with `IncomingMessage` and `ApplicationDraft` contracts.
- Add environment-aware configuration: mocked providers are the default; live providers require explicit opt-in.
- Add consent recording, media size/type limits, upload rate limiting, and a documented retention policy.
- Add a `/ready` endpoint that reports unavailable optional integrations without exposing secrets.
- Document local prerequisites, including Bun and ffmpeg.

**Done when:** tests, typecheck, and build pass; a user cannot upload media before consenting; raw identifiers are masked in logs and the inspector.

### Phase 1 — Deterministic validation core

- Define the income-certificate service requirements as versioned data. Every rule contains `sourceUrl`, `verifiedOn`, and a verification state.
- Implement name normalization and three outcomes: `match`, `likely_match`, and `mismatch`.
- Implement expiry and date-of-birth consistency checks.
- Implement a rule engine that returns finding code, severity, affected documents, evidence, and an actionable fix.
- Write 20–30 unit tests, including clean sets, seeded defects, ambiguous names, missing fields, and invalid dates.

**Done when:** all expected seeded defects are detected or explicitly marked unassessable; clean fixtures produce no false positives.

### Phase 2 — Synthetic fixtures and honest evaluation

- Generate only synthetic document images and watermark each with `SAMPLE / SYNTHETIC`.
- Create fixtures with: name mismatch, expired date, date-of-birth mismatch, missing document, blur, and cropped seal.
- Keep a fixture manifest containing defect labels and expected outcomes.
- Produce an evaluation report with fixture count, defect classes, true positives, false negatives, false positives, and unassessable/low-confidence results.
- Report rule-engine and end-to-end extraction-plus-rules scores separately. Lead demos with the end-to-end score.

**Done when:** the command produces a repeatable, human-readable results table.

### Phase 3 — Simulator and mocked end-to-end flow

- Build a browser chat with text input, microphone capture, image upload, audio replies, and a one-button demo reset.
- Add a visible consent screen before recording or uploading.
- Build a redacted inspector that shows transcript, extracted fields, confidence, findings, draft state, and per-step execution trace.
- Implement the conversation states: `consent -> collecting -> awaiting_docs -> validating -> draft_ready -> submitted_assisted -> tracking`.
- Handle a message that arrives in an invalid state with a safe, Kannada-first prompt rather than guessing.

**Done when:** a fully mocked Kannada demo runs from fresh state to a checked draft without any external API key.

### Phase 4 — Provider integrations

- Integrate Sarvam STT, TTS, and LLM behind interfaces that preserve the mock implementation.
- Validate current provider endpoints, language codes, audio limits, and voices immediately before implementation.
- Use OCR or vision extraction that returns field-level confidence and source references.
- Convert inbound browser media and WhatsApp OGG/Opus through a single ffmpeg boundary. Enforce duration and file-size limits before conversion.
- Use slot filling for application data; require confirmation for low-confidence or ambiguous extracted values.

**Done when:** one real Kannada recording creates a populated draft and clearly lists required follow-ups; every screen shows which steps remain mocked.

### Phase 5 — Draft PDF

- Generate a draft PDF with extracted answers, missing-field checklist, verification findings, and the Application Draft label.
- Test Kannada rendering before styling work. Use HTML-to-PDF with headless Chromium if the selected PDF library cannot render Kannada conjuncts correctly.

**Done when:** a representative Kannada draft is readable in a standard PDF viewer and never resembles an official government form.

### Phase 6 — Simulated status notification

- Implement a protected, demo-only status route and UI control labelled **Simulated feed**.
- Require a demo secret or local-only access; never leave an unauthenticated status-changing route exposed.
- Send an unprompted Kannada notification through the currently active channel.

**Done when:** the simulator demonstrates a status change and notification without claiming access to a government system.

### Phase 7 — WhatsApp, strictly time-boxed

- Verify Meta webhook signatures before accepting messages.
- De-duplicate retries using WhatsApp message IDs and preserve processing state before sending a response.
- Fetch media through the documented ID-to-URL-to-authenticated-download flow, enforcing size and type limits.
- Use a public HTTPS tunnel and registered test recipients only for development.
- Confirm current Meta requirements for audio/voice-note delivery and the 24-hour conversation window immediately before testing.

**Stop condition:** if verified inbound text and one reply do not work within two hours, keep the simulator as the demo channel and state that WhatsApp remains an integration in progress.

### Phase 8 — Demo preparation

- Rehearse a 90-second story from consent through draft readiness on clean state.
- Record a backup video and verify the reset path.
- Include a limitations slide: simulated status feed, synthetic documents, no automatic submission, no claim of official affiliation, and any mocked provider steps.

## Time-boxed scope

| Time available | Scope |
| --- | --- |
| About one day | Phases 0–3, plus a basic PDF. Keep all providers mocked unless a single integration is already working. |
| Two to three days | Add one or more real providers, PDF polish, and the simulated status push. Attempt WhatsApp only after the simulator is reliable. |
| Four or more days | Complete WhatsApp hardening and add a second service as another data definition and fixture set. |

## Required demo evidence

- A consent-gated conversation from a fresh state.
- Synthetic document input with visible watermark.
- A redacted finding for at least one seeded defect.
- A clean document set that produces no false warning.
- An execution trace that distinguishes live, mock, and deterministic work.
- The evaluation table and limitations slide.

## Open questions

1. What is the demo deadline?
2. Are Sarvam and OCR/vision credentials available?
3. Is there a confirmed official source for the selected service rules, and who will verify each rule?
4. Will the demo run only locally, or must it be externally accessible?
