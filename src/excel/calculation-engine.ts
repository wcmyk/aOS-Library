/**
 * Calculation Engine with Dependency Graph
 *
 * Features:
 * - Dependency graph tracking (which cells depend on which)
 * - Topological sorting for optimal calculation order
 * - Circular reference detection
 * - Dirty cell tracking (only recalculate what's needed)
 * - Async recalculation support
 * - Spill array support for dynamic arrays
 * - Safe calc mode with runaway protection
 */

import type { CellData, CellAddress } from './types';

export interface DependencyNode {
  address: string;
  dependsOn: Set<string>;  // Cells this cell depends on
  dependents: Set<string>;  // Cells that depend on this cell
  isDirty: boolean;
  isCalculating: boolean;
  spillRange?: { start: CellAddress; end: CellAddress };
}

export interface CalculationResult {
  value: any;
  error?: string;
  spillRange?: { start: CellAddress; end: CellAddress };
}

export interface CalculationStats {
  totalCells: number;
  dirtyCells: number;
  calculatedCells: number;
  circularReferences: string[];
  calculationTimeMs: number;
}

export class CalculationEngine {
  private dependencyGraph: Map<string, DependencyNode>;
  private dirtyQueue: Set<string>;
  private calculationOrder: string[];
  private maxIterations: number;
  private isCalculating: boolean;
  private abortController?: AbortController;

  constructor(maxIterations = 1000) {
    this.dependencyGraph = new Map();
    this.dirtyQueue = new Set();
    this.calculationOrder = [];
    this.maxIterations = maxIterations;
    this.isCalculating = false;
  }

  /**
   * Register a cell in the dependency graph
   */
  registerCell(address: string, dependsOn: string[] = []): void {
    if (!this.dependencyGraph.has(address)) {
      this.dependencyGraph.set(address, {
        address,
        dependsOn: new Set(),
        dependents: new Set(),
        isDirty: true,
        isCalculating: false,
      });
    }

    const node = this.dependencyGraph.get(address)!;

    // Remove old dependencies
    node.dependsOn.forEach(dep => {
      const depNode = this.dependencyGraph.get(dep);
      if (depNode) {
        depNode.dependents.delete(address);
      }
    });

    // Add new dependencies
    node.dependsOn = new Set(dependsOn);
    dependsOn.forEach(dep => {
      if (!this.dependencyGraph.has(dep)) {
        this.registerCell(dep, []);
      }
      const depNode = this.dependencyGraph.get(dep)!;
      depNode.dependents.add(address);
    });
  }

  /**
   * Mark a cell as dirty (needs recalculation)
   */
  markDirty(address: string): void {
    const node = this.dependencyGraph.get(address);
    if (!node) return;

    if (!node.isDirty) {
      node.isDirty = true;
      this.dirtyQueue.add(address);

      // Mark all dependents as dirty recursively
      node.dependents.forEach(dependent => {
        this.markDirty(dependent);
      });
    }
  }

  /**
   * Detect circular references using DFS
   */
  detectCircularReferences(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (address: string, path: string[] = []): void => {
      if (recursionStack.has(address)) {
        // Found a cycle
        const cycleStart = path.indexOf(address);
        if (cycleStart >= 0) {
          cycles.push([...path.slice(cycleStart), address]);
        }
        return;
      }

      if (visited.has(address)) return;

      visited.add(address);
      recursionStack.add(address);
      path.push(address);

      const node = this.dependencyGraph.get(address);
      if (node) {
        node.dependsOn.forEach(dep => {
          dfs(dep, [...path]);
        });
      }

      recursionStack.delete(address);
    };

    this.dependencyGraph.forEach((_, address) => {
      if (!visited.has(address)) {
        dfs(address);
      }
    });

    return cycles;
  }

  /**
   * Perform topological sort to determine calculation order
   */
  topologicalSort(): { order: string[]; hasCycle: boolean } {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];

    // Calculate in-degrees
    this.dependencyGraph.forEach((node, address) => {
      inDegree.set(address, node.dependsOn.size);
      if (node.dependsOn.size === 0) {
        queue.push(address);
      }
    });

    // Kahn's algorithm
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const node = this.dependencyGraph.get(current);
      if (node) {
        node.dependents.forEach(dependent => {
          const degree = inDegree.get(dependent)! - 1;
          inDegree.set(dependent, degree);
          if (degree === 0) {
            queue.push(dependent);
          }
        });
      }
    }

    const hasCycle = result.length !== this.dependencyGraph.size;
    this.calculationOrder = result;

    return { order: result, hasCycle };
  }

  /**
   * Extract cell references from a formula
   */
  extractReferences(formula: string): string[] {
    const references: string[] = [];

    // Match cell references (A1, B2, etc.) and ranges (A1:B5)
    const cellPattern = /\b([A-Z]+\d+)\b/g;
    let match;

    while ((match = cellPattern.exec(formula)) !== null) {
      references.push(match[1]);
    }

    // Also extract ranges and expand them
    const rangePattern = /\b([A-Z]+\d+):([A-Z]+\d+)\b/g;
    while ((match = rangePattern.exec(formula)) !== null) {
      const [, start, end] = match;
      const expanded = this.expandRange(start, end);
      references.push(...expanded);
    }

    // Remove duplicates
    return [...new Set(references)];
  }

  /**
   * Expand a range (A1:B3) into individual cell references
   */
  private expandRange(start: string, end: string): string[] {
    const cells: string[] = [];

    const startMatch = start.match(/([A-Z]+)(\d+)/);
    const endMatch = end.match(/([A-Z]+)(\d+)/);

    if (!startMatch || !endMatch) return [];

    const startCol = this.letterToCol(startMatch[1]);
    const startRow = parseInt(startMatch[2]);
    const endCol = this.letterToCol(endMatch[1]);
    const endRow = parseInt(endMatch[2]);

    for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
      for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
        cells.push(this.colToLetter(col) + row);
      }
    }

    return cells;
  }

  /**
   * Convert column letter to number (A=1, B=2, Z=26, AA=27)
   */
  private letterToCol(letter: string): number {
    let col = 0;
    for (let i = 0; i < letter.length; i++) {
      col = col * 26 + (letter.charCodeAt(i) - 64);
    }
    return col;
  }

  /**
   * Convert column number to letter (1=A, 2=B, 26=Z, 27=AA)
   */
  private colToLetter(col: number): string {
    let result = '';
    while (col > 0) {
      const remainder = (col - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      col = Math.floor((col - 1) / 26);
    }
    return result;
  }

  /**
   * Calculate cells in optimal order
   */
  async recalculate(
    cells: Map<string, CellData>,
    evaluator: (address: string, cell: CellData) => Promise<CalculationResult> | CalculationResult
  ): Promise<CalculationStats> {
    const startTime = performance.now();
    const stats: CalculationStats = {
      totalCells: this.dependencyGraph.size,
      dirtyCells: this.dirtyQueue.size,
      calculatedCells: 0,
      circularReferences: [],
      calculationTimeMs: 0,
    };

    // Detect circular references
    const cycles = this.detectCircularReferences();
    if (cycles.length > 0) {
      stats.circularReferences = cycles.map(cycle => cycle.join(' → '));
      console.warn('Circular references detected:', stats.circularReferences);
      // Mark circular cells with error
      cycles.flat().forEach(address => {
        const cell = cells.get(address);
        if (cell) {
          cell.displayValue = '#CIRCULAR!';
          cell.error = 'Circular reference detected';
        }
      });
    }

    // Perform topological sort
    const { order, hasCycle } = this.topologicalSort();

    if (hasCycle) {
      console.error('Cannot calculate: dependency graph has cycles');
      stats.calculationTimeMs = performance.now() - startTime;
      return stats;
    }

    // Create abort controller for safe calc mode
    this.abortController = new AbortController();
    this.isCalculating = true;

    try {
      // Calculate cells in dependency order
      for (const address of order) {
        const node = this.dependencyGraph.get(address);
        const cell = cells.get(address);

        if (!node || !cell || !node.isDirty) continue;

        // Check for abort
        if (this.abortController.signal.aborted) {
          throw new Error('Calculation aborted: exceeded time limit');
        }

        // Check for runaway formulas
        if (stats.calculatedCells > this.maxIterations) {
          throw new Error(`Calculation aborted: exceeded max iterations (${this.maxIterations})`);
        }

        node.isCalculating = true;

        try {
          // Evaluate the cell
          const result = await evaluator(address, cell);

          cell.displayValue = result.value?.toString() || '';
          cell.error = result.error;

          // Handle spill arrays
          if (result.spillRange) {
            node.spillRange = result.spillRange;
            // Mark spill cells
            this.markSpillRange(result.spillRange, cells, result.value);
          }

          node.isDirty = false;
          stats.calculatedCells++;
        } catch (error) {
          cell.displayValue = '#ERROR!';
          cell.error = error instanceof Error ? error.message : 'Unknown error';
          node.isDirty = false;
        } finally {
          node.isCalculating = false;
        }
      }

      // Clear dirty queue
      this.dirtyQueue.clear();
    } finally {
      this.isCalculating = false;
      this.abortController = undefined;
    }

    stats.calculationTimeMs = performance.now() - startTime;
    return stats;
  }

  /**
   * Mark cells in a spill range
   */
  private markSpillRange(
    range: { start: CellAddress; end: CellAddress },
    cells: Map<string, CellData>,
    value: any
  ): void {
    const { start, end } = range;

    for (let row = start.row; row <= end.row; row++) {
      for (let col = start.col; col <= end.col; col++) {
        const address = this.colToLetter(col + 1) + (row + 1);
        const cell = cells.get(address) || { value: '', displayValue: '' };

        // Mark as spill cell
        cell.isSpill = true;
        cell.spillSource = this.colToLetter(start.col + 1) + (start.row + 1);

        cells.set(address, cell);
      }
    }
  }

  /**
   * Abort ongoing calculation (for safe calc mode)
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Get calculation statistics
   */
  getStats(): CalculationStats {
    const cycles = this.detectCircularReferences();
    return {
      totalCells: this.dependencyGraph.size,
      dirtyCells: this.dirtyQueue.size,
      calculatedCells: 0,
      circularReferences: cycles.map(cycle => cycle.join(' → ')),
      calculationTimeMs: 0,
    };
  }

  /**
   * Get dependents of a cell (for audit trail)
   */
  getDependents(address: string): string[] {
    const node = this.dependencyGraph.get(address);
    return node ? Array.from(node.dependents) : [];
  }

  /**
   * Get dependencies of a cell (for audit trail)
   */
  getDependencies(address: string): string[] {
    const node = this.dependencyGraph.get(address);
    return node ? Array.from(node.dependsOn) : [];
  }

  /**
   * Get the full dependency chain for lineage tracking
   */
  getDependencyChain(address: string): { upstream: string[]; downstream: string[] } {
    const upstream = new Set<string>();
    const downstream = new Set<string>();

    const traverseUpstream = (addr: string) => {
      const node = this.dependencyGraph.get(addr);
      if (!node) return;

      node.dependsOn.forEach(dep => {
        if (!upstream.has(dep)) {
          upstream.add(dep);
          traverseUpstream(dep);
        }
      });
    };

    const traverseDownstream = (addr: string) => {
      const node = this.dependencyGraph.get(addr);
      if (!node) return;

      node.dependents.forEach(dependent => {
        if (!downstream.has(dependent)) {
          downstream.add(dependent);
          traverseDownstream(dependent);
        }
      });
    };

    traverseUpstream(address);
    traverseDownstream(address);

    return {
      upstream: Array.from(upstream),
      downstream: Array.from(downstream),
    };
  }

  /**
   * Clear the entire dependency graph
   */
  clear(): void {
    this.dependencyGraph.clear();
    this.dirtyQueue.clear();
    this.calculationOrder = [];
  }

  /**
   * Remove a cell from the dependency graph
   */
  removeCell(address: string): void {
    const node = this.dependencyGraph.get(address);
    if (!node) return;

    // Remove from dependents
    node.dependsOn.forEach(dep => {
      const depNode = this.dependencyGraph.get(dep);
      if (depNode) {
        depNode.dependents.delete(address);
      }
    });

    // Remove from dependencies
    node.dependents.forEach(dependent => {
      const depNode = this.dependencyGraph.get(dependent);
      if (depNode) {
        depNode.dependsOn.delete(address);
      }
    });

    this.dependencyGraph.delete(address);
    this.dirtyQueue.delete(address);
  }
}
