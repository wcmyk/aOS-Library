import type { ReactionRule, ChemicalAmount, StoichResult } from '../types';

/**
 * Compute the stoichiometric outcome of applying a reaction rule to a set of
 * available chemical amounts.
 *
 * Returns the limiting reagent, products formed, excess amounts, and energy.
 */
export function applyStoichiometry(
  rule: ReactionRule,
  available: Map<string, number>, // chemicalId -> moles available
): StoichResult | null {
  // 1. Determine how many times the reaction can proceed (moles of reaction ξ)
  let xi = Infinity;
  let limitingId = '';

  for (const reactant of rule.reactants) {
    const avail = available.get(reactant.chemicalId) ?? 0;
    const possible = avail / reactant.stoich;
    if (possible < xi) {
      xi = possible;
      limitingId = reactant.chemicalId;
    }
  }

  if (!isFinite(xi) || xi <= 1e-12) return null;

  // 2. Calculate excess amounts
  const excessReagents = rule.reactants
    .filter((r) => r.chemicalId !== limitingId)
    .map((r) => {
      const avail = available.get(r.chemicalId) ?? 0;
      const consumed = r.stoich * xi;
      return { chemicalId: r.chemicalId, excessMoles: Math.max(0, avail - consumed) };
    });

  // 3. Calculate product amounts
  const products = rule.products.map((p) => ({
    chemicalId: p.chemicalId,
    moles: p.stoich * xi,
    phase: p.phase,
  }));

  // 4. Energy (kJ) — negative deltaH means exothermic → energy released
  const energyReleased = -rule.deltaH * xi; // positive = exothermic = heat released

  return {
    limitingReagentId: limitingId,
    excessReagents,
    products,
    reactionsMoles: xi,
    energyReleased,
  };
}

/**
 * Compute the pH of a mixture based on strong-acid / strong-base moles in
 * a given volume. Returns pH on the 0–14 scale.
 */
export function computePH(
  components: ChemicalAmount[],
  totalVolumeML: number,
): number {
  if (totalVolumeML < 0.001) return 7.0;

  const V = totalVolumeML / 1000; // convert to litres

  // Identify strong acids and bases
  const STRONG_ACIDS = new Set(['HCl', 'HNO3', 'H2SO4']);
  const STRONG_BASES = new Set(['NaOH', 'KOH', 'Ca_OH_2']);
  // Weak acids / bases
  const WEAK_ACIDS: Record<string, number> = { CH3COOH: 4.76 };
  const WEAK_BASES: Record<string, number> = { NH3: 4.74 };

  let H_strong = 0;   // moles H⁺ from strong acids
  let OH_strong = 0;  // moles OH⁻ from strong bases

  for (const comp of components) {
    const conc = comp.moles / V;
    if (STRONG_ACIDS.has(comp.chemicalId)) {
      // H₂SO₄ is diprotic
      H_strong += comp.chemicalId === 'H2SO4' ? comp.moles * 2 : comp.moles;
    }
    if (STRONG_BASES.has(comp.chemicalId)) {
      // Ca(OH)₂ provides 2 OH⁻
      OH_strong += comp.chemicalId === 'Ca_OH_2' ? comp.moles * 2 : comp.moles;
      void conc; // used above
    }
    // Weak contributions are approximated via buffer equations below
    void WEAK_ACIDS;
    void WEAK_BASES;
  }

  const net = H_strong - OH_strong; // moles excess H⁺ or OH⁻

  if (Math.abs(net) < 1e-12) {
    // Near-neutral; check for weak acid/base contributions
    let weakH = 0;
    for (const comp of components) {
      const pKa = WEAK_ACIDS[comp.chemicalId];
      if (pKa !== undefined) {
        const Ka = Math.pow(10, -pKa);
        const C = comp.moles / V;
        // [H+] ≈ sqrt(Ka * C) for weak acid
        weakH += Math.sqrt(Ka * Math.max(C, 1e-10));
      }
      const pKb = WEAK_BASES[comp.chemicalId];
      if (pKb !== undefined) {
        const Kb = Math.pow(10, -pKb);
        const C = comp.moles / V;
        const OH = Math.sqrt(Kb * Math.max(C, 1e-10));
        weakH -= OH; // subtract H⁺ equivalents
      }
    }
    const totalH = 1e-7 + weakH; // add water autoionisation
    const pH = totalH > 0 ? -Math.log10(Math.max(totalH, 1e-14)) : 7.0;
    return Math.max(0, Math.min(14, pH));
  }

  if (net > 0) {
    // Excess acid
    const H_conc = net / V;
    return Math.max(0, -Math.log10(Math.max(H_conc, 1e-14)));
  } else {
    // Excess base
    const OH_conc = (-net) / V;
    const pOH = Math.max(0, -Math.log10(Math.max(OH_conc, 1e-14)));
    return Math.min(14, 14 - pOH);
  }
}

/**
 * Compute temperature change from energy released into a liquid volume.
 * Uses q = m·c·ΔT, with c = 4.184 J/(g·K) for aqueous solutions.
 */
export function computeTempChange(
  energyKJ: number,
  massGrams: number,
  specificHeat = 4.184,
): number {
  if (massGrams < 0.01) return 0;
  return (energyKJ * 1000) / (massGrams * specificHeat);
}
