/**
 * In-Cell Visuals
 *
 * Advanced cell visualizations beyond traditional sparklines:
 * - Data bars with gradients and value labels
 * - Mini heatmaps for multi-value cells
 * - Bullet graphs for KPI tracking
 * - Variance arrows with percentage changes
 * - Icon sets (arrows, flags, ratings)
 * - Progress rings and gauges
 * - Mini charts (sparklines, win/loss charts)
 */

export interface CellVisual {
  type: 'dataBar' | 'heatmap' | 'bulletGraph' | 'varianceArrow' | 'iconSet' | 'progressRing' | 'sparkline';
  config: VisualConfig;
  value: any;
  displayValue?: string;
}

export interface VisualConfig {
  // Data Bar
  barColor?: string;
  barGradient?: { start: string; end: string };
  showValue?: boolean;
  minValue?: number;
  maxValue?: number;
  direction?: 'ltr' | 'rtl';

  // Heatmap
  colorScale?: ColorScale;

  // Bullet Graph
  target?: number;
  ranges?: { min: number; max: number; color: string }[];

  // Variance Arrow
  previousValue?: number;
  showPercentage?: boolean;
  arrowStyle?: 'simple' | 'triangle' | 'bold';

  // Icon Set
  iconSet?: 'arrows' | 'flags' | 'traffic' | 'rating' | 'indicators';
  thresholds?: number[];

  // Progress Ring
  size?: number;
  thickness?: number;
  backgroundColor?: string;
  foregroundColor?: string;

  // Sparkline
  sparklineType?: 'line' | 'column' | 'winLoss';
  dataPoints?: number[];
  color?: string;
  highlightMax?: boolean;
  highlightMin?: boolean;
}

export interface ColorScale {
  type: 'gradient' | 'steps';
  colors: string[];
  stops?: number[];
}

export class CellVisualsEngine {
  /**
   * Render a data bar visual
   */
  renderDataBar(value: number, config: VisualConfig): string {
    const min = config.minValue ?? 0;
    const max = config.maxValue ?? 100;
    const percentage = ((value - min) / (max - min)) * 100;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));

    const barColor = config.barColor || '#d4a017';
    const gradient = config.barGradient
      ? `linear-gradient(90deg, ${config.barGradient.start}, ${config.barGradient.end})`
      : barColor;

    return `
      <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center;">
        <div style="
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          height: 70%;
          width: ${clampedPercentage}%;
          background: ${gradient};
          opacity: 0.6;
          border-radius: 2px;
          transition: width 0.3s ease;
        "></div>
        ${config.showValue !== false ? `
          <div style="position: relative; z-index: 1; padding: 0 4px; font-size: 11px; font-weight: 600;">
            ${value.toFixed(config.minValue && config.minValue < 1 ? 2 : 0)}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render a heatmap visual (gradient background)
   */
  renderHeatmap(value: number, config: VisualConfig): string {
    const min = config.minValue ?? 0;
    const max = config.maxValue ?? 100;
    const percentage = ((value - min) / (max - min));
    const clampedPercentage = Math.max(0, Math.min(1, percentage));

    const color = this.interpolateColor(clampedPercentage, config.colorScale);

    return `
      <div style="
        width: 100%;
        height: 100%;
        background: ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
        color: ${clampedPercentage > 0.5 ? '#fff' : '#000'};
      ">
        ${value.toFixed(1)}
      </div>
    `;
  }

  /**
   * Render a bullet graph (KPI visualization)
   */
  renderBulletGraph(value: number, config: VisualConfig): string {
    const target = config.target ?? 100;
    const max = config.maxValue ?? target * 1.5;
    const percentage = (value / max) * 100;
    const targetPercentage = (target / max) * 100;

    const ranges = config.ranges || [
      { min: 0, max: max * 0.6, color: 'rgba(220, 38, 38, 0.2)' },
      { min: max * 0.6, max: max * 0.9, color: 'rgba(245, 158, 11, 0.2)' },
      { min: max * 0.9, max: max, color: 'rgba(34, 197, 94, 0.2)' },
    ];

    return `
      <div style="position: relative; width: 100%; height: 100%; padding: 4px;">
        <div style="position: relative; height: 100%; display: flex;">
          ${ranges.map(range => {
            const rangeWidth = ((range.max - range.min) / max) * 100;
            return `
              <div style="
                height: 100%;
                width: ${rangeWidth}%;
                background: ${range.color};
                border-right: 1px solid rgba(0,0,0,0.1);
              "></div>
            `;
          }).join('')}
        </div>
        <div style="
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          height: 40%;
          width: ${Math.min(percentage, 100)}%;
          background: #d4a017;
          border-radius: 2px;
        "></div>
        <div style="
          position: absolute;
          left: ${Math.min(targetPercentage, 100)}%;
          top: 0;
          height: 100%;
          width: 2px;
          background: #000;
        "></div>
        <div style="
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          font-weight: 700;
          color: ${percentage >= 90 ? '#22c55e' : percentage >= 60 ? '#f59e0b' : '#dc2626'};
        ">
          ${value.toFixed(0)}
        </div>
      </div>
    `;
  }

  /**
   * Render variance arrow
   */
  renderVarianceArrow(currentValue: number, config: VisualConfig): string {
    const previousValue = config.previousValue ?? currentValue;
    const change = currentValue - previousValue;
    const percentChange = previousValue !== 0 ? (change / previousValue) * 100 : 0;

    const isPositive = change > 0;
    const isNeutral = change === 0;

    const color = isNeutral ? '#9ca3af' : isPositive ? '#22c55e' : '#dc2626';
    const arrow = isNeutral ? '→' : isPositive ? '↑' : '↓';

    return `
      <div style="
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px;
        color: ${color};
      ">
        <span style="font-size: 16px; font-weight: 700;">${arrow}</span>
        <div style="display: flex; flex-direction: column; align-items: flex-start;">
          <span style="font-size: 12px; font-weight: 700;">${currentValue.toFixed(1)}</span>
          ${config.showPercentage !== false ? `
            <span style="font-size: 9px; opacity: 0.8;">
              ${isPositive ? '+' : ''}${percentChange.toFixed(1)}%
            </span>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render icon set
   */
  renderIconSet(value: number, config: VisualConfig): string {
    const iconSet = config.iconSet || 'arrows';
    const thresholds = config.thresholds || [33, 67];

    let icon = '';
    let color = '';

    switch (iconSet) {
      case 'arrows':
        if (value < thresholds[0]) {
          icon = '↓';
          color = '#dc2626';
        } else if (value < thresholds[1]) {
          icon = '→';
          color = '#f59e0b';
        } else {
          icon = '↑';
          color = '#22c55e';
        }
        break;

      case 'traffic':
        if (value < thresholds[0]) {
          icon = '🔴';
        } else if (value < thresholds[1]) {
          icon = '🟡';
        } else {
          icon = '🟢';
        }
        break;

      case 'flags':
        if (value < thresholds[0]) {
          icon = '🚩';
          color = '#dc2626';
        } else if (value < thresholds[1]) {
          icon = '⚐';
          color = '#f59e0b';
        } else {
          icon = '⚑';
          color = '#22c55e';
        }
        break;

      case 'rating':
        const stars = Math.ceil((value / 100) * 5);
        icon = '★'.repeat(stars) + '☆'.repeat(5 - stars);
        color = '#fbbf24';
        break;

      case 'indicators':
        if (value < thresholds[0]) {
          icon = '✗';
          color = '#dc2626';
        } else if (value < thresholds[1]) {
          icon = '▬';
          color = '#f59e0b';
        } else {
          icon = '✓';
          color = '#22c55e';
        }
        break;
    }

    return `
      <div style="
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px;
      ">
        <span style="font-size: 16px; color: ${color};">${icon}</span>
        <span style="font-size: 11px; font-weight: 600;">${value.toFixed(0)}</span>
      </div>
    `;
  }

  /**
   * Render progress ring
   */
  renderProgressRing(value: number, config: VisualConfig): string {
    const size = config.size || 32;
    const thickness = config.thickness || 3;
    const percentage = Math.min(100, Math.max(0, value));

    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const bgColor = config.backgroundColor || 'rgba(255,255,255,0.1)';
    const fgColor = config.foregroundColor || '#d4a017';

    return `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        margin: auto;
      ">
        <svg width="${size}" height="${size}" style="transform: rotate(-90deg);">
          <circle
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            stroke="${bgColor}"
            stroke-width="${thickness}"
            fill="none"
          />
          <circle
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            stroke="${fgColor}"
            stroke-width="${thickness}"
            fill="none"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
            stroke-linecap="round"
            style="transition: stroke-dashoffset 0.3s ease;"
          />
        </svg>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 9px;
          font-weight: 700;
        ">
          ${value.toFixed(0)}%
        </div>
      </div>
    `;
  }

  /**
   * Render sparkline
   */
  renderSparkline(config: VisualConfig): string {
    const dataPoints = config.dataPoints || [];
    if (dataPoints.length === 0) return '';

    const width = 80;
    const height = 24;
    const padding = 2;

    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);
    const range = max - min || 1;

    const points = dataPoints.map((value, index) => {
      const x = padding + (index / (dataPoints.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((value - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const color = config.color || '#d4a017';

    return `
      <svg width="${width}" height="${height}" style="display: block;">
        <polyline
          points="${points}"
          fill="none"
          stroke="${color}"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
        ${config.highlightMax ? this.renderSparklineHighlight(dataPoints, max, width, height, padding, min, range, '#22c55e') : ''}
        ${config.highlightMin ? this.renderSparklineHighlight(dataPoints, min, width, height, padding, min, range, '#dc2626') : ''}
      </svg>
    `;
  }

  /**
   * Render sparkline highlight point
   */
  private renderSparklineHighlight(
    dataPoints: number[],
    targetValue: number,
    width: number,
    height: number,
    padding: number,
    min: number,
    range: number,
    color: string
  ): string {
    const index = dataPoints.indexOf(targetValue);
    if (index === -1) return '';

    const x = padding + (index / (dataPoints.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((targetValue - min) / range) * (height - 2 * padding);

    return `<circle cx="${x}" cy="${y}" r="2" fill="${color}" />`;
  }

  /**
   * Interpolate color based on value
   */
  private interpolateColor(value: number, colorScale?: ColorScale): string {
    if (!colorScale) {
      // Default green-yellow-red scale
      if (value < 0.5) {
        return this.blendColors('#dc2626', '#f59e0b', value * 2);
      } else {
        return this.blendColors('#f59e0b', '#22c55e', (value - 0.5) * 2);
      }
    }

    const colors = colorScale.colors;
    if (colors.length === 1) return colors[0];

    const stops = colorScale.stops || colors.map((_, i) => i / (colors.length - 1));

    for (let i = 0; i < stops.length - 1; i++) {
      if (value >= stops[i] && value <= stops[i + 1]) {
        const localValue = (value - stops[i]) / (stops[i + 1] - stops[i]);
        return this.blendColors(colors[i], colors[i + 1], localValue);
      }
    }

    return colors[colors.length - 1];
  }

  /**
   * Blend two hex colors
   */
  private blendColors(color1: string, color2: string, ratio: number): string {
    const hex = (color: string) => parseInt(color.slice(1), 16);
    const r = Math.round;

    const c1 = hex(color1);
    const c2 = hex(color2);

    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;

    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;

    const rr = r(r1 + (r2 - r1) * ratio);
    const gg = r(g1 + (g2 - g1) * ratio);
    const bb = r(b1 + (b2 - b1) * ratio);

    return `#${((rr << 16) | (gg << 8) | bb).toString(16).padStart(6, '0')}`;
  }

  /**
   * Create a visual from config
   */
  createVisual(type: CellVisual['type'], value: any, config: VisualConfig): string {
    switch (type) {
      case 'dataBar':
        return this.renderDataBar(value, config);
      case 'heatmap':
        return this.renderHeatmap(value, config);
      case 'bulletGraph':
        return this.renderBulletGraph(value, config);
      case 'varianceArrow':
        return this.renderVarianceArrow(value, config);
      case 'iconSet':
        return this.renderIconSet(value, config);
      case 'progressRing':
        return this.renderProgressRing(value, config);
      case 'sparkline':
        return this.renderSparkline(config);
      default:
        return value.toString();
    }
  }
}
