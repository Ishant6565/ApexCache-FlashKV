import { NextResponse } from 'next/server';
import { LsmTreeEngine } from '@/lib/engine/lsm-tree';

export async function POST() {
  try {
    const result = await LsmTreeEngine.compact();
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Compaction failed' }, { status: 500 });
  }
}
