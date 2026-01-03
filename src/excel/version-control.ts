/**
 * Version Control & Checkpoints
 *
 * Features:
 * - Automatic checkpoints on significant changes
 * - Manual checkpoint creation
 * - Instant rollback to any checkpoint
 * - Diff view (formulas, values, formatting)
 * - Branch and merge capabilities
 * - Change history timeline
 * - Conflict resolution
 */

import type { CellData } from './types';

export interface Checkpoint {
  id: string;
  timestamp: Date;
  author?: string;
  message: string;
  cells: Map<string, CellData>;
  changeCount: number;
  type: 'auto' | 'manual' | 'milestone';
  tags?: string[];
}

export interface VersionDiff {
  added: string[];
  modified: string[];
  deleted: string[];
  changes: CellChange[];
}

export interface CellChange {
  address: string;
  before: CellData | null;
  after: CellData | null;
  changeType: 'added' | 'modified' | 'deleted';
  fields: string[];
}

export interface ConflictResolution {
  address: string;
  ourValue: CellData;
  theirValue: CellData;
  resolution: 'ours' | 'theirs' | 'custom';
  customValue?: CellData;
}

export class VersionControl {
  private checkpoints: Checkpoint[];
  private currentIndex: number;
  private maxCheckpoints: number;
  private autoCheckpointInterval: number;
  private lastCheckpointTime: number;
  private changesSinceLastCheckpoint: number;

  constructor(maxCheckpoints = 100, autoCheckpointInterval = 60000) {
    this.checkpoints = [];
    this.currentIndex = -1;
    this.maxCheckpoints = maxCheckpoints;
    this.autoCheckpointInterval = autoCheckpointInterval;
    this.lastCheckpointTime = Date.now();
    this.changesSinceLastCheckpoint = 0;
  }

  /**
   * Create a checkpoint
   */
  createCheckpoint(
    cells: Map<string, CellData>,
    message: string,
    type: Checkpoint['type'] = 'manual',
    author?: string
  ): Checkpoint {
    // Remove checkpoints after current index (if we've rolled back)
    if (this.currentIndex < this.checkpoints.length - 1) {
      this.checkpoints = this.checkpoints.slice(0, this.currentIndex + 1);
    }

    // Create new checkpoint
    const checkpoint: Checkpoint = {
      id: this.generateCheckpointId(),
      timestamp: new Date(),
      author,
      message,
      cells: new Map(cells), // Deep copy
      changeCount: this.changesSinceLastCheckpoint,
      type,
    };

    // Add to history
    this.checkpoints.push(checkpoint);
    this.currentIndex = this.checkpoints.length - 1;

    // Prune old checkpoints if needed
    if (this.checkpoints.length > this.maxCheckpoints) {
      // Keep milestone checkpoints, remove oldest auto checkpoints
      const toRemove = this.checkpoints.length - this.maxCheckpoints;
      const autoCheckpoints = this.checkpoints.filter(cp => cp.type === 'auto');

      if (autoCheckpoints.length >= toRemove) {
        autoCheckpoints.slice(0, toRemove).forEach(cp => {
          const index = this.checkpoints.indexOf(cp);
          if (index > -1) {
            this.checkpoints.splice(index, 1);
            this.currentIndex = Math.max(0, this.currentIndex - 1);
          }
        });
      }
    }

    // Reset counters
    this.lastCheckpointTime = Date.now();
    this.changesSinceLastCheckpoint = 0;

    return checkpoint;
  }

  /**
   * Auto-checkpoint based on time or change count
   */
  shouldAutoCheckpoint(): boolean {
    const timeSinceLastCheckpoint = Date.now() - this.lastCheckpointTime;
    const timeThreshold = this.autoCheckpointInterval;
    const changeThreshold = 10;

    return (
      timeSinceLastCheckpoint >= timeThreshold ||
      this.changesSinceLastCheckpoint >= changeThreshold
    );
  }

  /**
   * Record a change
   */
  recordChange(): void {
    this.changesSinceLastCheckpoint++;
  }

  /**
   * Rollback to a checkpoint
   */
  rollbackTo(checkpointId: string): Map<string, CellData> | null {
    const index = this.checkpoints.findIndex(cp => cp.id === checkpointId);
    if (index === -1) return null;

    this.currentIndex = index;
    const checkpoint = this.checkpoints[index];

    return new Map(checkpoint.cells);
  }

  /**
   * Undo to previous checkpoint
   */
  undo(): Map<string, CellData> | null {
    if (this.currentIndex <= 0) return null;

    this.currentIndex--;
    return new Map(this.checkpoints[this.currentIndex].cells);
  }

  /**
   * Redo to next checkpoint
   */
  redo(): Map<string, CellData> | null {
    if (this.currentIndex >= this.checkpoints.length - 1) return null;

    this.currentIndex++;
    return new Map(this.checkpoints[this.currentIndex].cells);
  }

  /**
   * Get diff between two checkpoints
   */
  getDiff(fromCheckpointId: string, toCheckpointId: string): VersionDiff | null {
    const fromIndex = this.checkpoints.findIndex(cp => cp.id === fromCheckpointId);
    const toIndex = this.checkpoints.findIndex(cp => cp.id === toCheckpointId);

    if (fromIndex === -1 || toIndex === -1) return null;

    const fromCells = this.checkpoints[fromIndex].cells;
    const toCells = this.checkpoints[toIndex].cells;

    return this.computeDiff(fromCells, toCells);
  }

  /**
   * Compute diff between two cell maps
   */
  private computeDiff(from: Map<string, CellData>, to: Map<string, CellData>): VersionDiff {
    const added: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];
    const changes: CellChange[] = [];

    // Find added and modified cells
    to.forEach((toCell, address) => {
      const fromCell = from.get(address);

      if (!fromCell) {
        added.push(address);
        changes.push({
          address,
          before: null,
          after: toCell,
          changeType: 'added',
          fields: [],
        });
      } else {
        const changedFields = this.getChangedFields(fromCell, toCell);
        if (changedFields.length > 0) {
          modified.push(address);
          changes.push({
            address,
            before: fromCell,
            after: toCell,
            changeType: 'modified',
            fields: changedFields,
          });
        }
      }
    });

    // Find deleted cells
    from.forEach((fromCell, address) => {
      if (!to.has(address)) {
        deleted.push(address);
        changes.push({
          address,
          before: fromCell,
          after: null,
          changeType: 'deleted',
          fields: [],
        });
      }
    });

    return { added, modified, deleted, changes };
  }

  /**
   * Get changed fields between two cells
   */
  private getChangedFields(before: CellData, after: CellData): string[] {
    const fields: string[] = [];

    if (before.value !== after.value) fields.push('value');
    if (before.formula !== after.formula) fields.push('formula');
    if (before.displayValue !== after.displayValue) fields.push('displayValue');
    if (JSON.stringify(before.format) !== JSON.stringify(after.format)) fields.push('format');

    return fields;
  }

  /**
   * Get all checkpoints
   */
  getCheckpoints(): Checkpoint[] {
    return [...this.checkpoints];
  }

  /**
   * Get current checkpoint
   */
  getCurrentCheckpoint(): Checkpoint | null {
    return this.checkpoints[this.currentIndex] || null;
  }

  /**
   * Get checkpoint by ID
   */
  getCheckpoint(id: string): Checkpoint | null {
    return this.checkpoints.find(cp => cp.id === id) || null;
  }

  /**
   * Tag a checkpoint
   */
  tagCheckpoint(checkpointId: string, tags: string[]): void {
    const checkpoint = this.checkpoints.find(cp => cp.id === checkpointId);
    if (checkpoint) {
      checkpoint.tags = [...(checkpoint.tags || []), ...tags];
    }
  }

  /**
   * Set checkpoint as milestone
   */
  markAsMilestone(checkpointId: string): void {
    const checkpoint = this.checkpoints.find(cp => cp.id === checkpointId);
    if (checkpoint) {
      checkpoint.type = 'milestone';
    }
  }

  /**
   * Get change history
   */
  getHistory(limit?: number): Checkpoint[] {
    const checkpoints = [...this.checkpoints].reverse();
    return limit ? checkpoints.slice(0, limit) : checkpoints;
  }

  /**
   * Search checkpoints
   */
  searchCheckpoints(query: string): Checkpoint[] {
    const lowerQuery = query.toLowerCase();
    return this.checkpoints.filter(cp =>
      cp.message.toLowerCase().includes(lowerQuery) ||
      cp.author?.toLowerCase().includes(lowerQuery) ||
      cp.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Export checkpoint
   */
  exportCheckpoint(checkpointId: string): string | null {
    const checkpoint = this.checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) return null;

    return JSON.stringify({
      ...checkpoint,
      cells: Array.from(checkpoint.cells.entries()),
    });
  }

  /**
   * Import checkpoint
   */
  importCheckpoint(data: string): Checkpoint | null {
    try {
      const parsed = JSON.parse(data);
      const checkpoint: Checkpoint = {
        ...parsed,
        timestamp: new Date(parsed.timestamp),
        cells: new Map(parsed.cells),
      };

      this.checkpoints.push(checkpoint);
      return checkpoint;
    } catch (error) {
      console.error('Failed to import checkpoint:', error);
      return null;
    }
  }

  /**
   * Clear all checkpoints
   */
  clear(): void {
    this.checkpoints = [];
    this.currentIndex = -1;
    this.changesSinceLastCheckpoint = 0;
  }

  /**
   * Generate unique checkpoint ID
   */
  private generateCheckpointId(): string {
    return `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Can undo?
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Can redo?
   */
  canRedo(): boolean {
    return this.currentIndex < this.checkpoints.length - 1;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalCheckpoints: number;
    autoCheckpoints: number;
    manualCheckpoints: number;
    milestones: number;
    totalChanges: number;
  } {
    return {
      totalCheckpoints: this.checkpoints.length,
      autoCheckpoints: this.checkpoints.filter(cp => cp.type === 'auto').length,
      manualCheckpoints: this.checkpoints.filter(cp => cp.type === 'manual').length,
      milestones: this.checkpoints.filter(cp => cp.type === 'milestone').length,
      totalChanges: this.checkpoints.reduce((sum, cp) => sum + cp.changeCount, 0),
    };
  }

  /**
   * Merge two checkpoints (for branch merging)
   */
  merge(
    baseCheckpointId: string,
    theirCheckpointId: string,
    resolutions?: ConflictResolution[]
  ): { cells: Map<string, CellData>; conflicts: CellChange[] } {
    const baseCheckpoint = this.getCheckpoint(baseCheckpointId);
    const theirCheckpoint = this.getCheckpoint(theirCheckpointId);
    const ourCheckpoint = this.getCurrentCheckpoint();

    if (!baseCheckpoint || !theirCheckpoint || !ourCheckpoint) {
      throw new Error('Invalid checkpoint IDs');
    }

    const baseCells = baseCheckpoint.cells;
    const ourCells = ourCheckpoint.cells;
    const theirCells = theirCheckpoint.cells;

    const mergedCells = new Map<string, CellData>();
    const conflicts: CellChange[] = [];

    // Get all unique cell addresses
    const allAddresses = new Set([
      ...baseCells.keys(),
      ...ourCells.keys(),
      ...theirCells.keys(),
    ]);

    allAddresses.forEach(address => {
      const baseCell = baseCells.get(address);
      const ourCell = ourCells.get(address);
      const theirCell = theirCells.get(address);

      // No conflict - cell unchanged
      if (!ourCell && !theirCell) {
        if (baseCell) mergedCells.set(address, baseCell);
        return;
      }

      // We deleted, they didn't change
      if (!ourCell && theirCell && JSON.stringify(baseCell) === JSON.stringify(theirCell)) {
        return; // Accept deletion
      }

      // They deleted, we didn't change
      if (!theirCell && ourCell && JSON.stringify(baseCell) === JSON.stringify(ourCell)) {
        return; // Accept deletion
      }

      // We changed, they didn't
      if (ourCell && (!theirCell || JSON.stringify(baseCell) === JSON.stringify(theirCell))) {
        mergedCells.set(address, ourCell);
        return;
      }

      // They changed, we didn't
      if (theirCell && (!ourCell || JSON.stringify(baseCell) === JSON.stringify(ourCell))) {
        mergedCells.set(address, theirCell);
        return;
      }

      // Both changed - conflict!
      if (ourCell && theirCell && JSON.stringify(ourCell) !== JSON.stringify(theirCell)) {
        // Check for manual resolution
        const resolution = resolutions?.find(r => r.address === address);

        if (resolution) {
          if (resolution.resolution === 'custom' && resolution.customValue) {
            mergedCells.set(address, resolution.customValue);
          } else if (resolution.resolution === 'ours') {
            mergedCells.set(address, ourCell);
          } else {
            mergedCells.set(address, theirCell);
          }
        } else {
          // No resolution provided - record conflict and use ours
          conflicts.push({
            address,
            before: ourCell,
            after: theirCell,
            changeType: 'modified',
            fields: this.getChangedFields(ourCell, theirCell),
          });
          mergedCells.set(address, ourCell);
        }
      }
    });

    return { cells: mergedCells, conflicts };
  }
}
