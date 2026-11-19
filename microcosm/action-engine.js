(function (root) {
  'use strict';

  const art = root.MC || require('./engine.js');
  const { TAU, Game, clamp, dist, segmentDistance, delta } = art;
  const ENEMY_TYPES = {
    drifter: { name: 'Drifter', body: 'paramecium', health: 50, speed: 74 },
    dart: { name: 'Dart Ciliate', body: 'didinium', health: 75, speed: 101 },
  };
  const RULES = {
    health: 100,
    pulse: 25,
    mend: 25,
    boostSeconds: 8,
    dashCooldown: 2,
  };
  const FIELD = { width: 1920, height: 1400 };
  const savedNumber = value => Math.round(value * 1000) / 1000;
  const within = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
  const integerWithin = (value, min, max) => Number.isInteger(value) && within(value, min, max);
  const seedIsValid = value => integerWithin(value, -(2 ** 31), 2 ** 31 - 1);
  const pointIsValid = value => value && within(value.x, 0, FIELD.width) && within(value.y, 0, FIELD.height);
  const angleIsValid = value => within(value, -1e8, 1e8);

  const direction = (from, to) => Math.atan2(to.y - from.y, to.x - from.x);

  class Arcade {
    constructor(seed = Date.now()) {
      this.initialSeed = seed | 0;
      this.s = {
        w: FIELD.width, h: FIELD.height, time: 0, seed: this.initialSeed, nextId: 0,
        cells: [], food: [], dna: [], clouds: [], rocks: [], hazards: [], effects: [], selection: [],
      };
      // Share the original simulator's cell bodies, organelles and appearance.
      this.art = Object.create(Game.prototype);
      this.art.s = this.s;
      this.focus = this.art.cell('amoeba', this.s.w / 2, this.s.h / 2, 0);
      Object.assign(this.focus, { a: 0, invuln: 0, maxHp: RULES.health, hp: RULES.health });
      this.selected = [this.focus];
      this.s.selection = [this.focus.id];
      this.s.cells.push(this.focus);
      this.enemies = [];
      this.shots = [];
      this.pickups = [];
      this.events = [];
      this.wave = 0;
      this.defeated = 0;
      this.boost = 0;
      this.dash = 0;
      this.dashWait = 0;
      this.dashAngle = 0;
      this.nextWave = 0;
      this.dead = false;

      for (let i = 0; i < 24; i++) {
        const rock = { x: this.art.rand(50, this.s.w - 50), y: this.art.rand(50, this.s.h - 50), r: this.art.rand(13, 51), seed: this.art.rand() };
        if (dist(rock, this.focus) > 190) this.s.rocks.push(rock);
      }
      for (let i = 0; i < 85; i++) {
        this.s.food.push({
          x: this.art.rand(24, this.s.w - 24), y: this.art.rand(24, this.s.h - 24),
          r: this.art.rand(1.5, 4), seed: this.art.rand(0, TAU), kind: i % 4 === 0 ? 'alga' : 'detritus',
        });
      }

      this.advanceWave();
    }

    snapshot() {
      const player = this.focus;
      return {
        version: 1,
        seed: this.initialSeed,
        rng: this.s.seed,
        time: savedNumber(this.s.time),
        wave: this.wave,
        defeated: this.defeated,
        boost: savedNumber(this.boost),
        dash: savedNumber(this.dash),
        dashWait: savedNumber(this.dashWait),
        dashAngle: savedNumber(this.dashAngle),
        nextWave: savedNumber(this.nextWave),
        player: {
          x: savedNumber(player.x), y: savedNumber(player.y), a: savedNumber(player.a),
          hp: player.hp, cool: savedNumber(player.cool), invuln: savedNumber(player.invuln),
        },
        enemies: this.enemies.map(enemy => ({
          x: savedNumber(enemy.x), y: savedNumber(enemy.y), a: savedNumber(enemy.a),
          kind: enemy.kind, hp: enemy.hp, phase: enemy.phase,
          timer: savedNumber(enemy.timer), windup: savedNumber(enemy.windup),
          chargeAngle: savedNumber(enemy.chargeAngle ?? 0),
        })),
        pickups: this.pickups.map(pickup => ({
          x: savedNumber(pickup.x), y: savedNumber(pickup.y),
          kind: pickup.kind, life: savedNumber(pickup.life),
        })),
        shots: this.shots.map(shot => ({
          x: savedNumber(shot.x), y: savedNumber(shot.y), angle: savedNumber(shot.angle),
          damage: shot.damage, life: savedNumber(shot.life),
        })),
      };
    }

    static restore(data) {
      const { player, enemies, pickups, shots } = data || {};
      if (data?.version !== 1 || !seedIsValid(data.seed) || !seedIsValid(data.rng)
        || !within(data.time, 0, 1e8) || !integerWithin(data.wave, 1, 1e7) || !integerWithin(data.defeated, 0, data.wave * 10)
        || !within(data.boost, 0, RULES.boostSeconds) || !within(data.dash, 0, .24) || !within(data.dashWait, 0, RULES.dashCooldown)
        || !angleIsValid(data.dashAngle) || !within(data.nextWave, 0, 1.4)) throw new Error('Invalid or unsupported Microcosm save.');
      if (!pointIsValid(player) || !angleIsValid(player.a) || !integerWithin(player.hp, 0, RULES.health)
        || !within(player.cool, 0, .4) || !within(player.invuln, 0, .9)) throw new Error('Invalid Microcosm player state.');
      if (!Array.isArray(enemies) || enemies.length > 10 || !enemies.every(enemy => pointIsValid(enemy)
        && Object.hasOwn(ENEMY_TYPES, enemy.kind) && integerWithin(enemy.hp, 1, ENEMY_TYPES[enemy.kind].health)
        && ['track', 'warn', 'charge'].includes(enemy.phase) && within(enemy.timer, 0, .68)
        && within(enemy.windup, 0, 2.6) && angleIsValid(enemy.a) && angleIsValid(enemy.chargeAngle))) throw new Error('Invalid Microcosm enemies.');
      if (!Array.isArray(pickups) || pickups.length > 95 || !pickups.every(pickup => pointIsValid(pickup)
        && ['mend', 'boost'].includes(pickup.kind) && within(pickup.life, 0, 23))) throw new Error('Invalid Microcosm power-ups.');
      if (!Array.isArray(shots) || shots.length > 8 || !shots.every(shot => pointIsValid(shot)
        && [RULES.pulse, RULES.pulse * 2].includes(shot.damage) && within(shot.life, 0, 1.18)
        && angleIsValid(shot.angle))) throw new Error('Invalid Microcosm pulses.');

      const game = new Arcade(data.seed);
      game.enemies = [];
      game.s.cells = [game.focus];
      for (const key of ['wave', 'defeated', 'boost', 'dash', 'dashWait', 'dashAngle', 'nextWave']) game[key] = data[key];
      const { x, y, a, hp, cool, invuln } = player;
      Object.assign(game.focus, { x, y, a, hp, cool, invuln, surge: data.dash });
      for (const enemy of enemies) {
        const restored = game.spawnEnemy(enemy.kind, enemy.x, enemy.y);
        const { a, hp, phase, timer, windup, chargeAngle } = enemy;
        Object.assign(restored, { a, hp, phase, timer, windup, chargeAngle });
      }
      game.pickups = pickups.map(({ x, y, kind, life }) => ({ x, y, kind, life, r: 15 }));
      game.shots = shots.map(({ x, y, angle, damage, life }) => ({ x, y, angle, damage, life }));
      game.s.time = data.time;
      game.s.seed = data.rng;
      game.dead = hp === 0;
      game.events = [];
      return game;
    }

    findTarget(_cell, id) {
      return this.s.cells.find(cell => cell.id === id && cell.hp > 0);
    }

    nearestEnemy() {
      return this.enemies.reduce((nearest, enemy) => (!nearest || dist(this.focus, enemy) < dist(this.focus, nearest) ? enemy : nearest), null);
    }

    spawnEnemy(kind, x, y) {
      const type = ENEMY_TYPES[kind];
      const enemy = this.art.cell(type.body, x, y, 1);
      Object.assign(enemy, {
        kind, hp: type.health, maxHp: type.health, phase: 'track', timer: 0,
        a: direction(enemy, this.focus), windup: 1.4 + this.art.rand(0, 1.2),
      });
      this.enemies.push(enemy);
      this.s.cells.push(enemy);
      return enemy;
    }

    advanceWave() {
      this.wave += 1;
      const player = this.focus;
      const count = Math.min(2 + Math.floor(this.wave * .78), 10);
      const offset = this.wave === 1 ? .27 : this.art.rand(0, TAU);
      for (let i = 0; i < count; i++) {
        const baseAngle = offset + i / count * TAU;
        const spawnDistance = this.wave === 1 ? 260 + i * 60 : 310 + i % 4 * 28;
        let position;
        for (let attempt = 0; attempt < 10; attempt++) {
          const angle = baseAngle + attempt * .62;
          const candidate = { x: player.x + Math.cos(angle) * spawnDistance, y: player.y + Math.sin(angle) * spawnDistance };
          if (candidate.x < 54 || candidate.y < 54 || candidate.x > this.s.w - 54 || candidate.y > this.s.h - 54) continue;
          if (this.enemies.every(other => dist(candidate, other) > 66)) {
            position = candidate;
            break;
          }
        }
        if (!position) position = this.fallbackSpawn(i);
        const kind = this.wave >= 2 && (i + this.wave) % 3 === 0 ? 'dart' : 'drifter';
        this.spawnEnemy(kind, position.x, position.y);
      }
      this.events.push({ kind: 'wave', text: `Wave ${this.wave}`, note: this.wave === 2 ? 'Watch for the Dart Ciliate’s charge.' : `${count} enemies` });
    }

    fallbackSpawn(index) {
      const fartherX = this.focus.x < this.s.w / 2 ? 1 : -1;
      const fartherY = this.focus.y < this.s.h / 2 ? 1 : -1;
      return {
        x: this.focus.x + fartherX * (280 + (index % 4) * 72),
        y: this.focus.y + fartherY * (130 + Math.floor(index / 4) * 92),
      };
    }

    fire(aim) {
      const player = this.focus;
      if (this.dead || player.cool > 0) return;
      const target = aim || this.nearestEnemy();
      const angle = target && dist(player, target) > 2 ? direction(player, target) : player.a;
      const reach = player.r * .54;
      const damage = RULES.pulse * (this.boost > 0 ? 2 : 1);
      this.shots.push({ x: player.x + Math.cos(angle) * reach, y: player.y + Math.sin(angle) * reach, angle, damage, life: 1.18 });
      player.cool = .4;
    }

    startDash(move) {
      if (this.dead || this.dashWait > 0) return;
      this.dashAngle = move.x || move.y ? Math.atan2(move.y, move.x) : this.focus.a;
      this.dash = .24;
      this.dashWait = RULES.dashCooldown;
      this.focus.invuln = Math.max(this.focus.invuln, this.dash + .08);
    }

    move(cell, x, y, dt) {
      cell.vx = x;
      cell.vy = y;
      cell.x = clamp(cell.x + x * dt, cell.r + 6, this.s.w - cell.r - 6);
      cell.y = clamp(cell.y + y * dt, cell.r + 6, this.s.h - cell.r - 6);
      if (x || y) cell.a += delta(Math.atan2(y, x), cell.a) * (1 - Math.exp(-dt * 14));
    }

    movePlayer(move, dt) {
      const length = Math.max(1, Math.hypot(move.x, move.y));
      const x = this.dash > 0 ? Math.cos(this.dashAngle) * 535 : move.x * 178 / length;
      const y = this.dash > 0 ? Math.sin(this.dashAngle) * 535 : move.y * 178 / length;
      this.move(this.focus, x, y, dt);
      this.focus.surge = this.dash;
    }

    moveEnemy(enemy, dt) {
      const player = this.focus;
      const separation = dist(enemy, player);
      const aimed = direction(enemy, player);
      const type = ENEMY_TYPES[enemy.kind];
      enemy.timer = Math.max(0, enemy.timer - dt);
      enemy.windup = Math.max(0, enemy.windup - dt);

      if (enemy.phase === 'warn') {
        this.move(enemy, 0, 0, dt);
        if (!enemy.timer) {
          enemy.phase = 'charge';
          enemy.timer = .48;
        }
      } else if (enemy.phase === 'charge') {
        this.move(enemy, Math.cos(enemy.chargeAngle) * 365, Math.sin(enemy.chargeAngle) * 365, dt);
        if (!enemy.timer) {
          enemy.phase = 'track';
          enemy.windup = 2.1;
        }
      } else if (enemy.kind === 'dart' && !enemy.windup && separation < 250 && separation > 64) {
        enemy.phase = 'warn';
        enemy.chargeAngle = aimed;
        enemy.a = aimed;
        enemy.timer = .68;
        this.move(enemy, 0, 0, dt);
      } else {
        const speed = type.speed + Math.min(22, this.wave * 1.6);
        let x = Math.cos(aimed) * speed;
        let y = Math.sin(aimed) * speed;
        for (const other of this.enemies) {
          const gap = dist(enemy, other);
          const minimum = (enemy.r + other.r) * .86;
          if (other === enemy || gap >= minimum) continue;
          const away = direction(other, enemy);
          x += Math.cos(away) * (minimum - gap) * 4;
          y += Math.sin(away) * (minimum - gap) * 4;
        }
        this.move(enemy, x, y, dt);
      }

      if (dist(enemy, player) < (enemy.r + player.r) * .79) {
        this.hitPlayer(enemy.phase === 'charge' ? 20 : 12, enemy);
      }
    }

    hitPlayer(damage, source) {
      const player = this.focus;
      if (player.invuln > 0 || this.dead) return;
      this.hit(player, damage, source);
      player.invuln = .9;
      if (player.hp === 0) {
        this.dead = true;
        this.events.push({ kind: 'end' });
      }
    }

    hit(cell, damage, source) {
      const before = cell.hp;
      cell.hp = Math.max(0, before - damage);
      Object.assign(cell, {
        hurt: .38, damageHP: before, damageCue: .7, damageTotal: before - cell.hp,
        combat: .7, hitAngle: direction(cell, source), hitSize: .55,
      });
    }

    advanceShots(dt) {
      this.shots = this.shots.filter(shot => {
        const from = { x: shot.x, y: shot.y };
        shot.x += Math.cos(shot.angle) * 585 * dt;
        shot.y += Math.sin(shot.angle) * 585 * dt;
        shot.life -= dt;
        let firstHit;
        for (const enemy of this.enemies) {
          if (enemy.hp <= 0 || segmentDistance(enemy, from, shot) > enemy.r * .82 + 6) continue;
          if (!firstHit || dist(from, enemy) < dist(from, firstHit)) firstHit = enemy;
        }
        if (firstHit) {
          this.hit(firstHit, shot.damage, from);
          if (firstHit.hp === 0) this.defeat(firstHit);
          return false;
        }
        return shot.life > 0 && shot.x >= 0 && shot.y >= 0 && shot.x <= this.s.w && shot.y <= this.s.h;
      });
    }

    defeat(enemy) {
      this.defeated += 1;
      this.s.effects.push({ kind: 'rupture', x: enemy.x, y: enemy.y, r: enemy.r, life: .6, color: '#ff9bbb', damage: enemy.damageTotal });
      if (this.defeated % 4 === 1) this.drop('mend', enemy);
      if (this.defeated % 4 === 2) this.drop('boost', enemy);
    }

    drop(kind, position) {
      this.pickups.push({ x: position.x, y: position.y, kind, life: 23, r: 15 });
    }

    collect(dt) {
      this.pickups = this.pickups.filter(pickup => {
        pickup.life -= dt;
        if (pickup.life <= 0) return false;
        const player = this.focus;
        if (dist(player, pickup) > player.r * .72 + pickup.r) return true;
        if (pickup.kind === 'mend') {
          if (player.hp >= RULES.health) return true;
          const gain = Math.min(RULES.mend, RULES.health - player.hp);
          player.hp += gain;
          player.fed = .7;
          this.events.push({ kind: 'pickup', text: `Mend · +${gain} HP` });
        } else {
          this.boost = RULES.boostSeconds;
          player.upgraded = .8;
          this.events.push({ kind: 'pickup', text: 'Boost · double pulse damage' });
        }
        return false;
      });
    }

    step(dt, input = {}) {
      if (this.dead) return;
      this.s.time += dt;
      for (const key of ['dash', 'dashWait', 'boost']) this[key] = Math.max(0, this[key] - dt);
      for (const cell of this.s.cells) {
        for (const key of ['cool', 'invuln', 'hurt', 'damageCue', 'combat', 'fed', 'upgraded']) cell[key] = Math.max(0, (cell[key] || 0) - dt);
      }

      const move = input.move || { x: 0, y: 0 };
      if (input.dash) this.startDash(move);
      this.movePlayer(move, dt);
      if (input.fire) this.fire(input.aim);
      this.advanceShots(dt);
      this.enemies = this.enemies.filter(enemy => enemy.hp > 0);
      this.s.cells = [this.focus, ...this.enemies];

      for (const enemy of this.enemies) {
        this.moveEnemy(enemy, dt);
        if (this.dead) return;
      }
      for (const cell of this.s.cells) this.art.membrane(cell, Math.min(dt, 1 / 30));
      for (const effect of this.s.effects) effect.life -= dt;
      this.s.effects = this.s.effects.filter(effect => effect.life > 0);
      this.collect(dt);

      if (!this.enemies.length) {
        this.nextWave += dt;
        if (this.nextWave >= 1.4) {
          this.nextWave = 0;
          this.advanceWave();
        }
      }
    }
  }

  const api = { Arcade, ENEMY_TYPES, RULES };
  if (typeof module !== 'undefined') module.exports = api;
  root.MicrocosmArcade = api;
})(typeof window !== 'undefined' ? window : globalThis);
