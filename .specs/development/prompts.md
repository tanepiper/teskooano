---
title: Prompts Log
project: teskooano
language: typescript
framework:
lastUpdated: 2026-01-23
sourceOfTruth: project/project.yaml
---

# Development Prompts Log

## Overview

This file (prompts.md) contains ALL AI interactions for teskooano. Update .specs/prompts.md with every AI interaction.

**🚨 MANDATE**: Update with every AI interaction.

## First-Use Onboarding Prompt

After generating the `.specs` directory, use this prompt to have your AI agent populate all specification files with project-specific details while following established conventions:

```
You are onboarding as the specification co-pilot for this repository. We just initialized the .specs directory using SpecPilot SDD. Your task is to inspect the codebase and populate all .specs files following these strict conventions:

**Conventions & Rules:**
1. **IDs**: Use semantic prefixes (REQ-, TASK-, ARCH-, TEST-, etc.) with zero-padded numbers (e.g., REQ-001, TASK-042)
2. **Status values**: Must be one of: not-started, in-progress, completed, blocked, deprecated
3. **Priority values**: Must be: critical, high, medium, low
4. **Dates**: Use ISO 8601 format (YYYY-MM-DD)
5. **YAML**: Use proper indentation (2 spaces), include all required fields
6. **Markdown**: Use ATX headers (#), fenced code blocks, and consistent formatting
7. **Traceability**: Link requirements to tasks, tasks to tests, architecture to implementation

**File Structure Standards:**

- `project/project.yaml`: name, version, description, tech_stack[], dependencies[], metadata
- `project/requirements.md`: ## Functional/Non-Functional Requirements with REQ-XXX IDs, priority, status
- `architecture/architecture.md`: ## Overview, Components, Data Flow, Tech Stack, Decisions (ADR format)
- `architecture/api.yaml`: OpenAPI 3.0 spec or endpoints list with methods, paths, descriptions
- `planning/tasks.md`: ## Backlog/In Progress/Completed with TASK-XXX, assignee, priority, dependencies
- `planning/roadmap.md`: ## Milestones with versions, dates, features, status
- `quality/tests.md`: ## Test Strategy, Test Cases (TEST-XXX), Coverage Goals, CI/CD integration
- `development/docs.md`: ## Getting Started, Architecture, API, Deployment, Contributing
- `development/context.md`: ## Project Context, Key Decisions, Known Issues, Future Considerations

**Your Process:**
1. Analyze the codebase: language, framework, structure, existing tests, dependencies
2. For each .specs file, generate content that:
   - Reflects the actual implementation state
   - Follows the conventions above exactly
   - Maintains internal consistency (cross-references work)
   - Scales appropriately to project size (small projects = concise specs, large = comprehensive)
3. Identify gaps: missing tests, undocumented APIs, unclear requirements, architectural debt
4. Propose actionable next steps in planning/tasks.md

**Output Format:**
For each file, provide the complete content in a markdown code block:
\`\`\`markdown
// filepath: .specs/project/project.yaml
[full file content]
\`\`\`

**Constraints:**
- Maintain the exact file paths and names from the .specs structure
- Don't invent features that don't exist in the code
- Flag uncertainties with TODO comments
- Keep descriptions clear, concise, and technical
- Ensure all IDs are unique within their domain

After populating all files, provide a summary of:
- What was discovered about the project
- What's documented vs. what's implemented
- Critical gaps or risks
- Recommended immediate actions

Begin your analysis now.
```

## Prompt History

| Date       | User      | Prompt Summary | Context                  |
| ---------- | --------- | -------------- | ------------------------ |
| YYYY-MM-DD | @username | Example prompt | Brief context or outcome |

## Common Commands

\`\`\`bash

# Generate specs for new project

specpilot init

# Add specs to existing project

specpilot add-specs

# Validate spec files

specpilot validate
\`\`\`

## AI Agent Guidelines

When working with AI agents on this codebase:

- Always reference relevant .specs files for context
- Update specifications before/after significant changes
- Use the conventions defined in the onboarding prompt
- Link code changes to tasks (TASK-XXX) and requirements (REQ-XXX)
- Keep development/context.md current with architectural decisions
- **🚨 RELEASE MANDATE**: Never commit, push, create tags, publish releases, or publish to npm without explicit user consent and approval

## Cross-References

- Context: ./context.md
- Project config: ../project/project.yaml

---

_Last updated: 2026-01-23_
