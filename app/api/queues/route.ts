import { NextResponse } from 'next/server';
import { listQueues, getQueueAttributes } from '@/app/lib/sqs';
import { authUserEmail } from '@/app/lib/auth';
import { getAllowedQueueNamePatternsByEmail } from '@/app/lib/config';

export async function GET(request: Request) {
  try {
    const email = await authUserEmail();

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queueNamePatterns = getAllowedQueueNamePatternsByEmail(email);
    if (queueNamePatterns.length === 0) {
      return NextResponse.json({ items: [], nextToken: undefined });
    }

    const { searchParams } = new URL(request.url);
    const nextToken = searchParams.get('nextToken') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 100);

    const { items: queues, nextToken: newNextToken } = await listQueues(
      nextToken,
      limit,
      queueNamePatterns,
    );

    // Get attributes for each queue
    const queuesWithAttributes = await Promise.all(
      queues.map(async (queue) => {
        const attributes = await getQueueAttributes(queue.url);
        return {
          ...queue,
          attributes,
        };
      }),
    );

    return NextResponse.json({
      items: queuesWithAttributes,
      nextToken: newNextToken,
    });
  } catch (error) {
    console.error('Error in /api/queues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queues' },
      { status: 500 },
    );
  }
}
