# @msgine/sdk

![npm](https://img.shields.io/npm/v/@msgine/sdk?color=brightgreen&label=npm)

Official TypeScript SDK for the MsGine Messaging API.

## Features

- **Fully Typed**: Complete TypeScript support with strict typing
- **Multi-Channel**: SMS, Email, and Push notifications
- **Validation**: Runtime input validation before API calls
- **Analytics**: Built-in analytics and message history access
- **Modern**: Built with latest TypeScript and ES modules

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

const client = new MsGineClient({
  apiKey: process.env.MSGINE_API_KEY!,
});

// Send an SMS
const result = await client.sms.send({
  to: '+256701521269',
  message: 'Hello from MsGine!',
});

console.log('Message sent:', result.id);
console.log('Status:', result.status);
```

## Configuration

```typescript
const client = new MsGineClient({
  apiKey: 'your-api-key',                        // Required
  baseUrl: 'https://api.msgine.net/api/v1',      // Optional: custom API URL
});
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your MsGine API key |
| `baseUrl` | `string` | No | Custom API base URL |

## Usage

### Send an SMS

```typescript
const result = await client.sms.send({
  to: '+256701521269',
  message: 'Your verification code is 123456',
});

console.log('Message ID:', result.id);
console.log('Status:', result.status);
console.log('Cost:', result.cost, result.currency); // e.g., 30 UGX
```

### Send to Multiple Recipients

```typescript
const result = await client.sms.send({
  to: ['+256701521269', '+256701234567', '+256709876543'],
  message: 'System maintenance tonight at 10 PM',
});

console.log('Sent to:', result.to.length, 'recipients');
```

### Custom Sender ID

```typescript
const result = await client.sms.send({
  to: '+256701521269',
  from: 'MyApp',          // Max 11 alphanumeric characters
  message: 'Hello from MyApp!',
});
```

### Delivery Callback

```typescript
const result = await client.sms.send({
  to: '+256701521269',
  message: 'Hello!',
  callbackUrl: 'https://your-app.com/webhooks/msgine',
});
```

### Send Email

```typescript
const result = await client.email.send({
  to: 'user@example.com',
  subject: 'Welcome to our service',
  body: 'Thank you for signing up!',
});
```

### Send Push Notification

```typescript
const result = await client.push.send({
  to: 'device-token',
  title: 'New message',
  body: 'You have a new notification',
});
```

### View Message History

```typescript
const history = await client.sms.getHistory();
console.log('Messages:', history);
```

### View Analytics

```typescript
const overview = await client.analytics.overview();
const daily = await client.analytics.daily();

console.log('Total sent:', overview.totalSent);
```

## Error Handling

```typescript
import {
  MsGineClient,
  MsGineError,
  MsGineValidationError,
} from '@msgine/sdk';

const client = new MsGineClient({
  apiKey: process.env.MSGINE_API_KEY!,
});

try {
  const result = await client.sms.send({
    to: '+256701521269',
    message: 'Hello!',
  });
  console.log('Success:', result.id);
} catch (error) {
  if (error instanceof MsGineValidationError) {
    // Input failed validation before reaching the API
    console.error('Validation failed:', error.message);
    if (error.field) {
      console.error('Field:', error.field);
    }
  } else if (error instanceof MsGineError) {
    // API returned an error response
    console.error('API error:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Code:', error.code);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## API Reference

### `client.sms`

#### `send(options): Promise<SendSmsResponse>`

Send an SMS message.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | `string \| string[]` | Yes | Recipient phone number(s) in E.164 format |
| `message` | `string` | Yes | Message content (max 1000 characters) |
| `from` | `string` | No | Sender ID (max 11 alphanumeric characters) |
| `callbackUrl` | `string` | No | Webhook URL for delivery status updates |

#### `getHistory(): Promise<...>`

Retrieve SMS message history.

### `client.email`

#### `send(options): Promise<...>`

Send an email message.

### `client.push`

#### `send(options): Promise<...>`

Send a push notification.

### `client.analytics`

#### `overview(): Promise<...>`

Get a messaging analytics overview.

#### `daily(): Promise<...>`

Get daily analytics breakdown.

### `client.messages`

Access and retrieve message records.

## Types

```typescript
interface MsGineClientConfig {
  apiKey: string;
  baseUrl?: string;
}

interface SendSmsOptions {
  to: string | string[];
  message: string;       // max 1000 characters
  from?: string;         // max 11 characters
  callbackUrl?: string;
}

interface SendSmsResponse {
  id: string;
  sid: string | null;
  channel: string;
  to: string[];
  from: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  cost: number;
  currency: string;      // e.g., "UGX"
  createdAt: string;
  updatedAt?: string;
}
```

## Development

```bash
pnpm install      # Install dependencies
pnpm test         # Run tests
pnpm typecheck    # Type checking
pnpm build        # Build
```

### Project Structure

```
msgine-sdk/
├── src/
│   ├── index.ts           # Main entry point
│   ├── client.ts          # MsGineClient implementation
│   ├── http-client.ts     # HTTP transport layer
│   ├── types.ts           # TypeScript type definitions
│   └── modules/
│       ├── sms.ts         # SMS module
│       ├── email.ts       # Email module
│       ├── push.ts        # Push notification module
│       ├── analytics.ts   # Analytics module
│       └── messages.ts    # Messages module
├── dist/                  # Built files (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Best Practices

### Store API Keys Securely

Never hardcode your API key. Use environment variables:

```typescript
const client = new MsGineClient({
  apiKey: process.env.MSGINE_API_KEY!,
});
```

### Always Handle Errors

```typescript
try {
  const result = await client.sms.send({ to, message });
} catch (error) {
  // Handle error appropriately
}
```

### Send to Multiple Recipients Efficiently

```typescript
// ✅ Single request for multiple recipients
await client.sms.send({
  to: [phone1, phone2, phone3],
  message: 'Hello everyone!',
});

// ❌ Avoid: one request per recipient
for (const phone of phones) {
  await client.sms.send({ to: phone, message: 'Hello!' });
}
```

## License

MIT

## Support

- Documentation: [docs.msgine.net](https://docs.msgine.net)
- Email: support@msgine.net
- GitHub Issues: [github.com/kasimlyee/msgine-sdk](https://github.com/kasimlyee/msgine-sdk)
