/**
 * Data Connectors
 *
 * First-class data connectors for external data sources with:
 * - CSV, JSON, API, database support
 * - Automatic schema inference
 * - Refresh schedules
 * - Data transformation pipelines
 * - Error handling and validation
 */

import type { CellData } from './types';

export interface DataSource {
  id: string;
  name: string;
  type: 'csv' | 'json' | 'api' | 'database' | 'parquet' | 'web';
  config: DataSourceConfig;
  schema?: DataSchema;
  lastRefresh?: Date;
  refreshSchedule?: RefreshSchedule;
  status: 'connected' | 'disconnected' | 'error' | 'loading';
  errorMessage?: string;
}

export interface DataSourceConfig {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  query?: string;
  delimiter?: string;
  encoding?: string;
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'apiKey';
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
  };
}

export interface DataSchema {
  columns: ColumnSchema[];
  rowCount?: number;
  inferredTypes: Record<string, DataType>;
}

export interface ColumnSchema {
  name: string;
  type: DataType;
  nullable: boolean;
  unique: boolean;
  sampleValues: any[];
}

export type DataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'email'
  | 'url'
  | 'json'
  | 'null'
  | 'mixed';

export interface RefreshSchedule {
  enabled: boolean;
  interval: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string;
  lastRun?: Date;
  nextRun?: Date;
}

export interface DataConnectorResult {
  success: boolean;
  data: any[][];
  schema?: DataSchema;
  error?: string;
  metadata?: {
    rowCount: number;
    columnCount: number;
    fetchTimeMs: number;
  };
}

export class DataConnectorEngine {
  private sources: Map<string, DataSource>;
  private cache: Map<string, { data: any[][]; timestamp: number }>;
  private cacheExpiry: number = 300000; // 5 minutes

  constructor() {
    this.sources = new Map();
    this.cache = new Map();
  }

  /**
   * Register a new data source
   */
  registerSource(source: DataSource): void {
    this.sources.set(source.id, source);
  }

  /**
   * Fetch data from a source
   */
  async fetchData(sourceId: string, useCache = true): Promise<DataConnectorResult> {
    const source = this.sources.get(sourceId);
    if (!source) {
      return {
        success: false,
        data: [],
        error: `Data source ${sourceId} not found`,
      };
    }

    // Check cache
    if (useCache) {
      const cached = this.cache.get(sourceId);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return {
          success: true,
          data: cached.data,
          schema: source.schema,
          metadata: {
            rowCount: cached.data.length,
            columnCount: cached.data[0]?.length || 0,
            fetchTimeMs: 0,
          },
        };
      }
    }

    // Fetch new data
    const startTime = performance.now();

    try {
      let result: DataConnectorResult;

      switch (source.type) {
        case 'csv':
          result = await this.fetchCSV(source);
          break;
        case 'json':
          result = await this.fetchJSON(source);
          break;
        case 'api':
          result = await this.fetchAPI(source);
          break;
        case 'web':
          result = await this.fetchWeb(source);
          break;
        default:
          return {
            success: false,
            data: [],
            error: `Unsupported source type: ${source.type}`,
          };
      }

      if (result.success) {
        // Update cache
        this.cache.set(sourceId, {
          data: result.data,
          timestamp: Date.now(),
        });

        // Infer schema if not present
        if (!result.schema) {
          result.schema = this.inferSchema(result.data);
        }

        // Update source
        source.schema = result.schema;
        source.lastRefresh = new Date();
        source.status = 'connected';

        result.metadata = {
          rowCount: result.data.length,
          columnCount: result.data[0]?.length || 0,
          fetchTimeMs: performance.now() - startTime,
        };
      } else {
        source.status = 'error';
        source.errorMessage = result.error;
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      source.status = 'error';
      source.errorMessage = errorMessage;

      return {
        success: false,
        data: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Fetch CSV data
   */
  private async fetchCSV(source: DataSource): Promise<DataConnectorResult> {
    if (!source.config.url) {
      return { success: false, data: [], error: 'CSV URL is required' };
    }

    try {
      const response = await fetch(source.config.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const data = this.parseCSV(text, source.config.delimiter || ',');

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch CSV',
      };
    }
  }

  /**
   * Parse CSV text
   */
  private parseCSV(text: string, delimiter: string): any[][] {
    const rows: any[][] = [];
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      if (!line.trim()) continue;

      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }

      values.push(currentValue.trim());
      rows.push(values);
    }

    return rows;
  }

  /**
   * Fetch JSON data
   */
  private async fetchJSON(source: DataSource): Promise<DataConnectorResult> {
    if (!source.config.url) {
      return { success: false, data: [], error: 'JSON URL is required' };
    }

    try {
      const response = await fetch(source.config.url, {
        method: source.config.method || 'GET',
        headers: source.config.headers,
        body: source.config.body ? JSON.stringify(source.config.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const data = this.jsonToTable(json);

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch JSON',
      };
    }
  }

  /**
   * Convert JSON to table format
   */
  private jsonToTable(json: any): any[][] {
    if (Array.isArray(json)) {
      if (json.length === 0) return [];

      // Extract column names from first object
      const firstItem = json[0];
      if (typeof firstItem === 'object' && !Array.isArray(firstItem)) {
        const headers = Object.keys(firstItem);
        const rows: any[][] = [headers];

        json.forEach((item: any) => {
          const row = headers.map(header => item[header]);
          rows.push(row);
        });

        return rows;
      }

      // Array of primitives - single column
      return json.map(item => [item]);
    }

    // Single object - convert to rows
    if (typeof json === 'object') {
      return Object.entries(json).map(([key, value]) => [key, value]);
    }

    // Primitive value - single cell
    return [[json]];
  }

  /**
   * Fetch data from REST API
   */
  private async fetchAPI(source: DataSource): Promise<DataConnectorResult> {
    if (!source.config.url) {
      return { success: false, data: [], error: 'API URL is required' };
    }

    try {
      const headers: Record<string, string> = source.config.headers || {};

      // Add authentication
      if (source.config.auth) {
        switch (source.config.auth.type) {
          case 'bearer':
            headers['Authorization'] = `Bearer ${source.config.auth.token}`;
            break;
          case 'apiKey':
            headers['X-API-Key'] = source.config.auth.apiKey || '';
            break;
          case 'basic':
            const credentials = btoa(`${source.config.auth.username}:${source.config.auth.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
            break;
        }
      }

      const response = await fetch(source.config.url, {
        method: source.config.method || 'GET',
        headers,
        body: source.config.body ? JSON.stringify(source.config.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const data = this.jsonToTable(json);

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch from API',
      };
    }
  }

  /**
   * Fetch data from web page
   */
  private async fetchWeb(source: DataSource): Promise<DataConnectorResult> {
    if (!source.config.url) {
      return { success: false, data: [], error: 'Web URL is required' };
    }

    try {
      const response = await fetch(source.config.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const data = this.extractTablesFromHTML(html);

      return {
        success: true,
        data: data[0] || [], // Return first table
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch web page',
      };
    }
  }

  /**
   * Extract tables from HTML
   */
  private extractTablesFromHTML(html: string): any[][][] {
    const tables: any[][][] = [];

    // Basic HTML table parsing (simplified - would use DOMParser in browser)
    const tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);

    if (!tableMatches) return [];

    tableMatches.forEach(tableHtml => {
      const rows: any[][] = [];
      const rowMatches = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);

      rowMatches?.forEach(rowHtml => {
        const cells: any[] = [];
        const cellMatches = rowHtml.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);

        cellMatches?.forEach(cellHtml => {
          const content = cellHtml.replace(/<[^>]+>/g, '').trim();
          cells.push(content);
        });

        if (cells.length > 0) {
          rows.push(cells);
        }
      });

      if (rows.length > 0) {
        tables.push(rows);
      }
    });

    return tables;
  }

  /**
   * Infer schema from data
   */
  inferSchema(data: any[][]): DataSchema {
    if (data.length === 0) {
      return { columns: [], inferredTypes: {} };
    }

    const headers = data[0];
    const rows = data.slice(1);

    const columns: ColumnSchema[] = headers.map((header, colIndex) => {
      const values = rows.map(row => row[colIndex]).filter(v => v != null && v !== '');
      const type = this.inferColumnType(values);
      const unique = new Set(values).size === values.length;

      return {
        name: header.toString(),
        type,
        nullable: values.length < rows.length,
        unique,
        sampleValues: values.slice(0, 5),
      };
    });

    const inferredTypes: Record<string, DataType> = {};
    columns.forEach(col => {
      inferredTypes[col.name] = col.type;
    });

    return {
      columns,
      rowCount: rows.length,
      inferredTypes,
    };
  }

  /**
   * Infer data type from values
   */
  private inferColumnType(values: any[]): DataType {
    if (values.length === 0) return 'null';

    const types = new Set<DataType>();

    values.forEach(value => {
      const type = this.inferValueType(value);
      types.add(type);
    });

    if (types.size === 1) {
      return Array.from(types)[0];
    }

    if (types.has('number') && types.has('string')) {
      return 'mixed';
    }

    return 'mixed';
  }

  /**
   * Infer type of a single value
   */
  private inferValueType(value: any): DataType {
    if (value == null || value === '') return 'null';

    // Boolean
    if (value === 'true' || value === 'false' || typeof value === 'boolean') {
      return 'boolean';
    }

    // Number
    if (!isNaN(parseFloat(value)) && isFinite(value)) {
      return 'number';
    }

    // Email
    if (typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'email';
    }

    // URL
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
      return 'url';
    }

    // Date
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const timePattern = /\d{2}:\d{2}/;
      if (timePattern.test(value)) {
        return 'datetime';
      }
      return 'date';
    }

    // JSON
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        JSON.parse(value);
        return 'json';
      } catch {}
    }

    return 'string';
  }

  /**
   * Import data to cells
   */
  importToSheet(
    data: any[][],
    startRow: number,
    startCol: number,
    includeHeaders = true
  ): Map<string, CellData> {
    const cells = new Map<string, CellData>();
    const startIndex = includeHeaders ? 0 : 1;

    data.slice(startIndex).forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        const address = this.getCellAddress(startRow + rowIndex, startCol + colIndex);
        cells.set(address, {
          value: value?.toString() || '',
          displayValue: value?.toString() || '',
        });
      });
    });

    return cells;
  }

  /**
   * Convert row/col to cell address (A1 notation)
   */
  private getCellAddress(row: number, col: number): string {
    let colName = '';
    let c = col;

    while (c >= 0) {
      colName = String.fromCharCode(65 + (c % 26)) + colName;
      c = Math.floor(c / 26) - 1;
    }

    return `${colName}${row + 1}`;
  }

  /**
   * Clear cache for a source
   */
  clearCache(sourceId: string): void {
    this.cache.delete(sourceId);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.cache.clear();
  }

  /**
   * Get all data sources
   */
  getSources(): DataSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Remove a data source
   */
  removeSource(sourceId: string): void {
    this.sources.delete(sourceId);
    this.cache.delete(sourceId);
  }
}
