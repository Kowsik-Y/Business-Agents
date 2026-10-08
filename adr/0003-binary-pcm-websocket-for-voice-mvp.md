# ADR 0003: Binary PCM WebSocket for Voice MVP

## Status

Accepted

## Context

The MVP needs browser voice interaction, faster-whisper transcription, streaming TTS, and customer interruption without the additional complexity of a full media platform.

## Decision

Use AudioWorklet capture and binary PCM WebSocket frames for the MVP. Create sessions through Next.js BFF and connect directly to Voice Service through the gateway.

## Consequences

Implementation is simple and debuggable. At larger scale or for telephony-grade media, a dedicated WebRTC or media-server architecture may be introduced.
