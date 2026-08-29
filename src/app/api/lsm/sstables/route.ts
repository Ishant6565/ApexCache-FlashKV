import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const sstables = await prisma.sstableFile.findMany({
      orderBy: [{ level: 'asc' }, { createdAt: 'desc' }],
    });

    const walLogs = await prisma.walLogEntry.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json({
      sstables,
      walLogs,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
