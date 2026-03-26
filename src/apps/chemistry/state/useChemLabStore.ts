import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LabState,
  ContainerInstance,
  InstrumentInstance,
  LabMode,
  NotebookEntry,
  Measurement,
  HazardEvent,
  LabEvent,
  GraphSeries,
  GraphDataPoint,
  ContainerType,
  InstrumentType,
} from '../types';
import {
  uid,
  executePour,
  executeAddChemical,
  executeHeat,
  measurePH,
  measureTemp,
  emptyMixture,
} from '../engine/ChemistryEngine';
import { EXPERIMENT_TEMPLATES } from '../data/experiments';

// ─── Default Instrument Positions ─────────────────────────────────────────────

const DEFAULT_INSTRUMENTS: InstrumentInstance[] = [
  { id: uid('inst'), type: 'hot_plate',    label: 'Hot Plate',     isActive: false, position: { x: 680, y: 320 }, zIndex: 1, isSelected: false },
  { id: uid('inst'), type: 'balance',      label: 'Balance',       isActive: false, position: { x: 80,  y: 320 }, zIndex: 1, isSelected: false },
  { id: uid('inst'), type: 'bunsen_burner',label: 'Burner',        isActive: false, position: { x: 580, y: 330 }, zIndex: 1, isSelected: false },
  { id: uid('inst'), type: 'burette_stand',label: 'Burette Stand', isActive: false, position: { x: 380, y: 200 }, zIndex: 1, isSelected: false },
];

// ─── Initial State ────────────────────────────────────────────────────────────

const INITIAL_STATE: LabState = {
  mode: 'sandbox',
  containers: [],
  instruments: DEFAULT_INSTRUMENTS,
  selectedItemId: null,
  selectedItemType: null,
  notebook: [],
  measurements: [],
  hazardEvents: [],
  events: [],
  currentExperimentId: null,
  currentStepIndex: 0,
  completedSteps: [],
  graphs: [],
  showNotebook: false,
  showSafetyPanel: false,
  showGraphs: false,
  reagentPanelOpen: true,
  activeTab: 'bench',
  nextZIndex: 10,
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface ChemLabStore extends LabState {
  // Container management
  addContainer: (type: ContainerType, capacityML: number, label?: string, position?: { x: number; y: number }) => ContainerInstance;
  removeContainer: (id: string) => void;
  moveContainer: (id: string, position: { x: number; y: number }) => void;
  selectItem: (id: string | null, itemType: 'container' | 'instrument' | null) => void;
  bringToFront: (id: string) => void;

  // Chemistry actions
  pourChemical: (sourceId: string, targetId: string, volumeML: number) => void;
  addChemicalToContainer: (containerId: string, chemicalId: string, amount: number, unit: 'mol' | 'g' | 'mL', concentration?: number) => void;
  heatContainer: (containerId: string, targetTempC: number) => void;
  coolContainer: (containerId: string) => void;
  measureContainerPH: (containerId: string) => number;
  measureContainerTemp: (containerId: string) => number;
  clearContainer: (containerId: string) => void;

  // Instrument actions
  activateInstrument: (id: string) => void;
  deactivateInstrument: (id: string) => void;
  moveInstrument: (id: string, position: { x: number; y: number }) => void;

  // Notebook & Events
  addNotebookEntry: (entry: Omit<NotebookEntry, 'id' | 'timestamp'>) => void;
  addMeasurement: (m: Omit<Measurement, 'id' | 'timestamp'>) => void;
  dismissHazard: (id: string) => void;
  clearAllHazards: () => void;

  // Graphs
  addGraphPoint: (seriesId: string, point: GraphDataPoint) => void;
  createGraphSeries: (series: Omit<GraphSeries, 'points'>) => void;
  clearGraphSeries: (seriesId: string) => void;

  // Mode & Experiments
  setMode: (mode: LabMode) => void;
  startExperiment: (id: string) => void;
  advanceStep: () => void;
  completeStep: (stepId: string) => void;
  abandonExperiment: () => void;

  // UI state
  setShowNotebook: (v: boolean) => void;
  setShowGraphs: (v: boolean) => void;
  setShowSafety: (v: boolean) => void;
  setActiveTab: (tab: 'bench' | 'notebook' | 'graphs') => void;
  setReagentPanelOpen: (v: boolean) => void;

  // Reset
  resetLab: () => void;
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useChemLabStore = create<ChemLabStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Container Management ────────────────────────────────────────────────

      addContainer(type, capacityML, label, position) {
        const { nextZIndex, containers } = get();
        const names: Record<ContainerType, string> = {
          beaker: 'Beaker',
          erlenmeyer: 'Erlenmeyer Flask',
          test_tube: 'Test Tube',
          graduated_cylinder: 'Grad. Cylinder',
          volumetric_flask: 'Volumetric Flask',
          burette: 'Burette',
          pipette: 'Pipette',
          reagent_bottle: 'Reagent Bottle',
          wash_bottle: 'Wash Bottle',
          crucible: 'Crucible',
        };
        const newContainer: ContainerInstance = {
          id: uid('cont'),
          type,
          label: label ?? `${names[type]} ${containers.length + 1}`,
          capacityML,
          mixture: null,
          temperatureC: 22,
          isOnHeatSource: false,
          isBroken: false,
          isSelected: false,
          position: position ?? { x: 200 + Math.random() * 300, y: 200 + Math.random() * 150 },
          zIndex: nextZIndex,
        };
        const entry: NotebookEntry = {
          id: uid('note'),
          timestamp: new Date(),
          category: 'action',
          text: `Added ${newContainer.label} (${capacityML} mL) to bench.`,
        };
        set((s) => ({
          containers: [...s.containers, newContainer],
          notebook: [...s.notebook, entry],
          nextZIndex: s.nextZIndex + 1,
        }));
        return newContainer;
      },

      removeContainer(id) {
        set((s) => ({
          containers: s.containers.filter((c) => c.id !== id),
          selectedItemId: s.selectedItemId === id ? null : s.selectedItemId,
        }));
      },

      moveContainer(id, position) {
        set((s) => ({
          containers: s.containers.map((c) => c.id === id ? { ...c, position } : c),
        }));
      },

      selectItem(id, itemType) {
        set((s) => ({
          selectedItemId: id,
          selectedItemType: itemType,
          containers: s.containers.map((c) => ({ ...c, isSelected: c.id === id && itemType === 'container' })),
          instruments: s.instruments.map((i) => ({ ...i, isSelected: i.id === id && itemType === 'instrument' })),
        }));
      },

      bringToFront(id) {
        const { nextZIndex } = get();
        set((s) => ({
          containers: s.containers.map((c) => c.id === id ? { ...c, zIndex: nextZIndex } : c),
          instruments: s.instruments.map((i) => i.id === id ? { ...i, zIndex: nextZIndex } : i),
          nextZIndex: nextZIndex + 1,
        }));
      },

      // ── Chemistry Actions ───────────────────────────────────────────────────

      pourChemical(sourceId, targetId, volumeML) {
        const { containers } = get();
        const source = containers.find((c) => c.id === sourceId);
        const target = containers.find((c) => c.id === targetId);
        if (!source || !target) return;

        const result = executePour(source, target, volumeML);

        set((s) => ({
          containers: s.containers.map((c) => {
            if (c.id === sourceId) return result.sourceContainer;
            if (c.id === targetId) return result.targetContainer;
            return c;
          }),
          notebook: [...s.notebook, ...result.notes],
          events: [...s.events, ...result.events].slice(-200),
          hazardEvents: [...s.hazardEvents, ...result.hazards],
          showSafetyPanel: result.hazards.length > 0 ? true : s.showSafetyPanel,
        }));

        // Graph titration data if pH is being tracked
        const { graphs } = get();
        const titrationSeries = graphs.find((g) => g.id === 'titration_curve');
        if (titrationSeries && result.targetContainer.mixture) {
          const vol = result.targetContainer.mixture.totalVolumeML;
          get().addGraphPoint('titration_curve', { x: vol, y: result.targetContainer.mixture.pH });
        }
      },

      addChemicalToContainer(containerId, chemicalId, amount, unit, concentration) {
        const container = get().containers.find((c) => c.id === containerId);
        if (!container) return;

        const result = executeAddChemical(container, chemicalId, amount, unit, concentration);

        set((s) => ({
          containers: s.containers.map((c) => c.id === containerId ? result.container : c),
          notebook: [...s.notebook, ...result.notes],
          events: [...s.events, ...result.events].slice(-200),
          hazardEvents: [...s.hazardEvents, ...result.hazards],
          showSafetyPanel: result.hazards.length > 0 ? true : s.showSafetyPanel,
        }));
      },

      heatContainer(containerId, targetTempC) {
        const container = get().containers.find((c) => c.id === containerId);
        if (!container) return;

        const result = executeHeat(container, targetTempC);

        set((s) => ({
          containers: s.containers.map((c) => c.id === containerId ? result.container : c),
          notebook: [...s.notebook, ...result.notes],
          events: [...s.events, ...result.events].slice(-200),
          hazardEvents: [...s.hazardEvents, ...result.hazards],
          showSafetyPanel: result.hazards.length > 0 ? true : s.showSafetyPanel,
        }));

        // Log temperature measurement
        const tempMeasurement: Measurement = {
          id: uid('meas'),
          type: 'temperature',
          value: targetTempC,
          unit: '°C',
          containerId,
          timestamp: new Date(),
        };
        set((s) => ({ measurements: [...s.measurements, tempMeasurement] }));
      },

      coolContainer(containerId) {
        set((s) => ({
          containers: s.containers.map((c) =>
            c.id === containerId ? { ...c, temperatureC: 22, isOnHeatSource: false } : c,
          ),
        }));
      },

      measureContainerPH(containerId) {
        const container = get().containers.find((c) => c.id === containerId);
        if (!container) return 7.0;

        const result = measurePH(container);

        const m: Measurement = {
          id: uid('meas'),
          type: 'pH',
          value: result.pH,
          unit: '',
          containerId,
          timestamp: new Date(),
        };

        set((s) => ({
          notebook: [...s.notebook, ...result.notes],
          events: [...s.events, ...result.events].slice(-200),
          measurements: [...s.measurements, m],
        }));

        // Add to titration curve if active
        const { graphs } = get();
        if (graphs.find((g) => g.id === 'titration_curve')) {
          const vol = container.mixture?.totalVolumeML ?? 0;
          get().addGraphPoint('titration_curve', { x: vol, y: result.pH });
        }

        return result.pH;
      },

      measureContainerTemp(containerId) {
        const container = get().containers.find((c) => c.id === containerId);
        if (!container) return 22;

        const result = measureTemp(container);
        const m: Measurement = {
          id: uid('meas'),
          type: 'temperature',
          value: result.tempC,
          unit: '°C',
          containerId,
          timestamp: new Date(),
        };

        set((s) => ({
          notebook: [...s.notebook, ...result.notes],
          events: [...s.events, ...result.events].slice(-200),
          measurements: [...s.measurements, m],
        }));

        return result.tempC;
      },

      clearContainer(containerId) {
        const container = get().containers.find((c) => c.id === containerId);
        if (!container) return;
        const note: NotebookEntry = {
          id: uid('note'),
          timestamp: new Date(),
          category: 'action',
          text: `${container.label} cleared (contents discarded).`,
        };
        set((s) => ({
          containers: s.containers.map((c) => c.id === containerId ? { ...c, mixture: null, temperatureC: 22 } : c),
          notebook: [...s.notebook, note],
        }));
      },

      // ── Instrument Actions ──────────────────────────────────────────────────

      activateInstrument(id) {
        set((s) => ({ instruments: s.instruments.map((i) => i.id === id ? { ...i, isActive: true } : i) }));
      },

      deactivateInstrument(id) {
        set((s) => ({ instruments: s.instruments.map((i) => i.id === id ? { ...i, isActive: false } : i) }));
      },

      moveInstrument(id, position) {
        set((s) => ({ instruments: s.instruments.map((i) => i.id === id ? { ...i, position } : i) }));
      },

      // ── Notebook & Events ───────────────────────────────────────────────────

      addNotebookEntry(entry) {
        const full: NotebookEntry = { ...entry, id: uid('note'), timestamp: new Date() };
        set((s) => ({ notebook: [...s.notebook, full] }));
      },

      addMeasurement(m) {
        const full: Measurement = { ...m, id: uid('meas'), timestamp: new Date() };
        set((s) => ({ measurements: [...s.measurements, full] }));
      },

      dismissHazard(id) {
        set((s) => ({ hazardEvents: s.hazardEvents.map((h) => h.id === id ? { ...h, dismissed: true } : h) }));
      },

      clearAllHazards() {
        set((s) => ({ hazardEvents: s.hazardEvents.map((h) => ({ ...h, dismissed: true })) }));
      },

      // ── Graphs ──────────────────────────────────────────────────────────────

      createGraphSeries(series) {
        const full: GraphSeries = { ...series, points: [] };
        set((s) => ({ graphs: [...s.graphs.filter((g) => g.id !== series.id), full] }));
      },

      addGraphPoint(seriesId, point) {
        set((s) => ({
          graphs: s.graphs.map((g) =>
            g.id === seriesId ? { ...g, points: [...g.points, point] } : g,
          ),
        }));
      },

      clearGraphSeries(seriesId) {
        set((s) => ({ graphs: s.graphs.map((g) => g.id === seriesId ? { ...g, points: [] } : g) }));
      },

      // ── Mode & Experiments ──────────────────────────────────────────────────

      setMode(mode) {
        set({ mode });
      },

      startExperiment(id) {
        const template = EXPERIMENT_TEMPLATES.find((e) => e.id === id);
        if (!template) return;

        // Set up initial containers
        const newContainers: ContainerInstance[] = template.initialSetup.containers.map(
          (c, i) => ({
            ...c,
            id: uid('cont'),
            isSelected: false,
            position: { x: 150 + i * 200, y: 250 },
            zIndex: 10 + i,
          }),
        );

        const initNote: NotebookEntry = {
          id: uid('note'),
          timestamp: new Date(),
          category: 'action',
          text: `Experiment started: ${template.name}`,
        };

        set((s) => ({
          mode: 'guided',
          currentExperimentId: id,
          currentStepIndex: 0,
          completedSteps: [],
          containers: [...s.containers, ...newContainers],
          notebook: [...s.notebook, initNote],
        }));

        // Create titration graph series for titration experiments
        if (id === 'acid_base_titration') {
          get().createGraphSeries({
            id: 'titration_curve',
            name: 'Titration Curve',
            color: '#7dd3fc',
            xLabel: 'Volume NaOH (mL)',
            yLabel: 'pH',
          });
        }
      },

      advanceStep() {
        const { currentStepIndex, currentExperimentId } = get();
        const template = EXPERIMENT_TEMPLATES.find((e) => e.id === currentExperimentId);
        if (!template) return;
        const nextIndex = Math.min(currentStepIndex + 1, template.steps.length - 1);
        set({ currentStepIndex: nextIndex });
      },

      completeStep(stepId) {
        set((s) => ({
          completedSteps: s.completedSteps.includes(stepId)
            ? s.completedSteps
            : [...s.completedSteps, stepId],
        }));
        get().advanceStep();
      },

      abandonExperiment() {
        const note: NotebookEntry = {
          id: uid('note'),
          timestamp: new Date(),
          category: 'action',
          text: 'Experiment abandoned.',
        };
        set((s) => ({
          mode: 'sandbox',
          currentExperimentId: null,
          currentStepIndex: 0,
          completedSteps: [],
          notebook: [...s.notebook, note],
        }));
      },

      // ── UI State ────────────────────────────────────────────────────────────

      setShowNotebook(v) { set({ showNotebook: v }); },
      setShowGraphs(v) { set({ showGraphs: v }); },
      setShowSafety(v) { set({ showSafetyPanel: v }); },
      setActiveTab(tab) { set({ activeTab: tab }); },
      setReagentPanelOpen(v) { set({ reagentPanelOpen: v }); },

      // ── Reset ────────────────────────────────────────────────────────────────

      resetLab() {
        set({ ...INITIAL_STATE, instruments: DEFAULT_INSTRUMENTS });
      },
    }),
    {
      name: 'aos-chem-lab-v1',
      partialize: (s) => ({
        notebook: s.notebook.slice(-100),
        measurements: s.measurements.slice(-200),
        graphs: s.graphs,
        mode: s.mode,
      }),
    },
  ),
);

// ─── Selector Helpers ─────────────────────────────────────────────────────────

export function useSelectedContainer() {
  return useChemLabStore((s) => {
    if (s.selectedItemType !== 'container' || !s.selectedItemId) return null;
    return s.containers.find((c) => c.id === s.selectedItemId) ?? null;
  });
}

export function useSelectedInstrument() {
  return useChemLabStore((s) => {
    if (s.selectedItemType !== 'instrument' || !s.selectedItemId) return null;
    return s.instruments.find((i) => i.id === s.selectedItemId) ?? null;
  });
}

export function useActiveHazards() {
  return useChemLabStore((s) => s.hazardEvents.filter((h) => !h.dismissed));
}

export function useLabEvents(): LabEvent[] {
  return useChemLabStore((s) => s.events.slice(-50));
}
