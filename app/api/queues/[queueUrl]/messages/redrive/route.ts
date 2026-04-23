import { redriveMessage } from '@/app/lib/sqs';
import { NextRequest, NextResponse } from 'next/server';

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
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? `Failed to redrive message: ${error.message}`
        : 'Failed to redrive message';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
