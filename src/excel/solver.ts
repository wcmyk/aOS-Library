/**
 * Solver Module
 * Implements Excel Solver functionality for optimization problems
 */

import { SolverOptions, SolverConstraint } from './types';

export class Solver {
  // ============================================================================
  // SOLVER ENGINE
  // ============================================================================

  solve(options: SolverOptions, getCellValue: (address: string) => number, setCellValue: (address: string, value: number) => void): {
    success: boolean;
    values: { [cell: string]: number };
    objectiveValue: number;
    iterations: number;
  } {
    const method = options.method || 'grg';

    switch (method) {
      case 'grg':
        return this.solveGRG(options, getCellValue, setCellValue);

      case 'simplex':
        return this.solveSimplex(options, getCellValue, setCellValue);

      case 'evolutionary':
        return this.solveEvolutionary(options, getCellValue, setCellValue);

      default:
        return this.solveGRG(options, getCellValue, setCellValue);
    }
  }

  // ============================================================================
  // GRG NONLINEAR (Generalized Reduced Gradient)
  // ============================================================================

  private solveGRG(
    options: SolverOptions,
    getCellValue: (address: string) => number,
    setCellValue: (address: string, value: number) => void
  ): any {
    const maxIterations = 1000;
    const tolerance = 1e-6;
    const stepSize = 0.1;

    let currentValues: { [cell: string]: number } = {};
    let bestValues: { [cell: string]: number } = {};
    let bestObjective = options.optimizeType === 'max' ? -Infinity : Infinity;

    // Initialize variable cells
    for (const cell of options.variableCells) {
      currentValues[cell] = getCellValue(cell);
      bestValues[cell] = currentValues[cell];
    }

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Calculate gradient
      const gradient = this.calculateGradient(options, currentValues, getCellValue, setCellValue);

      // Update values
      let improved = false;

      for (const cell of options.variableCells) {
        const oldValue = currentValues[cell];
        const newValue = oldValue + stepSize * gradient[cell];

        // Check constraints
        currentValues[cell] = newValue;
        setCellValue(cell, newValue);

        if (!this.checkConstraints(options.constraints, getCellValue)) {
          currentValues[cell] = oldValue;
          setCellValue(cell, oldValue);
          continue;
        }

        const objectiveValue = getCellValue(options.objectiveCell);

        if (this.isBetterObjective(objectiveValue, bestObjective, options.optimizeType)) {
          bestObjective = objectiveValue;
          bestValues = { ...currentValues };
          improved = true;
        } else {
          currentValues[cell] = oldValue;
          setCellValue(cell, oldValue);
        }
      }

      // Check convergence
      if (!improved && Math.abs(stepSize) < tolerance) {
        break;
      }
    }

    // Set best values
    for (const cell of options.variableCells) {
      setCellValue(cell, bestValues[cell]);
    }

    return {
      success: true,
      values: bestValues,
      objectiveValue: bestObjective,
      iterations: maxIterations
    };
  }

  // ============================================================================
  // SIMPLEX (Linear Programming)
  // ============================================================================

  private solveSimplex(
    options: SolverOptions,
    getCellValue: (address: string) => number,
    setCellValue: (address: string, value: number) => void
  ): any {
    // Simplified Simplex implementation
    const maxIterations = 1000;
    const tolerance = 1e-6;

    let currentValues: { [cell: string]: number } = {};
    let bestValues: { [cell: string]: number } = {};
    let bestObjective = options.optimizeType === 'max' ? -Infinity : Infinity;

    // Initialize
    for (const cell of options.variableCells) {
      currentValues[cell] = getCellValue(cell);
      bestValues[cell] = currentValues[cell];
    }

    // Simplex iterations
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let improved = false;

      for (const cell of options.variableCells) {
        // Try increasing
        const oldValue = currentValues[cell];
        currentValues[cell] = oldValue + 1;
        setCellValue(cell, currentValues[cell]);

        if (this.checkConstraints(options.constraints, getCellValue)) {
          const objectiveValue = getCellValue(options.objectiveCell);

          if (this.isBetterObjective(objectiveValue, bestObjective, options.optimizeType)) {
            bestObjective = objectiveValue;
            bestValues = { ...currentValues };
            improved = true;
            continue;
          }
        }

        // Try decreasing
        currentValues[cell] = oldValue - 1;
        setCellValue(cell, currentValues[cell]);

        if (this.checkConstraints(options.constraints, getCellValue)) {
          const objectiveValue = getCellValue(options.objectiveCell);

          if (this.isBetterObjective(objectiveValue, bestObjective, options.optimizeType)) {
            bestObjective = objectiveValue;
            bestValues = { ...currentValues };
            improved = true;
            continue;
          }
        }

        // Restore
        currentValues[cell] = oldValue;
        setCellValue(cell, oldValue);
      }

      if (!improved) break;
    }

    // Set best values
    for (const cell of options.variableCells) {
      setCellValue(cell, bestValues[cell]);
    }

    return {
      success: true,
      values: bestValues,
      objectiveValue: bestObjective,
      iterations: maxIterations
    };
  }

  // ============================================================================
  // EVOLUTIONARY (Genetic Algorithm)
  // ============================================================================

  private solveEvolutionary(
    options: SolverOptions,
    getCellValue: (address: string) => number,
    setCellValue: (address: string, value: number) => void
  ): any {
    const populationSize = 50;
    const generations = 100;
    const mutationRate = 0.1;
    const crossoverRate = 0.7;

    // Initialize population
    let population: { [cell: string]: number }[] = [];

    for (let i = 0; i < populationSize; i++) {
      const individual: { [cell: string]: number } = {};

      for (const cell of options.variableCells) {
        individual[cell] = Math.random() * 100; // Random initialization
      }

      population.push(individual);
    }

    let bestSolution: { [cell: string]: number } = {};
    let bestFitness = options.optimizeType === 'max' ? -Infinity : Infinity;

    // Evolution
    for (let generation = 0; generation < generations; generation++) {
      // Evaluate fitness
      const fitness: number[] = population.map(individual => {
        for (const cell of options.variableCells) {
          setCellValue(cell, individual[cell]);
        }

        if (!this.checkConstraints(options.constraints, getCellValue)) {
          return options.optimizeType === 'max' ? -Infinity : Infinity;
        }

        return getCellValue(options.objectiveCell);
      });

      // Update best
      for (let i = 0; i < populationSize; i++) {
        if (this.isBetterObjective(fitness[i], bestFitness, options.optimizeType)) {
          bestFitness = fitness[i];
          bestSolution = { ...population[i] };
        }
      }

      // Selection
      const newPopulation: { [cell: string]: number }[] = [];

      for (let i = 0; i < populationSize; i++) {
        const parent1 = this.tournamentSelection(population, fitness, options.optimizeType);
        const parent2 = this.tournamentSelection(population, fitness, options.optimizeType);

        // Crossover
        let child: { [cell: string]: number };

        if (Math.random() < crossoverRate) {
          child = this.crossover(parent1, parent2, options.variableCells);
        } else {
          child = { ...parent1 };
        }

        // Mutation
        if (Math.random() < mutationRate) {
          child = this.mutate(child, options.variableCells);
        }

        newPopulation.push(child);
      }

      population = newPopulation;
    }

    // Set best solution
    for (const cell of options.variableCells) {
      setCellValue(cell, bestSolution[cell]);
    }

    return {
      success: true,
      values: bestSolution,
      objectiveValue: bestFitness,
      iterations: generations
    };
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  private calculateGradient(
    options: SolverOptions,
    currentValues: { [cell: string]: number },
    getCellValue: (address: string) => number,
    setCellValue: (address: string, value: number) => void
  ): { [cell: string]: number } {
    const gradient: { [cell: string]: number } = {};
    const epsilon = 1e-6;

    const baseObjective = getCellValue(options.objectiveCell);

    for (const cell of options.variableCells) {
      const oldValue = currentValues[cell];

      setCellValue(cell, oldValue + epsilon);
      const newObjective = getCellValue(options.objectiveCell);

      gradient[cell] = (newObjective - baseObjective) / epsilon;

      if (options.optimizeType === 'min') {
        gradient[cell] = -gradient[cell];
      }

      setCellValue(cell, oldValue);
    }

    return gradient;
  }

  private checkConstraints(constraints: SolverConstraint[], getCellValue: (address: string) => number): boolean {
    for (const constraint of constraints) {
      const cellValue = getCellValue(constraint.cell);
      const constraintValue = typeof constraint.value === 'number' ? constraint.value : getCellValue(constraint.value);

      switch (constraint.operator) {
        case '=':
          if (Math.abs(cellValue - constraintValue) > 1e-6) return false;
          break;

        case '<=':
          if (cellValue > constraintValue + 1e-6) return false;
          break;

        case '>=':
          if (cellValue < constraintValue - 1e-6) return false;
          break;

        case 'int':
          if (Math.abs(cellValue - Math.round(cellValue)) > 1e-6) return false;
          break;

        case 'bin':
          if (cellValue !== 0 && cellValue !== 1) return false;
          break;
      }
    }

    return true;
  }

  private isBetterObjective(newValue: number, bestValue: number, optimizeType: 'max' | 'min' | 'value'): boolean {
    if (optimizeType === 'max') {
      return newValue > bestValue;
    } else if (optimizeType === 'min') {
      return newValue < bestValue;
    }
    return false;
  }

  private tournamentSelection(
    population: { [cell: string]: number }[],
    fitness: number[],
    optimizeType: 'max' | 'min' | 'value'
  ): { [cell: string]: number } {
    const tournamentSize = 3;
    let bestIndex = Math.floor(Math.random() * population.length);
    let bestFitness = fitness[bestIndex];

    for (let i = 1; i < tournamentSize; i++) {
      const index = Math.floor(Math.random() * population.length);
      if (this.isBetterObjective(fitness[index], bestFitness, optimizeType)) {
        bestIndex = index;
        bestFitness = fitness[index];
      }
    }

    return population[bestIndex];
  }

  private crossover(
    parent1: { [cell: string]: number },
    parent2: { [cell: string]: number },
    variableCells: string[]
  ): { [cell: string]: number } {
    const child: { [cell: string]: number } = {};

    for (const cell of variableCells) {
      child[cell] = Math.random() < 0.5 ? parent1[cell] : parent2[cell];
    }

    return child;
  }

  private mutate(individual: { [cell: string]: number }, variableCells: string[]): { [cell: string]: number } {
    const mutated = { ...individual };
    const cellToMutate = variableCells[Math.floor(Math.random() * variableCells.length)];

    mutated[cellToMutate] = mutated[cellToMutate] + (Math.random() - 0.5) * 10;

    return mutated;
  }

  // ============================================================================
  // SCENARIO MANAGER
  // ============================================================================

  createScenario(name: string, values: { [cell: string]: number }): { name: string; values: { [cell: string]: number } } {
    return { name, values };
  }

  applyScenario(scenario: { name: string; values: { [cell: string]: number } }, setCellValue: (address: string, value: number) => void): void {
    for (const [cell, value] of Object.entries(scenario.values)) {
      setCellValue(cell, value);
    }
  }

  // ============================================================================
  // GOAL SEEK
  // ============================================================================

  goalSeek(
    formulaCell: string,
    targetValue: number,
    changeCell: string,
    getCellValue: (address: string) => number,
    setCellValue: (address: string, value: number) => void
  ): { success: boolean; value: number; iterations: number } {
    const maxIterations = 1000;
    const tolerance = 1e-6;

    let currentValue = getCellValue(changeCell);
    let currentResult = getCellValue(formulaCell);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const error = targetValue - currentResult;

      if (Math.abs(error) < tolerance) {
        return { success: true, value: currentValue, iterations: iteration };
      }

      // Calculate derivative
      const epsilon = 1e-6;
      setCellValue(changeCell, currentValue + epsilon);
      const newResult = getCellValue(formulaCell);
      const derivative = (newResult - currentResult) / epsilon;

      if (Math.abs(derivative) < tolerance) {
        return { success: false, value: currentValue, iterations: iteration };
      }

      // Newton's method
      currentValue = currentValue + error / derivative;
      setCellValue(changeCell, currentValue);
      currentResult = getCellValue(formulaCell);
    }

    return { success: false, value: currentValue, iterations: maxIterations };
  }

  // ============================================================================
  // DATA TABLE
  // ============================================================================

  createDataTable(
    rowInputCell: string | null,
    columnInputCell: string | null,
    rowValues: number[],
    columnValues: number[],
    formulaCell: string,
    getCellValue: (address: string) => number,
    setCellValue: (address: string, value: number) => void
  ): number[][] {
    const result: number[][] = [];

    const originalRowValue = rowInputCell ? getCellValue(rowInputCell) : 0;
    const originalColumnValue = columnInputCell ? getCellValue(columnInputCell) : 0;

    for (let i = 0; i < rowValues.length; i++) {
      result[i] = [];

      if (rowInputCell) {
        setCellValue(rowInputCell, rowValues[i]);
      }

      for (let j = 0; j < columnValues.length; j++) {
        if (columnInputCell) {
          setCellValue(columnInputCell, columnValues[j]);
        }

        result[i][j] = getCellValue(formulaCell);
      }
    }

    // Restore original values
    if (rowInputCell) {
      setCellValue(rowInputCell, originalRowValue);
    }
    if (columnInputCell) {
      setCellValue(columnInputCell, originalColumnValue);
    }

    return result;
  }
}
