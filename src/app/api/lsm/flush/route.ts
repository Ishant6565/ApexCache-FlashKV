import { NextResponse } from 'next/server';
import { LsmTreeEngine } from '@/lib/engine/lsm-tree';

export async function POST() {
  try {
    const result = await LsmTreeEngine.flushMemTable();
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Flush failed' }, { status: 500 });
  }
}
