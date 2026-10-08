# Customer Web

## Purpose

The customer-facing Next.js application provides chat, voice controls, account context, conversation history, attachments, and status updates.

## Technology

- Next.js App Router
- TypeScript
- Tailwind CSS and shadcn/ui
- TanStack Query for server state
- Zustand for transient UI state
- Zod for request validation
- Server-Sent Events or fetch streaming for chat
- AudioWorklet and WebSocket for voice

## Folder structure

```text
apps/customer-web/
├── app/
│   ├── api/
│   │   ├── chat/route.ts
│   │   ├── conversations/route.ts
│   │   ├── uploads/route.ts
│   │   └── voice/session/route.ts
│   ├── support/page.tsx
│   ├── orders/page.tsx
│   └── account/page.tsx
├── features/
│   ├── chat/
│   ├── voice/
│   ├── account/
│   └── cases/
├── components/
└── public/worklets/
```

## BFF responsibilities

The Next.js server layer:

- Reads secure browser sessions
- Validates browser request bodies
- Adds correlation IDs
- Calls internal APIs using short-lived service credentials
- Aggregates frontend-specific views
- Streams AI events to the browser
- Creates short-lived voice-session tokens
- Signs attachment-upload requests

It must not own durable business state or perform long-running operations.

## Chat states

```text
idle -> sending -> receiving -> completed
                    |             |
                    v             v
                 tool_wait     escalated
                    |
                    v
                 receiving
```

The UI should display grounded source labels, tool progress, human-handoff status, retryable failures, and explicit confirmations for sensitive actions.

## Voice states

```text
idle -> connecting -> calibrating -> listening -> transcribing
                                      ^             |
                                      |             v
                                  interrupted <- thinking -> speaking
```

## Security

- Use Secure, HttpOnly, SameSite cookies.
- Do not store long-lived access tokens in local storage.
- Escape model-generated content before rendering.
- Render links through an allow-list policy.
- Scan uploaded files before ingestion.
- Prevent the browser from selecting arbitrary internal tool names.

## Accessibility

Support keyboard navigation, focus management, screen-reader announcements for streaming updates, visible captions during voice interactions, and a text fallback for every voice action.

## Tests

- Component tests for chat and voice states
- Route-handler tests for validation and authentication
- Playwright flows for chat, order lookup, handoff, and voice-session creation
- Accessibility tests
- Network interruption and stream-resume tests
