const FieldTrial = (() => {
  const width = 100;
  const height = 62;
  const duration = 18;
  const fields = {
    grove: { start: 24, extreme: 29, event: 'Warm clearing', stress: .58 },
    frost: { start: -7, extreme: -14, event: 'Cold gust', stress: .8 },
    dunes: { start: 38, extreme: 46, event: 'Heat wave', stress: .9 },
  };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function create(brood, habitatKey) {
    return {
      habitat: habitatKey,
      time: 0,
      affected: false,
      shelter: { x: 88, y: 49 },
      animals: brood.map((individual, index) => ({
        id: individual.id,
        x: 21 + index * 10,
        y: index % 2 ? 46 : 36,
        energy: 100,
        heading: 1,
        hit: 0,
        ate: 0,
        zone: 'foraging',
        target: index % 3,
      })),
      predator: { x: 13, y: 16, heading: 1, target: null, patrol: 0, recovery: 0 },
      bushes: [
        { x: 28, y: 20, berries: 2, regrow: 0 },
        { x: 70, y: 19, berries: 2, regrow: 0 },
        { x: 52, y: 51, berries: 2, regrow: 0 },
      ],
    };
  }

  function temperature(field) {
    const weather = fields[field.habitat];
    const surge = clamp((field.time - 5.5) / 3, 0, 1) * clamp((duration - field.time) / 3.5, 0, 1);
    return Math.round(weather.start + (weather.extreme - weather.start) * surge);
  }

  function moveToward(actor, goal, speed, dt) {
    const dx = goal.x - actor.x;
    const dy = goal.y - actor.y;
    const length = Math.hypot(dx, dy);
    if (length < .08) return;
    const stride = Math.min(speed * dt, length);
    if (Math.abs(dx) > .14) actor.heading = dx > 0 ? 1 : -1;
    actor.x = clamp(actor.x + dx / length * stride, 5, 95);
    actor.y = clamp(actor.y + dy / length * stride, 8, 56);
  }

  function shelterAt(field, x, y) {
    field.shelter.x = clamp(x, 8, 92);
    field.shelter.y = clamp(y, 10, 52);
    field.affected = true;
  }

  function detection(field, individual, actor) {
    const camouflaged = individual.color === SurvivalModel.habitats[field.habitat].color;
    const hidden = distance(actor, field.shelter) < 11;
    return (camouflaged ? 15 : 36) * (hidden ? .48 : 1);
  }

  function patrol(field, traits, dt) {
    const predator = field.predator;
    if (predator.recovery > 0) {
      predator.recovery = Math.max(0, predator.recovery - dt);
      predator.target = null;
      moveToward(predator, { x: predator.x < 52 ? 10 : 90, y: 12 }, 10.4, dt);
      return;
    }
    let nearest = Infinity;
    let prey = null;
    field.animals.forEach((animal, index) => {
      if (!animal.energy) return;
      const gap = distance(predator, animal);
      if (gap < detection(field, traits[index], animal) && gap < nearest) {
        nearest = gap;
        prey = animal;
      }
    });
    predator.target = prey?.id ?? null;
    if (prey) {
      moveToward(predator, prey, 11.7, dt);
      if (nearest < 5.7 && prey.hit === 0) {
        prey.energy = Math.max(0, prey.energy - 34);
        prey.hit = 1.25;
        predator.recovery = 1.65;
      }
      return;
    }
    const points = [{ x: 24, y: 21 }, { x: 76, y: 24 }, { x: 63, y: 43 }, { x: 16, y: 40 }];
    const goal = points[predator.patrol];
    if (distance(predator, goal) < 3) predator.patrol = (predator.patrol + 1) % points.length;
    moveToward(predator, goal, 8.1, dt);
  }

  function forage(field, animal, traits, dt) {
    const fieldType = fields[field.habitat];
    const habitat = SurvivalModel.habitats[field.habitat];
    const sheltered = distance(animal, field.shelter) < 10;
    const warmEnough = traits.fur === habitat.fur;
    const peak = Math.abs(temperature(field) - fieldType.start) / Math.abs(fieldType.extreme - fieldType.start);
    const thermal = warmEnough ? .55 : (4.8 + 3.3 * peak) * fieldType.stress;
    animal.energy = Math.max(0, animal.energy - (1.4 + thermal * (sheltered ? .38 : 1)) * dt);
    animal.hit = Math.max(0, animal.hit - dt);
    animal.ate = Math.max(0, animal.ate - dt);
    if (!animal.energy) return;

    const pursuing = field.predator.target === animal.id || distance(animal, field.predator) < 10;
    if (pursuing && !sheltered) {
      const dx = animal.x - field.predator.x;
      const dy = animal.y - field.predator.y;
      const run = { x: clamp(animal.x + dx * 2, 8, 92), y: clamp(animal.y + dy * 2, 13, 51) };
      if (distance(animal, run) < 7) {
        run.x = clamp(animal.x + Math.sign(52 - animal.x) * 8, 8, 92);
        run.y = animal.y <= 31 ? 41 : 18;
      }
      const escape = distance(animal, field.shelter) < 28 ? field.shelter : run;
      animal.zone = 'fleeing';
      moveToward(animal, escape, animal.energy > 29 ? 12.8 : 9, dt);
      return;
    }

    const berry = field.bushes[animal.target];
    animal.zone = sheltered ? 'sheltered' : 'foraging';
    if (distance(animal, berry) < 6) {
      if (berry.berries > 0 && animal.energy < 89 && animal.ate === 0) {
        berry.berries -= 1;
        berry.regrow = 2.2;
        animal.energy = Math.min(100, animal.energy + 23);
        animal.ate = .8;
      }
      animal.target = (animal.target + 1) % field.bushes.length;
    }
    moveToward(animal, field.bushes[animal.target], animal.energy > 29 ? 7.6 : 5.6, dt);
  }

  function step(field, traits, dt) {
    const interval = Math.min(dt, duration - field.time);
    if (interval <= 0) return;
    field.time += interval;
    field.bushes.forEach(bush => {
      if (bush.berries === 2) return;
      bush.regrow -= interval;
      if (bush.regrow <= 0) {
        bush.berries += 1;
        bush.regrow = 2.2;
      }
    });
    patrol(field, traits, interval);
    field.animals.forEach((animal, index) => {
      if (animal.energy > 0) forage(field, animal, traits[index], interval);
    });
  }

  function results(field, brood) {
    return brood.map((individual, index) => ({
      ...individual, survived: field.animals[index].energy > 0,
      energy: field.animals[index].energy ? Math.max(1, Math.round(field.animals[index].energy)) : 0,
    }));
  }

  return { create, step, results, shelterAt, temperature, duration, fields, width, height };
})();

if (typeof module !== 'undefined') module.exports = FieldTrial;
