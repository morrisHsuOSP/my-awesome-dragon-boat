---
description: Use the GitHub Copilot's AskQuestions tool whenever an agent answers a question, finishes a task or has follow-up questions to ask the user.
# applyTo: 'Describe when these instructions should be loaded' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

## Environment

The user's operating system is **Windows**. Always use Windows-compatible commands, paths, and tooling:
- Use **PowerShell 5.1** (built-in Windows PowerShell) syntax for all terminal commands — not bash/shell.
- The primary terminal is the **VS Code integrated terminal running PowerShell 5.1**.
- Use backslashes (`\`) for file paths, or forward slashes where cross-platform tools (e.g., Python, Git) accept them.
- Use PowerShell cmdlets (e.g., `Get-ChildItem`, `Set-Location`) where applicable instead of Unix equivalents.
- Never assume Unix-only tools (e.g., `grep`, `ls`, `cat`) are available unless confirmed.

### Python
- The project uses a local virtual environment located at `.venv\` in the workspace root.
- Activate it with: `.\.venv\Scripts\Activate.ps1`
- Always use `.\.venv\Scripts\python.exe` (or the activated environment) when running Python commands.

### Node.js / npm
- Node.js and npm are available. Use `npm` commands directly in the PowerShell terminal.

### Docker / Containers
- Docker is available. Use `docker` and `docker compose` commands in the PowerShell terminal.
- Prefer `docker compose` (v2 plugin syntax) over the legacy `docker-compose` CLI.

### Terminal Usage for Servers
- When starting a server or any long-running process (e.g., `uvicorn`, `npm start`, `docker compose up`), always run the server command in a **separate, dedicated terminal** using `isBackground: true`.
- Any follow-up commands (e.g., running tests, making API calls, installing packages) must be run in a **different terminal** — never in the same terminal as the running server.
- This prevents the server process from being interrupted and ensures follow-up commands are not blocked.

### Git Operations
- **Never auto-commit**: Always let the developer review and check results before running `git commit` or `git push`.
- Before committing, show:
  - A summary of files changed (new, modified, deleted)
  - Key modifications made
  - The proposed commit message
- Use the **AskQuestions tool** to ask for explicit confirmation before any git commit or push operation.
- If the developer says "no" or wants changes, make the requested modifications first and re-present for review.
- This rule applies to ALL agents, prompt files, and direct chat interactions — no exceptions.

## Naming Conventions

- For Python: Use `snake_case` for variables and functions, `PascalCase` for classes, and `UPPER_SNAKE_CASE` for constants.

## Code Style

- For Python: Follow PEP 8 style guidelines for formatting, including indentation, line length, and spacing, and use module level imports instead of inline imports.

### Key rules

## Task Completion

Whenever an agent answers a question, finishes a task or has follow-up questions to ask the user, use the AskQuestions tool to gather more information. Always do this before ending the task. This allows you to clarify any uncertainties and ensure that you have all the necessary information to complete the task effectively. Only end the task when the user has no more questions or can confirm that the task is complete. Always prompt the user to ask any follow-up questions they may have before ending the task. This will help ensure that the user is satisfied with the outcome and that all their concerns have been addressed.