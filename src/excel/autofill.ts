/**
 * Auto-Fill Module
 * Handles cell dragging, smart pattern detection, and series completion
 */

import { CellData, CellAddress, AutoFillPattern } from './types';

export class AutoFillEngine {
  // ============================================================================
  // PATTERN DETECTION
  // ============================================================================

  detectPattern(cells: CellData[]): AutoFillPattern {
    if (cells.length === 0) {
      return { type: 'copy' };
    }

    if (cells.length === 1) {
      // Single cell - check if it's a special pattern
      const value = cells[0].value;

      if (this.isDate(value)) {
        return { type: 'series', seriesType: 'date', stepValue: 1 };
      }

      if (this.isNumber(value)) {
        return { type: 'series', seriesType: 'linear', stepValue: 1 };
      }

      if (this.isDayName(value)) {
        return { type: 'series', seriesType: 'autoFill' };
      }

      if (this.isMonthName(value)) {
        return { type: 'series', seriesType: 'autoFill' };
      }

      return { type: 'copy' };
    }

    // Multiple cells - detect series pattern
    const values = cells.map(c => c.value);

    if (this.isNumberSeries(values)) {
      const step = this.calculateNumberStep(values);
      return { type: 'series', seriesType: 'linear', stepValue: step };
    }

    if (this.isDateSeries(values)) {
      const step = this.calculateDateStep(values);
      return { type: 'series', seriesType: 'date', stepValue: step };
    }

    if (this.isGrowthSeries(values)) {
      const ratio = this.calculateGrowthRatio(values);
      return { type: 'series', seriesType: 'growth', stepValue: ratio };
    }

    if (this.isDayNameSeries(values)) {
      return { type: 'series', seriesType: 'autoFill' };
    }

    if (this.isMonthNameSeries(values)) {
      return { type: 'series', seriesType: 'autoFill' };
    }

    // No pattern detected - just copy
    return { type: 'copy' };
  }

  // ============================================================================
  // AUTO-FILL EXECUTION
  // ============================================================================

  autoFill(
    sourceCells: CellData[],
    targetRange: { start: CellAddress; end: CellAddress },
    pattern?: AutoFillPattern
  ): CellData[] {
    const detectedPattern = pattern || this.detectPattern(sourceCells);
    const direction = this.getDirection(targetRange);

    switch (detectedPattern.type) {
      case 'copy':
        return this.fillCopy(sourceCells, targetRange);

      case 'series':
        return this.fillSeries(sourceCells, targetRange, detectedPattern);

      case 'formats':
        return this.fillFormats(sourceCells, targetRange);

      case 'values':
        return this.fillValues(sourceCells, targetRange);

      default:
        return this.fillCopy(sourceCells, targetRange);
    }
  }

  private fillCopy(sourceCells: CellData[], targetRange: { start: CellAddress; end: CellAddress }): CellData[] {
    const result: CellData[] = [];
    const sourceLength = sourceCells.length;

    const rangeSize = this.getRangeSize(targetRange);

    for (let i = 0; i < rangeSize; i++) {
      const sourceIndex = i % sourceLength;
      result.push({ ...sourceCells[sourceIndex] });
    }

    return result;
  }

  private fillSeries(
    sourceCells: CellData[],
    targetRange: { start: CellAddress; end: CellAddress },
    pattern: AutoFillPattern
  ): CellData[] {
    const result: CellData[] = [];
    const rangeSize = this.getRangeSize(targetRange);

    switch (pattern.seriesType) {
      case 'linear':
        return this.fillLinearSeries(sourceCells, rangeSize, pattern.stepValue || 1);

      case 'growth':
        return this.fillGrowthSeries(sourceCells, rangeSize, pattern.stepValue || 2);

      case 'date':
        return this.fillDateSeries(sourceCells, rangeSize, pattern.stepValue || 1);

      case 'autoFill':
        return this.fillAutoSeries(sourceCells, rangeSize);

      default:
        return this.fillCopy(sourceCells, targetRange);
    }
  }

  private fillLinearSeries(sourceCells: CellData[], count: number, step: number): CellData[] {
    const result: CellData[] = [];
    const startValue = parseFloat(sourceCells[sourceCells.length - 1].value);

    for (let i = 0; i < count; i++) {
      const value = startValue + (i + 1) * step;
      result.push({
        value: value.toString(),
        displayValue: value.toString(),
        format: sourceCells[sourceCells.length - 1].format
      });
    }

    return result;
  }

  private fillGrowthSeries(sourceCells: CellData[], count: number, ratio: number): CellData[] {
    const result: CellData[] = [];
    const startValue = parseFloat(sourceCells[sourceCells.length - 1].value);

    for (let i = 0; i < count; i++) {
      const value = startValue * Math.pow(ratio, i + 1);
      result.push({
        value: value.toString(),
        displayValue: value.toString(),
        format: sourceCells[sourceCells.length - 1].format
      });
    }

    return result;
  }

  private fillDateSeries(sourceCells: CellData[], count: number, days: number): CellData[] {
    const result: CellData[] = [];
    const startDate = new Date(sourceCells[sourceCells.length - 1].value);

    for (let i = 0; i < count; i++) {
      const newDate = new Date(startDate);
      newDate.setDate(newDate.getDate() + (i + 1) * days);

      result.push({
        value: newDate.toISOString(),
        displayValue: newDate.toLocaleDateString(),
        format: sourceCells[sourceCells.length - 1].format
      });
    }

    return result;
  }

  private fillAutoSeries(sourceCells: CellData[], count: number): CellData[] {
    const result: CellData[] = [];
    const lastValue = sourceCells[sourceCells.length - 1].value;

    if (this.isDayName(lastValue)) {
      return this.fillDayNameSeries(lastValue, count);
    }

    if (this.isMonthName(lastValue)) {
      return this.fillMonthNameSeries(lastValue, count);
    }

    return this.fillCopy(sourceCells, { start: { row: 0, col: 0 }, end: { row: count - 1, col: 0 } });
  }

  private fillDayNameSeries(startDay: string, count: number): CellData[] {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const isShort = shortDays.includes(startDay);
    const dayList = isShort ? shortDays : days;

    const startIndex = dayList.indexOf(startDay);
    if (startIndex === -1) return [];

    const result: CellData[] = [];

    for (let i = 0; i < count; i++) {
      const dayIndex = (startIndex + i + 1) % dayList.length;
      result.push({
        value: dayList[dayIndex],
        displayValue: dayList[dayIndex]
      });
    }

    return result;
  }

  private fillMonthNameSeries(startMonth: string, count: number): CellData[] {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const isShort = shortMonths.includes(startMonth);
    const monthList = isShort ? shortMonths : months;

    const startIndex = monthList.indexOf(startMonth);
    if (startIndex === -1) return [];

    const result: CellData[] = [];

    for (let i = 0; i < count; i++) {
      const monthIndex = (startIndex + i + 1) % monthList.length;
      result.push({
        value: monthList[monthIndex],
        displayValue: monthList[monthIndex]
      });
    }

    return result;
  }

  private fillFormats(sourceCells: CellData[], targetRange: { start: CellAddress; end: CellAddress }): CellData[] {
    const result: CellData[] = [];
    const sourceLength = sourceCells.length;
    const rangeSize = this.getRangeSize(targetRange);

    for (let i = 0; i < rangeSize; i++) {
      const sourceIndex = i % sourceLength;
      result.push({
        value: '',
        format: sourceCells[sourceIndex].format
      });
    }

    return result;
  }

  private fillValues(sourceCells: CellData[], targetRange: { start: CellAddress; end: CellAddress }): CellData[] {
    const result: CellData[] = [];
    const sourceLength = sourceCells.length;
    const rangeSize = this.getRangeSize(targetRange);

    for (let i = 0; i < rangeSize; i++) {
      const sourceIndex = i % sourceLength;
      result.push({
        value: sourceCells[sourceIndex].value,
        displayValue: sourceCells[sourceIndex].displayValue
      });
    }

    return result;
  }

  // ============================================================================
  // FLASH FILL (AI-powered pattern completion)
  // ============================================================================

  flashFill(examples: string[], sourceData: string[]): string[] {
    // Simplified flash fill - detects common patterns
    if (examples.length === 0) return [];

    // Detect pattern type
    const pattern = this.detectFlashFillPattern(examples, sourceData);

    if (!pattern) return [];

    // Apply pattern to remaining data
    return sourceData.slice(examples.length).map(data => this.applyFlashFillPattern(data, pattern));
  }

  private detectFlashFillPattern(examples: string[], sourceData: string[]): any {
    // Extract first name (e.g., "John Doe" -> "John")
    if (this.isFirstNameExtraction(examples, sourceData)) {
      return { type: 'firstName' };
    }

    // Extract last name (e.g., "John Doe" -> "Doe")
    if (this.isLastNameExtraction(examples, sourceData)) {
      return { type: 'lastName' };
    }

    // Combine values (e.g., "John", "Doe" -> "John Doe")
    if (this.isCombination(examples, sourceData)) {
      return { type: 'combine', separator: this.detectSeparator(examples, sourceData) };
    }

    // Extract domain from email (e.g., "john@example.com" -> "example.com")
    if (this.isDomainExtraction(examples, sourceData)) {
      return { type: 'domain' };
    }

    // Extract numbers (e.g., "Order 12345" -> "12345")
    if (this.isNumberExtraction(examples, sourceData)) {
      return { type: 'numbers' };
    }

    // Uppercase/lowercase transformation
    if (this.isCaseTransformation(examples, sourceData)) {
      return { type: 'case', toUpper: examples[0] === sourceData[0].toUpperCase() };
    }

    return null;
  }

  private applyFlashFillPattern(data: string, pattern: any): string {
    switch (pattern.type) {
      case 'firstName':
        return data.split(' ')[0] || '';

      case 'lastName':
        const parts = data.split(' ');
        return parts[parts.length - 1] || '';

      case 'combine':
        return data; // Would need access to multiple columns

      case 'domain':
        const match = data.match(/@(.+)$/);
        return match ? match[1] : '';

      case 'numbers':
        return data.replace(/\D/g, '');

      case 'case':
        return pattern.toUpper ? data.toUpperCase() : data.toLowerCase();

      default:
        return data;
    }
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  private isNumber(value: string): boolean {
    return !isNaN(parseFloat(value));
  }

  private isDate(value: string): boolean {
    return !isNaN(new Date(value).getTime());
  }

  private isDayName(value: string): boolean {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.includes(value);
  }

  private isMonthName(value: string): boolean {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.includes(value);
  }

  private isNumberSeries(values: string[]): boolean {
    if (values.length < 2) return false;

    const numbers = values.map(v => parseFloat(v));
    if (numbers.some(isNaN)) return false;

    const step = numbers[1] - numbers[0];
    for (let i = 2; i < numbers.length; i++) {
      if (Math.abs(numbers[i] - numbers[i - 1] - step) > 0.0001) {
        return false;
      }
    }

    return true;
  }

  private isDateSeries(values: string[]): boolean {
    if (values.length < 2) return false;

    const dates = values.map(v => new Date(v));
    if (dates.some(d => isNaN(d.getTime()))) return false;

    const step = dates[1].getTime() - dates[0].getTime();
    for (let i = 2; i < dates.length; i++) {
      if (Math.abs(dates[i].getTime() - dates[i - 1].getTime() - step) > 86400000) {
        return false;
      }
    }

    return true;
  }

  private isGrowthSeries(values: string[]): boolean {
    if (values.length < 2) return false;

    const numbers = values.map(v => parseFloat(v));
    if (numbers.some(isNaN) || numbers.some(n => n <= 0)) return false;

    const ratio = numbers[1] / numbers[0];
    for (let i = 2; i < numbers.length; i++) {
      if (Math.abs(numbers[i] / numbers[i - 1] - ratio) > 0.0001) {
        return false;
      }
    }

    return true;
  }

  private isDayNameSeries(values: string[]): boolean {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return values.every(v => days.includes(v) || shortDays.includes(v));
  }

  private isMonthNameSeries(values: string[]): boolean {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return values.every(v => months.includes(v) || shortMonths.includes(v));
  }

  private calculateNumberStep(values: string[]): number {
    const numbers = values.map(v => parseFloat(v));
    return numbers[1] - numbers[0];
  }

  private calculateDateStep(values: string[]): number {
    const dates = values.map(v => new Date(v).getTime());
    return Math.round((dates[1] - dates[0]) / 86400000); // Days
  }

  private calculateGrowthRatio(values: string[]): number {
    const numbers = values.map(v => parseFloat(v));
    return numbers[1] / numbers[0];
  }

  private getDirection(targetRange: { start: CellAddress; end: CellAddress }): 'down' | 'right' | 'up' | 'left' {
    const rowDiff = targetRange.end.row - targetRange.start.row;
    const colDiff = targetRange.end.col - targetRange.start.col;

    if (Math.abs(rowDiff) > Math.abs(colDiff)) {
      return rowDiff > 0 ? 'down' : 'up';
    } else {
      return colDiff > 0 ? 'right' : 'left';
    }
  }

  private getRangeSize(targetRange: { start: CellAddress; end: CellAddress }): number {
    const rows = Math.abs(targetRange.end.row - targetRange.start.row) + 1;
    const cols = Math.abs(targetRange.end.col - targetRange.start.col) + 1;
    return rows * cols;
  }

  private isFirstNameExtraction(examples: string[], sourceData: string[]): boolean {
    if (examples.length === 0) return false;

    return examples.every((example, i) => {
      const source = sourceData[i];
      return source.startsWith(example) && source.includes(' ');
    });
  }

  private isLastNameExtraction(examples: string[], sourceData: string[]): boolean {
    if (examples.length === 0) return false;

    return examples.every((example, i) => {
      const source = sourceData[i];
      return source.endsWith(example) && source.includes(' ');
    });
  }

  private isCombination(examples: string[], sourceData: string[]): boolean {
    // Simplified - would need access to multiple source columns
    return false;
  }

  private isDomainExtraction(examples: string[], sourceData: string[]): boolean {
    if (examples.length === 0) return false;

    return examples.every((example, i) => {
      const source = sourceData[i];
      return source.includes('@') && source.endsWith(example);
    });
  }

  private isNumberExtraction(examples: string[], sourceData: string[]): boolean {
    if (examples.length === 0) return false;

    return examples.every((example, i) => {
      const source = sourceData[i];
      const numbers = source.replace(/\D/g, '');
      return numbers === example;
    });
  }

  private isCaseTransformation(examples: string[], sourceData: string[]): boolean {
    if (examples.length === 0) return false;

    const allUpper = examples.every((example, i) => example === sourceData[i].toUpperCase());
    const allLower = examples.every((example, i) => example === sourceData[i].toLowerCase());

    return allUpper || allLower;
  }

  private detectSeparator(examples: string[], sourceData: string[]): string {
    // Simplified - would analyze examples to find separator
    return ' ';
  }
}
