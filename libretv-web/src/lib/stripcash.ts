import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseM3u } from './m3u-parser';

export type StripcashPerformer = {
  id: string;
  name: string;
  category: string;
  status: 'online' | 'offline' | 'demo' | 'thirdparty';
  playerUrl?: string;
  streamUrl?: string;
  logo?: string;
};

export type StripcashPerformerResponse = {
  performers: StripcashPerformer[];
  demo: boolean;
  configInvalid?: boolean;
};

const DEFAULT_PLAYER_HOSTS = ['stripchat.com', 'stripcash.com'];
const ADULT_HLS_HOSTS = new Set<string>();
const ADULT_LIVE_M3U_PATH = join(process.cwd(), 'config', 'adult-live.m3u');

function isHostnameRoot(value: string): boolean {
  if (value.length > 253 || value.includes(':') || value.includes('/') || value.includes('*')) return false;
  const labels = value.split('.');
  return labels.length >= 2 && labels.every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)
  );
}

export function isAllowedStripcashPlayerUrl(input: unknown, allowedHosts: string[] = DEFAULT_PLAYER_HOSTS): input is string {
  if (typeof input !== 'string' || !input.trim()) return false;
  try {
    const url = new URL(input.trim());
    const host = url.hostname.toLowerCase();
    const allowed = allowedHosts.some((root) => {
      const normalized = root.trim().toLowerCase();
      return host === normalized || host.endsWith('.' + normalized);
    });
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && allowed;
  } catch {
    return false;
  }
}

export function getStripcashPlayerConfig(): { playerUrl: string; allowedHosts: string[] } {
  const extraHosts = (process.env.STRIPCASH_PLAYER_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(isHostnameRoot);
  const allowedHosts = [...new Set([...DEFAULT_PLAYER_HOSTS, ...extraHosts])];
  const configuredUrl = (process.env.STRIPCASH_PLAYER_URL || '').trim();
  return {
    playerUrl: isAllowedStripcashPlayerUrl(configuredUrl, allowedHosts) ? configuredUrl : '',
    allowedHosts,
  };
}

const DEMO_PERFORMERS: StripcashPerformer[] = [
  { id: 'demo-a', name: '主播 A', category: '示例分类', status: 'demo' },
  { id: 'demo-b', name: '主播 B', category: '示例分类', status: 'demo' },
  { id: 'demo-c', name: '主播 C', category: '示例分类', status: 'demo' },
];

function shortText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function isAllowedAdultHlsUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      ADULT_HLS_HOSTS.has(url.hostname.toLowerCase()) &&
      url.pathname.toLowerCase().endsWith('.m3u8');
  } catch {
    return false;
  }
}

function getConfiguredAdultChannels(): { channels: StripcashPerformer[]; invalid: boolean } {
  try {
    const content = readFileSync(ADULT_LIVE_M3U_PATH, 'utf8');
    const channels = parseM3u(content).flatMap((channel) => {
      if (!isAllowedAdultHlsUrl(channel.url)) return [];
      return [{
        id: channel.id,
        name: channel.name,
        category: channel.group || '成人直播',
        status: 'thirdparty' as const,
        streamUrl: channel.url,
        logo: channel.logo,
      }];
    });
    return { channels, invalid: false };
  } catch {
    return { channels: [], invalid: true };
  }
}

export function getStripcashPerformers(): StripcashPerformerResponse {
  const raw = process.env.STRIPCASH_PERFORMERS_JSON;
  const configuredChannels = getConfiguredAdultChannels();
  if (!raw?.trim()) {
    if (configuredChannels.channels.length > 0) {
      return { performers: configuredChannels.channels, demo: false, configInvalid: configuredChannels.invalid };
    }
    return { performers: DEMO_PERFORMERS, demo: true, configInvalid: configuredChannels.invalid };
  }
  if (raw.length > 64_000) {
    return {
      performers: configuredChannels.channels.length ? configuredChannels.channels : DEMO_PERFORMERS,
      demo: configuredChannels.channels.length === 0,
      configInvalid: true,
    };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return {
        performers: configuredChannels.channels.length ? configuredChannels.channels : DEMO_PERFORMERS,
        demo: configuredChannels.channels.length === 0,
        configInvalid: true,
      };
    }
    const allowedHosts = getStripcashPlayerConfig().allowedHosts;
    const performers: StripcashPerformer[] = parsed.slice(0, 100).flatMap((entry, index) => {
      if (typeof entry !== 'object' || entry === null) return [];
      const item = entry as Record<string, unknown>;
      const id = shortText(item.id, 80) || 'performer-' + index;
      const name = shortText(item.name, 80);
      const category = shortText(item.category, 60) || '未分类';
      if (!name) return [];
      const status = item.online === true || item.status === 'online'
        ? 'online'
        : item.status === 'offline'
          ? 'offline'
          : 'demo';
      const playerUrl = isAllowedStripcashPlayerUrl(item.playerUrl, allowedHosts)
        ? item.playerUrl.trim()
        : undefined;
      return [{ id, name, category, status, playerUrl }];
    });
    const combined = [...performers, ...configuredChannels.channels];
    return {
      performers: combined.length ? combined : DEMO_PERFORMERS,
      demo: combined.length === 0,
      configInvalid: configuredChannels.invalid || undefined,
    };
  } catch {
    return {
      performers: configuredChannels.channels.length ? configuredChannels.channels : DEMO_PERFORMERS,
      demo: configuredChannels.channels.length === 0,
      configInvalid: true,
    };
  }
}
