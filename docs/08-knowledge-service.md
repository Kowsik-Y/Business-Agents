# Knowledge Service

## Purpose

The Knowledge Service ingests approved organizational content and provides permission-aware, version-aware retrieval for the AI Orchestrator and agent console.

## Technology

- FastAPI
- LangChain document loaders and splitters
- PostgreSQL and pgvector
- Optional OpenSearch for hybrid retrieval at larger scale
- Object storage for original documents
- Embedding and reranking models

## Ingestion flow

```mermaid
flowchart LR
    U[Upload] --> S[Malware Scan]
    S --> P[Parse]
    P --> N[Normalize]
    N --> C[Chunk]
    C --> M[Attach Metadata]
    M --> E[Generate Embeddings]
    E --> V[(pgvector)]
    V --> Q[Quality Validation]
    Q --> A[Activate Version]
```

## Required metadata

```text
documentId
version
title
sourceSystem
product
region
language
effectiveFrom
effectiveUntil
accessLevel
approvalStatus
ownerDepartment
checksum
```

## Retrieval pipeline

1. Normalize and optionally rewrite the query.
2. Apply mandatory metadata and permission filters.
3. Run vector and keyword retrieval.
4. Merge and deduplicate candidates.
5. Rerank.
6. Reject expired, unapproved, or inaccessible content.
7. Detect conflicting authoritative passages.
8. Return passages with stable source identifiers.

## APIs

```text
POST /internal/v1/documents
POST /internal/v1/documents/{id}/versions
POST /internal/v1/documents/{id}/activate
POST /internal/v1/retrieval/search
GET  /internal/v1/documents/{id}
POST /internal/v1/index-jobs
GET  /internal/v1/index-jobs/{id}
```

## Retrieval response

```json
{
  "queryId": "QRY-101",
  "results": [
    {
      "chunkId": "CHK-2001",
      "documentId": "DOC-1029",
      "version": "4.2",
      "text": "...",
      "score": 0.91,
      "title": "Warranty Policy",
      "effectiveFrom": "2026-04-01",
      "region": "India"
    }
  ],
  "conflictDetected": false
}
```

## Governance

- Only approved document versions are retrievable.
- Activation and retirement are audited.
- Access-level filters are mandatory, not model-selected.
- Embeddings must be regenerated when chunk text or embedding model changes.
- Deletion must distinguish operational removal from legal-retention requirements.

## Tests

Include parser tests, chunk-boundary tests, metadata filters, permission leakage tests, version precedence, retrieval relevance, conflict detection, and index migration tests.
