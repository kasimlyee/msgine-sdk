# Getting Started with MsGine SDK

Welcome! This guide will get you up and running in 5 minutes.

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed ([Download](https://nodejs.org/))
- ✅ pnpm installed (`npm install -g pnpm`)
- ✅ MsGine API token (from your dashboard)

## Step 1: Navigate to the Project

```bash
cd msgine-sdk
```

## Step 2: Install Dependencies

```bash
pnpm install
```

This will install all required dependencies. It should take about 30 seconds.

## Step 3: Configure Your API Token

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit the `.env` file and add your API token:

```env
MSGINE_API_TOKEN=your-actual-api-token-here
```

**Important**: Never commit your `.env` file to version control!

## Step 4: Verify Setup

Run the tests to ensure everything is working:

```bash
pnpm test
```

You should see all tests passing 

## Step 5: Try the Examples

### Basic Example

```bash
# First, update the phone number in examples/basic-usage.ts
# Then run:
pnpm tsx examples/basic-usage.ts
```

### Advanced Example

```bash
pnpm tsx examples/usage2.ts
```

## Step 6: Use in Your Code

Create a new file `my-app.ts`:

```typescript
import { MsGineClient } from '@msgine/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Initialize client
  const client = new MsGineClient({
    apiToken: process.env.MSGINE_API_TOKEN!,
  });

  // Send SMS
  const result = await client.sendSms({
    to: '+256701521269', // Replace with your number
    message: 'Hello from MsGine SDK!',
  });

  console.log('✅ Message sent!');
  console.log('Message ID:', result.id);
  console.log('Status:', result.status);
}

main().catch(console.error);
```

Run it:

```bash
pnpm tsx my-app.ts
```

## Development Commands

```bash
# Run tests
pnpm test                 # Run once
pnpm test:watch           # Watch mode
pnpm test:coverage        # With coverage

# Code quality
pnpm typecheck            # Type checking
pnpm lint                 # Linting
pnpm lint:fix             # Fix linting issues
pnpm format               # Format code

# Build
pnpm build                # Production build
pnpm dev                  # Development mode (watch)
```

## What's Next?

### Read the Documentation

- **[README.md](README.md)** - Complete API documentation
- **[SETUP.md](SETUP.md)** - Detailed setup and deployment guide
- **[PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md)** - Architecture details
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Quick reference guide

### Explore Examples

- `examples/basic-usage.ts` - Simple SMS sending
- `examples/advanced-usage.ts` - Advanced features and error handling

### 🛠️ Customize Configuration

Edit your client configuration in your code:

```typescript
const client = new MsGineClient({
  apiToken: process.env.MSGINE_API_TOKEN!,
  timeout: 60000, // 60 seconds
  retry: {
    maxRetries: 5,
    initialDelay: 2000,
  },
});
```

### Build for Production

```bash
pnpm build
```

The built files will be in the `dist/` directory:
- `dist/index.js` - CommonJS
- `dist/index.mjs` - ES Module
- `dist/index.d.ts` - TypeScript types

### Deploy

See [SETUP.md](SETUP.md) for deployment guides:
- Express.js
- AWS Lambda
- Docker
- Kubernetes

## Troubleshooting

### "Cannot find module '@msgine/sdk'"

Make sure you've run `pnpm install` first.

### "API token is required"

Check that your `.env` file exists and contains `MSGINE_API_TOKEN`.

### "Request timeout"

Increase the timeout in your configuration:

```typescript
new MsGineClient({
  apiToken: process.env.MSGINE_API_TOKEN!,
  timeout: 60000, // Increase from default 30000
});
```

### Tests are failing

Make sure all dependencies are installed:

```bash
pnpm install
pnpm test
```

### Need More Help?

- Check [SETUP.md](SETUP.md) for detailed guides
- Open an issue on GitHub
- Email: support@msgine.net

## Quick Reference

### Send SMS

```typescript
await client.sendSms({
  to: '+256701521269',
  message: 'Hello!',
});
```

### Send Batch

```typescript
await client.sendSmsBatch([
  { to: '+256701521269', message: 'Hello Alice!' },
  { to: '+256701521270', message: 'Hello Bob!' },
]);
```

### Error Handling

```typescript
import { MsGineError, MsGineValidationError } from '@msgine/sdk';

try {
  await client.sendSms({ to, message });
} catch (error) {
  if (error instanceof MsGineValidationError) {
    console.error('Validation failed:', error.errors);
  } else if (error instanceof MsGineError) {
    console.error('API error:', error.statusCode, error.message);
  }
}
```

## Success! 

You're all set up and ready to send SMS messages with the MsGine SDK!

Happy coding! 