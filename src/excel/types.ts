/**
 * Type definitions for Excel functionality
 */

export interface CellData {
  value: string;
  formula?: string;
  displayValue?: string;
  format?: CellFormat;
  mergedWith?: string; // Cell address it's merged with (e.g., "B2:C3")
  isMerged?: boolean; // If this cell is part of a merge
  validation?: CellValidation;
  comment?: string;
}

export interface CellFormat {
  // Font
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;

  // Alignment
  alignment?: 'left' | 'center' | 'right';
  verticalAlignment?: 'top' | 'middle' | 'bottom';
  wrapText?: boolean;
  textRotation?: number;

  // Background
  backgroundColor?: string;
  pattern?: string;

  // Border
  borderTop?: BorderStyle;
  borderRight?: BorderStyle;
  borderBottom?: BorderStyle;
  borderLeft?: BorderStyle;

  // Number format
  numberFormat?: string;
  decimals?: number;
  currency?: string;
  percentage?: boolean;
  dateFormat?: string;

  // Conditional formatting
  conditionalFormat?: ConditionalFormat[];
}

export interface BorderStyle {
  style?: 'none' | 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted' | 'double';
  color?: string;
}

export interface ConditionalFormat {
  type: 'cellValue' | 'expression' | 'colorScale' | 'dataBar' | 'iconSet';
  operator?: 'greaterThan' | 'lessThan' | 'between' | 'equal' | 'notEqual' | 'contains';
  value1?: any;
  value2?: any;
  expression?: string;
  format?: CellFormat;
  colorScale?: { min: string; mid?: string; max: string };
  dataBar?: { color: string; showValue: boolean };
  iconSet?: { set: 'arrows' | 'flags' | 'traffic' | 'rating'; reverseOrder: boolean };
}

export interface CellValidation {
  type: 'list' | 'number' | 'date' | 'text' | 'custom';
  operator?: 'between' | 'notBetween' | 'equal' | 'notEqual' | 'greaterThan' | 'lessThan';
  value1?: any;
  value2?: any;
  list?: string[];
  formula?: string;
  allowBlank?: boolean;
  showDropdown?: boolean;
  errorMessage?: string;
  errorTitle?: string;
}

export interface CellAddress {
  row: number;
  col: number;
}

export interface CellRange {
  start: CellAddress;
  end: CellAddress;
}

export interface AutoFillPattern {
  type: 'copy' | 'series' | 'fill' | 'formats' | 'values';
  direction?: 'down' | 'right' | 'up' | 'left';
  seriesType?: 'linear' | 'growth' | 'date' | 'autoFill';
  stepValue?: number;
  stopValue?: number;
  trend?: boolean;
}

export interface SolverOptions {
  objectiveCell: string;
  optimizeType: 'max' | 'min' | 'value';
  targetValue?: number;
  variableCells: string[];
  constraints: SolverConstraint[];
  method?: 'grg' | 'simplex' | 'evolutionary';
}

export interface SolverConstraint {
  cell: string;
  operator: '=' | '<=' | '>=' | 'int' | 'bin' | 'dif';
  value: number | string;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'doughnut' | 'radar';
  series: ChartSeries[];
  categories?: string[];
  title?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;
  legend?: boolean;
}

export interface ChartSeries {
  name: string;
  data: number[];
  color?: string;
}

export interface PivotTableConfig {
  sourceData: string;
  rows: string[];
  columns: string[];
  values: PivotValue[];
  filters?: string[];
}

export interface PivotValue {
  field: string;
  aggregation: 'sum' | 'count' | 'average' | 'max' | 'min' | 'product' | 'countNumbers' | 'stdDev' | 'stdDevP' | 'var' | 'varP';
  name?: string;
}
