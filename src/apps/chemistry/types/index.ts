// ─── Chemical Domain Types ────────────────────────────────────────────────────

export type PhaseType = 'solid' | 'liquid' | 'gas' | 'aqueous';
export type HazardClass = 'none' | 'flammable' | 'corrosive' | 'toxic' | 'oxidizer' | 'irritant' | 'explosive';
export type SolubilityClass = 'soluble' | 'insoluble' | 'slightly_soluble';

export interface Chemical {
  id: string;
  name: string;
  formula: string;
  molarMass: number;          // g/mol
  color: string;              // SVG/CSS color when dissolved
  solidColor: string;         // color as solid
  phase: PhaseType;           // default phase at room temp
  density: number;            // g/mL
  hazards: HazardClass[];
  isAcid: boolean;
  isBase: boolean;
  pKa?: number;               // acid dissociation constant
  pKb?: number;               // base dissociation constant
  solubility: SolubilityClass;
  description: string;
  concentrationDefault?: number; // mol/L for stock solutions
  heatOfFormation?: number;   // kJ/mol (for energy calculations)
}

// ─── Container Types ──────────────────────────────────────────────────────────

export type ContainerType =
  | 'beaker'
  | 'erlenmeyer'
  | 'test_tube'
  | 'graduated_cylinder'
  | 'volumetric_flask'
  | 'burette'
  | 'pipette'
  | 'reagent_bottle'
  | 'wash_bottle'
  | 'crucible';

export interface ChemicalAmount {
  chemicalId: string;
  moles: number;
  concentration?: number; // mol/L if dissolved
}

export interface MixtureState {
  components: ChemicalAmount[];
  totalVolumeML: number;
  solventVolumeML: number;
  pH: number;
  color: string;           // computed display color
  isCloudy: boolean;       // precipitate present
  hasPrecipitate: boolean;
  precipitateColor: string;
  gasEvolved: string[];    // chemical IDs of gases being produced
  isBuffered: boolean;
}

export interface ContainerInstance {
  id: string;
  type: ContainerType;
  label: string;
  capacityML: number;
  mixture: MixtureState | null;
  temperatureC: number;
  isOnHeatSource: boolean;
  isBroken: boolean;
  isSelected: boolean;
  position: { x: number; y: number };
  zIndex: number;
}

// ─── Instrument Types ─────────────────────────────────────────────────────────

export type InstrumentType =
  | 'hot_plate'
  | 'bunsen_burner'
  | 'balance'
  | 'ph_meter'
  | 'thermometer'
  | 'stirrer'
  | 'burette_stand';

export interface InstrumentInstance {
  id: string;
  type: InstrumentType;
  label: string;
  isActive: boolean;
  currentReading?: number;   // for meters
  readingUnit?: string;
  position: { x: number; y: number };
  zIndex: number;
  isSelected: boolean;
  targetContainerId?: string; // which container is being measured/heated
}

// ─── Reaction System ──────────────────────────────────────────────────────────

export type ReactionType =
  | 'acid_base'
  | 'precipitation'
  | 'redox'
  | 'dissolution'
  | 'decomposition'
  | 'combustion'
  | 'complex_formation';

export interface ReactionReactant {
  chemicalId: string;
  stoich: number;
}

export interface ReactionProduct {
  chemicalId: string;
  stoich: number;
  phase: PhaseType;
}

export interface ReactionConditions {
  minTempC?: number;
  maxTempC?: number;
  requiresCatalyst?: string;
  requiresAqueous?: boolean;
  minConcentration?: number;
}

export interface ReactionRule {
  id: string;
  name: string;
  type: ReactionType;
  reactants: ReactionReactant[];
  products: ReactionProduct[];
  conditions: ReactionConditions;
  deltaH: number;         // kJ/mol (negative = exothermic)
  isExothermic: boolean;
  description: string;
  safetyNote?: string;
  colorChange?: string;   // product color
  gasEvolved?: string;    // gas product id if any
  precipitateFormed?: string;
  precipitateColor?: string;
}

// ─── Lab Actions ──────────────────────────────────────────────────────────────

export type LabActionType =
  | 'pour'
  | 'pipette'
  | 'heat'
  | 'cool'
  | 'stir'
  | 'weigh'
  | 'measure_ph'
  | 'measure_temp'
  | 'add_from_inventory'
  | 'titrate'
  | 'dilute'
  | 'dissolve'
  | 'break_container';

export interface PourAction {
  type: 'pour';
  sourceId: string;
  targetId: string;
  volumeML: number;
}

export interface AddChemicalAction {
  type: 'add_from_inventory';
  targetContainerId: string;
  chemicalId: string;
  amount: number;         // moles or grams
  unit: 'mol' | 'g' | 'mL';
  concentration?: number; // if adding solution
}

export interface HeatAction {
  type: 'heat';
  containerId: string;
  targetTempC: number;
}

export interface MeasureAction {
  type: 'measure_ph' | 'measure_temp';
  containerId: string;
  instrumentId: string;
}

export interface StirAction {
  type: 'stir';
  containerId: string;
  duration: number; // seconds
}

export type LabAction = PourAction | AddChemicalAction | HeatAction | MeasureAction | StirAction;

// ─── Events & Logging ─────────────────────────────────────────────────────────

export type LabEventType =
  | 'reaction_start'
  | 'reaction_complete'
  | 'hazard_triggered'
  | 'measurement_taken'
  | 'container_added'
  | 'container_removed'
  | 'chemical_added'
  | 'pour_complete'
  | 'heating_start'
  | 'heating_stop'
  | 'precipitate_formed'
  | 'gas_evolved'
  | 'color_change'
  | 'overfill'
  | 'break_event'
  | 'experiment_step'
  | 'experiment_complete';

export interface LabEvent {
  id: string;
  type: LabEventType;
  timestamp: Date;
  message: string;
  details?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'danger' | 'success';
}

export interface NotebookEntry {
  id: string;
  timestamp: Date;
  category: 'observation' | 'measurement' | 'action' | 'reaction' | 'safety' | 'result';
  text: string;
  data?: Record<string, unknown>;
}

export interface Measurement {
  id: string;
  type: 'pH' | 'temperature' | 'volume' | 'mass' | 'concentration' | 'time';
  value: number;
  unit: string;
  containerId?: string;
  timestamp: Date;
}

export interface HazardEvent {
  id: string;
  type: 'toxic_gas' | 'overheat' | 'incompatible_mix' | 'overfill' | 'spill' | 'broken_glass' | 'violent_reaction';
  severity: 'warning' | 'danger' | 'critical';
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

// ─── Experiment Templates ─────────────────────────────────────────────────────

export type ExperimentCategory =
  | 'acid_base'
  | 'precipitation'
  | 'redox'
  | 'thermochemistry'
  | 'kinetics'
  | 'synthesis'
  | 'qualitative';

export interface ExperimentStep {
  id: string;
  stepNumber: number;
  instruction: string;
  hint?: string;
  expectedAction?: LabActionType;
  expectedContainerId?: string;
  expectedChemicalId?: string;
  validation?: (state: LabState) => boolean;
  completionMessage?: string;
}

export interface ExperimentTemplate {
  id: string;
  name: string;
  category: ExperimentCategory;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  steps: ExperimentStep[];
  initialSetup: {
    containers: Omit<ContainerInstance, 'id' | 'position' | 'zIndex' | 'isSelected'>[];
    chemicals?: AddChemicalAction[];
  };
  learningObjectives: string[];
  safetyNotes: string[];
}

// ─── Top-Level Lab State ──────────────────────────────────────────────────────

export type LabMode = 'sandbox' | 'guided';

export interface GraphDataPoint {
  x: number;
  y: number;
  label?: string;
}

export interface GraphSeries {
  id: string;
  name: string;
  color: string;
  points: GraphDataPoint[];
  xLabel: string;
  yLabel: string;
}

export interface LabState {
  mode: LabMode;
  containers: ContainerInstance[];
  instruments: InstrumentInstance[];
  selectedItemId: string | null;
  selectedItemType: 'container' | 'instrument' | null;
  notebook: NotebookEntry[];
  measurements: Measurement[];
  hazardEvents: HazardEvent[];
  events: LabEvent[];
  currentExperimentId: string | null;
  currentStepIndex: number;
  completedSteps: string[];
  graphs: GraphSeries[];
  showNotebook: boolean;
  showSafetyPanel: boolean;
  showGraphs: boolean;
  reagentPanelOpen: boolean;
  activeTab: 'bench' | 'notebook' | 'graphs';
  nextZIndex: number;
}

// ─── Stoichiometry Results ────────────────────────────────────────────────────

export interface StoichResult {
  limitingReagentId: string;
  excessReagents: { chemicalId: string; excessMoles: number }[];
  products: { chemicalId: string; moles: number; phase: PhaseType }[];
  reactionsMoles: number;       // moles of reaction that occurred
  energyReleased: number;       // kJ (positive = exothermic, negative = endothermic)
}
