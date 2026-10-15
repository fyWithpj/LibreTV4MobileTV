import { NextResponse } from 'next/server';
import { guardRequest } from '@/lib/api-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 更新检测在服务端访问固定的 GitHub API 地址，避免浏览器直接连外网。 */
export async function GET(req: Request) {
  const guarded = guardRequest(req);
  if (guarded) return guarded;

  try {
    const response = await fetch('https://api.github.com/repos/LibreSpark/LibreTV/tags?per_page=1', {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'LibreTV',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return NextResponse.json({ error: `GitHub 返回 ${response.status}` }, { status: 502 });
    }
    return NextResponse.json(await response.json(), {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '更新检查失败' },
      { status: 502 }
    );
  }
}
