import { MsGineClient } from '@msgine/sdk';
import {loadEnv} from "dotenv-gad"
import schema from "./env.schema"

// Load environment variables
const env = loadEnv(schema)

async function main() {
  // Create client
  const client = new MsGineClient({
    apiToken: env.MSGINE_API_TOKEN,
  });

  try {
    // Send a single SMS
    console.log('Sending SMS...');
    const result = await client.sendSms({
      to: '+256701521269',
      message: 'Hello from MsGine SDK!',
    });

    console.log('✅ SMS sent successfully!');
    console.log('Message ID:', result.id);
    console.log('Status:', result.status);
    console.log('Recipients:', result.to);
    console.log('Cost:', result.cost, result.currency);
    console.log('Timestamp:', result.createdAt);
  } catch (error) {
    console.error('❌ Failed to send SMS:', error);
  }
}

main().catch(console.error);