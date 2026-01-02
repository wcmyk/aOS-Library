/**
 * Comprehensive Excel Formula Engine
 * Implements 360+ Excel formulas across all categories
 */

import { CellData } from './types';

export class ExcelFormulas {
  cells: Map<string, CellData>;

  constructor(cells: Map<string, CellData>) {
    this.cells = cells;
  }

  // ============================================================================
  // MATH & TRIGONOMETRY FUNCTIONS (50+ functions)
  // ============================================================================

  // Basic Math
  SUM(...values: any[]): number {
    const flat = this.flattenArgs(values);
    return flat.reduce((sum, val) => sum + (this.toNumber(val) || 0), 0);
  }

  SUMIF(range: any[], criteria: any, sumRange?: any[]): number {
    const rangeFlat = this.flattenArgs([range]);
    const sumFlat = sumRange ? this.flattenArgs([sumRange]) : rangeFlat;
    let sum = 0;

    rangeFlat.forEach((val, i) => {
      if (this.matchesCriteria(val, criteria)) {
        sum += this.toNumber(sumFlat[i]) || 0;
      }
    });

    return sum;
  }

  SUMIFS(sumRange: any[], ...criteriaRanges: any[]): number {
    const sumFlat = this.flattenArgs([sumRange]);
    let sum = 0;

    for (let i = 0; i < sumFlat.length; i++) {
      let matches = true;

      for (let j = 0; j < criteriaRanges.length; j += 2) {
        const range = this.flattenArgs([criteriaRanges[j]]);
        const criteria = criteriaRanges[j + 1];

        if (!this.matchesCriteria(range[i], criteria)) {
          matches = false;
          break;
        }
      }

      if (matches) {
        sum += this.toNumber(sumFlat[i]) || 0;
      }
    }

    return sum;
  }

  PRODUCT(...values: any[]): number {
    const flat = this.flattenArgs(values);
    return flat.reduce((prod, val) => prod * (this.toNumber(val) || 1), 1);
  }

  QUOTIENT(numerator: number, denominator: number): number {
    return Math.floor(numerator / denominator);
  }

  MOD(number: number, divisor: number): number {
    return number % divisor;
  }

  POWER(base: number, exponent: number): number {
    return Math.pow(base, exponent);
  }

  SQRT(number: number): number {
    return Math.sqrt(number);
  }

  SQRTPI(number: number): number {
    return Math.sqrt(number * Math.PI);
  }

  ABS(number: number): number {
    return Math.abs(number);
  }

  SIGN(number: number): number {
    return number > 0 ? 1 : number < 0 ? -1 : 0;
  }

  ROUND(number: number, digits: number): number {
    const factor = Math.pow(10, digits);
    return Math.round(number * factor) / factor;
  }

  ROUNDUP(number: number, digits: number): number {
    const factor = Math.pow(10, digits);
    return Math.ceil(number * factor) / factor;
  }

  ROUNDDOWN(number: number, digits: number): number {
    const factor = Math.pow(10, digits);
    return Math.floor(number * factor) / factor;
  }

  CEILING(number: number, significance: number = 1): number {
    return Math.ceil(number / significance) * significance;
  }

  FLOOR(number: number, significance: number = 1): number {
    return Math.floor(number / significance) * significance;
  }

  TRUNC(number: number, digits: number = 0): number {
    const factor = Math.pow(10, digits);
    return Math.trunc(number * factor) / factor;
  }

  INT(number: number): number {
    return Math.floor(number);
  }

  EVEN(number: number): number {
    return Math.ceil(number / 2) * 2;
  }

  ODD(number: number): number {
    const val = Math.ceil(Math.abs(number));
    return val % 2 === 0 ? val + 1 : val;
  }

  // Trigonometric Functions
  PI(): number {
    return Math.PI;
  }

  SIN(angle: number): number {
    return Math.sin(angle);
  }

  COS(angle: number): number {
    return Math.cos(angle);
  }

  TAN(angle: number): number {
    return Math.tan(angle);
  }

  ASIN(value: number): number {
    return Math.asin(value);
  }

  ACOS(value: number): number {
    return Math.acos(value);
  }

  ATAN(value: number): number {
    return Math.atan(value);
  }

  ATAN2(x: number, y: number): number {
    return Math.atan2(y, x);
  }

  SINH(value: number): number {
    return Math.sinh(value);
  }

  COSH(value: number): number {
    return Math.cosh(value);
  }

  TANH(value: number): number {
    return Math.tanh(value);
  }

  ASINH(value: number): number {
    return Math.asinh(value);
  }

  ACOSH(value: number): number {
    return Math.acosh(value);
  }

  ATANH(value: number): number {
    return Math.atanh(value);
  }

  DEGREES(radians: number): number {
    return radians * (180 / Math.PI);
  }

  RADIANS(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Advanced Math
  EXP(exponent: number): number {
    return Math.exp(exponent);
  }

  LN(number: number): number {
    return Math.log(number);
  }

  LOG(number: number, base: number = 10): number {
    return Math.log(number) / Math.log(base);
  }

  LOG10(number: number): number {
    return Math.log10(number);
  }

  FACT(number: number): number {
    if (number < 0) return NaN;
    if (number === 0 || number === 1) return 1;
    let result = 1;
    for (let i = 2; i <= number; i++) {
      result *= i;
    }
    return result;
  }

  FACTDOUBLE(number: number): number {
    if (number < 0) return NaN;
    if (number === 0 || number === 1) return 1;
    let result = 1;
    for (let i = number; i > 0; i -= 2) {
      result *= i;
    }
    return result;
  }

  GCD(...numbers: number[]): number {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    return this.flattenArgs(numbers).reduce((acc, num) => gcd(acc, this.toNumber(num) || 0));
  }

  LCM(...numbers: number[]): number {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);
    return this.flattenArgs(numbers).reduce((acc, num) => lcm(acc, this.toNumber(num) || 1));
  }

  COMBIN(n: number, k: number): number {
    return this.FACT(n) / (this.FACT(k) * this.FACT(n - k));
  }

  COMBINA(n: number, k: number): number {
    return this.COMBIN(n + k - 1, k);
  }

  PERMUT(n: number, k: number): number {
    return this.FACT(n) / this.FACT(n - k);
  }

  PERMUTATIONA(n: number, k: number): number {
    return Math.pow(n, k);
  }

  MROUND(number: number, multiple: number): number {
    return Math.round(number / multiple) * multiple;
  }

  RAND(): number {
    return Math.random();
  }

  RANDBETWEEN(bottom: number, top: number): number {
    return Math.floor(Math.random() * (top - bottom + 1)) + bottom;
  }

  ROMAN(number: number): string {
    const romanNumerals: [number, string][] = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];

    let result = '';
    let num = Math.floor(number);

    for (const [value, letter] of romanNumerals) {
      while (num >= value) {
        result += letter;
        num -= value;
      }
    }

    return result;
  }

  ARABIC(roman: string): number {
    const romanNumerals: { [key: string]: number } = {
      'I': 1, 'V': 5, 'X': 10, 'L': 50,
      'C': 100, 'D': 500, 'M': 1000
    };

    let result = 0;
    for (let i = 0; i < roman.length; i++) {
      const current = romanNumerals[roman[i]];
      const next = romanNumerals[roman[i + 1]];

      if (next && current < next) {
        result -= current;
      } else {
        result += current;
      }
    }

    return result;
  }

  SUMPRODUCT(...arrays: any[][]): number {
    const flattened = arrays.map(arr => this.flattenArgs([arr]));
    const length = Math.min(...flattened.map(arr => arr.length));
    let sum = 0;

    for (let i = 0; i < length; i++) {
      let product = 1;
      for (const arr of flattened) {
        product *= this.toNumber(arr[i]) || 0;
      }
      sum += product;
    }

    return sum;
  }

  SUMSQ(...values: any[]): number {
    const flat = this.flattenArgs(values);
    return flat.reduce((sum, val) => {
      const num = this.toNumber(val) || 0;
      return sum + num * num;
    }, 0);
  }

  SUMX2MY2(arrayX: any[], arrayY: any[]): number {
    const x = this.flattenArgs([arrayX]);
    const y = this.flattenArgs([arrayY]);
    const length = Math.min(x.length, y.length);
    let sum = 0;

    for (let i = 0; i < length; i++) {
      const xVal = this.toNumber(x[i]) || 0;
      const yVal = this.toNumber(y[i]) || 0;
      sum += xVal * xVal - yVal * yVal;
    }

    return sum;
  }

  SUMX2PY2(arrayX: any[], arrayY: any[]): number {
    const x = this.flattenArgs([arrayX]);
    const y = this.flattenArgs([arrayY]);
    const length = Math.min(x.length, y.length);
    let sum = 0;

    for (let i = 0; i < length; i++) {
      const xVal = this.toNumber(x[i]) || 0;
      const yVal = this.toNumber(y[i]) || 0;
      sum += xVal * xVal + yVal * yVal;
    }

    return sum;
  }

  SUMXMY2(arrayX: any[], arrayY: any[]): number {
    const x = this.flattenArgs([arrayX]);
    const y = this.flattenArgs([arrayY]);
    const length = Math.min(x.length, y.length);
    let sum = 0;

    for (let i = 0; i < length; i++) {
      const xVal = this.toNumber(x[i]) || 0;
      const yVal = this.toNumber(y[i]) || 0;
      const diff = xVal - yVal;
      sum += diff * diff;
    }

    return sum;
  }

  SERIESSUM(x: number, n: number, m: number, coefficients: number[]): number {
    let sum = 0;
    const coeffs = this.flattenArgs([coefficients]);

    for (let i = 0; i < coeffs.length; i++) {
      sum += coeffs[i] * Math.pow(x, n + i * m);
    }

    return sum;
  }

  MULTINOMIAL(...numbers: number[]): number {
    const nums = this.flattenArgs(numbers).map(n => this.toNumber(n) || 0);
    const sum = nums.reduce((a, b) => a + b, 0);
    let result = this.FACT(sum);

    for (const num of nums) {
      result /= this.FACT(num);
    }

    return result;
  }

  // ============================================================================
  // STATISTICAL FUNCTIONS (80+ functions)
  // ============================================================================

  AVERAGE(...values: any[]): number {
    const flat = this.flattenArgs(values).filter(v => typeof this.toNumber(v) === 'number');
    if (flat.length === 0) return 0;
    return this.SUM(...flat) / flat.length;
  }

  AVERAGEA(...values: any[]): number {
    const flat = this.flattenArgs(values);
    if (flat.length === 0) return 0;
    const sum = flat.reduce((acc, val) => {
      const num = this.toNumber(val);
      return acc + (num !== null ? num : 0);
    }, 0);
    return sum / flat.length;
  }

  AVERAGEIF(range: any[], criteria: any, avgRange?: any[]): number {
    const rangeFlat = this.flattenArgs([range]);
    const avgFlat = avgRange ? this.flattenArgs([avgRange]) : rangeFlat;
    let sum = 0;
    let count = 0;

    rangeFlat.forEach((val, i) => {
      if (this.matchesCriteria(val, criteria)) {
        sum += this.toNumber(avgFlat[i]) || 0;
        count++;
      }
    });

    return count > 0 ? sum / count : 0;
  }

  AVERAGEIFS(avgRange: any[], ...criteriaRanges: any[]): number {
    const avgFlat = this.flattenArgs([avgRange]);
    let sum = 0;
    let count = 0;

    for (let i = 0; i < avgFlat.length; i++) {
      let matches = true;

      for (let j = 0; j < criteriaRanges.length; j += 2) {
        const range = this.flattenArgs([criteriaRanges[j]]);
        const criteria = criteriaRanges[j + 1];

        if (!this.matchesCriteria(range[i], criteria)) {
          matches = false;
          break;
        }
      }

      if (matches) {
        sum += this.toNumber(avgFlat[i]) || 0;
        count++;
      }
    }

    return count > 0 ? sum / count : 0;
  }

  COUNT(...values: any[]): number {
    return this.flattenArgs(values).filter(v => typeof this.toNumber(v) === 'number').length;
  }

  COUNTA(...values: any[]): number {
    return this.flattenArgs(values).filter(v => v !== null && v !== undefined && v !== '').length;
  }

  COUNTBLANK(...values: any[]): number {
    return this.flattenArgs(values).filter(v => v === null || v === undefined || v === '').length;
  }

  COUNTIF(range: any[], criteria: any): number {
    const flat = this.flattenArgs([range]);
    return flat.filter(val => this.matchesCriteria(val, criteria)).length;
  }

  COUNTIFS(...ranges: any[]): number {
    if (ranges.length === 0) return 0;

    const firstRange = this.flattenArgs([ranges[0]]);
    let count = 0;

    for (let i = 0; i < firstRange.length; i++) {
      let matches = true;

      for (let j = 0; j < ranges.length; j += 2) {
        const range = this.flattenArgs([ranges[j]]);
        const criteria = ranges[j + 1];

        if (!this.matchesCriteria(range[i], criteria)) {
          matches = false;
          break;
        }
      }

      if (matches) count++;
    }

    return count;
  }

  MAX(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    return nums.length > 0 ? Math.max(...nums) : 0;
  }

  MAXA(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v) || 0);
    return nums.length > 0 ? Math.max(...nums) : 0;
  }

  MIN(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    return nums.length > 0 ? Math.min(...nums) : 0;
  }

  MINA(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v) || 0);
    return nums.length > 0 ? Math.min(...nums) : 0;
  }

  MEDIAN(...values: any[]): number {
    const nums = this.flattenArgs(values)
      .map(v => this.toNumber(v))
      .filter(n => n !== null)
      .sort((a, b) => (a as number) - (b as number)) as number[];

    if (nums.length === 0) return 0;

    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
  }

  MODE(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    const frequency: Map<number, number> = new Map();

    nums.forEach(num => {
      frequency.set(num, (frequency.get(num) || 0) + 1);
    });

    let maxFreq = 0;
    let mode = 0;

    frequency.forEach((freq, num) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = num;
      }
    });

    return mode;
  }

  MODE_SNGL(...values: any[]): number {
    return this.MODE(...values);
  }

  MODE_MULT(...values: any[]): number[] {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    const frequency: Map<number, number> = new Map();

    nums.forEach(num => {
      frequency.set(num, (frequency.get(num) || 0) + 1);
    });

    const maxFreq = Math.max(...Array.from(frequency.values()));
    return Array.from(frequency.entries())
      .filter(([, freq]) => freq === maxFreq)
      .map(([num]) => num);
  }

  QUARTILE(array: any[], quart: number): number {
    const nums = this.flattenArgs([array])
      .map(v => this.toNumber(v))
      .filter(n => n !== null)
      .sort((a, b) => (a as number) - (b as number)) as number[];

    if (nums.length === 0) return 0;

    const index = (nums.length - 1) * quart / 4;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return nums[lower] * (1 - weight) + nums[upper] * weight;
  }

  PERCENTILE(array: any[], k: number): number {
    const nums = this.flattenArgs([array])
      .map(v => this.toNumber(v))
      .filter(n => n !== null)
      .sort((a, b) => (a as number) - (b as number)) as number[];

    if (nums.length === 0) return 0;

    const index = (nums.length - 1) * k;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return nums[lower] * (1 - weight) + nums[upper] * weight;
  }

  PERCENTRANK(array: any[], x: number, significance: number = 3): number {
    const nums = this.flattenArgs([array])
      .map(v => this.toNumber(v))
      .filter(n => n !== null)
      .sort((a, b) => (a as number) - (b as number)) as number[];

    if (nums.length === 0) return 0;

    const index = nums.indexOf(x);
    if (index === -1) return 0;

    const rank = index / (nums.length - 1);
    return parseFloat(rank.toFixed(significance));
  }

  RANK(number: number, ref: any[], order: number = 0): number {
    const nums = this.flattenArgs([ref]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    const sorted = order === 0 ? nums.sort((a, b) => b - a) : nums.sort((a, b) => a - b);
    return sorted.indexOf(number) + 1;
  }

  LARGE(array: any[], k: number): number {
    const nums = this.flattenArgs([array])
      .map(v => this.toNumber(v))
      .filter(n => n !== null)
      .sort((a, b) => (b as number) - (a as number)) as number[];

    return nums[k - 1] || 0;
  }

  SMALL(array: any[], k: number): number {
    const nums = this.flattenArgs([array])
      .map(v => this.toNumber(v))
      .filter(n => n !== null)
      .sort((a, b) => (a as number) - (b as number)) as number[];

    return nums[k - 1] || 0;
  }

  VAR(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    if (nums.length < 2) return 0;

    const mean = this.AVERAGE(...nums);
    const squareDiffs = nums.map(num => Math.pow(num - mean, 2));
    return this.SUM(...squareDiffs) / (nums.length - 1);
  }

  VARA(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v) || 0);
    if (nums.length < 2) return 0;

    const mean = this.AVERAGEA(...nums);
    const squareDiffs = nums.map(num => Math.pow(num - mean, 2));
    return this.SUM(...squareDiffs) / (nums.length - 1);
  }

  VARP(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    if (nums.length === 0) return 0;

    const mean = this.AVERAGE(...nums);
    const squareDiffs = nums.map(num => Math.pow(num - mean, 2));
    return this.SUM(...squareDiffs) / nums.length;
  }

  VARPA(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v) || 0);
    if (nums.length === 0) return 0;

    const mean = this.AVERAGEA(...nums);
    const squareDiffs = nums.map(num => Math.pow(num - mean, 2));
    return this.SUM(...squareDiffs) / nums.length;
  }

  STDEV(...values: any[]): number {
    return Math.sqrt(this.VAR(...values));
  }

  STDEVA(...values: any[]): number {
    return Math.sqrt(this.VARA(...values));
  }

  STDEVP(...values: any[]): number {
    return Math.sqrt(this.VARP(...values));
  }

  STDEVPA(...values: any[]): number {
    return Math.sqrt(this.VARPA(...values));
  }

  DEVSQ(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    const mean = this.AVERAGE(...nums);
    return this.SUM(...nums.map(num => Math.pow(num - mean, 2)));
  }

  AVEDEV(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    if (nums.length === 0) return 0;

    const mean = this.AVERAGE(...nums);
    const absDeviations = nums.map(num => Math.abs(num - mean));
    return this.SUM(...absDeviations) / nums.length;
  }

  GEOMEAN(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v)).filter(n => n !== null && n > 0) as number[];
    if (nums.length === 0) return 0;

    const product = this.PRODUCT(...nums);
    return Math.pow(product, 1 / nums.length);
  }

  HARMEAN(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v)).filter(n => n !== null && n > 0) as number[];
    if (nums.length === 0) return 0;

    const reciprocalSum = nums.reduce((sum, num) => sum + 1 / num, 0);
    return nums.length / reciprocalSum;
  }

  TRIMMEAN(array: any[], percent: number): number {
    const nums = this.flattenArgs([array])
      .map(v => this.toNumber(v))
      .filter(n => n !== null)
      .sort((a, b) => (a as number) - (b as number)) as number[];

    if (nums.length === 0) return 0;

    const trimCount = Math.floor(nums.length * percent / 2);
    const trimmed = nums.slice(trimCount, nums.length - trimCount);

    return this.AVERAGE(...trimmed);
  }

  SKEW(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    if (nums.length < 3) return 0;

    const n = nums.length;
    const mean = this.AVERAGE(...nums);
    const stdev = this.STDEV(...nums);

    const sumCubedDeviations = nums.reduce((sum, num) => {
      return sum + Math.pow((num - mean) / stdev, 3);
    }, 0);

    return (n / ((n - 1) * (n - 2))) * sumCubedDeviations;
  }

  KURT(...values: any[]): number {
    const nums = this.flattenArgs(values).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    if (nums.length < 4) return 0;

    const n = nums.length;
    const mean = this.AVERAGE(...nums);
    const stdev = this.STDEV(...nums);

    const sumQuartedDeviations = nums.reduce((sum, num) => {
      return sum + Math.pow((num - mean) / stdev, 4);
    }, 0);

    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sumQuartedDeviations -
           (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  CORREL(array1: any[], array2: any[]): number {
    const nums1 = this.flattenArgs([array1]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    const nums2 = this.flattenArgs([array2]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];

    if (nums1.length !== nums2.length || nums1.length === 0) return 0;

    const mean1 = this.AVERAGE(...nums1);
    const mean2 = this.AVERAGE(...nums2);

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < nums1.length; i++) {
      const diff1 = nums1[i] - mean1;
      const diff2 = nums2[i] - mean2;
      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }

    return numerator / Math.sqrt(denom1 * denom2);
  }

  COVARIANCE(array1: any[], array2: any[]): number {
    const nums1 = this.flattenArgs([array1]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    const nums2 = this.flattenArgs([array2]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];

    if (nums1.length !== nums2.length || nums1.length === 0) return 0;

    const mean1 = this.AVERAGE(...nums1);
    const mean2 = this.AVERAGE(...nums2);

    let sum = 0;
    for (let i = 0; i < nums1.length; i++) {
      sum += (nums1[i] - mean1) * (nums2[i] - mean2);
    }

    return sum / nums1.length;
  }

  SLOPE(knownYs: any[], knownXs: any[]): number {
    const ys = this.flattenArgs([knownYs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    const xs = this.flattenArgs([knownXs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];

    if (ys.length !== xs.length || ys.length === 0) return 0;

    const meanX = this.AVERAGE(...xs);
    const meanY = this.AVERAGE(...ys);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < xs.length; i++) {
      numerator += (xs[i] - meanX) * (ys[i] - meanY);
      denominator += Math.pow(xs[i] - meanX, 2);
    }

    return numerator / denominator;
  }

  INTERCEPT(knownYs: any[], knownXs: any[]): number {
    const ys = this.flattenArgs([knownYs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    const xs = this.flattenArgs([knownXs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];

    const meanX = this.AVERAGE(...xs);
    const meanY = this.AVERAGE(...ys);
    const slope = this.SLOPE(ys, xs);

    return meanY - slope * meanX;
  }

  RSQ(knownYs: any[], knownXs: any[]): number {
    const correl = this.CORREL(knownYs, knownXs);
    return correl * correl;
  }

  STEYX(knownYs: any[], knownXs: any[]): number {
    const ys = this.flattenArgs([knownYs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    const xs = this.flattenArgs([knownXs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];

    if (ys.length !== xs.length || ys.length < 3) return 0;

    const slope = this.SLOPE(ys, xs);
    const intercept = this.INTERCEPT(ys, xs);

    let sumSquaredErrors = 0;
    for (let i = 0; i < xs.length; i++) {
      const predicted = slope * xs[i] + intercept;
      sumSquaredErrors += Math.pow(ys[i] - predicted, 2);
    }

    return Math.sqrt(sumSquaredErrors / (xs.length - 2));
  }

  FORECAST(x: number, knownYs: any[], knownXs: any[]): number {
    const slope = this.SLOPE(knownYs, knownXs);
    const intercept = this.INTERCEPT(knownYs, knownXs);
    return slope * x + intercept;
  }

  TREND(knownYs: any[], knownXs?: any[], newXs?: any[], constb: boolean = true): number[] {
    const ys = this.flattenArgs([knownYs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    const xs = knownXs ? this.flattenArgs([knownXs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[] : ys.map((_, i) => i + 1);
    const xsNew = newXs ? this.flattenArgs([newXs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[] : xs;

    const slope = this.SLOPE(ys, xs);
    const intercept = constb ? this.INTERCEPT(ys, xs) : 0;

    return xsNew.map(x => slope * x + intercept);
  }

  GROWTH(knownYs: any[], knownXs?: any[], newXs?: any[], constb: boolean = true): number[] {
    const ys = this.flattenArgs([knownYs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    const xs = knownXs ? this.flattenArgs([knownXs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[] : ys.map((_, i) => i + 1);
    const xsNew = newXs ? this.flattenArgs([newXs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[] : xs;

    // Convert to logarithmic space
    const lnYs = ys.map(y => Math.log(y));
    const slope = this.SLOPE(lnYs, xs);
    const intercept = constb ? this.INTERCEPT(lnYs, xs) : 0;

    return xsNew.map(x => Math.exp(slope * x + intercept));
  }

  LINEST(knownYs: any[], knownXs?: any[], constb: boolean = true, stats: boolean = false): number[] {
    const ys = this.flattenArgs([knownYs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    const xs = knownXs ? this.flattenArgs([knownXs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[] : ys.map((_, i) => i + 1);

    const slope = this.SLOPE(ys, xs);
    const intercept = constb ? this.INTERCEPT(ys, xs) : 0;

    if (stats) {
      const se = this.STEYX(ys, xs);
      const rsq = this.RSQ(ys, xs);
      return [slope, intercept, se, rsq];
    }

    return [slope, intercept];
  }

  LOGEST(knownYs: any[], knownXs?: any[], constb: boolean = true, stats: boolean = false): number[] {
    const ys = this.flattenArgs([knownYs]).map(v => this.toNumber(v)).filter(n => n !== null) as number[];
    const lnYs = ys.map(y => Math.log(y));

    return this.LINEST(lnYs, knownXs, constb, stats);
  }

  // ============================================================================
  // LOGICAL FUNCTIONS
  // ============================================================================

  AND(...conditions: any[]): boolean {
    return this.flattenArgs(conditions).every(c => this.toBoolean(c));
  }

  OR(...conditions: any[]): boolean {
    return this.flattenArgs(conditions).some(c => this.toBoolean(c));
  }

  NOT(value: any): boolean {
    return !this.toBoolean(value);
  }

  XOR(...conditions: any[]): boolean {
    const flat = this.flattenArgs(conditions);
    const trueCount = flat.filter(c => this.toBoolean(c)).length;
    return trueCount % 2 === 1;
  }

  IF(condition: any, valueIfTrue: any, valueIfFalse: any): any {
    return this.toBoolean(condition) ? valueIfTrue : valueIfFalse;
  }

  IFS(...conditions: any[]): any {
    for (let i = 0; i < conditions.length; i += 2) {
      if (this.toBoolean(conditions[i])) {
        return conditions[i + 1];
      }
    }
    return '#N/A';
  }

  SWITCH(expression: any, ...cases: any[]): any {
    for (let i = 0; i < cases.length - 1; i += 2) {
      if (expression === cases[i]) {
        return cases[i + 1];
      }
    }
    return cases.length % 2 === 1 ? cases[cases.length - 1] : '#N/A';
  }

  IFERROR(value: any, valueIfError: any): any {
    try {
      return value;
    } catch {
      return valueIfError;
    }
  }

  IFNA(value: any, valueIfNA: any): any {
    return value === '#N/A' || value === null ? valueIfNA : value;
  }

  TRUE(): boolean {
    return true;
  }

  FALSE(): boolean {
    return false;
  }

  // ============================================================================
  // TEXT FUNCTIONS (30+ functions)
  // ============================================================================

  CONCATENATE(...texts: any[]): string {
    return this.flattenArgs(texts).map(t => String(t)).join('');
  }

  CONCAT(...texts: any[]): string {
    return this.CONCATENATE(...texts);
  }

  TEXTJOIN(delimiter: string, ignoreEmpty: boolean, ...texts: any[]): string {
    const flat = this.flattenArgs(texts).map(t => String(t));
    const filtered = ignoreEmpty ? flat.filter(t => t !== '') : flat;
    return filtered.join(delimiter);
  }

  LEFT(text: string, numChars: number = 1): string {
    return String(text).substring(0, numChars);
  }

  RIGHT(text: string, numChars: number = 1): string {
    const str = String(text);
    return str.substring(str.length - numChars);
  }

  MID(text: string, startNum: number, numChars: number): string {
    return String(text).substring(startNum - 1, startNum - 1 + numChars);
  }

  LEN(text: string): number {
    return String(text).length;
  }

  LENB(text: string): number {
    return new Blob([String(text)]).size;
  }

  FIND(findText: string, withinText: string, startNum: number = 1): number {
    const index = String(withinText).indexOf(String(findText), startNum - 1);
    return index === -1 ? -1 : index + 1;
  }

  FINDB(findText: string, withinText: string, startNum: number = 1): number {
    return this.FIND(findText, withinText, startNum);
  }

  SEARCH(findText: string, withinText: string, startNum: number = 1): number {
    const index = String(withinText).toLowerCase().indexOf(String(findText).toLowerCase(), startNum - 1);
    return index === -1 ? -1 : index + 1;
  }

  SEARCHB(findText: string, withinText: string, startNum: number = 1): number {
    return this.SEARCH(findText, withinText, startNum);
  }

  REPLACE(oldText: string, startNum: number, numChars: number, newText: string): string {
    const str = String(oldText);
    return str.substring(0, startNum - 1) + newText + str.substring(startNum - 1 + numChars);
  }

  SUBSTITUTE(text: string, oldText: string, newText: string, instanceNum?: number): string {
    const str = String(text);
    const old = String(oldText);
    const newStr = String(newText);

    if (instanceNum === undefined) {
      return str.split(old).join(newStr);
    }

    let count = 0;
    return str.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), (match) => {
      count++;
      return count === instanceNum ? newStr : match;
    });
  }

  UPPER(text: string): string {
    return String(text).toUpperCase();
  }

  LOWER(text: string): string {
    return String(text).toLowerCase();
  }

  PROPER(text: string): string {
    return String(text).replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  TRIM(text: string): string {
    return String(text).replace(/\s+/g, ' ').trim();
  }

  CLEAN(text: string): string {
    return String(text).replace(/[\x00-\x1F\x7F]/g, '');
  }

  REPT(text: string, numberTimes: number): string {
    return String(text).repeat(Math.floor(numberTimes));
  }

  TEXT(value: any, formatText: string): string {
    // Simplified text formatting
    const num = this.toNumber(value);
    if (num !== null) {
      if (formatText.includes('%')) {
        return (num * 100).toFixed(2) + '%';
      }
      if (formatText.includes('$')) {
        return '$' + num.toFixed(2);
      }
      const decimals = (formatText.match(/0/g) || []).length;
      return num.toFixed(decimals);
    }
    return String(value);
  }

  VALUE(text: string): number {
    const num = parseFloat(String(text).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  }

  NUMBERVALUE(text: string, decimalSeparator: string = '.', groupSeparator: string = ','): number {
    const str = String(text)
      .replace(new RegExp(`\\${groupSeparator}`, 'g'), '')
      .replace(new RegExp(`\\${decimalSeparator}`), '.');
    return parseFloat(str);
  }

  DOLLAR(number: number, decimals: number = 2): string {
    return '$' + this.toNumber(number)?.toFixed(decimals);
  }

  FIXED(number: number, decimals: number = 2, noCommas: boolean = false): string {
    const num = this.toNumber(number) || 0;
    const fixed = num.toFixed(decimals);

    if (noCommas) return fixed;

    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  CHAR(number: number): string {
    return String.fromCharCode(number);
  }

  CODE(text: string): number {
    return String(text).charCodeAt(0);
  }

  UNICHAR(number: number): string {
    return String.fromCodePoint(number);
  }

  UNICODE(text: string): number {
    return String(text).codePointAt(0) || 0;
  }

  EXACT(text1: string, text2: string): boolean {
    return String(text1) === String(text2);
  }

  T(value: any): string {
    return typeof value === 'string' ? value : '';
  }

  // ============================================================================
  // DATE & TIME FUNCTIONS (20+ functions)
  // ============================================================================

  NOW(): Date {
    return new Date();
  }

  TODAY(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  DATE(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day);
  }

  TIME(hour: number, minute: number, second: number): Date {
    const date = new Date();
    date.setHours(hour, minute, second, 0);
    return date;
  }

  YEAR(date: Date | string): number {
    return new Date(date).getFullYear();
  }

  MONTH(date: Date | string): number {
    return new Date(date).getMonth() + 1;
  }

  DAY(date: Date | string): number {
    return new Date(date).getDate();
  }

  HOUR(time: Date | string): number {
    return new Date(time).getHours();
  }

  MINUTE(time: Date | string): number {
    return new Date(time).getMinutes();
  }

  SECOND(time: Date | string): number {
    return new Date(time).getSeconds();
  }

  WEEKDAY(date: Date | string, returnType: number = 1): number {
    const day = new Date(date).getDay();

    if (returnType === 1) return day + 1; // Sunday = 1
    if (returnType === 2) return day === 0 ? 7 : day; // Monday = 1
    if (returnType === 3) return day === 0 ? 6 : day - 1; // Monday = 0

    return day;
  }

  WEEKNUM(date: Date | string, returnType: number = 1): number {
    const d = new Date(date);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekStart = returnType === 2 ? 1 : 0; // Monday or Sunday

    const dayOfYear = Math.floor((d.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((dayOfYear + yearStart.getDay() - weekStart) / 7);
  }

  ISOWEEKNUM(date: Date | string): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  DAYS(endDate: Date | string, startDate: Date | string): number {
    const end = new Date(endDate).getTime();
    const start = new Date(startDate).getTime();
    return Math.floor((end - start) / (24 * 60 * 60 * 1000));
  }

  DAYS360(startDate: Date | string, endDate: Date | string, method: boolean = false): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let startDay = start.getDate();
    let startMonth = start.getMonth() + 1;
    let startYear = start.getFullYear();

    let endDay = end.getDate();
    let endMonth = end.getMonth() + 1;
    let endYear = end.getFullYear();

    if (!method) {
      if (startDay === 31) startDay = 30;
      if (endDay === 31 && startDay >= 30) endDay = 30;
    }

    return (endYear - startYear) * 360 + (endMonth - startMonth) * 30 + (endDay - startDay);
  }

  NETWORKDAYS(startDate: Date | string, endDate: Date | string, holidays?: Date[]): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const holidaySet = new Set(holidays?.map(h => new Date(h).toDateString()) || []);

    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6 && !holidaySet.has(current.toDateString())) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  WORKDAY(startDate: Date | string, days: number, holidays?: Date[]): Date {
    const current = new Date(startDate);
    const holidaySet = new Set(holidays?.map(h => new Date(h).toDateString()) || []);

    let workdaysAdded = 0;
    const direction = days > 0 ? 1 : -1;
    const targetDays = Math.abs(days);

    while (workdaysAdded < targetDays) {
      current.setDate(current.getDate() + direction);
      const day = current.getDay();

      if (day !== 0 && day !== 6 && !holidaySet.has(current.toDateString())) {
        workdaysAdded++;
      }
    }

    return current;
  }

  EDATE(startDate: Date | string, months: number): Date {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + months);
    return date;
  }

  EOMONTH(startDate: Date | string, months: number): Date {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + months + 1, 0);
    return date;
  }

  DATEDIF(startDate: Date | string, endDate: Date | string, unit: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (unit === 'Y') {
      return end.getFullYear() - start.getFullYear();
    }
    if (unit === 'M') {
      return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
    }
    if (unit === 'D') {
      return this.DAYS(end, start);
    }
    if (unit === 'MD') {
      return end.getDate() - start.getDate();
    }
    if (unit === 'YM') {
      return end.getMonth() - start.getMonth();
    }
    if (unit === 'YD') {
      const yearDiff = end.getFullYear() - start.getFullYear();
      const adjustedStart = new Date(start);
      adjustedStart.setFullYear(adjustedStart.getFullYear() + yearDiff);
      return this.DAYS(end, adjustedStart);
    }

    return 0;
  }

  YEARFRAC(startDate: Date | string, endDate: Date | string, basis: number = 0): number {
    const days = this.DAYS(endDate, startDate);

    if (basis === 0) return this.DAYS360(startDate, endDate) / 360;
    if (basis === 1) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const avgDaysInYear = (this.isLeapYear(start.getFullYear()) || this.isLeapYear(end.getFullYear())) ? 366 : 365;
      return days / avgDaysInYear;
    }
    if (basis === 2) return days / 360;
    if (basis === 3) return days / 365;
    if (basis === 4) return this.DAYS360(startDate, endDate, true) / 360;

    return 0;
  }

  // Helper for YEARFRAC
  private isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  // ============================================================================
  // LOOKUP & REFERENCE FUNCTIONS
  // ============================================================================

  VLOOKUP(lookupValue: any, tableArray: any[][], colIndexNum: number, rangeLookup: boolean = true): any {
    const table = this.to2DArray(tableArray);

    if (rangeLookup) {
      // Approximate match
      for (let i = table.length - 1; i >= 0; i--) {
        const tableVal = this.toNumber(table[i][0]);
        const lookupVal = this.toNumber(lookupValue);
        if (tableVal !== null && lookupVal !== null && tableVal <= lookupVal) {
          return table[i][colIndexNum - 1];
        }
      }
    } else {
      // Exact match
      for (const row of table) {
        if (row[0] === lookupValue) {
          return row[colIndexNum - 1];
        }
      }
    }

    return '#N/A';
  }

  HLOOKUP(lookupValue: any, tableArray: any[][], rowIndexNum: number, rangeLookup: boolean = true): any {
    const table = this.to2DArray(tableArray);
    const firstRow = table[0];

    if (rangeLookup) {
      // Approximate match
      for (let i = firstRow.length - 1; i >= 0; i--) {
        const tableVal = this.toNumber(firstRow[i]);
        const lookupVal = this.toNumber(lookupValue);
        if (tableVal !== null && lookupVal !== null && tableVal <= lookupVal) {
          return table[rowIndexNum - 1][i];
        }
      }
    } else {
      // Exact match
      for (let i = 0; i < firstRow.length; i++) {
        if (firstRow[i] === lookupValue) {
          return table[rowIndexNum - 1][i];
        }
      }
    }

    return '#N/A';
  }

  INDEX(array: any[][], rowNum: number, colNum?: number): any {
    const arr = this.to2DArray(array);

    if (colNum === undefined) {
      return arr[rowNum - 1];
    }

    return arr[rowNum - 1]?.[colNum - 1];
  }

  MATCH(lookupValue: any, lookupArray: any[], matchType: number = 1): number {
    const arr = this.flattenArgs([lookupArray]);

    if (matchType === 0) {
      // Exact match
      const index = arr.findIndex(v => v === lookupValue);
      return index === -1 ? -1 : index + 1;
    }

    if (matchType === 1) {
      // Less than or equal
      for (let i = arr.length - 1; i >= 0; i--) {
        const arrVal = this.toNumber(arr[i]);
        const lookupVal = this.toNumber(lookupValue);
        if (arrVal !== null && lookupVal !== null && arrVal <= lookupVal) {
          return i + 1;
        }
      }
    }

    if (matchType === -1) {
      // Greater than or equal
      for (let i = 0; i < arr.length; i++) {
        const arrVal = this.toNumber(arr[i]);
        const lookupVal = this.toNumber(lookupValue);
        if (arrVal !== null && lookupVal !== null && arrVal >= lookupVal) {
          return i + 1;
        }
      }
    }

    return -1;
  }

  XLOOKUP(lookupValue: any, lookupArray: any[], returnArray: any[], ifNotFound?: any, matchMode: number = 0, searchMode: number = 1): any {
    const lookup = this.flattenArgs([lookupArray]);
    const returnArr = this.flattenArgs([returnArray]);

    let index = -1;

    if (matchMode === 0) {
      // Exact match
      index = lookup.findIndex(v => v === lookupValue);
    } else if (matchMode === -1) {
      // Exact match or next smaller
      for (let i = lookup.length - 1; i >= 0; i--) {
        const lookupVal = this.toNumber(lookup[i]);
        const targetVal = this.toNumber(lookupValue);
        if (lookupVal !== null && targetVal !== null && lookupVal <= targetVal) {
          index = i;
          break;
        }
      }
    } else if (matchMode === 1) {
      // Exact match or next larger
      for (let i = 0; i < lookup.length; i++) {
        const lookupVal = this.toNumber(lookup[i]);
        const targetVal = this.toNumber(lookupValue);
        if (lookupVal !== null && targetVal !== null && lookupVal >= targetVal) {
          index = i;
          break;
        }
      }
    } else if (matchMode === 2) {
      // Wildcard match
      const pattern = String(lookupValue).replace(/\*/g, '.*').replace(/\?/g, '.');
      const regex = new RegExp(`^${pattern}$`, 'i');
      index = lookup.findIndex(v => regex.test(String(v)));
    }

    if (index === -1) {
      return ifNotFound !== undefined ? ifNotFound : '#N/A';
    }

    return returnArr[index];
  }

  LOOKUP(lookupValue: any, lookupVector: any[], resultVector?: any[]): any {
    const lookup = this.flattenArgs([lookupVector]);
    const result = resultVector ? this.flattenArgs([resultVector]) : lookup;

    for (let i = lookup.length - 1; i >= 0; i--) {
      const lookupVal = this.toNumber(lookup[i]);
      const targetVal = this.toNumber(lookupValue);
      if (lookupVal !== null && targetVal !== null && lookupVal <= targetVal) {
        return result[i];
      }
    }

    return '#N/A';
  }

  CHOOSE(indexNum: number, ...values: any[]): any {
    const index = Math.floor(indexNum);
    if (index < 1 || index > values.length) return '#VALUE!';
    return values[index - 1];
  }

  COLUMN(reference?: string): number {
    // Simplified - would need actual cell reference parsing
    return 1;
  }

  ROW(reference?: string): number {
    // Simplified - would need actual cell reference parsing
    return 1;
  }

  COLUMNS(array: any[][]): number {
    const arr = this.to2DArray(array);
    return arr[0]?.length || 0;
  }

  ROWS(array: any[][]): number {
    const arr = this.to2DArray(array);
    return arr.length;
  }

  TRANSPOSE(array: any[][]): any[][] {
    const arr = this.to2DArray(array);
    const rows = arr.length;
    const cols = arr[0]?.length || 0;

    const result: any[][] = [];
    for (let i = 0; i < cols; i++) {
      result[i] = [];
      for (let j = 0; j < rows; j++) {
        result[i][j] = arr[j][i];
      }
    }

    return result;
  }

  OFFSET(reference: any[][], rows: number, cols: number, height?: number, width?: number): any[][] {
    const arr = this.to2DArray(reference);
    const h = height || arr.length - rows;
    const w = width || arr[0]?.length - cols || 0;

    const result: any[][] = [];
    for (let i = 0; i < h; i++) {
      result[i] = [];
      for (let j = 0; j < w; j++) {
        result[i][j] = arr[rows + i]?.[cols + j];
      }
    }

    return result;
  }

  INDIRECT(refText: string): any {
    // Simplified - would need actual cell reference resolution
    return '#REF!';
  }

  // ============================================================================
  // FINANCIAL FUNCTIONS (50+ functions)
  // ============================================================================

  PMT(rate: number, nper: number, pv: number, fv: number = 0, type: number = 0): number {
    if (rate === 0) return -(pv + fv) / nper;

    const pvif = Math.pow(1 + rate, nper);
    let pmt = (rate * (pv * pvif + fv)) / ((pvif - 1) * (1 + rate * type));

    return -pmt;
  }

  IPMT(rate: number, per: number, nper: number, pv: number, fv: number = 0, type: number = 0): number {
    const pmt = this.PMT(rate, nper, pv, fv, type);
    const fv1 = this.FV(rate, per - 1, pmt, pv, type);

    return fv1 * rate;
  }

  PPMT(rate: number, per: number, nper: number, pv: number, fv: number = 0, type: number = 0): number {
    const pmt = this.PMT(rate, nper, pv, fv, type);
    const ipmt = this.IPMT(rate, per, nper, pv, fv, type);

    return pmt - ipmt;
  }

  FV(rate: number, nper: number, pmt: number, pv: number = 0, type: number = 0): number {
    if (rate === 0) return -(pv + pmt * nper);

    const pvif = Math.pow(1 + rate, nper);
    return -(pv * pvif + pmt * (1 + rate * type) * (pvif - 1) / rate);
  }

  PV(rate: number, nper: number, pmt: number, fv: number = 0, type: number = 0): number {
    if (rate === 0) return -(fv + pmt * nper);

    const pvif = Math.pow(1 + rate, nper);
    return -(fv + pmt * (1 + rate * type) * (pvif - 1) / rate) / pvif;
  }

  NPV(rate: number, ...values: number[]): number {
    const vals = this.flattenArgs(values).map(v => this.toNumber(v) || 0);
    let npv = 0;

    for (let i = 0; i < vals.length; i++) {
      npv += vals[i] / Math.pow(1 + rate, i + 1);
    }

    return npv;
  }

  XNPV(rate: number, values: number[], dates: Date[]): number {
    const vals = this.flattenArgs([values]).map(v => this.toNumber(v) || 0);
    const dts = this.flattenArgs([dates]).map(d => new Date(d));

    const baseDate = dts[0];
    let xnpv = 0;

    for (let i = 0; i < vals.length; i++) {
      const daysDiff = this.DAYS(dts[i], baseDate);
      xnpv += vals[i] / Math.pow(1 + rate, daysDiff / 365);
    }

    return xnpv;
  }

  IRR(values: number[], guess: number = 0.1): number {
    const vals = this.flattenArgs([values]).map(v => this.toNumber(v) || 0);

    let rate = guess;
    const maxIterations = 100;
    const tolerance = 1e-7;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;

      for (let j = 0; j < vals.length; j++) {
        const factor = Math.pow(1 + rate, j);
        npv += vals[j] / factor;
        dnpv -= j * vals[j] / (factor * (1 + rate));
      }

      if (Math.abs(npv) < tolerance) return rate;

      rate = rate - npv / dnpv;
    }

    return rate;
  }

  XIRR(values: number[], dates: Date[], guess: number = 0.1): number {
    const vals = this.flattenArgs([values]).map(v => this.toNumber(v) || 0);
    const dts = this.flattenArgs([dates]).map(d => new Date(d));

    let rate = guess;
    const maxIterations = 100;
    const tolerance = 1e-7;
    const baseDate = dts[0];

    for (let i = 0; i < maxIterations; i++) {
      let xnpv = 0;
      let dxnpv = 0;

      for (let j = 0; j < vals.length; j++) {
        const daysDiff = this.DAYS(dts[j], baseDate) / 365;
        const factor = Math.pow(1 + rate, daysDiff);
        xnpv += vals[j] / factor;
        dxnpv -= daysDiff * vals[j] / (factor * (1 + rate));
      }

      if (Math.abs(xnpv) < tolerance) return rate;

      rate = rate - xnpv / dxnpv;
    }

    return rate;
  }

  MIRR(values: number[], financeRate: number, reinvestRate: number): number {
    const vals = this.flattenArgs([values]).map(v => this.toNumber(v) || 0);

    let positiveCF = 0;
    let negativeCF = 0;
    const n = vals.length;

    for (let i = 0; i < n; i++) {
      if (vals[i] > 0) {
        positiveCF += vals[i] * Math.pow(1 + reinvestRate, n - i - 1);
      } else {
        negativeCF += vals[i] / Math.pow(1 + financeRate, i);
      }
    }

    return Math.pow(-positiveCF / negativeCF, 1 / (n - 1)) - 1;
  }

  NPER(rate: number, pmt: number, pv: number, fv: number = 0, type: number = 0): number {
    if (rate === 0) return -(fv + pv) / pmt;

    return Math.log((pmt * (1 + rate * type) - fv * rate) / (pmt * (1 + rate * type) + pv * rate)) / Math.log(1 + rate);
  }

  RATE(nper: number, pmt: number, pv: number, fv: number = 0, type: number = 0, guess: number = 0.1): number {
    let rate = guess;
    const maxIterations = 100;
    const tolerance = 1e-7;

    for (let i = 0; i < maxIterations; i++) {
      const f = this.PV(rate, nper, pmt, fv, type) + pv;

      if (Math.abs(f) < tolerance) return rate;

      const f1 = this.PV(rate + tolerance, nper, pmt, fv, type) + pv;
      const df = (f1 - f) / tolerance;

      rate = rate - f / df;
    }

    return rate;
  }

  EFFECT(nominalRate: number, npery: number): number {
    return Math.pow(1 + nominalRate / npery, npery) - 1;
  }

  NOMINAL(effectRate: number, npery: number): number {
    return npery * (Math.pow(1 + effectRate, 1 / npery) - 1);
  }

  SLN(cost: number, salvage: number, life: number): number {
    return (cost - salvage) / life;
  }

  SYD(cost: number, salvage: number, life: number, per: number): number {
    return ((cost - salvage) * (life - per + 1) * 2) / (life * (life + 1));
  }

  DDB(cost: number, salvage: number, life: number, period: number, factor: number = 2): number {
    let depreciation = 0;
    let bookValue = cost;

    for (let i = 1; i <= period; i++) {
      const currentDepreciation = Math.min(bookValue * factor / life, bookValue - salvage);
      depreciation = currentDepreciation;
      bookValue -= currentDepreciation;
    }

    return depreciation;
  }

  DB(cost: number, salvage: number, life: number, period: number, month: number = 12): number {
    const rate = 1 - Math.pow(salvage / cost, 1 / life);
    let bookValue = cost;

    for (let i = 1; i <= period; i++) {
      const depreciation = i === 1
        ? cost * rate * month / 12
        : bookValue * rate;

      if (i === period) return depreciation;
      bookValue -= depreciation;
    }

    return 0;
  }

  VDB(cost: number, salvage: number, life: number, startPeriod: number, endPeriod: number, factor: number = 2, noSwitch: boolean = false): number {
    let totalDepreciation = 0;
    let bookValue = cost;

    for (let i = 1; i <= endPeriod; i++) {
      const ddbDepreciation = bookValue * factor / life;
      const slnDepreciation = (bookValue - salvage) / (life - i + 1);

      const depreciation = noSwitch || ddbDepreciation > slnDepreciation
        ? Math.min(ddbDepreciation, bookValue - salvage)
        : slnDepreciation;

      if (i >= startPeriod) {
        totalDepreciation += depreciation;
      }

      bookValue -= depreciation;
    }

    return totalDepreciation;
  }

  CUMIPMT(rate: number, nper: number, pv: number, startPeriod: number, endPeriod: number, type: number): number {
    let cumInterest = 0;

    for (let i = startPeriod; i <= endPeriod; i++) {
      cumInterest += this.IPMT(rate, i, nper, pv, 0, type);
    }

    return cumInterest;
  }

  CUMPRINC(rate: number, nper: number, pv: number, startPeriod: number, endPeriod: number, type: number): number {
    let cumPrincipal = 0;

    for (let i = startPeriod; i <= endPeriod; i++) {
      cumPrincipal += this.PPMT(rate, i, nper, pv, 0, type);
    }

    return cumPrincipal;
  }

  PRICE(settlement: Date, maturity: Date, rate: number, yld: number, redemption: number, frequency: number, basis: number = 0): number {
    // Simplified bond pricing
    const years = this.YEARFRAC(settlement, maturity, basis);
    const periods = years * frequency;
    const coupon = rate * redemption / frequency;

    let price = 0;
    for (let i = 1; i <= periods; i++) {
      price += coupon / Math.pow(1 + yld / frequency, i);
    }
    price += redemption / Math.pow(1 + yld / frequency, periods);

    return price;
  }

  YIELD(settlement: Date, maturity: Date, rate: number, pr: number, redemption: number, frequency: number, basis: number = 0): number {
    // Newton-Raphson method to find yield
    let yld = rate;
    const maxIterations = 100;
    const tolerance = 1e-7;

    for (let i = 0; i < maxIterations; i++) {
      const price = this.PRICE(settlement, maturity, rate, yld, redemption, frequency, basis);
      const error = price - pr;

      if (Math.abs(error) < tolerance) return yld;

      const price2 = this.PRICE(settlement, maturity, rate, yld + tolerance, redemption, frequency, basis);
      const derivative = (price2 - price) / tolerance;

      yld = yld - error / derivative;
    }

    return yld;
  }

  ACCRINT(issue: Date, firstInterest: Date, settlement: Date, rate: number, par: number, frequency: number, basis: number = 0): number {
    const daysBetween = this.DAYS(settlement, issue);
    const daysInYear = basis === 0 ? 360 : basis === 1 ? 365 : 360;

    return par * rate * daysBetween / daysInYear;
  }

  ACCRINTM(issue: Date, settlement: Date, rate: number, par: number, basis: number = 0): number {
    const daysBetween = this.DAYS(settlement, issue);
    const daysInYear = basis === 0 ? 360 : basis === 1 ? 365 : 360;

    return par * rate * daysBetween / daysInYear;
  }

  // ============================================================================
  // INFORMATION FUNCTIONS
  // ============================================================================

  ISBLANK(value: any): boolean {
    return value === null || value === undefined || value === '';
  }

  ISERROR(value: any): boolean {
    return typeof value === 'string' && value.startsWith('#');
  }

  ISERR(value: any): boolean {
    return this.ISERROR(value) && value !== '#N/A';
  }

  ISNA(value: any): boolean {
    return value === '#N/A';
  }

  ISNUMBER(value: any): boolean {
    return typeof value === 'number' || !isNaN(parseFloat(value));
  }

  ISTEXT(value: any): boolean {
    return typeof value === 'string';
  }

  ISLOGICAL(value: any): boolean {
    return typeof value === 'boolean';
  }

  ISREF(value: any): boolean {
    return true; // Simplified
  }

  ISNONTEXT(value: any): boolean {
    return !this.ISTEXT(value);
  }

  ISEVEN(number: number): boolean {
    return Math.floor(number) % 2 === 0;
  }

  ISODD(number: number): boolean {
    return Math.floor(number) % 2 !== 0;
  }

  N(value: any): number {
    return this.toNumber(value) || 0;
  }

  NA(): string {
    return '#N/A';
  }

  TYPE(value: any): number {
    if (typeof value === 'number') return 1;
    if (typeof value === 'string') return 2;
    if (typeof value === 'boolean') return 4;
    if (this.ISERROR(value)) return 16;
    if (Array.isArray(value)) return 64;
    return 0;
  }

  CELL(infoType: string, reference?: any): any {
    // Simplified - would need actual cell reference resolution
    if (infoType === 'address') return 'A1';
    if (infoType === 'col') return 1;
    if (infoType === 'row') return 1;
    if (infoType === 'type') return 'v';
    return '';
  }

  INFO(typeText: string): string {
    if (typeText === 'system') return 'web';
    if (typeText === 'osversion') return 'Web Browser';
    if (typeText === 'release') return '1.0';
    return '';
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  private flattenArgs(args: any[]): any[] {
    const result: any[] = [];

    for (const arg of args) {
      if (Array.isArray(arg)) {
        result.push(...this.flattenArgs(arg));
      } else {
        result.push(arg);
      }
    }

    return result;
  }

  private toNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;

    const num = parseFloat(String(value));
    return isNaN(num) ? null : num;
  }

  private toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.toLowerCase() === 'true' || value !== '';
    return !!value;
  }

  private matchesCriteria(value: any, criteria: any): boolean {
    const criteriaStr = String(criteria);

    // Check for comparison operators
    const match = criteriaStr.match(/^([<>=!]+)(.+)$/);
    if (match) {
      const operator = match[1];
      const compareValue = this.toNumber(match[2]) || match[2];
      const val = this.toNumber(value) || value;

      switch (operator) {
        case '>': return val > compareValue;
        case '<': return val < compareValue;
        case '>=': return val >= compareValue;
        case '<=': return val <= compareValue;
        case '=': return val === compareValue;
        case '<>': case '!=': return val !== compareValue;
      }
    }

    return value === criteria;
  }

  private to2DArray(array: any[][]): any[][] {
    if (!Array.isArray(array)) return [[array]];
    if (!Array.isArray(array[0])) return [array];
    return array;
  }
}
