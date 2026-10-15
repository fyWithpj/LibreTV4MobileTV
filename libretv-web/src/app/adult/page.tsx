import { Header } from '@/components/header';
import { SiteFooter } from '@/components/site-footer';
import AdultPerformerList from '@/components/adult/performer-list';
import { getStripcashPlayerConfig } from '@/lib/stripcash';

export const dynamic = 'force-dynamic';

export default function AdultPage() {
  const { playerUrl, allowedHosts } = getStripcashPlayerConfig();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">18+ 成人内容</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-content">成人直播</h1>
          <p className="text-sm text-muted leading-relaxed">
            频道流来自本机配置的 HLS 列表，在线状态与可播放性由上游提供方决定。官方 Stripcash 播放器仍可在播放器区域切换使用。
          </p>
        </header>
        <AdultPerformerList initialPlayerUrl={playerUrl} allowedHosts={allowedHosts} />
      </main>
      <SiteFooter />
    </div>
  );
}
