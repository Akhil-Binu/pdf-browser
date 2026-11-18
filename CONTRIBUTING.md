# Contributing Guidelines

Thank you for your interest in contributing to PDF & Image Kit!

## Development Setup

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Code Quality Standards

Before opening a pull request, please ensure:
1. TypeScript compiles with no errors:
   ```bash
   npm run build
   ```
2. Lint checks pass:
   ```bash
   npm run lint
   ```
3. Client-side privacy guarantee: no remote network calls or file transmissions are allowed.

## Submitting Pull Requests

1. Create a feature branch: `git checkout -b feature/your-feature-name`.
2. Commit your changes with clear, descriptive commit messages.
3. Push to your fork and submit a Pull Request targeting the `main` branch.
