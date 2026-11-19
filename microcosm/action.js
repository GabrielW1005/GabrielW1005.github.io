(function () {
  'use strict';

  if (window.location.hash.startsWith('#save=')) {
    window.location.replace('living-worlds.html' + window.location.search + window.location.hash);
    return;
  }

  const { Arcade, RULES } = window.MicrocosmArcade;
  const { clamp } = window.MC;
  const byId = id => document.getElementById(id);
  const world = byId('world');
  const overlay = byId('overlay');
  const primary = byId('primary-button');
  const secondary = byId('secondary-button');
  const directionKeys = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  };

  class ArcadeRenderer extends window.MCRenderer {
    drawArcade(game, dt) {
      this.draw(game, dt);
      const context = this.ctx;
      context.save();
      context.translate(this.width / 2, this.height / 2);
      context.scale(this.zoom, this.zoom);
      context.translate(-this.camera.x, -this.camera.y);

      for (const enemy of game.enemies) {
        if (!this.visible(enemy, 210) || enemy.phase === 'track') continue;
        this.charge(enemy);
      }
      for (const pickup of game.pickups) {
        if (this.visible(pickup)) this.pickup(pickup, game.s.time);
      }
      for (const shot of game.shots) {
        if (this.visible(shot)) this.shot(shot);
      }
      for (const impact of game.s.effects) {
        if (impact.damage && this.visible(impact)) {
          context.fillStyle = '#ffd2bd';
          context.globalAlpha = Math.min(1, impact.life * 2);
          context.font = 'bold 12px system-ui';
          context.textAlign = 'center';
          context.fillText('−' + impact.damage, impact.x, impact.y - impact.r - (1 - impact.life) * 22);
        }
      }
      context.restore();
      this.indicators(game.enemies);
    }

    charge(enemy) {
      const context = this.ctx;
      const warning = enemy.phase === 'warn';
      context.save();
      context.translate(enemy.x, enemy.y);
      context.rotate(enemy.chargeAngle);
      context.strokeStyle = warning ? '#ff778c' : '#ffb07a';
      context.lineWidth = warning ? 2.4 : 2;
      if (warning) context.setLineDash([6, 5]);
      const start = warning ? enemy.r + 4 : -enemy.r - 43;
      const end = warning ? enemy.r + 172 : -enemy.r - 5;
      context.beginPath();
      context.moveTo(start, 0);
      context.lineTo(end, 0);
      context.stroke();
      context.setLineDash([]);
      if (warning) {
        context.beginPath();
        context.moveTo(end - 13, -7);
        context.lineTo(end, 0);
        context.lineTo(end - 13, 7);
        context.stroke();
      }
      context.restore();
    }

    pickup(pickup, time) {
      const context = this.ctx;
      const mend = pickup.kind === 'mend';
      const color = mend ? '#9effbd' : '#ffc981';
      const y = pickup.y + Math.sin(time * 3.4 + pickup.x) * 2;
      context.save();
      context.globalAlpha = Math.min(1, pickup.life / 2);
      this.circle(pickup.x, y, 18, mend ? '#0d352e' : '#412e29', color, 1.5);
      this.circle(pickup.x, y, 22, null, color + '54', 1);
      context.fillStyle = color;
      context.font = 'bold 21px system-ui';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(mend ? '+' : '✦', pickup.x, y + 1);
      context.restore();
    }

    shot(shot) {
      const context = this.ctx;
      const boosted = shot.damage > RULES.pulse;
      const color = boosted ? '#ffcc8e' : '#7ff3cb';
      context.save();
      context.translate(shot.x, shot.y);
      context.rotate(shot.angle);
      context.strokeStyle = color + '8c';
      context.lineWidth = boosted ? 3 : 2;
      context.beginPath();
      context.moveTo(-27, 0);
      context.lineTo(-5, 0);
      context.stroke();
      this.ellipse(0, 0, boosted ? 11 : 8.5, boosted ? 6.5 : 4.4, 0, color + '60', color, 1.4);
      this.circle(2, 0, 2.4, '#fffbe8');
      context.restore();
    }

    indicators(enemies) {
      const context = this.ctx;
      for (const enemy of enemies) {
        const point = this.screen(enemy);
        if (point.x >= 20 && point.x <= this.width - 20 && point.y >= 18 && point.y <= this.height - 18) continue;
        const x = clamp(point.x, 18, this.width - 18);
        const y = clamp(point.y, 100, this.height - 108);
        const angle = Math.atan2(point.y - this.height / 2, point.x - this.width / 2);
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.fillStyle = '#071923';
        context.strokeStyle = enemy.kind === 'dart' ? '#ffba89' : '#7fd6ff';
        context.lineWidth = 1.7;
        context.beginPath();
        context.moveTo(8, 0);
        context.lineTo(-6, 7);
        context.lineTo(-3, 0);
        context.lineTo(-6, -7);
        context.closePath();
        context.fill();
        context.stroke();
        context.restore();
      }
    }
  }

  const renderer = new ArcadeRenderer(world);
  let game = new Arcade();
  let state = 'ready';
  let guideFrom = 'ready';
  let needsRender = true;
  let lastFrame = 0;
  let announcementTime = 0;
  let pointerId = null;
  let aim = null;
  let fireTap = false;
  let dashTap = false;
  let nudge = null;
  const keyboard = new Set();
  const pointers = new Map();
  let best = readBest();

  function readBest() {
    try {
      const stored = Number(localStorage.getItem('microcosm.arcade.best-wave'));
      return Number.isFinite(stored) ? Math.max(0, Math.floor(stored)) : 0;
    } catch {
      return 0;
    }
  }

  function recordBest() {
    if (game.wave <= best) return;
    best = game.wave;
    try { localStorage.setItem('microcosm.arcade.best-wave', String(best)); } catch { /* Optional local record. */ }
  }

  function resize() {
    const bounds = byId('game').getBoundingClientRect();
    renderer.resize(bounds.width, bounds.height);
    renderer.zoom = clamp(bounds.width / 680, .95, 1.5);
    needsRender = true;
  }

  function resetCamera() {
    renderer.camera.x = game.focus.x;
    renderer.camera.y = game.focus.y;
  }

  function clearInput() {
    keyboard.clear();
    pointers.clear();
    pointerId = null;
    fireTap = false;
    dashTap = false;
    nudge = null;
  }

  function writeText(node, text) {
    if (node.textContent !== String(text)) node.textContent = text;
  }

  const hud = {
    health: byId('health-text'), meter: byId('health-meter'), wave: byId('wave'),
    defeated: byId('defeated'), remaining: byId('remaining'), boost: byId('boost-indicator'),
    boostTime: byId('boost-time'), dash: byId('dash-button'), dashStatus: byId('dash-status'),
  };

  function updateHud() {
    writeText(hud.health, game.focus.hp);
    hud.meter.value = game.focus.hp;
    writeText(hud.wave, game.wave);
    writeText(hud.defeated, game.defeated);
    writeText(hud.remaining, game.enemies.length);
    hud.boost.hidden = game.boost <= 0;
    writeText(hud.boostTime, Math.ceil(game.boost) + 's');
    hud.dash.dataset.wait = String(game.dashWait > 0);
    writeText(hud.dashStatus, game.dashWait > 0 ? game.dashWait.toFixed(1) + 's' : 'Ready');
  }

  function showState(next) {
    state = next;
    if (next === 'playing') {
      overlay.close();
      world.focus({ preventScroll: true });
      lastFrame = 0;
      return;
    }
    clearInput();

    const screens = {
      ready: ['Microcosm Arcade', 'Steer an amoeba, fire pulses, and survive incoming waves.', 'Start playing', 'How to play'],
      paused: ['Paused', 'Your wave and power-up time are on hold.', 'Resume', 'How to play'],
      guide: ['How to play', 'Defeat the enemies in each wave to keep going.', 'Back', ''],
      ended: ['Run complete', `You reached wave ${game.wave} and defeated ${game.defeated} ${game.defeated === 1 ? 'enemy' : 'enemies'}.`, 'Play again', 'How to play'],
    };
    const [title, text, button, more] = screens[next];
    writeText(byId('overlay-title'), title);
    writeText(byId('overlay-text'), text);
    writeText(primary, button);
    writeText(secondary, more);
    secondary.hidden = !more;
    byId('game-guide').hidden = next !== 'guide';
    const bestLine = byId('best-line');
    bestLine.hidden = next !== 'ended';
    writeText(bestLine, `Best wave ${best}`);
    if (!overlay.open) overlay.showModal();
    primary.focus({ preventScroll: true });
  }

  function openGuide() {
    if (state === 'guide') return;
    guideFrom = state;
    showState('guide');
  }

  function startNewRun() {
    game = new Arcade();
    resetCamera();
    announcementTime = 0;
    byId('announcement').hidden = true;
    updateHud();
    showState('playing');
  }

  primary.addEventListener('click', () => {
    if (state === 'guide') showState(guideFrom);
    else if (state === 'ended') startNewRun();
    else showState('playing');
  });
  secondary.addEventListener('click', openGuide);
  byId('guide-button').addEventListener('click', openGuide);
  byId('pause-button').addEventListener('click', () => showState('paused'));
  overlay.addEventListener('cancel', event => {
    event.preventDefault();
    if (state === 'guide') showState(guideFrom);
    else if (state === 'paused') showState('playing');
  });

  document.addEventListener('keydown', event => {
    if (state === 'paused' && event.code === 'KeyP' && !event.repeat) {
      event.preventDefault();
      showState('playing');
      return;
    }
    if (state !== 'playing') return;
    if (event.code === 'Escape' || event.code === 'KeyP') {
      event.preventDefault();
      if (!event.repeat) showState('paused');
      return;
    }
    if (!directionKeys[event.code] && !['Space', 'ShiftLeft', 'ShiftRight', 'KeyF'].includes(event.code)) return;
    if (event.code === 'Space' && event.target.closest?.('button, a')) return;
    event.preventDefault();
    keyboard.add(event.code);
    if (!event.repeat && ['ShiftLeft', 'ShiftRight', 'KeyF'].includes(event.code)) dashTap = true;
    if (!event.repeat && event.code === 'Space') {
      if (pointerId === null) aim = null;
      fireTap = true;
    }
  });
  document.addEventListener('keyup', event => keyboard.delete(event.code));
  window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') showState('paused');
  });

  function readAim(event) {
    const bounds = world.getBoundingClientRect();
    aim = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  world.addEventListener('pointerdown', event => {
    if (state !== 'playing' || event.button !== 0 || pointerId !== null) return;
    event.preventDefault();
    world.focus({ preventScroll: true });
    world.setPointerCapture(event.pointerId);
    readAim(event);
    pointerId = event.pointerId;
    fireTap = true;
  });
  world.addEventListener('pointermove', event => {
    if (pointerId === event.pointerId) readAim(event);
  });
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    world.addEventListener(eventName, event => {
      if (pointerId === event.pointerId) pointerId = null;
    });
  }

  const heldButtons = document.querySelectorAll('[data-move], #pulse-button');
  for (const button of heldButtons) {
    const buttonCommand = button.dataset.move || 'fire';
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || state !== 'playing') return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, buttonCommand);
      if (buttonCommand === 'fire') {
        aim = null;
        fireTap = true;
      } else {
        nudge = { direction: buttonCommand, time: .09 };
      }
    });
    for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(eventName, event => pointers.delete(event.pointerId));
    }
    button.addEventListener('click', event => {
      if (event.detail !== 0) return;
      if (buttonCommand === 'fire') {
        aim = null;
        fireTap = true;
      } else nudge = { direction: buttonCommand, time: .15 };
    });
  }
  hud.dash.addEventListener('pointerdown', event => {
    if (state !== 'playing' || event.button !== 0) return;
    event.preventDefault();
    dashTap = true;
  });
  hud.dash.addEventListener('click', event => {
    if (event.detail === 0) dashTap = true;
  });

  function getInput(dt) {
    const actions = new Set(pointers.values());
    for (const code of keyboard) actions.add(directionKeys[code]);
    if (nudge) {
      actions.add(nudge.direction);
      nudge.time -= dt;
      if (nudge.time <= 0) nudge = null;
    }
    const move = {
      x: Number(actions.has('right')) - Number(actions.has('left')),
      y: Number(actions.has('down')) - Number(actions.has('up')),
    };
    const manualAim = aim && (pointerId !== null || fireTap) ? renderer.world(aim.x, aim.y) : null;
    const fire = pointerId !== null || actions.has('fire') || keyboard.has('Space') || fireTap;
    const dash = dashTap;
    fireTap = false;
    dashTap = false;
    return { move, fire, dash, aim: manualAim };
  }

  function announce(dt) {
    const banner = byId('announcement');
    announcementTime = Math.max(0, announcementTime - dt);
    if (!announcementTime) banner.hidden = true;
    for (const event of game.events.splice(0)) {
      if (event.kind === 'end') {
        showState('ended');
        continue;
      }
      if (event.kind === 'wave') recordBest();
      writeText(byId('event-title'), event.text);
      writeText(byId('event-note'), event.note || '');
      banner.hidden = false;
      announcementTime = event.kind === 'wave' ? 2.1 : 1.5;
    }
  }

  function frame(now) {
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 1 / 30) : 1 / 60;
    lastFrame = now;
    if (state === 'playing') {
      game.step(dt, getInput(dt));
      updateHud();
      announce(dt);
      needsRender = true;
    }
    if (needsRender) {
      renderer.drawArcade(game, dt);
      needsRender = false;
    }
    requestAnimationFrame(frame);
  }

  if (window.ResizeObserver) new ResizeObserver(resize).observe(byId('game'));
  else window.addEventListener('resize', resize);
  resize();
  resetCamera();
  updateHud();
  showState('ready');
  requestAnimationFrame(frame);
})();
