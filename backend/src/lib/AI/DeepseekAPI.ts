export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DeepseekResponse {
  choices: Array<{
    delta?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
}

export async function* streamDeepseekChat(messages: ChatMessage[]): AsyncGenerator<string> {
  try {
    const response = await fetch(Bun.env.DEEPSEEK_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Bun.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        stream: true,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Deepseek API error: ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed: DeepseekResponse = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;

            if (content) {
              yield content;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }
  } catch (error) {
    console.error('Deepseek API error:', error);
    throw error;
  }
}
