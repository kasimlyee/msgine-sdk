# Setup Guide - From Development to Production

This guide walks you through setting up the MsGine SDK from initial development to production deployment.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Testing](#testing)
3. [Building](#building)
4. [Using in Your Project](#using-in-your-project)
5. [Production Deployment](#production-deployment)
6. [Best Practices](#best-practices)

## Development Setup

### 1. Prerequisites

Install required tools:

```bash
# Install Node.js (v18 or higher)
# Download from https://nodejs.org/

# Install pnpm
npm install -g pnpm

# Verify installations
node --version  # Should be >= 18.0.0
pnpm --version  # Should be >= 8.0.0
```

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/kasimlyee/msgine-sdk.git
cd msgine-sdk

# Install dependencies
pnpm install
```

### 3. Environment Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
MSGINE_API_TOKEN=8834d259513120b714524dfg41d6f48793778570
```

### 4. Development Commands

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# Build the project
pnpm build

# Development mode (watch and rebuild)
pnpm dev
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode (auto-rerun on changes)
pnpm test:watch
```

### Writing Tests

Example test:

```typescript
import { describe, it, expect } from 'vitest';
import { MsGineClient } from '../src';

describe('MsGineClient', () => {
  it('should send SMS successfully', async () => {
    const client = new MsGineClient({
      apiToken: 'test-token',
    });

    const result = await client.sendSms({
      to: '+256701521269',
      message: 'Test message',
    });

    expect(result.success).toBe(true);
  });
});
```

## Building

### Build for Production

```bash
# Clean build
pnpm build

# Output will be in ./dist/
# - dist/index.js     (CommonJS)
# - dist/index.mjs    (ES Modules)
# - dist/index.d.ts   (TypeScript definitions)
```

### Build Configuration

The build is configured in `package.json`:

```json
{
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts"
}
```

## Using in Your Project

### Installation

```bash
# If published to npm
pnpm add @msgine/sdk

# If using locally during development
pnpm add /path/to/msgine-sdk
```

### Basic Usage

Create a file `send-sms.ts`:

```typescript
import { MsGineClient } from '@msgine/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

async function sendSMS() {
  const client = new MsGineClient({
    apiToken: process.env.MSGINE_API_TOKEN!,
  });

  try {
    const result = await client.sendSms({
      to: '+256701521269',
      message: 'Hello from MsGine!',
    });

    console.log('Message sent:', result.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
}

sendSMS();
```

### TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true
  }
}
```

## Production Deployment

### 1. Environment Variables

**Never commit secrets!** Use environment variables:

```bash
# .env file (add to .gitignore)
MSGINE_API_TOKEN=your-production-token
```

### 2. Node.js Application

```typescript
// app.ts
import { MsGineClient } from '@msgine/sdk';

const client = new MsGineClient({
  apiToken: process.env.MSGINE_API_TOKEN!,
  timeout: 30000,
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
  },
});

export { client };
```

### 3. Express.js Integration

```typescript
import express from 'express';
import { MsGineClient, MsGineError } from '@msgine/sdk';

const app = express();
app.use(express.json());

const client = new MsGineClient({
  apiToken: process.env.MSGINE_API_TOKEN!,
});

app.post('/api/send-sms', async (req, res) => {
  try {
    const { to, message } = req.body;

    const result = await client.sendSms({ to, message });

    res.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    if (error instanceof MsGineError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 4. Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build
RUN pnpm build

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
```

Build and run:

```bash
# Build image
docker build -t msgine-app .

# Run container
docker run -e MSGINE_API_TOKEN=your-token -p 3000:3000 msgine-app
```

### 5. Serverless (AWS Lambda)

```typescript
// lambda.ts
import { MsGineClient } from '@msgine/sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';

const client = new MsGineClient({
  apiToken: process.env.MSGINE_API_TOKEN!,
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    const result = await client.sendSms({
      to: body.to,
      message: body.message,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: result.messageId,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to send SMS',
      }),
    };
  }
};
```

### 6. Kubernetes Deployment

Create `deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: msgine-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: msgine-app
  template:
    metadata:
      labels:
        app: msgine-app
    spec:
      containers:
      - name: msgine-app
        image: your-registry/msgine-app:latest
        env:
        - name: MSGINE_API_TOKEN
          valueFrom:
            secretKeyRef:
              name: msgine-secret
              key: api-token
        ports:
        - containerPort: 3000
```

## Best Practices

### 1. Error Handling

Always handle errors properly:

```typescript
import { MsGineError, MsGineValidationError } from '@msgine/sdk';

try {
  const result = await client.sendSms({ to, message });
} catch (error) {
  if (error instanceof MsGineValidationError) {
    // Handle validation errors
    console.error('Invalid input:', error.errors);
  } else if (error instanceof MsGineError) {
    // Handle API errors
    console.error('API error:', error.statusCode, error.message);
    
    // Implement retry logic or fallback
    if (error.statusCode === 429) {
      // Rate limited - wait and retry
    }
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

### 2. Logging

Add proper logging:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

try {
  logger.info('Sending SMS', { to, messageLength: message.length });
  const result = await client.sendSms({ to, message });
  logger.info('SMS sent successfully', { messageId: result.messageId });
} catch (error) {
  logger.error('Failed to send SMS', { error, to });
  throw error;
}
```

### 3. Rate Limiting

Implement rate limiting:

```typescript
import pLimit from 'p-limit';

const limit = pLimit(10); // Max 10 concurrent requests

const messages = [...]; // Array of messages

const results = await Promise.all(
  messages.map(msg => 
    limit(() => client.sendSms(msg))
  )
);
```

### 4. Monitoring

Add health checks:

```typescript
app.get('/health', async (req, res) => {
  try {
    // You could add a test SMS endpoint check here
    res.json({ status: 'healthy' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy' });
  }
});
```

### 5. Security

- Store API tokens in environment variables
- Use secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)
- Enable HTTPS in production
- Validate and sanitize all inputs
- Implement rate limiting
- Use least-privilege principles

### 6. Performance

```typescript
// Create client once and reuse
const client = new MsGineClient({
  apiToken: process.env.MSGINE_API_TOKEN!,
  timeout: 10000, // Adjust based on your needs
  retry: {
    maxRetries: 3,
    initialDelay: 500,
  },
});

// Batch operations when possible
const results = await client.sendSmsBatch(messages);
```

## Troubleshooting

### Common Issues

1. **"API token is required"**
   - Ensure `MSGINE_API_TOKEN` is set in environment variables

2. **"Request timeout"**
   - Increase timeout in client configuration
   - Check network connectivity

3. **Validation errors**
   - Verify phone number format
   - Check message length (max 1600 characters)

4. **Rate limiting (429)**
   - Implement exponential backoff
   - Reduce request rate
   - Contact support for rate limit increase

### Debug Mode

Enable verbose logging:

```typescript
const client = new MsGineClient({
  apiToken: process.env.MSGINE_API_TOKEN!,
  // Add custom fetch for logging
  fetch: async (url, options) => {
    console.log('Request:', url, options);
    const response = await fetch(url, options);
    console.log('Response:', response.status);
    return response;
  },
});
```

## Support

- Documentation: [docs.msgine.net](https://docs.msgine.net)
- GitHub Issues: [github.com/kasimlyee/msgine-sdk/issues](https://github.com/kasimlyee/msgine-sdk/issues)
- Email: support@msgine.net