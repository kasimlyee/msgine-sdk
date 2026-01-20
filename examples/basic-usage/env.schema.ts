import { defineSchema } from 'dotenv-gad';

export default defineSchema({
  // Add your environment variables here
  MSGINE_API_TOKEN: {
    type: 'string',
    required: true,
    docs: 'Your Msgine API token',
    sensitive: true,
  },
});
