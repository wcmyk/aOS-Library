import type { ReactionRule } from '../types';

// ─── Reaction Rule Table ──────────────────────────────────────────────────────
// Rules are checked by the chemistry engine after each mixing event.
// Stoichiometry is applied based on limiting reagent logic.

export const REACTION_RULES: ReactionRule[] = [

  // ── Acid–Base Neutralizations ─────────────────────────────────────────────

  {
    id: 'hcl_naoh',
    name: 'HCl + NaOH Neutralization',
    type: 'acid_base',
    reactants: [
      { chemicalId: 'HCl',  stoich: 1 },
      { chemicalId: 'NaOH', stoich: 1 },
    ],
    products: [
      { chemicalId: 'NaCl', stoich: 1, phase: 'aqueous' },
      { chemicalId: 'H2O',  stoich: 1, phase: 'liquid' },
    ],
    conditions: { requiresAqueous: true },
    deltaH: -57.3,
    isExothermic: true,
    description: 'Classic strong acid–strong base neutralization.',
    colorChange: 'rgba(160,210,255,0.28)',
  },
  {
    id: 'hcl_koh',
    name: 'HCl + KOH Neutralization',
    type: 'acid_base',
    reactants: [
      { chemicalId: 'HCl', stoich: 1 },
      { chemicalId: 'KOH', stoich: 1 },
    ],
    products: [
      { chemicalId: 'NaCl', stoich: 1, phase: 'aqueous' }, // reusing NaCl as KCl proxy
      { chemicalId: 'H2O',  stoich: 1, phase: 'liquid' },
    ],
    conditions: { requiresAqueous: true },
    deltaH: -57.3,
    isExothermic: true,
    description: 'Strong acid–strong base neutralization.',
    colorChange: 'rgba(160,210,255,0.28)',
  },
  {
    id: 'h2so4_naoh',
    name: 'H₂SO₄ + 2 NaOH Neutralization',
    type: 'acid_base',
    reactants: [
      { chemicalId: 'H2SO4', stoich: 1 },
      { chemicalId: 'NaOH',  stoich: 2 },
    ],
    products: [
      { chemicalId: 'K2SO4', stoich: 1, phase: 'aqueous' }, // Na₂SO₄ proxy
      { chemicalId: 'H2O',   stoich: 2, phase: 'liquid' },
    ],
    conditions: { requiresAqueous: true },
    deltaH: -114.6,
    isExothermic: true,
    description: 'Diprotic acid neutralization.',
    colorChange: 'rgba(160,210,255,0.28)',
  },
  {
    id: 'ch3cooh_naoh',
    name: 'CH₃COOH + NaOH',
    type: 'acid_base',
    reactants: [
      { chemicalId: 'CH3COOH', stoich: 1 },
      { chemicalId: 'NaOH',    stoich: 1 },
    ],
    products: [
      { chemicalId: 'NaCl', stoich: 1, phase: 'aqueous' }, // acetate salt proxy
      { chemicalId: 'H2O',  stoich: 1, phase: 'liquid' },
    ],
    conditions: { requiresAqueous: true },
    deltaH: -55.8,
    isExothermic: true,
    description: 'Weak acid–strong base neutralization; produces buffer region.',
    colorChange: 'rgba(160,210,255,0.28)',
  },
  {
    id: 'hcl_nh3',
    name: 'HCl + NH₃',
    type: 'acid_base',
    reactants: [
      { chemicalId: 'HCl', stoich: 1 },
      { chemicalId: 'NH3', stoich: 1 },
    ],
    products: [
      { chemicalId: 'NaCl', stoich: 1, phase: 'aqueous' }, // ammonium chloride proxy
      { chemicalId: 'H2O',  stoich: 1, phase: 'liquid' },
    ],
    conditions: { requiresAqueous: true },
    deltaH: -51.0,
    isExothermic: true,
    description: 'Strong acid–weak base neutralization.',
    colorChange: 'rgba(160,210,255,0.28)',
  },

  // ── Acid + Carbonate ──────────────────────────────────────────────────────

  {
    id: 'hcl_caco3',
    name: 'HCl + CaCO₃',
    type: 'acid_base',
    reactants: [
      { chemicalId: 'HCl',   stoich: 2 },
      { chemicalId: 'CaCO3', stoich: 1 },
    ],
    products: [
      { chemicalId: 'NaCl', stoich: 1, phase: 'aqueous' }, // CaCl₂ proxy
      { chemicalId: 'H2O',  stoich: 1, phase: 'liquid' },
      { chemicalId: 'CO2',  stoich: 1, phase: 'gas' },
    ],
    conditions: { requiresAqueous: true },
    deltaH: -15.0,
    isExothermic: false,
    description: 'Acid reacts with limestone; CO₂ bubbles produced.',
    gasEvolved: 'CO2',
    colorChange: 'rgba(160,210,255,0.28)',
  },
  {
    id: 'hcl_na2co3',
    name: 'HCl + Na₂CO₃',
    type: 'acid_base',
    reactants: [
      { chemicalId: 'HCl',    stoich: 2 },
      { chemicalId: 'Na2CO3', stoich: 1 },
    ],
    products: [
      { chemicalId: 'NaCl', stoich: 2, phase: 'aqueous' },
      { chemicalId: 'H2O',  stoich: 1, phase: 'liquid' },
      { chemicalId: 'CO2',  stoich: 1, phase: 'gas' },
    ],
    conditions: { requiresAqueous: true },
    deltaH: -20.0,
    isExothermic: false,
    description: 'Soda ash with HCl; vigorous CO₂ evolution.',
    gasEvolved: 'CO2',
    colorChange: 'rgba(160,210,255,0.28)',
  },

  // ── Precipitation Reactions ───────────────────────────────────────────────

  {
    id: 'bacl2_na2so4',
    name: 'BaCl₂ + Na₂SO₄ → BaSO₄↓',
    type: 'precipitation',
    reactants: [
      { chemicalId: 'BaCl2',  stoich: 1 },
      { chemicalId: 'Na2SO4', stoich: 1 },
    ],
    products: [
      { chemicalId: 'BaSO4', stoich: 1, phase: 'solid' },
      { chemicalId: 'NaCl',  stoich: 2, phase: 'aqueous' },
    ],
    conditions: { requiresAqueous: true },
    deltaH: -19.3,
    isExothermic: false,
    description: 'White BaSO₄ precipitate; sulfate qualitative test.',
    precipitateFormed: 'BaSO4',
    precipitateColor: '#ffffff',
    colorChange: 'rgba(160,210,255,0.28)',
  },
  {
    id: 'agno3_nacl',
    name: 'AgNO₃ + NaCl → AgCl↓',
    type: 'precipitation',
    reactants: [
      { chemicalId: 'AgNO3', stoich: 1 },
      { chemicalId: 'NaCl',  stoich: 1 },
    ],
    products: [
      { chemicalId: 'AgCl',  stoich: 1, phase: 'solid' },
      { chemicalId: 'NaCl',  stoich: 1, phase: 'aqueous' }, // NaNO₃ proxy
    ],
    conditions: { requiresAqueous: true },
    deltaH: -65.5,
    isExothermic: false,
    description: 'White/cream AgCl precipitate; chloride qualitative test.',
    precipitateFormed: 'AgCl',
    precipitateColor: '#e8e8e8',
    colorChange: 'rgba(160,210,255,0.28)',
  },
  {
    id: 'pb_no3_2_ki',
    name: 'Pb(NO₃)₂ + 2KI → PbI₂↓',
    type: 'precipitation',
    reactants: [
      { chemicalId: 'Pb_NO3_2', stoich: 1 },
      { chemicalId: 'KI',       stoich: 2 },
    ],
    products: [
      { chemicalId: 'PbI2', stoich: 1, phase: 'solid' },
      { chemicalId: 'NaCl', stoich: 2, phase: 'aqueous' }, // KNO₃ proxy
    ],
    conditions: { requiresAqueous: true },
    deltaH: -30.0,
    isExothermic: false,
    description: 'Spectacular yellow PbI₂ precipitate — "golden rain" demo.',
    precipitateFormed: 'PbI2',
    precipitateColor: '#f5d020',
    colorChange: 'rgba(245,208,32,0.3)',
  },

  // ── Simple Redox ─────────────────────────────────────────────────────────

  {
    id: 'kmno4_h2so4_reduction',
    name: 'KMnO₄ reduction (acidic)',
    type: 'redox',
    reactants: [
      { chemicalId: 'KMnO4', stoich: 2 },
      { chemicalId: 'H2SO4', stoich: 5 },
    ],
    products: [
      { chemicalId: 'NaCl',  stoich: 1, phase: 'aqueous' }, // MnSO₄ proxy
      { chemicalId: 'H2O',   stoich: 8, phase: 'liquid' },
    ],
    conditions: { requiresAqueous: true, minConcentration: 0.01 },
    deltaH: -100.0,
    isExothermic: true,
    description: 'Permanganate decolorized to pale Mn²⁺ in acid; intense color loss.',
    colorChange: 'rgba(160,210,255,0.28)',
  },
];

/** Return all rules that could potentially apply given the chemical IDs present */
export function findApplicableRules(chemicalIds: Set<string>): ReactionRule[] {
  return REACTION_RULES.filter((rule) =>
    rule.reactants.every((r) => chemicalIds.has(r.chemicalId)),
  );
}
