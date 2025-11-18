# Contributing to @msgine/sdk

Thank you for your interest in contributing to the MsGine SDK! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Getting Started

1. Fork and clone the repository:
```bash
git clone https://github.com/kasimlyee/msgine-sdk.git
cd msgine-sdk
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
# Edit .env and add your API token
```

4. Run tests:
```bash
pnpm test
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, typed TypeScript code
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed

### 3. Run Quality Checks

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test

# Run all checks
pnpm typecheck && pnpm lint && pnpm test
```

### 4. Commit Your Changes

We follow conventional commits:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in SMS sending"
git commit -m "docs: update README"
git commit -m "test: add tests for client"
git commit -m "refactor: improve error handling"
```

Commit types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test changes
- `refactor`: Code refactoring
- `chore`: Build/tooling changes
- `style`: Code style changes

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style

### TypeScript

- Use strict TypeScript configuration
- Avoid `any` type - use proper typing
- Use interfaces for object shapes
- Use enums for fixed sets of values
- Document public APIs with JSDoc comments

### Example:

```typescript
/**
 * Send an SMS message
 * 
 * @param payload - SMS message data
 * @returns Promise resolving to the SMS response
 * @throws {MsGineValidationError} If payload validation fails
 * @throws {MsGineError} If the API request fails
 */
async sendSms(payload: SendSmsPayload): Promise<SendSmsResponse> {
  // Implementation
}
```

### Error Handling

- Use custom error classes
- Provide helpful error messages
- Include relevant context in errors

### Testing

- Write tests for all new features
- Maintain high code coverage
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

Example:

```typescript
describe('MsGineClient', () => {
  describe('sendSms', () => {
    it('should send SMS successfully', async () => {
      // Arrange
      const client = createClient();
      
      // Act
      const result = await client.sendSms({ to, message });
      
      // Assert
      expect(result.success).toBe(true);
    });
  });
});
```

## Project Structure

```
msgine-sdk/
├── src/
│   ├── index.ts          # Main entry point
│   ├── client.ts         # Client implementation
│   ├── http-client.ts    # HTTP client with retry
│   ├── types.ts          # Type definitions
│   └── *.test.ts         # Test files
├── examples/             # Usage examples
├── dist/                 # Built files (generated)
└── ...config files
```

## Pull Request Guidelines

### Before Submitting

- [ ] Tests pass (`pnpm test`)
- [ ] Code is formatted (`pnpm format`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Types are correct (`pnpm typecheck`)
- [ ] Documentation is updated
- [ ] Examples are updated (if needed)

### PR Description

Include:
- What changes were made
- Why the changes were necessary
- How to test the changes
- Any breaking changes
- Related issues (if any)

### Example PR Description:

```markdown
## Changes
- Added batch SMS sending functionality
- Improved error handling for rate limiting

## Why
Users requested the ability to send multiple SMS messages efficiently.

## Testing
1. Run `pnpm test`
2. Try the new example in `examples/batch-sending.ts`

## Breaking Changes
None

## Related Issues
Closes #123
```

## Reporting Issues

### Bug Reports

Include:
- SDK version
- Node.js version
- Code snippet to reproduce
- Expected behavior
- Actual behavior
- Error messages/stack traces

### Feature Requests

Include:
- Use case description
- Proposed API design
- Example usage code
- Any alternatives considered

## Questions?

- Open a GitHub Discussion
- Check existing issues
- Review the README and documentation

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Follow the Golden Rule

Thank you for contributing! 