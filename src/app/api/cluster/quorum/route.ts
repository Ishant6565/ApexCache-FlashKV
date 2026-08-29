import { NextResponse } from 'next/server';
import { RaftClusterEngine } from '@/lib/engine/raft-cluster';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { readQuorum, writeQuorum, replicationFactor } = body;

    const status = await RaftClusterEngine.getClusterStatus({
      readQuorum: readQuorum ? Number(readQuorum) : 2,
      writeQuorum: writeQuorum ? Number(writeQuorum) : 2,
      replicationFactor: replicationFactor ? Number(replicationFactor) : 3,
    });

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Quorum status failed' }, { status: 500 });
  }
}
