import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_AI === 'true';

// Initialize AWS Bedrock client
const client = USE_MOCK
  ? null
  : new BedrockRuntimeClient({
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
      },
    });

// Use cross-region inference profile (required for newer Claude models)
// Claude Sonnet 4.5 (September 2025) - Latest model
const MODEL_ID =
  import.meta.env.VITE_BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BedrockRequest {
  messages: BedrockMessage[];
  max_tokens?: number;
  temperature?: number;
  system?: string;
}

export interface BedrockResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Call AWS Bedrock Claude Sonnet 4.5
 */
export async function callBedrock(
  request: BedrockRequest
): Promise<string> {
  if (USE_MOCK || !client) {
    throw new Error(
      'AWS Bedrock is not configured. Set VITE_USE_MOCK_AI=false and provide AWS credentials in .env'
    );
  }

  try {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: request.max_tokens || 4096,
      temperature: request.temperature || 0.7,
      messages: request.messages,
      ...(request.system && { system: request.system }),
    };

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(
      new TextDecoder().decode(response.body)
    ) as BedrockResponse;

    if (!responseBody.content || responseBody.content.length === 0) {
      throw new Error('Empty response from Bedrock');
    }

    // Check if response was truncated due to max_tokens limit
    if (responseBody.stop_reason === 'max_tokens') {
      console.warn('Response was truncated due to max_tokens limit');
      console.warn(`Input tokens: ${responseBody.usage.input_tokens}, Output tokens: ${responseBody.usage.output_tokens}`);
      // Still return the text - the caller will handle truncation
    }

    return responseBody.content[0].text;
  } catch (error) {
    console.error('Bedrock API Error:', error);
    throw new Error(
      `Failed to call Bedrock: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if AWS Bedrock is configured
 */
export function isBedrockConfigured(): boolean {
  if (USE_MOCK) return false;

  const hasCredentials =
    import.meta.env.VITE_AWS_ACCESS_KEY_ID &&
    import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;

  return !!hasCredentials;
}
