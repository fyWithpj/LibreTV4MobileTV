export function isTvInput() {
  if (typeof navigator === 'undefined') return false;
  return /TV|MiBOX|MiTV|AFT|Leanback/i.test(navigator.userAgent)
    || (/Android/i.test(navigator.userAgent) && /wv/i.test(navigator.userAgent));
}
