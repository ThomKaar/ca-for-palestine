# Jev form runner

This authenticated sidecar runs the `jev-ultrafast` Python agent against the senators' public contact forms. It should run on a trusted host with Chrome, Python 3.12+, and Browser Harness; it is not intended to run inside a serverless Next.js function.

```bash
uv sync
uv run browser-harness --doctor
uv run uvicorn app:app --host 0.0.0.0 --port 8767
```

Required environment variables:

```bash
TYPESAFE_API_KEY=
TYPESAFE_MODEL=jev-latest
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4.1-mini
JEV_FORM_RUNNER_TOKEN=
```

`OPENAI_API_KEY` may be the same key used by the Next app. The runner replaces only `jev-ultrafast`'s `TYPE_TEXT` helper with an OpenAI-native Chat Completions adapter. Jev still chooses browser actions through TypeSafe. The adapter uses JSON mode, disables response storage, and intentionally sends no reasoning parameter because `gpt-4.1-mini` is a non-reasoning model.

The runner serializes jobs because Browser Harness uses a shared local Chrome profile. Put it behind TLS and keep the bearer token aligned with the Next app's `JEV_FORM_RUNNER_TOKEN`.

Failure responses include a sanitized control-flow summary (action labels, counts, and skipped field labels). They intentionally exclude typed values and visible page text.
