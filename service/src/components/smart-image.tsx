'use client';

import { useEffect, useState } from 'react';

interface SmartImageProps {
  /** 原始图片地址（未经代理加工，降级链由本组件按加载方式生成） */
  url?: string;
  mode: 'direct' | 'proxy' | 'custom';
  customProxy?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  /** 候选链耗尽后回调，调用方切换占位图等兜底 UI */
  onExhausted?: () => void;
}

/**
 * 封面图统一经本站代理加载，避免浏览器绕过 LibreTV 服务直连外网。
 * 代理失败后触发 onExhausted 并停止渲染，由调用方展示占位图。
 * referrerPolicy=no-referrer：不向图床暴露来源页。
 */
export function SmartImage({
  url,
  alt,
  className,
  loading = 'lazy',
  onExhausted,
}: SmartImageProps) {
  // 所有图片均由本站服务端获取；保留 mode/customProxy props 仅为兼容调用处。
  const candidates = url
    ? [url.startsWith('/api/proxy') ? url : `/api/proxy?url=${encodeURIComponent(url)}`]
    : [];
  const [idx, setIdx] = useState(0);

  // 地址变化时重置加载进度
  useEffect(() => setIdx(0), [url]);
  useEffect(() => {
    if (idx >= candidates.length) onExhausted?.();
    // 候选数组随 url/mode 变化，length 是充分的稳定信号
  }, [idx, candidates.length, onExhausted]);

  const src = candidates[idx];
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setIdx((i) => i + 1)}
    />
  );
}
