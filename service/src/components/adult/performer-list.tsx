"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth';
import { useAppStore } from '@/lib/store';
import { LivePlayer } from '@/components/live-player';
import OfficialPlayer from './official-player';
import type { StripcashPerformer, StripcashPerformerResponse } from '@/lib/stripcash';
import { LIVE_STREAM_BASE } from '@/lib/m3u8';

const AGE_KEY = 'libretv-adult-age-confirmed';
const PLAYER_KEY = 'libretv-stripcash-player-url';
function isAllowedPlayerUrl(value: string, allowedHosts: string[]): boolean {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      allowedHosts.some((root) => {
        const domain = root.toLowerCase();
        return host === domain || host.endsWith('.' + domain);
      })
    );
  } catch {
    return false;
  }
}

export default function AdultPerformerList({
  initialPlayerUrl,
  allowedHosts,
}: {
  initialPlayerUrl: string;
  allowedHosts: string[];
}) {
  const yellowFilter = useAppStore((state) => state.yellowFilter);
  const { openLogin } = useAuth();
  const [gateReady, setGateReady] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [performers, setPerformers] = useState<StripcashPerformer[]>([]);
  const [demo, setDemo] = useState(false);
  const [configInvalid, setConfigInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部分类');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [playerUrl, setPlayerUrl] = useState(initialPlayerUrl);
  const [playerUrlDraft, setPlayerUrlDraft] = useState(initialPlayerUrl);
  const [playerError, setPlayerError] = useState('');
  const [playerMode, setPlayerMode] = useState<'channels' | 'official'>('channels');
  const [reloadKey, setReloadKey] = useState(0);
  const channelPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      setAgeConfirmed(window.localStorage.getItem(AGE_KEY) === 'yes');
      const favoriteRaw = window.localStorage.getItem('libretv-adult-favorites');
      if (favoriteRaw) {
        const saved = JSON.parse(favoriteRaw);
        if (Array.isArray(saved)) setFavorites(saved.filter((item) => typeof item === 'string').slice(0, 300));
      }
      const savedPlayer = window.localStorage.getItem(PLAYER_KEY);
      if (savedPlayer && isAllowedPlayerUrl(savedPlayer, allowedHosts)) {
        setPlayerUrl(savedPlayer);
        setPlayerUrlDraft(savedPlayer);
      }
    } catch {
      // 存储不可用时保留当前页默认状态。
    }
    setGateReady(true);
  }, [allowedHosts]);

  useEffect(() => {
    if (yellowFilter || !ageConfirmed) return;
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    fetch('/api/adult/performers', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401 || response.status === 503) {
          openLogin();
          throw new Error(response.status === 401 ? '请先登录 LibreTV' : '服务端登录密码未配置');
        }
        if (!response.ok) throw new Error('主播列表暂时不可用');
        return (await response.json()) as StripcashPerformerResponse;
      })
      .then((result) => {
        if (cancelled) return;
        setPerformers(Array.isArray(result.performers) ? result.performers : []);
        setDemo(result.demo === true);
        setConfigInvalid(result.configInvalid === true);
        setSelectedId((current) => current || result.performers?.[0]?.id || '');
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : '主播列表加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [yellowFilter, ageConfirmed, openLogin, reloadKey]);

  const categories = useMemo(
    () => ['全部分类', ...new Set(performers.map((performer) => performer.category).filter(Boolean))],
    [performers]
  );
  const filteredPerformers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return performers.filter((performer) => {
      const matchesSearch =
        !query ||
        performer.name.toLocaleLowerCase().includes(query) ||
        performer.category.toLocaleLowerCase().includes(query);
      const matchesCategory = category === '全部分类' || performer.category === category;
      const matchesFavorite = !favoritesOnly || favorites.includes(performer.id);
      return matchesSearch && matchesCategory && matchesFavorite;
    });
  }, [performers, search, category, favoritesOnly, favorites]);
  const selected = performers.find((performer) => performer.id === selectedId);
  const activePlayerUrl = selected?.playerUrl || playerUrl;

  const confirmAge = () => {
    try {
      window.localStorage.setItem(AGE_KEY, 'yes');
    } catch {
      // 存储不可用时本次访问仍有效。
    }
    setAgeConfirmed(true);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try {
        window.localStorage.setItem('libretv-adult-favorites', JSON.stringify(next));
      } catch {
        // 当前会话内仍保留收藏状态。
      }
      return next;
    });
  };

  const savePlayerUrl = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = playerUrlDraft.trim();
    if (!isAllowedPlayerUrl(value, allowedHosts)) {
      setPlayerError('只接受 HTTPS 的 Stripchat / Stripcash 官方域名，或服务端明确加入白名单的域名。');
      return;
    }
    setPlayerError('');
    setPlayerUrl(value);
    try {
      window.localStorage.setItem(PLAYER_KEY, value);
    } catch {
      // 当前页面仍可播放，刷新后需重新粘贴。
    }
  };

  const resetPlayerUrl = () => {
    try {
      window.localStorage.removeItem(PLAYER_KEY);
    } catch {
      // 忽略存储异常。
    }
    setPlayerUrl(initialPlayerUrl);
    setPlayerUrlDraft(initialPlayerUrl);
    setPlayerError('');
  };

  if (yellowFilter) {
    return (
      <section className="card p-6 sm:p-8 space-y-3">
        <h2 className="text-lg font-semibold text-content">成人专区默认隐藏</h2>
        <p className="text-sm text-muted leading-relaxed">
          当前“成人内容过滤”已开启。请在右上角“设置”中关闭该过滤，成人直播入口才会显示。
        </p>
      </section>
    );
  }

  if (!gateReady) return <div className="card p-8 text-sm text-muted">正在读取访问确认…</div>;

  if (!ageConfirmed) {
    return (
      <section className="card max-w-xl mx-auto p-6 sm:p-8 space-y-5" role="dialog" aria-modal="true" aria-labelledby="adult-age-title">
        <span className="tag bg-warning/15 text-warning">18+</span>
        <h2 id="adult-age-title" className="text-xl font-semibold text-content">进入成人专区前请确认年龄</h2>
        <p className="text-sm text-muted leading-relaxed">
          此专区可能包含成人内容。继续即表示你确认已达到所在地法律规定的成人年龄，并同意自行承担访问责任。
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={confirmAge}>我已达到法定成人年龄</button>
          <Link className="btn-ghost" href="/">离开专区</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <label className="flex-1 space-y-1.5">
            <span className="text-xs text-muted">搜索主播或分类</span>
            <input className="input w-full" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="输入名称或分类" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-muted">分类</span>
            <select className="input w-full lg:min-w-44" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button type="button" className={favoritesOnly ? 'btn-primary' : 'btn-ghost'} onClick={() => setFavoritesOnly((value) => !value)}>
            {favoritesOnly ? '显示全部' : '只看收藏'} · {favorites.length}
          </button>
        </div>
        {demo && <p className="text-xs text-warning">布局示意，非真实主播信息或可播放预览。</p>}
        {configInvalid && <p className="text-xs text-warning">主播列表配置格式无效，当前显示示例卡片。</p>}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(13rem,0.8fr)_minmax(0,1.7fr)] gap-5 items-start">
        <section
          ref={channelPanelRef}
          className="card flex h-[70vh] min-h-[22rem] max-h-[46rem] min-w-0 flex-col p-4"
          onKeyDown={(event) => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
            const target = event.target instanceof HTMLElement ? event.target : null;
            const article = target?.closest('article');
            const current = target?.closest<HTMLButtonElement>('[data-performer-select]')
              ?? article?.querySelector<HTMLButtonElement>('[data-performer-select]')
              ?? null;
            const items = Array.from(channelPanelRef.current?.querySelectorAll<HTMLButtonElement>('[data-performer-select]') ?? []);
            const index = current ? items.indexOf(current) : -1;
            const nextIndex = index < 0
              ? (event.key === 'ArrowDown' ? 0 : -1)
              : index + (event.key === 'ArrowDown' ? 1 : -1);
            const next = items[nextIndex];
            if (!next) return;
            event.preventDefault();
            next.focus({ preventScroll: true });
            next.scrollIntoView({ block: 'nearest' });
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-content">直播频道 / 主播</h2>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}>
              {loading ? '加载中…' : '刷新'}
            </button>
          </div>
          {loadError && <p className="text-sm text-danger">{loadError}</p>}
          {!loading && filteredPerformers.length === 0 && (
            <p className="py-6 text-sm text-muted">{performers.length ? '没有匹配的主播' : '暂无主播数据'}</p>
          )}
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
            {filteredPerformers.map((performer) => {
              const active = selectedId === performer.id;
              const isFavorite = favorites.includes(performer.id);
              return (
                <article key={performer.id} className={'rounded-lg border p-3 flex items-center gap-2 ' + (active ? 'border-accent bg-hover' : 'border-line bg-card')}>
                  <button type="button" data-performer-select className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent" onClick={() => setSelectedId(performer.id)}>
                    <span className="block truncate font-medium text-content">{performer.name}</span>
                    <span className="mt-1 block text-xs text-muted">{performer.category}</span>
                    <span className="mt-2 inline-flex text-[11px] rounded-full px-2 py-0.5 bg-chip text-muted">
                      {performer.status === 'online'
                        ? '在线'
                        : performer.status === 'offline'
                          ? '离线'
                          : performer.status === 'thirdparty'
                            ? '第三方 HLS'
                            : '在线示例'}
                    </span>
                  </button>
                  <button type="button" className="p-2 rounded-md text-warning hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={isFavorite ? '取消收藏' : '加入收藏'} onClick={() => toggleFavorite(performer.id)}>
                    {isFavorite ? '★' : '☆'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="card p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-content">成人直播播放器</h2>
              <p className="mt-1 text-xs text-muted">选择频道播放用户配置的 HLS 源，或切换到 Stripcash 官方嵌入播放器。</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className={playerMode === 'channels' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => setPlayerMode('channels')}>频道流</button>
              <button type="button" className={playerMode === 'official' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => setPlayerMode('official')}>官方播放器</button>
            </div>
          </div>
          {playerMode === 'official' && (
            <form className="flex flex-col sm:flex-row gap-2" onSubmit={savePlayerUrl}>
              <input
                type="url"
                className="input min-w-0 flex-1"
                value={playerUrlDraft}
                onChange={(event) => setPlayerUrlDraft(event.target.value)}
                placeholder="https://stripchat.com/…"
                aria-label="官方播放器地址"
              />
              <button type="submit" className="btn-primary">加载播放器</button>
              <button type="button" className="btn-ghost" onClick={resetPlayerUrl}>恢复服务配置</button>
            </form>
          )}
          {playerError && playerMode === 'official' && <p role="alert" className="text-sm text-danger">{playerError}</p>}
          {playerMode === 'channels' && selected?.streamUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <LivePlayer
                key={selected.id}
                url={selected.streamUrl.startsWith('/api/live/stream')
                  ? selected.streamUrl
                  : `${LIVE_STREAM_BASE}${encodeURIComponent(selected.streamUrl)}`}
                title={selected.name}
              />
            </div>
          ) : playerMode === 'official' && activePlayerUrl ? (
            <OfficialPlayer playerUrl={activePlayerUrl} allowedHosts={allowedHosts} />
          ) : (
            <div className="aspect-video w-full rounded-lg border border-line bg-black/30 grid place-items-center p-6 text-center">
              <p className="max-w-lg text-sm text-muted">
                {playerMode === 'channels'
                  ? '请选择一个带 HLS 地址的频道。频道源来自 config/adult-live.m3u。'
                  : '尚未配置官方播放器。登录 Stripcash 后台，在 Links & Creatives → Widgets → Universal 生成并复制 iframe 的 src 地址，再粘贴到上方。后台生成链接因账号权限而异，本页不会猜测或拼造地址。'}
              </p>
            </div>
          )}
          {playerMode === 'official' && (
            <p className="text-xs text-muted leading-relaxed">
              若播放器空白，可能是该创意不允许嵌入，或上游通过 CSP / X-Frame-Options 禁止 iframe。请使用后台明确允许嵌入的官方地址。
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
