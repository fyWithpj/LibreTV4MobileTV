function isListModeSource(sourceUrl: string): boolean {
  const configuredHosts = (process.env.LIST_MODE_SOURCE_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  try {
    const hostname = new URL(sourceUrl).hostname.toLowerCase();
    return configuredHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function getApiUrl(sourceUrl: string): URL {
  const url = new URL(sourceUrl.replace(/\/+$/, ''));
  // Hosts in LIST_MODE_SOURCE_HOSTS use the list-style CMS API.
  if (isListModeSource(sourceUrl)) url.protocol = 'https:';
  return url;
}

export function buildCmsSearchUrl(sourceUrl: string, keyword: string, page: number): string {
  const listMode = isListModeSource(sourceUrl);
  const url = getApiUrl(sourceUrl);
  url.searchParams.set('ac', listMode ? 'list' : 'videolist');
  url.searchParams.set('wd', keyword);
  url.searchParams.set('pg', String(page));
  return url.toString();
}

export function buildCmsDetailUrl(sourceUrl: string, id: string): string {
  const listMode = isListModeSource(sourceUrl);
  const url = getApiUrl(sourceUrl);
  url.searchParams.set('ac', listMode ? 'detail' : 'videolist');
  url.searchParams.set('ids', id);
  return url.toString();
}