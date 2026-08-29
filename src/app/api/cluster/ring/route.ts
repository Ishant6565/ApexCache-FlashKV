import { NextResponse } from 'next/server';
import { ConsistentHashRing } from '@/lib/engine/consistent-hashing';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { testKey, newNodeId } = body;

    const storageNodes = await prisma.storageNode.findMany();
    const ring = new ConsistentHashRing(128);

    storageNodes.forEach((n) => ring.addNode(n.nodeId));

    let keyRouting = null;
    if (testKey) {
      keyRouting = ring.getNode(testKey);
    }

    let rehashImpact = null;
    if (newNodeId) {
      const sampleKeys = [
        'sess:usr_1001',
        'sess:usr_2048',
        'sess:usr_3902',
        'prod:item_99',
        'prod:item_102',
        'rate:ip_192_168_1_1',
        'rate:ip_10_0_0_5',
        'user:profile:99',
        'user:cart:442',
        'order:tx_8819',
      ];
      rehashImpact = ring.calculateRehashImpact(newNodeId, sampleKeys);
    }

    return NextResponse.json({
      success: true,
      ringOverview: ring.getRingOverview(),
      keyRouting,
      rehashImpact,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Ring calculation failed' }, { status: 500 });
  }
}
