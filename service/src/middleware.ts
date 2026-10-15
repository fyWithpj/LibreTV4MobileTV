import { NextRequest, NextResponse } from 'next/server';

/** 老的 /live?url=https://... 分享链接也强制走本机直播代理。 */
export function middleware(request: NextRequest) {
  const streamUrl = request.nextUrl.searchParams.get('url')?.trim();
  if (!streamUrl || !/^https?:\/\//i.test(streamUrl)) return NextResponse.next();

  const nextUrl = request.nextUrl.clone();
  nextUrl.searchParams.set('url', `/api/live/stream?url=${encodeURIComponent(streamUrl)}`);
  return NextResponse.rewrite(nextUrl);
}

export const config = { matcher: ['/live'] };
