import { NextRequest, NextResponse } from 'next/server';
import { redriveMessage } from '@/app/lib/sqs';
import { authUserEmail } from '@/app/lib/auth';
import { canAccessQueue } from '@/app/lib/permission';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ queueUrl: string }> },
) {
  try {
    const email = await authUserEmail();

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const decodedQueueUrl = Buffer.from(params.queueUrl, 'base64').toString(
      'utf-8',
    );

    if (!canAccessQueue(decodedQueueUrl, email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { messageId, targetQueueUrl } = await request.json();

    if (!messageId || typeof messageId !== 'string') {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 },
      );
    }

    if (!targetQueueUrl || typeof targetQueueUrl !== 'string') {
      return NextResponse.json(
        { error: 'Target queue URL is required' },
        { status: 400 },
      );
    }

    if (!canAccessQueue(targetQueueUrl, email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await redriveMessage(decodedQueueUrl, targetQueueUrl, messageId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to redrive message' },
      { status: 500 },
    );
  }
}
