"use client";

type Props = { playerUrl: string; allowedHosts: string[] };

function parseOfficialPlayerUrl(playerUrl: string, allowedHosts: string[]): string | null {
  try {
    const url = new URL(playerUrl.trim());
    const host = url.hostname.toLowerCase();
    const allowed = allowedHosts.some((root) => {
      const domain = root.trim().toLowerCase();
      return host === domain || host.endsWith("." + domain);
    });
    if (url.protocol !== "https:" || url.username || url.password || url.port || !allowed) return null;
    return url.href;
  } catch {
    return null;
  }
}

export default function OfficialPlayer({ playerUrl, allowedHosts }: Props) {
  const safeUrl = parseOfficialPlayerUrl(playerUrl, allowedHosts);
  if (!safeUrl) {
    return (
      <div className="aspect-video w-full rounded-lg border border-line bg-black/30 grid place-items-center p-6 text-center">
        <p className="text-sm text-muted">播放器地址无效或来源未获准。请使用 Stripcash 后台生成的 HTTPS 播放器链接。</p>
      </div>
    );
  }
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe
        src={safeUrl}
        title="Stripchat 官方播放器"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
