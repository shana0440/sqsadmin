import { NextRequest, NextResponse } from 'next/server';
import { getQueueAttributes, listDeadLetterSourceQueues } from '@/app/lib/sqs';
import { authUserEmail } from '@/app/lib/auth';
import { canAccessQueue } from '@/app/lib/permission';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ queueUrl: string }> },
) {
  try {
    const email = await authUserEmail();

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // The queueUrl will be base64 encoded since it contains special characters
    const params = await context.params;
    const decodedQueueUrl = Buffer.from(params.queueUrl, 'base64').toString(
      'utf-8',
    );

    if (!canAccessQueue(decodedQueueUrl, email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get queue attributes
    const attributes = await getQueueAttributes(decodedQueueUrl);
    const deadLetterSourceQueues =
      await listDeadLetterSourceQueues(decodedQueueUrl);

    // Extract queue name from URL
    const name = decodedQueueUrl.split('/').pop() || decodedQueueUrl;

    return NextResponse.json({
      url: decodedQueueUrl,
      name,
      attributes,
      deadLetterSourceQueues,
    });
  } catch (error) {
    console.error('Error in GET /api/queues/[queueUrl]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue details' },
      { status: 500 },
    );
  }
}
