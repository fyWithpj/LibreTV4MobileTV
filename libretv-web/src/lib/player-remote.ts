import type Artplayer from 'artplayer';
import { isTvInput } from './tv-input';
import { formatTime } from './utils';

/** D-pad controls live inside the player so they also work in webpage fullscreen. */
export function attachPlayerRemote(art: Artplayer, live = false) {
  const root = art.template.$player;
  const tv = isTvInput();
  const previousTabIndex = root.getAttribute('tabindex');
  root.tabIndex = 0;
  root.setAttribute('data-tv-player', 'true');
  root.setAttribute('aria-label', '视频播放器，按确认进入全屏');
  if (tv) art.volume = 1;
  const panel = document.createElement('div');
  panel.className = 'ltv-remote-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', '遥控器播放控制');
  const seekDisplay = document.createElement('div');
  seekDisplay.className = 'ltv-seek-display';
  seekDisplay.hidden = true;
  const seekTime = document.createElement('div');
  const seekTrack = document.createElement('div');
  seekTrack.className = 'ltv-seek-track';
  const seekFill = document.createElement('div');
  seekFill.className = 'ltv-seek-fill';
  seekTrack.append(seekFill);
  seekDisplay.append(seekTime, seekTrack);
  const style = document.createElement('style');
  style.textContent = `
    .ltv-remote-panel { position:absolute; z-index:100; left:5%; right:5%; bottom:38px;
      padding:18px; background:rgba(12,12,18,.94); border-radius:14px; color:white; }
    .ltv-remote-panel[hidden] { display:none !important; }
    .ltv-remote-row { display:flex; flex-wrap:wrap; gap:14px; justify-content:center; }
    .ltv-remote-panel button { min-width:100px; min-height:48px; padding:10px 18px;
      border:2px solid #666; border-radius:8px; color:white; background:#27272a; font-size:20px; }
    .ltv-remote-panel button:focus { outline:4px solid #60a5fa; outline-offset:3px; background:#1d4ed8; }
    .ltv-remote-help { margin:12px 0 0; text-align:center; font-size:15px; color:#d4d4d8; }
    .ltv-remote-mode .art-control-volume { display:none !important; }
    .ltv-remote-mode .art-controls { visibility:hidden; }
    .ltv-remote-mode:focus { outline:4px solid #60a5fa; outline-offset:-4px; }
    .ltv-remote-idle .art-bottom { display:none !important; opacity:0 !important; pointer-events:none !important; transition:none !important; }
    .ltv-remote-idle:focus { outline:none; }
    .ltv-seek-display { position:absolute; z-index:101; left:15%; right:15%; bottom:80px;
      background:rgba(0,0,0,.85); color:white; border-radius:12px; padding:18px 24px;
      text-align:center; font-size:26px; font-variant-numeric:tabular-nums; }
    .ltv-seek-display[hidden] { display:none !important; }
    .ltv-seek-track { height:8px; background:#555; border-radius:4px; margin-top:14px; overflow:hidden; }
    .ltv-seek-fill { height:100%; background:#60a5fa; }
  `;
  root.append(style, panel, seekDisplay);
  let visible = false;
  let settings = false;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let seekTimer: ReturnType<typeof setTimeout> | undefined;
  let seekHideTimer: ReturnType<typeof setTimeout> | undefined;
  let seekTarget: number | null = null;
  let playButton: HTMLButtonElement;
  let fullButton: HTMLButtonElement;

  const wake = () => {
    root.classList.remove('ltv-remote-idle');
    clearTimeout(idleTimer);
    if (tv && (art.fullscreenWeb || art.fullscreen)) {
      idleTimer = setTimeout(() => {
        if (!visible && seekTarget === null) root.classList.add('ltv-remote-idle');
      }, 5000);
    }
  };
  const fullscreenChanged = () => { updateLabels(); wake(); };
  const commitSeek = () => {
    if (seekTarget === null) return;
    const target = seekTarget;
    seekTarget = null;
    art.currentTime = target;
    wake();
  };

  const buttons = () => Array.from(panel.querySelectorAll<HTMLButtonElement>('button'));
  const updateLabels = () => {
    if (playButton) playButton.textContent = art.video.paused ? '播放' : '暂停';
    if (fullButton) fullButton.textContent = art.fullscreenWeb || art.fullscreen ? '退出全屏' : '全屏';
  };
  const hide = () => {
    clearTimeout(hideTimer);
    if (panel.contains(document.activeElement)) root.focus({ preventScroll: true });
    visible = false;
    panel.hidden = true;
    if (tv && (art.fullscreenWeb || art.fullscreen) && seekTarget === null) {
      clearTimeout(idleTimer);
      root.classList.add('ltv-remote-idle');
    } else wake();
  };
  const armTimer = () => {
    clearTimeout(hideTimer);
    if (!settings && !art.video.paused) hideTimer = setTimeout(hide, 5000);
  };
  const addButton = (row: HTMLElement, label: string, action: () => void) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => { action(); updateLabels(); armTimer(); });
    row.append(button);
    return button;
  };
  const toggleFullscreen = () => {
    if (art.fullscreen || art.fullscreenWeb) {
      if (art.fullscreen) art.fullscreen = false;
      if (art.fullscreenWeb) art.fullscreenWeb = false;
      hide();
      root.focus({ preventScroll: true });
      return;
    }
    art.fullscreenWeb = true;
    // ArtPlayer reparents the player into body for webpage fullscreen, losing focus.
    fullButton.focus({ preventScroll: true });
  };
  const render = () => {
    panel.replaceChildren();
    const row = document.createElement('div');
    row.className = 'ltv-remote-row';
    panel.append(row);
    if (settings) {
      for (const rate of [0.75, 1, 1.25, 1.5, 2]) {
        addButton(row, `${rate} 倍速`, () => {
          art.playbackRate = rate;
          art.notice.show = `${rate} 倍速`;
        });
      }
      for (const ratio of ['default', '16:9', '4:3'] as const) {
        addButton(row, ratio === 'default' ? '原始比例' : ratio, () => {
          art.aspectRatio = ratio;
          art.notice.show = ratio === 'default' ? '原始比例' : ratio;
        });
      }
      addButton(row, '返回控制栏', () => { settings = false; render(); buttons()[0]?.focus(); });
    } else {
      playButton = addButton(row, '播放/暂停', () => { art.toggle(); });
      fullButton = addButton(row, '全屏', toggleFullscreen);
      if (!live) addButton(row, '倍速 / 画面比例', () => {
        settings = true; render(); buttons()[0]?.focus();
      });
      addButton(row, '收起', hide);
      updateLabels();
    }
    const help = document.createElement('p');
    help.className = 'ltv-remote-help';
    help.textContent = live
      ? '方向键选择 · 确认键执行 · 选择「收起」隐藏控制栏'
      : '方向键选择 · 确认键执行 · 收起后左右快进/快退';
    panel.append(help);
  };
  const show = () => {
    clearTimeout(seekTimer);
    commitSeek();
    seekDisplay.hidden = true;
    root.classList.add('ltv-remote-mode');
    visible = true;
    panel.hidden = false;
    settings = false;
    render();
    fullButton.focus({ preventScroll: true });
    art.controls.show = true;
    wake();
    armTimer();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
    const inside = !!target && root.contains(target);
    if (!inside && (!tv || (target !== document.body && target !== document.documentElement))) return;
    const key = event.key;
    // Inline playback is a single navigation target, never a directional-key trap.
    if (!art.fullscreen && !art.fullscreenWeb) {
      if (target === root && (key === 'Enter' || key === ' ') && !event.repeat) {
        art.fullscreenWeb = true;
        root.focus({ preventScroll: true });
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return;
    }
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape', 'Backspace', 'GoBack', 'BrowserBack'].includes(key)) return;
    if (['Escape', 'Backspace', 'GoBack', 'BrowserBack'].includes(key)) {
      if (!seekDisplay.hidden) {
        clearTimeout(seekTimer); clearTimeout(seekHideTimer);
        seekTarget = null;
        seekDisplay.hidden = true;
        wake();
      } else if (visible) {
        if (settings) { settings = false; render(); fullButton.focus(); armTimer(); }
        else hide();
      } else if (art.fullscreenWeb || art.fullscreen) {
        if (art.fullscreen) art.fullscreen = false;
        if (art.fullscreenWeb) art.fullscreenWeb = false;
      } else return;
    } else if (visible) {
      const list = buttons();
      const index = list.indexOf(document.activeElement as HTMLButtonElement);
      if (key.startsWith('Arrow')) {
        const direction = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
        list[(Math.max(0, index) + direction + list.length) % list.length]?.focus();
      } else if (!event.repeat) {
        (list[index] || fullButton).click();
      }
      if (visible) armTimer();
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
      show();
    } else if (key === 'Enter' || key === ' ') {
      if (!event.repeat) { art.toggle(); show(); }
    } else if (!live && Number.isFinite(art.duration) && art.duration > 0) {
      const change = key === 'ArrowLeft' ? -5 : 5;
      seekTarget = Math.max(0, Math.min(Math.max(0, art.duration - 0.1), (seekTarget ?? art.currentTime) + change));
      seekTime.textContent = `${formatTime(seekTarget)} / ${formatTime(art.duration)}`;
      seekFill.style.width = `${seekTarget / art.duration * 100}%`;
      seekDisplay.hidden = false;
      wake();
      clearTimeout(seekTimer);
      clearTimeout(seekHideTimer);
      // Repeated D-pad presses update the preview immediately, but only load the final target.
      seekTimer = setTimeout(commitSeek, 300);
      seekHideTimer = setTimeout(() => { seekDisplay.hidden = true; }, 5000);
    } else return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  render();
  if (tv) root.classList.add('ltv-remote-mode');
  document.addEventListener('keydown', onKey, true);
  art.on('video:play', updateLabels);
  art.on('video:pause', updateLabels);
  art.on('fullscreenWeb', fullscreenChanged);
  art.on('fullscreen', fullscreenChanged);
  return () => {
    clearTimeout(hideTimer);
    clearTimeout(idleTimer); clearTimeout(seekTimer); clearTimeout(seekHideTimer);
    document.removeEventListener('keydown', onKey, true);
    art.off('video:play', updateLabels);
    art.off('video:pause', updateLabels);
    art.off('fullscreenWeb', fullscreenChanged);
    art.off('fullscreen', fullscreenChanged);
    panel.remove(); style.remove(); seekDisplay.remove(); root.classList.remove('ltv-remote-mode', 'ltv-remote-idle');
    if (previousTabIndex === null) root.removeAttribute('tabindex');
    else root.setAttribute('tabindex', previousTabIndex);
  };
}
