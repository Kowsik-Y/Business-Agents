# Admin Console

## Purpose

The administration application manages platform configuration without requiring direct database changes.

## Administrative domains

- Intent catalog and required fields
- Tool registry and permission requirements
- Authentication-level requirements
- Human-approval thresholds
- Knowledge-source configuration
- Document approval and retirement
- Prompt and graph configuration versions
- Feature flags
- Service health dashboards
- Queue and routing rules
- Notification templates
- Data-retention policies

## Change-management rules

- Every configuration change is versioned.
- Sensitive policy changes require four-eyes approval.
- Production changes include an effective timestamp and rollback target.
- Prompt changes must pass regression evaluation before activation.
- Document retirement must remove the content from retrieval without deleting mandatory audit evidence.

## Security

Administrative routes should use separate gateway policies, stronger authentication, narrow roles, IP or device restrictions where appropriate, and complete audit logging.

## Tests

Test authorization boundaries, version rollback, invalid policy combinations, prompt activation, document approval, and feature-flag targeting.
