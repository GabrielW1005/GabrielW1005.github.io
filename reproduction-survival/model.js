const SurvivalModel = (() => {
  const habitats = {
    grove: { name: 'Shaded Grove', color: 'Dark slate', fur: 'Sleek', cue: 'Dark ground • mild weather', className: 'grove' },
    frost: { name: 'Frost Ridge', color: 'Cream', fur: 'Fluffy', cue: 'Pale snow • cold air', className: 'frost' },
    dunes: { name: 'Ember Dunes', color: 'Cream', fur: 'Sleek', cue: 'Pale sand • hot air', className: 'dunes' },
  };

  function phenotype(genotype) {
    return {
      color: genotype.color.includes('C') ? 'Dark slate' : 'Cream',
      fur: genotype.fur.includes('F') ? 'Fluffy' : 'Sleek',
    };
  }

  function matchingTraits(genotype, habitatKey) {
    const traits = phenotype(genotype);
    const habitat = habitats[habitatKey];
    return Number(traits.color === habitat.color) + Number(traits.fur === habitat.fur);
  }

  function pair(first, second) {
    return first <= second ? first + second : second + first;
  }

  function gamete(genotype, random = Math.random) {
    const allele = gene => genotype[gene][random() < 0.5 ? 0 : 1];
    return { color: allele('color'), fur: allele('fur') };
  }

  function founders() {
    return [
      { id: 'founder-1', name: 'Mica', genotype: { color: 'Cc', fur: 'Ff' } },
      { id: 'founder-2', name: 'Pip', genotype: { color: 'cc', fur: 'Ff' } },
      { id: 'founder-3', name: 'Taro', genotype: { color: 'CC', fur: 'ff' } },
      { id: 'founder-4', name: 'Fern', genotype: { color: 'Cc', fur: 'ff' } },
      { id: 'founder-5', name: 'Pebble', genotype: { color: 'cc', fur: 'FF' } },
      { id: 'founder-6', name: 'Sol', genotype: { color: 'cc', fur: 'ff' } },
    ];
  }

  function breed(parents, mode, generation, random = Math.random) {
    const sexual = mode === 'sexual';
    const names = [
      ['Bramble', 'Clover', 'Dash', 'Flint', 'Lumi', 'Moss'],
      ['Nova', 'Saffron', 'Sprig', 'Echo', 'Drift', 'Wren'],
      ['Juniper', 'Milo', 'Puck', 'Aspen', 'Sage', 'Nori'],
    ];
    return Array.from({ length: sexual ? 4 : 6 }, (_, index) => {
      const sperm = sexual ? gamete(parents[0].genotype, random) : null;
      const egg = sexual ? gamete(parents[1].genotype, random) : null;
      const genotype = sexual
        ? { color: pair(sperm.color, egg.color), fur: pair(sperm.fur, egg.fur) }
        : { ...parents[0].genotype };
      return {
        id: String(generation + 1) + '-' + index,
        name: names[(generation - 1) % names.length][index],
        genotype,
        sperm,
        egg,
      };
    });
  }

  return { habitats, phenotype, matchingTraits, pair, gamete, founders, breed };
})();

if (typeof module !== 'undefined') module.exports = SurvivalModel;
