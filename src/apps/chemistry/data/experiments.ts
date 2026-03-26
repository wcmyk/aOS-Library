import type { ExperimentTemplate } from '../types';

export const EXPERIMENT_TEMPLATES: ExperimentTemplate[] = [
  {
    id: 'acid_base_titration',
    name: 'Acid–Base Titration',
    category: 'acid_base',
    description:
      'Determine the unknown concentration of a NaOH solution by titrating against a standardised 0.100 M HCl using phenolphthalein indicator.',
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    learningObjectives: [
      'Understand equivalence point and endpoint detection',
      'Practice burette technique and volume reading',
      'Calculate molarity from titration data',
      'Interpret a titration curve',
    ],
    safetyNotes: [
      'NaOH is corrosive — wear gloves and eye protection.',
      'Rinse any spills immediately with water.',
      'Handle HCl with care — avoid inhaling vapours.',
    ],
    initialSetup: {
      containers: [
        {
          type: 'erlenmeyer',
          label: 'Erlenmeyer A',
          capacityML: 250,
          mixture: null,
          temperatureC: 22,
          isOnHeatSource: false,
          isBroken: false,
        },
        {
          type: 'burette',
          label: 'Burette (NaOH)',
          capacityML: 50,
          mixture: null,
          temperatureC: 22,
          isOnHeatSource: false,
          isBroken: false,
        },
        {
          type: 'beaker',
          label: 'Waste Beaker',
          capacityML: 400,
          mixture: null,
          temperatureC: 22,
          isOnHeatSource: false,
          isBroken: false,
        },
      ],
    },
    steps: [
      {
        id: 'step_1',
        stepNumber: 1,
        instruction:
          'Rinse and fill the burette with 0.100 M NaOH solution. Record the initial reading (should be ~0.00 mL).',
        hint: 'Drag the NaOH reagent bottle over the burette icon and drop it to fill.',
        expectedAction: 'add_from_inventory',
        expectedChemicalId: 'NaOH',
        completionMessage: 'Burette filled with NaOH. Initial volume recorded.',
      },
      {
        id: 'step_2',
        stepNumber: 2,
        instruction:
          'Pipette exactly 25.00 mL of the unknown HCl solution into the Erlenmeyer flask.',
        hint: 'Use the pipette tool: select it, click the HCl reagent, then click the Erlenmeyer flask.',
        expectedAction: 'add_from_inventory',
        expectedChemicalId: 'HCl',
        completionMessage: 'HCl added to Erlenmeyer flask.',
      },
      {
        id: 'step_3',
        stepNumber: 3,
        instruction:
          'Add 2–3 drops of phenolphthalein indicator to the Erlenmeyer flask.',
        hint: 'Find phenolphthalein in the reagent panel and add a small amount.',
        expectedAction: 'add_from_inventory',
        expectedChemicalId: 'phenolphthalein',
        completionMessage: 'Indicator added. Solution should be colourless.',
      },
      {
        id: 'step_4',
        stepNumber: 4,
        instruction:
          'Begin the titration: slowly add NaOH from the burette to the flask while swirling. Watch for the pink colour that momentarily fades.',
        hint: "Use the burette's pour control. Add NaOH in small increments once the colour starts to persist.",
        expectedAction: 'titrate',
        completionMessage: 'Good technique! Keep approaching the endpoint carefully.',
      },
      {
        id: 'step_5',
        stepNumber: 5,
        instruction:
          'Stop when a single drop turns the solution pale pink and the colour persists for 30 seconds. Record the final burette reading.',
        hint: 'Near the endpoint, add NaOH drop-by-drop. The pH will rise steeply at the equivalence point.',
        expectedAction: 'measure_ph',
        completionMessage: 'Endpoint reached! Calculate the NaOH volume used.',
      },
    ],
  },

  {
    id: 'precipitation_bacl2_na2so4',
    name: 'Precipitation: BaSO₄ Formation',
    category: 'precipitation',
    description:
      'Observe the precipitation of insoluble barium sulfate when BaCl₂ and Na₂SO₄ solutions are mixed.',
    difficulty: 'beginner',
    estimatedMinutes: 10,
    learningObjectives: [
      'Understand solubility rules and precipitation',
      'Identify ionic equations and spectator ions',
      'Observe filtration as a separation technique',
    ],
    safetyNotes: [
      'BaCl₂ is toxic — do not ingest.',
      'Wash hands after handling barium compounds.',
    ],
    initialSetup: {
      containers: [
        {
          type: 'beaker',
          label: 'Beaker A (BaCl₂)',
          capacityML: 100,
          mixture: null,
          temperatureC: 22,
          isOnHeatSource: false,
          isBroken: false,
        },
        {
          type: 'beaker',
          label: 'Beaker B (Na₂SO₄)',
          capacityML: 100,
          mixture: null,
          temperatureC: 22,
          isOnHeatSource: false,
          isBroken: false,
        },
        {
          type: 'beaker',
          label: 'Reaction Beaker',
          capacityML: 250,
          mixture: null,
          temperatureC: 22,
          isOnHeatSource: false,
          isBroken: false,
        },
      ],
    },
    steps: [
      {
        id: 'step_1',
        stepNumber: 1,
        instruction: 'Add 50 mL of 0.1 M BaCl₂ to Beaker A.',
        hint: 'Drag the BaCl₂ bottle to Beaker A.',
        expectedAction: 'add_from_inventory',
        expectedChemicalId: 'BaCl2',
        completionMessage: 'BaCl₂ solution prepared.',
      },
      {
        id: 'step_2',
        stepNumber: 2,
        instruction: 'Add 50 mL of 0.1 M Na₂SO₄ to Beaker B.',
        hint: 'Drag the Na₂SO₄ bottle to Beaker B.',
        expectedAction: 'add_from_inventory',
        expectedChemicalId: 'Na2SO4',
        completionMessage: 'Na₂SO₄ solution prepared.',
      },
      {
        id: 'step_3',
        stepNumber: 3,
        instruction: 'Pour the contents of Beaker A into the Reaction Beaker.',
        hint: 'Select Beaker A and use the Pour action toward the Reaction Beaker.',
        expectedAction: 'pour',
        completionMessage: 'BaCl₂ transferred.',
      },
      {
        id: 'step_4',
        stepNumber: 4,
        instruction:
          'Pour Beaker B into the Reaction Beaker and observe the white precipitate.',
        hint: 'The immediate white turbidity is BaSO₄ precipitating.',
        expectedAction: 'pour',
        completionMessage: 'BaSO₄ precipitate formed! Dense white turbidity observed.',
      },
    ],
  },

  {
    id: 'golden_rain',
    name: 'Golden Rain: PbI₂ Precipitation',
    category: 'precipitation',
    description:
      'Produce the vivid yellow lead(II) iodide precipitate from Pb(NO₃)₂ and KI solutions.',
    difficulty: 'beginner',
    estimatedMinutes: 8,
    learningObjectives: [
      'Observe dramatic colour change in precipitation',
      'Understand toxic-compound handling',
      'Write the net ionic equation for the reaction',
    ],
    safetyNotes: [
      'Lead compounds are toxic — handle with gloves.',
      'Dispose of waste in the heavy-metals waste container.',
    ],
    initialSetup: {
      containers: [
        {
          type: 'beaker',
          label: 'Pb(NO₃)₂ Solution',
          capacityML: 100,
          mixture: null,
          temperatureC: 22,
          isOnHeatSource: false,
          isBroken: false,
        },
        {
          type: 'beaker',
          label: 'KI Solution',
          capacityML: 100,
          mixture: null,
          temperatureC: 22,
          isOnHeatSource: false,
          isBroken: false,
        },
      ],
    },
    steps: [
      {
        id: 'step_1',
        stepNumber: 1,
        instruction: 'Add 50 mL of 0.1 M Pb(NO₃)₂ to the first beaker.',
        expectedAction: 'add_from_inventory',
        expectedChemicalId: 'Pb_NO3_2',
        completionMessage: 'Lead nitrate solution ready.',
      },
      {
        id: 'step_2',
        stepNumber: 2,
        instruction: 'Add 100 mL of 0.2 M KI to the second beaker.',
        expectedAction: 'add_from_inventory',
        expectedChemicalId: 'KI',
        completionMessage: 'Potassium iodide solution ready.',
      },
      {
        id: 'step_3',
        stepNumber: 3,
        instruction:
          'Slowly pour the KI solution into the Pb(NO₃)₂ beaker and observe.',
        hint: 'Watch for the brilliant yellow PbI₂ shower as the two solutions meet.',
        expectedAction: 'pour',
        completionMessage: 'Golden rain! PbI₂ precipitate gives a stunning yellow suspension.',
      },
    ],
  },

  {
    id: 'calorimetry_neutralisation',
    name: 'Calorimetry: Heat of Neutralisation',
    category: 'thermochemistry',
    description:
      'Measure the temperature change during HCl + NaOH neutralisation and calculate the molar enthalpy change.',
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    learningObjectives: [
      'Apply q = mcΔT to calculate heat released',
      'Determine molar enthalpy of neutralisation',
      'Understand calorimeter correction factors',
    ],
    safetyNotes: [
      'Both NaOH and HCl are corrosive.',
      'The mixture will get warm — handle with care.',
    ],
    initialSetup: {
      containers: [
        {
          type: 'beaker',
          label: 'Calorimeter (polystyrene)',
          capacityML: 250,
          mixture: null,
          temperatureC: 22,
          isOnHeatSource: false,
          isBroken: false,
        },
      ],
    },
    steps: [
      {
        id: 'step_1',
        stepNumber: 1,
        instruction: 'Add 50 mL of 1.0 M HCl to the calorimeter. Measure and record the initial temperature.',
        expectedAction: 'add_from_inventory',
        expectedChemicalId: 'HCl',
        completionMessage: 'HCl added. Temperature baseline recorded.',
      },
      {
        id: 'step_2',
        stepNumber: 2,
        instruction: 'Add 50 mL of 1.0 M NaOH to the calorimeter quickly. Stir and record the maximum temperature.',
        hint: 'The temperature will rise sharply — this is the exothermic neutralisation reaction.',
        expectedAction: 'add_from_inventory',
        expectedChemicalId: 'NaOH',
        completionMessage: 'Neutralisation complete. Maximum temperature recorded.',
      },
      {
        id: 'step_3',
        stepNumber: 3,
        instruction: 'Measure the final temperature of the mixture.',
        expectedAction: 'measure_temp',
        completionMessage: 'ΔT recorded. Calculate q = m·c·ΔT and find ΔH per mole.',
      },
    ],
  },
];

export function getExperiment(id: string): ExperimentTemplate | undefined {
  return EXPERIMENT_TEMPLATES.find((e) => e.id === id);
}
