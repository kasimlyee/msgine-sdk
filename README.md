# @msgine/sdk

![npm](https://img.shields.io/npm/v/@msgine/sdk?color=brightgreen&label=npm)

Official TypeScript SDK for the MsGine Messaging API. 

## Features

- **Fully Typed**: Complete TypeScript support with strict typing
- **Auto Retry**: Configurable retry logic with exponential backoff
- **Validation**: Runtime validation using Zod schemas
- **Modern**: Built with latest TypeScript and ES modules
- **Well Tested**: Comprehensive test coverage
- **Zero Config**: Sensible defaults, easy to customize
- **Flexible**: Support for custom fetch implementations

## Installation

```bash
# Using pnpm (recommended)
pnpm add @msgine/sdk

# Using npm
npm install @msgine/sdk

# Using yarn
yarn add @msgine/sdk
```

## Quick Start

```typescript
import { MsGineClient } from '@msgine/sdk';

// Create a client
const client = new MsGineClient({
  apiToken: process.env.MSGINE_API_TOKEN!,
});

// Send an SMS
const result = await client.sendSms({
  to: '+256701521269',
  message: 'Hello from MsGine!',
});

console.log('Message sent:', result.id);
console.log('Status:', result.status);
```

## Configuration

### Basic Configuration

```typescript
const client = new MsGineClient({
  apiToken: 'your-api-token',
});
```

### Advanced Configuration

```typescript
const client = new MsGineClient({
  apiToken: 'your-api-token',
  baseUrl: 'https://api.msgine.net/api/v1', // Optional: Custom API URL
  timeout: 30000, // Optional: Request timeout in ms (default: 30000)
  retry: {
    maxRetries: 3, // Optional: Max retry attempts (default: 3)
    initialDelay: 1000, // Optional: Initial delay in ms (default: 1000)
    maxDelay: 10000, // Optional: Max delay in ms (default: 10000)
    backoffMultiplier: 2, // Optional: Backoff multiplier (default: 2)
    retryableStatusCodes: [408, 429, 500, 502, 503, 504], // Optional
  },
});
```

## Usage Examples

### Send a Single SMS

```typescript
try {
  const result = await client.sendSms({
    to: '+256701521269',
    message: 'Your verification code is 123456',
  });

  console.log('Message ID:', result.id);
  console.log('Status:', result.status);
  console.log('Recipients:', result.to);
  console.log('Cost:', result.cost, result.currency);
  console.log('Timestamp:', result.createdAt);
} catch (error) {
  if (error instanceof MsGineError) {
    console.error('API Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Error Code:', error.code);
  }
}
```

### Send Multiple SMS (Batch)

```typescript
const messages = [
  { to: '+256701521269', message: 'Hello Alice!' },
  { to: '+256701521270', message: 'Hello Bob!' },
  { to: '+256701521271', message: 'Hello Charlie!' },
];

try {
  const results = await client.sendSmsBatch(messages);
  
  results.forEach((result, index) => {
    console.log(`Message ${index + 1}:`, result.id);
  });
} catch (error) {
  console.error('Failed to send batch:', error);
}
```

### Using Environment Variables

Create a `.env` file:

```env
MSGINE_API_TOKEN=your-api-token-here
```

Then use it in your code:

```typescript
import { MsGineClient } from '@msgine/sdk';
import {loadEnv} from "dotenv-gad";
import schema from "./env.schema"

env = loadEnv(schema)

const client = new MsGineClient({
  apiToken: env.MSGINE_API_TOKEN!,
});
```

### Error Handling

```typescript
import {
  MsGineClient,
  MsGineError,
  MsGineValidationError,
} from '@msgine/sdk';

const client = new MsGineClient({
  apiToken: env.MSGINE_API_TOKEN!,
});

try {
  const result = await client.sendSms({
    to: '+256701521269',
    message: 'Hello!',
  });
  console.log('Success:', result);
} catch (error) {
  if (error instanceof MsGineValidationError) {
    // Handle validation errors
    console.error('Validation failed:', error.message);
    console.error('Details:', error.errors.issues);
  } else if (error instanceof MsGineError) {
    // Handle API errors
    console.error('API error:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Code:', error.code);
    console.error('Request ID:', error.requestId);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

### Custom Fetch Implementation

Useful for testing or custom network handling:

```typescript
import { MsGineClient } from '@msgine/sdk';

const customFetch = async (url: string, options: RequestInit) => {
  // Add custom headers, logging, etc.
  console.log('Making request to:', url);
  return fetch(url, options);
};

const client = new MsGineClient({
  apiToken: env.MSGINE_API_TOKEN!,
  fetch: customFetch,
});
```

### Using the Factory Function

```typescript
import { createClient } from '@msgine/sdk';

const client = createClient({
  apiToken: env.MSGINE_API_TOKEN!,
});

await client.sendSms({
  to: '+256701521269',
  message: 'Hello!',
});
```

## API Reference

### MsGineClient

#### Constructor

```typescript
new MsGineClient(config: MsGineClientConfig)
```

#### Methods

##### `sendSms(payload: SendSmsPayload): Promise<SendSmsResponse>`

Send a single SMS message.

**Parameters:**
- `payload.to` (string): Recipient phone number (required)
- `payload.message` (string): Message content, max 1600 characters (required)

**Returns:** `Promise<SendSmsResponse>`

**Throws:**
- `MsGineValidationError`: If payload validation fails
- `MsGineError`: If the API request fails

##### `sendSmsBatch(payloads: SendSmsPayload[]): Promise<SendSmsResponse[]>`

Send multiple SMS messages.

**Parameters:**
- `payloads` (SendSmsPayload[]): Array of SMS payloads

**Returns:** `Promise<SendSmsResponse[]>`

**Throws:**
- `MsGineValidationError`: If any payload validation fails
- `MsGineError`: If any API request fails

### Types

#### `MsGineClientConfig`

```typescript
interface MsGineClientConfig {
  apiToken: string;
  baseUrl?: string;
  timeout?: number;
  fetch?: typeof fetch;
  retry?: RetryConfig;
}
```

#### `SendSmsPayload`

```typescript
interface SendSmsPayload {
  to: string;
  message: string;
}
```

#### `SendSmsResponse`

```typescript
interface SendSmsResponse {
  id: string;
  sid: string | null;
  channel: string;
  to: string[];
  from: string;
  content: string;
  status: MessageStatus;
  cost: number;
  currency: string;
  createdAt: string;
  updatedAt?: string;
}
```

#### `MessageStatus`

```typescript
enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}
```

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# Build
pnpm build
```

### Project Structure

```
msgine-sdk/
├── src/
│   ├── index.ts          # Main entry point
│   ├── client.ts         # MsGine client implementation
│   ├── http-client.ts    # HTTP client with retry logic
│   ├── types.ts          # Type definitions
│   └── client.test.ts    # Tests
├── dist/                 # Built files (generated)
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Best Practices

### 1. Store API Token Securely

Never hardcode your API token. Use environment variables:

```typescript
const client = new MsGineClient({
  apiToken: process.env.MSGINE_API_TOKEN!,
});
```

### 2. Handle Errors Gracefully

Always wrap API calls in try-catch blocks:

```typescript
try {
  const result = await client.sendSms({ to, message });
  // Handle success
} catch (error) {
  // Handle error
}
```

### 3. Validate Input

The SDK automatically validates input, but you can also use the schemas:

```typescript
import { SendSmsSchema } from '@msgine/sdk';

const result = SendSmsSchema.safeParse({
  to: '+256701521269',
  message: 'Hello!',
});

if (!result.success) {
  console.error('Validation errors:', result.error);
}
```

### 4. Use TypeScript

Take advantage of full type safety:

```typescript
const client = new MsGineClient({ apiToken: 'token' });

// TypeScript will catch errors at compile time
await client.sendSms({
  to: '+256701521269',
  message: 'Hello!',
  // invalidField: 'error' // ❌ TypeScript error
});
```

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [github.com/kasimlyee/msgine-sdk](https://github.com/kasimlyee/msgine-sdk)
- Documentation: [docs.msgine.net](https://docs.msgine.net)
- Email: support@msgine.net
