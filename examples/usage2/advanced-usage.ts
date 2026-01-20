import {
  MsGineClient,
  MsGineError,
  MsGineValidationError,
  MessageStatus,
} from '@msgine/sdk';
import {loadEnv} from "dotenv-gad"
import schema from "./env.schema"

const env = loadEnv(schema)

async function main() {
  // Create client with custom configuration
  const client = new MsGineClient({
    apiToken: env.MSGINE_API_TOKEN,
    timeout: 60000, // 60 seconds
    retry: {
      maxRetries: 5,
      initialDelay: 2000,
      backoffMultiplier: 2,
    },
  });

  // Example 1: Send single SMS with error handling
  console.log('=== Example 1: Single SMS ===');
  try {
    const result = await client.sendSms({
      to: '+256701521269',
      message: 'Your verification code is: 123456',
    });

    console.log('✅ Message sent');
    console.log('Message ID:', result.id);
    console.log('Status:', result.status);
    console.log('Cost:', result.cost, result.currency);

    // Check status
    if (result.status === MessageStatus.PENDING) {
      console.log('📤 Message is being sent...');
    }
  } catch (error) {
    if (error instanceof MsGineValidationError) {
      console.error('❌ Validation Error:', error.message);
      console.error('Issues:', error.errors.issues);
    } else if (error instanceof MsGineError) {
      console.error('❌ API Error:', error.message);
      console.error('Status Code:', error.statusCode);
      console.error('Error Code:', error.code);
      console.error('Request ID:', error.requestId);
    } else {
      console.error('❌ Unexpected Error:', error);
    }
  }

  // Example 2: Batch send
  console.log('\n=== Example 2: Batch Send ===');
  const messages = [
    {
      to: '+256701521269',
      message: 'Hello Lyee! Welcome to MsGine.',
    },
    {
      to: '+256752282506',
      message: 'Hello Carrie! MsGine Wishes you Success inyour exams. This is a check from the SDK.',
    },
    {
      to: '+256757212246',
      message: 'Hello Isaac! If you see this, the SDK is ready.',
    },
  ];

  try {
    console.log(`Sending ${messages.length} messages...`);
    const results = await client.sendSmsBatch(messages);

    console.log(`✅ Successfully sent ${results.length} messages`);
    results.forEach((result, index) => {
      console.log(`\nMessage ${index + 1}:`);
      console.log('  ID:', result.id);
      console.log('  To:', result.to.join(', '));
      console.log('  Status:', result.status);
      console.log('  Cost:', result.cost, result.currency);
    });
  } catch (error) {
    console.error('❌ Batch send failed:', error);
  }

  // Example 3: Validation
  console.log('\n=== Example 3: Validation ===');
  try {
    await client.sendSms({
      to: '', // Invalid: empty phone number
      message: 'This will fail validation',
    });
  } catch (error) {
    if (error instanceof MsGineValidationError) {
      console.log('✅ Validation caught the error:');
      console.log('Message:', error.message);
      error.errors.issues.forEach((issue) => {
        console.log(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
    }
  }

  // Example 4: Message too long
  console.log('\n=== Example 4: Message Length Validation ===');
  try {
    await client.sendSms({
      to: '+256701521269',
      message: 'a'.repeat(1601), // Too long
    });
  } catch (error) {
    if (error instanceof MsGineValidationError) {
      console.log('✅ Validation caught the error:');
      console.log('Message:', error.message);
    }
  }

  // Example 5: Custom retry behavior
  console.log('\n=== Example 5: Custom Retry Configuration ===');
  const clientWithRetry = new MsGineClient({
    apiToken: env.MSGINE_API_TOKEN,
    retry: {
      maxRetries: 2,
      initialDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 3,
      retryableStatusCodes: [429, 500, 502, 503, 504],
    },
  });

  console.log('Client configured with custom retry logic');
  console.log('  Max retries: 2');
  console.log('  Initial delay: 500ms');
  console.log('  Backoff multiplier: 3x');
}

main().catch(console.error);