import { NextResponse } from 'next/server';
import { guardRequest } from '@/lib/api-guard';
import { getStripcashPerformers } from '@/lib/stripcash';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  const denied = guardRequest(req);
  if (denied) return denied;
  return NextResponse.json(getStripcashPerformers(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
