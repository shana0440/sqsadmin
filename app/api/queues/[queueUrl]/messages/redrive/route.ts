import { NextRequest, NextResponse } from 'next/server';
import { redriveMessage } from '@/app/lib/sqs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ queueUrl: string }> },
) {
  try {
    const params = await context.params;
    const decodedQueueUrl = Buffer.from(params.queueUrl, 'base64').toString(
      'utf-8',
    );

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

    await redriveMessage(decodedQueueUrl, targetQueueUrl, messageId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to redrive message' },
      { status: 500 },
    );
  }
}
