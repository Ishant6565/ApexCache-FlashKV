import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const keyspaces = await prisma.keyspace.findMany({
      include: {
        entries: {
          orderBy: { lastAccessedAt: 'desc' },
          take: 50,
        },
      },
    });

    const totalEntries = await prisma.kvEntry.count();
    const memtableEntries = await prisma.kvEntry.count({ where: { sstableLevel: 'MEMTABLE' } });
    const l0Entries = await prisma.kvEntry.count({ where: { sstableLevel: 'L0' } });
    const l1Entries = await prisma.kvEntry.count({ where: { sstableLevel: 'L1' } });
    const tombstoneEntries = await prisma.kvEntry.count({ where: { isTombstone: true } });

    return NextResponse.json({
      keyspaces,
      stats: {
        totalEntries,
        memtableEntries,
        l0Entries,
        l1Entries,
        tombstoneEntries,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
