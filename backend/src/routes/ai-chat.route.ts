import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { streamDeepseekChat } from '../lib/AI/DeepseekAPI';
import type { ChatMessage } from '../lib/AI/DeepseekAPI';
import VerifyToken from '@middlewars/VerifyToken';

const AIChatRoute = new Hono();

const ChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
});

AIChatRoute.use('/*', VerifyToken());

AIChatRoute.post('/chat', zValidator('json', ChatSchema), async (ctx) => {
  const body = ctx.req.valid('json');
  const user = ctx.get('user');

  try {
    const messages: ChatMessage[] = body.messages;
    if (!messages.some((m) => m.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: 'You are a helpful AI assistant.',
      });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        for await (const chunk of streamDeepseekChat(messages)) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        }

        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
      } catch (error) {
        console.error('Streaming error:', error);
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ error: 'An error occurred' })}\n\n`)
        );
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return ctx.json(
      {
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

AIChatRoute.post('/reset', async (ctx) => {
  return ctx.json({ message: 'Chat history reset successfully' });
});

export default AIChatRoute;
