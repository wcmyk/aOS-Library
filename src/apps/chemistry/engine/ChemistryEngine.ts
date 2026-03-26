/**
 * ChemistryEngine – core simulation logic
 *
 * Processes lab actions and produces updated container state, new lab events,
 * notebook entries, and hazard events. Pure functions (no side effects) so
 * the engine can be unit-tested in isolation.
 */

import type {
  ContainerInstance,
  ChemicalAmount,
  MixtureState,
  LabEvent,
  NotebookEntry,
  HazardEvent,
  StoichResult,
} from '../types';
import { CHEMICALS, computeMixtureColor } from '../data/chemicals';
import { findApplicableRules } from '../data/reactions';
import { applyStoichiometry, computePH, computeTempChange } from './stoichiometry';

// ─── Unique ID Generator ──────────────────────────────────────────────────────

let _counter = 0;
export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${++_counter}`;
}

// ─── Mixture Helpers ──────────────────────────────────────────────────────────

export function emptyMixture(volumeML = 0): MixtureState {
  return {
    components: [],
    totalVolumeML: volumeML,
    solventVolumeML: volumeML,
    pH: 7.0,
    color: volumeML > 0 ? 'rgba(160,210,255,0.28)' : 'transparent',
    isCloudy: false,
    hasPrecipitate: false,
    precipitateColor: '#ffffff',
    gasEvolved: [],
    isBuffered: false,
  };
}

/** Merge two mixtures and recompute all derived properties */
export function mergeMixtures(a: MixtureState, b: MixtureState): MixtureState {
  const merged = new Map<string, number>();
  for (const c of a.components) merged.set(c.chemicalId, (merged.get(c.chemicalId) ?? 0) + c.moles);
  for (const c of b.components) merged.set(c.chemicalId, (merged.get(c.chemicalId) ?? 0) + c.moles);

  const components: ChemicalAmount[] = Array.from(merged.entries())
    .filter(([, m]) => m > 1e-14)
    .map(([chemicalId, moles]) => ({ chemicalId, moles }));

  const totalVolumeML = a.totalVolumeML + b.totalVolumeML;
  const pH = computePH(components, totalVolumeML);
  const color = computeMixtureColor(components, totalVolumeML, pH);

  return {
    components,
    totalVolumeML,
    solventVolumeML: a.solventVolumeML + b.solventVolumeML,
    pH,
    color,
    isCloudy: a.isCloudy || b.isCloudy,
    hasPrecipitate: a.hasPrecipitate || b.hasPrecipitate,
    precipitateColor: a.hasPrecipitate ? a.precipitateColor : b.precipitateColor,
    gasEvolved: [...new Set([...a.gasEvolved, ...b.gasEvolved])],
    isBuffered: false,
  };
}

// ─── Reaction Processing ──────────────────────────────────────────────────────

interface ReactionOutcome {
  mixture: MixtureState;
  events: LabEvent[];
  notes: NotebookEntry[];
  tempDelta: number;
}

export function processReactions(
  mixture: MixtureState,
  containerTempC: number,
): ReactionOutcome {
  const events: LabEvent[] = [];
  const notes: NotebookEntry[] = [];
  let tempDelta = 0;
  let current = { ...mixture, components: [...mixture.components] };

  const presentIds = new Set(current.components.map((c) => c.chemicalId));
  const applicableRules = findApplicableRules(presentIds);

  for (const rule of applicableRules) {
    // Check temperature condition
    if (rule.conditions.minTempC !== undefined && containerTempC < rule.conditions.minTempC) continue;
    if (rule.conditions.maxTempC !== undefined && containerTempC > rule.conditions.maxTempC) continue;

    const availMap = new Map<string, number>();
    for (const comp of current.components) availMap.set(comp.chemicalId, comp.moles);

    const result: StoichResult | null = applyStoichiometry(rule, availMap);
    if (!result || result.reactionsMoles < 1e-12) continue;

    // Apply stoichiometry: remove reactants, add products
    const newComponents = new Map<string, number>(
      current.components.map((c) => [c.chemicalId, c.moles]),
    );

    for (const reactant of rule.reactants) {
      const consumed = reactant.stoich * result.reactionsMoles;
      const remaining = (newComponents.get(reactant.chemicalId) ?? 0) - consumed;
      if (remaining < 1e-14) newComponents.delete(reactant.chemicalId);
      else newComponents.set(reactant.chemicalId, remaining);
    }

    for (const product of result.products) {
      if (product.phase === 'gas') {
        // Track gas evolution but don't add to liquid components
        if (!current.gasEvolved.includes(product.chemicalId)) {
          current = { ...current, gasEvolved: [...current.gasEvolved, product.chemicalId] };
          events.push({
            id: uid('evt'),
            type: 'gas_evolved',
            timestamp: new Date(),
            message: `Gas evolved: ${CHEMICALS[product.chemicalId]?.name ?? product.chemicalId}`,
            severity: 'warning',
          });
          notes.push({
            id: uid('note'),
            timestamp: new Date(),
            category: 'reaction',
            text: `Gas evolution detected: ${CHEMICALS[product.chemicalId]?.formula ?? product.chemicalId} (${rule.name})`,
          });
        }
        continue;
      }
      const existing = newComponents.get(product.chemicalId) ?? 0;
      newComponents.set(product.chemicalId, existing + product.moles);
    }

    const components: ChemicalAmount[] = Array.from(newComponents.entries())
      .filter(([, m]) => m > 1e-14)
      .map(([chemicalId, moles]) => ({ chemicalId, moles }));

    // Temperature change
    const massG = current.totalVolumeML * 1.0; // assume density ~1 g/mL
    const dT = computeTempChange(result.energyReleased, massG);
    tempDelta += dT;

    // Precipitate
    let hasPrecipitate = current.hasPrecipitate;
    let precipitateColor = current.precipitateColor;
    if (rule.precipitateFormed) {
      hasPrecipitate = true;
      precipitateColor = rule.precipitateColor ?? '#ffffff';
      events.push({
        id: uid('evt'),
        type: 'precipitate_formed',
        timestamp: new Date(),
        message: `Precipitate formed: ${CHEMICALS[rule.precipitateFormed]?.name ?? rule.precipitateFormed}`,
        severity: 'info',
      });
    }

    const pH = computePH(components, current.totalVolumeML);
    const color = rule.colorChange ?? computeMixtureColor(components, current.totalVolumeML, pH);

    current = {
      ...current,
      components,
      pH,
      color,
      hasPrecipitate,
      precipitateColor,
      isCloudy: hasPrecipitate,
    };

    events.push({
      id: uid('evt'),
      type: 'reaction_complete',
      timestamp: new Date(),
      message: `Reaction: ${rule.name}`,
      details: {
        ruleId: rule.id,
        molesReacted: result.reactionsMoles,
        energyKJ: result.energyReleased,
        isExothermic: rule.isExothermic,
      },
      severity: rule.isExothermic ? 'warning' : 'success',
    });

    notes.push({
      id: uid('note'),
      timestamp: new Date(),
      category: 'reaction',
      text: `${rule.name}: ξ = ${result.reactionsMoles.toFixed(4)} mol, ΔT ≈ ${dT.toFixed(1)}°C${rule.isExothermic ? ' (exothermic)' : ''}`,
      data: { ruleId: rule.id, xi: result.reactionsMoles },
    });
  }

  return { mixture: current, events, notes, tempDelta };
}

// ─── Pour Operation ───────────────────────────────────────────────────────────

export interface PourResult {
  sourceContainer: ContainerInstance;
  targetContainer: ContainerInstance;
  events: LabEvent[];
  notes: NotebookEntry[];
  hazards: HazardEvent[];
  tempDelta: number;
}

export function executePour(
  source: ContainerInstance,
  target: ContainerInstance,
  volumeML: number,
): PourResult {
  const events: LabEvent[] = [];
  const notes: NotebookEntry[] = [];
  const hazards: HazardEvent[] = [];

  if (!source.mixture || source.mixture.totalVolumeML < 0.1) {
    events.push({ id: uid('evt'), type: 'reaction_start', timestamp: new Date(), message: 'Source container is empty.', severity: 'warning' });
    return { sourceContainer: source, targetContainer: target, events, notes, hazards, tempDelta: 0 };
  }

  const pourableVol = Math.min(volumeML, source.mixture.totalVolumeML);
  const fraction = pourableVol / source.mixture.totalVolumeML;

  // Fraction of mixture being poured
  const pouredComponents: ChemicalAmount[] = source.mixture.components.map((c) => ({
    chemicalId: c.chemicalId,
    moles: c.moles * fraction,
  }));
  const pouredMixture: MixtureState = {
    ...source.mixture,
    components: pouredComponents,
    totalVolumeML: pourableVol,
    solventVolumeML: source.mixture.solventVolumeML * fraction,
  };

  // Remaining in source
  const remainingComponents: ChemicalAmount[] = source.mixture.components.map((c) => ({
    chemicalId: c.chemicalId,
    moles: c.moles * (1 - fraction),
  }));
  const remainingVol = source.mixture.totalVolumeML - pourableVol;
  const remainingPH = computePH(remainingComponents, remainingVol);

  const updatedSource: ContainerInstance = {
    ...source,
    mixture: remainingVol < 0.5
      ? null
      : {
          ...source.mixture,
          components: remainingComponents,
          totalVolumeML: remainingVol,
          pH: remainingPH,
          color: computeMixtureColor(remainingComponents, remainingVol, remainingPH),
        },
  };

  // Check for overfill
  const targetCurrent = target.mixture?.totalVolumeML ?? 0;
  const wouldFill = targetCurrent + pourableVol;
  let overfill = false;
  if (wouldFill > target.capacityML) {
    overfill = true;
    hazards.push({
      id: uid('haz'),
      type: 'overfill',
      severity: 'warning',
      message: `${target.label} would overflow. Only ${(target.capacityML - targetCurrent).toFixed(1)} mL available.`,
      timestamp: new Date(),
      dismissed: false,
    });
  }

  // Merge
  const targetMixture = target.mixture ?? emptyMixture(0);
  const mergedBefore = mergeMixtures(targetMixture, pouredMixture);

  // Process reactions
  const outcome = processReactions(mergedBefore, target.temperatureC);
  events.push(...outcome.events);
  notes.push(...outcome.notes);

  // Hazard: incompatible mixture check (toxic gas, extreme temp)
  const hasToxicGas = outcome.mixture.gasEvolved.some((g) => {
    const chem = CHEMICALS[g];
    return chem && chem.hazards.includes('toxic');
  });
  if (hasToxicGas) {
    hazards.push({
      id: uid('haz'),
      type: 'toxic_gas',
      severity: 'danger',
      message: 'Toxic gas detected in mixture! Ensure proper ventilation.',
      timestamp: new Date(),
      dismissed: false,
    });
  }
  if (outcome.tempDelta > 30) {
    hazards.push({
      id: uid('haz'),
      type: 'violent_reaction',
      severity: 'warning',
      message: `Highly exothermic reaction detected (+${outcome.tempDelta.toFixed(1)}°C). Handle with care.`,
      timestamp: new Date(),
      dismissed: false,
    });
  }

  const finalVol = Math.min(wouldFill, overfill ? target.capacityML : wouldFill);
  const finalMixture: MixtureState = {
    ...outcome.mixture,
    totalVolumeML: finalVol,
  };

  const updatedTarget: ContainerInstance = {
    ...target,
    mixture: finalMixture,
    temperatureC: target.temperatureC + outcome.tempDelta,
  };

  notes.push({
    id: uid('note'),
    timestamp: new Date(),
    category: 'action',
    text: `Poured ${pourableVol.toFixed(1)} mL from ${source.label} → ${target.label}. pH = ${finalMixture.pH.toFixed(2)}`,
  });

  return { sourceContainer: updatedSource, targetContainer: updatedTarget, events, notes, hazards, tempDelta: outcome.tempDelta };
}

// ─── Add Chemical ─────────────────────────────────────────────────────────────

export interface AddChemResult {
  container: ContainerInstance;
  events: LabEvent[];
  notes: NotebookEntry[];
  hazards: HazardEvent[];
}

export function executeAddChemical(
  container: ContainerInstance,
  chemicalId: string,
  amount: number,
  unit: 'mol' | 'g' | 'mL',
  concentration?: number,
): AddChemResult {
  const events: LabEvent[] = [];
  const notes: NotebookEntry[] = [];
  const hazards: HazardEvent[] = [];

  const chem = CHEMICALS[chemicalId];
  if (!chem) {
    events.push({ id: uid('evt'), type: 'reaction_start', timestamp: new Date(), message: `Unknown chemical: ${chemicalId}`, severity: 'warning' });
    return { container, events, notes, hazards };
  }

  let moles: number;
  let addVolumeML: number;

  if (unit === 'mol') {
    moles = amount;
    addVolumeML = chem.phase === 'liquid' || chem.phase === 'aqueous'
      ? (moles * chem.molarMass) / chem.density
      : 0;
  } else if (unit === 'g') {
    moles = amount / chem.molarMass;
    addVolumeML = chem.phase === 'liquid' ? amount / chem.density : 0;
  } else {
    // mL — add as solution at given concentration
    addVolumeML = amount;
    const conc = concentration ?? chem.concentrationDefault ?? 1.0;
    moles = conc * (addVolumeML / 1000);
  }

  const existing = container.mixture ?? emptyMixture(0);
  const newTotalVol = existing.totalVolumeML + addVolumeML;

  if (newTotalVol > container.capacityML * 1.02) {
    hazards.push({
      id: uid('haz'),
      type: 'overfill',
      severity: 'warning',
      message: `${container.label}: Adding ${addVolumeML.toFixed(1)} mL would exceed capacity.`,
      timestamp: new Date(),
      dismissed: false,
    });
  }

  const prevComponents = [...existing.components];
  const idx = prevComponents.findIndex((c) => c.chemicalId === chemicalId);
  if (idx >= 0) {
    prevComponents[idx] = { ...prevComponents[idx], moles: prevComponents[idx].moles + moles };
  } else {
    prevComponents.push({ chemicalId, moles });
  }

  const pH = computePH(prevComponents, Math.max(newTotalVol, 0.1));
  const color = computeMixtureColor(prevComponents, newTotalVol, pH);

  const preliminary: MixtureState = {
    ...existing,
    components: prevComponents,
    totalVolumeML: Math.min(newTotalVol, container.capacityML),
    pH,
    color,
  };

  const outcome = processReactions(preliminary, container.temperatureC);
  events.push(...outcome.events);
  notes.push(...outcome.notes);

  notes.push({
    id: uid('note'),
    timestamp: new Date(),
    category: 'action',
    text: `Added ${moles.toFixed(4)} mol ${chem.name} (${addVolumeML > 0 ? addVolumeML.toFixed(1) + ' mL' : amount + ' ' + unit}) to ${container.label}`,
    data: { chemicalId, moles, volume: addVolumeML },
  });

  events.push({
    id: uid('evt'),
    type: 'chemical_added',
    timestamp: new Date(),
    message: `${chem.name} added to ${container.label}`,
    severity: 'info',
  });

  return {
    container: {
      ...container,
      mixture: outcome.mixture,
      temperatureC: container.temperatureC + outcome.tempDelta,
    },
    events,
    notes,
    hazards,
  };
}

// ─── Heating ──────────────────────────────────────────────────────────────────

export function executeHeat(
  container: ContainerInstance,
  targetTempC: number,
): { container: ContainerInstance; events: LabEvent[]; notes: NotebookEntry[]; hazards: HazardEvent[] } {
  const events: LabEvent[] = [];
  const notes: NotebookEntry[] = [];
  const hazards: HazardEvent[] = [];

  if (targetTempC > 200) {
    hazards.push({
      id: uid('haz'),
      type: 'overheat',
      severity: 'danger',
      message: `Dangerously high temperature (${targetTempC}°C). Risk of boiling or container failure.`,
      timestamp: new Date(),
      dismissed: false,
    });
  }

  // Check for volatile hazardous components
  if (container.mixture) {
    const flammable = container.mixture.components.find((c) => {
      const chem = CHEMICALS[c.chemicalId];
      return chem?.hazards.includes('flammable') && targetTempC > 60;
    });
    if (flammable) {
      hazards.push({
        id: uid('haz'),
        type: 'overheat',
        severity: 'warning',
        message: `Flammable component present: ${CHEMICALS[flammable.chemicalId]?.name}. Avoid open flames.`,
        timestamp: new Date(),
        dismissed: false,
      });
    }
  }

  // Re-run reactions at new temperature (may trigger temperature-dependent rules)
  let updatedMixture = container.mixture;
  if (updatedMixture) {
    const outcome = processReactions(updatedMixture, targetTempC);
    updatedMixture = outcome.mixture;
    events.push(...outcome.events);
    notes.push(...outcome.notes);
  }

  notes.push({
    id: uid('note'),
    timestamp: new Date(),
    category: 'action',
    text: `${container.label} heated to ${targetTempC.toFixed(1)}°C`,
  });

  events.push({
    id: uid('evt'),
    type: 'heating_start',
    timestamp: new Date(),
    message: `${container.label} heated to ${targetTempC.toFixed(1)}°C`,
    severity: targetTempC > 150 ? 'warning' : 'info',
  });

  return {
    container: {
      ...container,
      temperatureC: targetTempC,
      isOnHeatSource: true,
      mixture: updatedMixture,
    },
    events,
    notes,
    hazards,
  };
}

// ─── pH Measurement ───────────────────────────────────────────────────────────

export function measurePH(
  container: ContainerInstance,
): { pH: number; notes: NotebookEntry[]; events: LabEvent[] } {
  const pH = container.mixture?.pH ?? 7.0;
  const notes: NotebookEntry[] = [{
    id: uid('note'),
    timestamp: new Date(),
    category: 'measurement',
    text: `pH of ${container.label}: ${pH.toFixed(2)}`,
    data: { containerId: container.id, pH },
  }];
  const events: LabEvent[] = [{
    id: uid('evt'),
    type: 'measurement_taken',
    timestamp: new Date(),
    message: `pH measured: ${pH.toFixed(2)} (${container.label})`,
    severity: 'info',
  }];
  return { pH, notes, events };
}

// ─── Temperature Measurement ──────────────────────────────────────────────────

export function measureTemp(
  container: ContainerInstance,
): { tempC: number; notes: NotebookEntry[]; events: LabEvent[] } {
  const tempC = container.temperatureC;
  const notes: NotebookEntry[] = [{
    id: uid('note'),
    timestamp: new Date(),
    category: 'measurement',
    text: `Temperature of ${container.label}: ${tempC.toFixed(1)} °C`,
    data: { containerId: container.id, tempC },
  }];
  const events: LabEvent[] = [{
    id: uid('evt'),
    type: 'measurement_taken',
    timestamp: new Date(),
    message: `Temperature: ${tempC.toFixed(1)} °C (${container.label})`,
    severity: 'info',
  }];
  return { tempC, notes, events };
}
