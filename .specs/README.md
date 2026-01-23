# SpecPilot Specifications

This folder contains structured documentation for your codebase.

## 🚀 Quick Start: Populate Your Specs

Your specs are generated but empty. Follow these steps to fill them with AI-assisted details:

### Step 1: Copy the Onboarding Prompt

1. Open [`development/prompts.md`](development/prompts.md).
2. Find the "First-Use Onboarding Prompt" section.
3. Copy the entire fenced code block (`...`).

### Step 2: Paste into Your AI Agent

1. In your IDE (VS Code, Cursor, etc.), open the AI chat.
2. Paste the prompt and run it.
3. The AI will analyze your codebase and populate all spec files.

### Step 3: Review & Iterate

- Check the generated content in each `.specs` file.
- Refine as needed (e.g., add missing details).
- Run `specpilot validate` to ensure consistency.

## 📁 File Structure

- `project/`: Metadata and requirements
- `architecture/`: Design and APIs
- `planning/`: Tasks and roadmap
- `quality/`: Testing
- `development/`: Docs and prompts

## 🛠️ Commands

\`\`\`bash

# Validate your specs

specpilot validate

# Update specs after code changes

specpilot add-specs
\`\`\`

For AI guidelines and prompt history, see [`development/prompts.md`](development/prompts.md).
