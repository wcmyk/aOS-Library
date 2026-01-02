/**
 * Cell Formatting Module
 * Handles all cell formatting operations including fonts, colors, borders, number formats, etc.
 */

import { CellData, CellFormat, BorderStyle, ConditionalFormat } from './types';

export class CellFormatter {
  // ============================================================================
  // FONT FORMATTING
  // ============================================================================

  applyBold(cell: CellData, bold: boolean = true): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        bold
      }
    };
  }

  applyItalic(cell: CellData, italic: boolean = true): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        italic
      }
    };
  }

  applyUnderline(cell: CellData, underline: boolean = true): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        underline
      }
    };
  }

  applyStrikethrough(cell: CellData, strikethrough: boolean = true): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        strikethrough
      }
    };
  }

  applyFontSize(cell: CellData, fontSize: number): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        fontSize
      }
    };
  }

  applyFontFamily(cell: CellData, fontFamily: string): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        fontFamily
      }
    };
  }

  applyFontColor(cell: CellData, color: string): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        color
      }
    };
  }

  // ============================================================================
  // ALIGNMENT
  // ============================================================================

  applyAlignment(cell: CellData, alignment: 'left' | 'center' | 'right'): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        alignment
      }
    };
  }

  applyVerticalAlignment(cell: CellData, verticalAlignment: 'top' | 'middle' | 'bottom'): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        verticalAlignment
      }
    };
  }

  applyWrapText(cell: CellData, wrapText: boolean = true): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        wrapText
      }
    };
  }

  applyTextRotation(cell: CellData, degrees: number): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        textRotation: degrees
      }
    };
  }

  // ============================================================================
  // BACKGROUND & FILL
  // ============================================================================

  applyBackgroundColor(cell: CellData, color: string): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        backgroundColor: color
      }
    };
  }

  applyPattern(cell: CellData, pattern: string): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        pattern
      }
    };
  }

  // ============================================================================
  // BORDERS
  // ============================================================================

  applyBorder(cell: CellData, side: 'top' | 'right' | 'bottom' | 'left' | 'all', style: BorderStyle): CellData {
    const newFormat = { ...cell.format };

    if (side === 'all') {
      newFormat.borderTop = style;
      newFormat.borderRight = style;
      newFormat.borderBottom = style;
      newFormat.borderLeft = style;
    } else {
      const borderKey = `border${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof CellFormat;
      (newFormat as any)[borderKey] = style;
    }

    return {
      ...cell,
      format: newFormat
    };
  }

  applyOutlineBorder(cell: CellData, style: BorderStyle): CellData {
    return this.applyBorder(cell, 'all', style);
  }

  removeBorder(cell: CellData, side: 'top' | 'right' | 'bottom' | 'left' | 'all'): CellData {
    const newFormat = { ...cell.format };

    if (side === 'all') {
      delete newFormat.borderTop;
      delete newFormat.borderRight;
      delete newFormat.borderBottom;
      delete newFormat.borderLeft;
    } else {
      const borderKey = `border${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof CellFormat;
      delete (newFormat as any)[borderKey];
    }

    return {
      ...cell,
      format: newFormat
    };
  }

  // ============================================================================
  // NUMBER FORMATS
  // ============================================================================

  applyNumberFormat(cell: CellData, format: string): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        numberFormat: format
      }
    };
  }

  applyDecimals(cell: CellData, decimals: number): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        decimals
      }
    };
  }

  applyCurrency(cell: CellData, currency: string = '$'): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        currency,
        numberFormat: 'currency'
      }
    };
  }

  applyPercentage(cell: CellData): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        percentage: true,
        numberFormat: 'percentage'
      }
    };
  }

  applyDateFormat(cell: CellData, dateFormat: string): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        dateFormat,
        numberFormat: 'date'
      }
    };
  }

  applyCommaSeparator(cell: CellData): CellData {
    return {
      ...cell,
      format: {
        ...cell.format,
        numberFormat: 'comma'
      }
    };
  }

  // ============================================================================
  // CONDITIONAL FORMATTING
  // ============================================================================

  applyConditionalFormat(cell: CellData, condition: ConditionalFormat): CellData {
    const formats = cell.format?.conditionalFormat || [];
    return {
      ...cell,
      format: {
        ...cell.format,
        conditionalFormat: [...formats, condition]
      }
    };
  }

  removeConditionalFormat(cell: CellData, index?: number): CellData {
    if (!cell.format?.conditionalFormat) return cell;

    const formats = [...cell.format.conditionalFormat];

    if (index !== undefined) {
      formats.splice(index, 1);
    } else {
      formats.length = 0;
    }

    return {
      ...cell,
      format: {
        ...cell.format,
        conditionalFormat: formats.length > 0 ? formats : undefined
      }
    };
  }

  evaluateConditionalFormat(cell: CellData): CellFormat | undefined {
    if (!cell.format?.conditionalFormat) return undefined;

    for (const condition of cell.format.conditionalFormat) {
      if (this.checkCondition(cell, condition)) {
        return condition.format;
      }
    }

    return undefined;
  }

  private checkCondition(cell: CellData, condition: ConditionalFormat): boolean {
    const cellValue = cell.value;

    switch (condition.type) {
      case 'cellValue':
        return this.checkCellValueCondition(cellValue, condition);

      case 'expression':
        // Would need formula evaluation
        return false;

      case 'colorScale':
      case 'dataBar':
      case 'iconSet':
        return true; // Always apply for visualization types

      default:
        return false;
    }
  }

  private checkCellValueCondition(cellValue: any, condition: ConditionalFormat): boolean {
    const value = parseFloat(cellValue);
    const value1 = parseFloat(condition.value1);
    const value2 = parseFloat(condition.value2);

    switch (condition.operator) {
      case 'greaterThan':
        return value > value1;
      case 'lessThan':
        return value < value1;
      case 'equal':
        return value === value1;
      case 'notEqual':
        return value !== value1;
      case 'between':
        return value >= value1 && value <= value2;
      case 'contains':
        return String(cellValue).includes(String(condition.value1));
      default:
        return false;
    }
  }

  // ============================================================================
  // FORMAT COPYING
  // ============================================================================

  copyFormat(sourceCell: CellData, targetCell: CellData): CellData {
    return {
      ...targetCell,
      format: { ...sourceCell.format }
    };
  }

  clearFormat(cell: CellData): CellData {
    return {
      ...cell,
      format: undefined
    };
  }

  // ============================================================================
  // STYLE PRESETS
  // ============================================================================

  applyPresetStyle(cell: CellData, styleName: string): CellData {
    const styles: { [key: string]: CellFormat } = {
      'heading1': {
        bold: true,
        fontSize: 18,
        color: '#000000',
        backgroundColor: '#E7E6E6'
      },
      'heading2': {
        bold: true,
        fontSize: 14,
        color: '#000000',
        backgroundColor: '#F2F2F2'
      },
      'accent1': {
        bold: true,
        color: '#FFFFFF',
        backgroundColor: '#4472C4'
      },
      'accent2': {
        bold: true,
        color: '#FFFFFF',
        backgroundColor: '#ED7D31'
      },
      'accent3': {
        bold: true,
        color: '#FFFFFF',
        backgroundColor: '#A5A5A5'
      },
      'warning': {
        bold: true,
        color: '#9C6500',
        backgroundColor: '#FFEB9C'
      },
      'error': {
        bold: true,
        color: '#9C0006',
        backgroundColor: '#FFC7CE'
      },
      'success': {
        bold: true,
        color: '#006100',
        backgroundColor: '#C6EFCE'
      },
      'neutral': {
        color: '#000000',
        backgroundColor: '#FFFFFF'
      },
      'currency': {
        numberFormat: 'currency',
        currency: '$',
        decimals: 2,
        alignment: 'right'
      },
      'percentage': {
        numberFormat: 'percentage',
        percentage: true,
        decimals: 2,
        alignment: 'right'
      },
      'date': {
        numberFormat: 'date',
        dateFormat: 'MM/DD/YYYY',
        alignment: 'left'
      }
    };

    const style = styles[styleName];
    if (!style) return cell;

    return {
      ...cell,
      format: {
        ...cell.format,
        ...style
      }
    };
  }

  // ============================================================================
  // FORMAT DISPLAY
  // ============================================================================

  formatDisplayValue(cell: CellData): string {
    const value = cell.displayValue || cell.value;
    const format = cell.format;

    if (!format || !value) return value;

    const num = parseFloat(value);
    if (isNaN(num)) return value;

    // Currency
    if (format.currency) {
      const decimals = format.decimals !== undefined ? format.decimals : 2;
      return `${format.currency}${num.toFixed(decimals)}`;
    }

    // Percentage
    if (format.percentage) {
      const decimals = format.decimals !== undefined ? format.decimals : 2;
      return `${(num * 100).toFixed(decimals)}%`;
    }

    // Decimals
    if (format.decimals !== undefined) {
      return num.toFixed(format.decimals);
    }

    // Comma separator
    if (format.numberFormat === 'comma') {
      const parts = num.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }

    // Date format
    if (format.dateFormat) {
      try {
        const date = new Date(value);
        return this.formatDate(date, format.dateFormat);
      } catch {
        return value;
      }
    }

    // Custom number format
    if (format.numberFormat && format.numberFormat !== 'currency' && format.numberFormat !== 'percentage') {
      return this.applyCustomFormat(num, format.numberFormat);
    }

    return value;
  }

  private formatDate(date: Date, format: string): string {
    const tokens: { [key: string]: string } = {
      'YYYY': date.getFullYear().toString(),
      'YY': date.getFullYear().toString().slice(-2),
      'MM': String(date.getMonth() + 1).padStart(2, '0'),
      'M': String(date.getMonth() + 1),
      'DD': String(date.getDate()).padStart(2, '0'),
      'D': String(date.getDate()),
      'HH': String(date.getHours()).padStart(2, '0'),
      'H': String(date.getHours()),
      'mm': String(date.getMinutes()).padStart(2, '0'),
      'm': String(date.getMinutes()),
      'ss': String(date.getSeconds()).padStart(2, '0'),
      's': String(date.getSeconds())
    };

    let formatted = format;
    for (const [token, value] of Object.entries(tokens)) {
      formatted = formatted.replace(new RegExp(token, 'g'), value);
    }

    return formatted;
  }

  private applyCustomFormat(num: number, format: string): string {
    // Simplified custom format implementation
    const parts = format.split(';');
    const positiveFormat = parts[0] || '#,##0.00';

    if (num < 0 && parts[1]) {
      return this.processFormatString(Math.abs(num), parts[1]);
    }

    if (num === 0 && parts[2]) {
      return this.processFormatString(num, parts[2]);
    }

    return this.processFormatString(num, positiveFormat);
  }

  private processFormatString(num: number, format: string): string {
    // Count decimal places
    const decimalIndex = format.indexOf('.');
    const decimals = decimalIndex >= 0 ? format.substring(decimalIndex + 1).replace(/[^0#]/g, '').length : 0;

    let result = num.toFixed(decimals);

    // Apply comma separator
    if (format.includes(',')) {
      const parts = result.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      result = parts.join('.');
    }

    // Apply prefix/suffix
    const prefix = format.match(/^[^#0]+/)?.[0] || '';
    const suffix = format.match(/[^#0]+$/)?.[0] || '';

    return prefix + result + suffix;
  }

  // ============================================================================
  // CELL MERGING
  // ============================================================================

  mergeCells(cells: CellData[], startRow: number, startCol: number, endRow: number, endCol: number): CellData[] {
    const mergeAddress = `${this.colToLetter(startCol)}${startRow + 1}:${this.colToLetter(endCol)}${endRow + 1}`;

    return cells.map((cell, index) => {
      const row = Math.floor(index / 26);
      const col = index % 26;

      if (row >= startRow && row <= endRow && col >= startCol && col <= endCol) {
        if (row === startRow && col === startCol) {
          // Master cell
          return {
            ...cell,
            mergedWith: mergeAddress
          };
        } else {
          // Merged cells
          return {
            ...cell,
            isMerged: true,
            value: ''
          };
        }
      }

      return cell;
    });
  }

  unmergeCells(cells: CellData[], startRow: number, startCol: number, endRow: number, endCol: number): CellData[] {
    return cells.map((cell, index) => {
      const row = Math.floor(index / 26);
      const col = index % 26;

      if (row >= startRow && row <= endRow && col >= startCol && col <= endCol) {
        const newCell = { ...cell };
        delete newCell.mergedWith;
        delete newCell.isMerged;
        return newCell;
      }

      return cell;
    });
  }

  private colToLetter(col: number): string {
    let result = '';
    while (col >= 0) {
      result = String.fromCharCode(65 + (col % 26)) + result;
      col = Math.floor(col / 26) - 1;
    }
    return result;
  }
}
