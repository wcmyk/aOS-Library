import { useState, useMemo } from 'react';

// ── Seed helpers ──────────────────────────────────────────────────────────────

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Data pools ────────────────────────────────────────────────────────────────

const USA_CITIES: Array<{ city: string; state: string; lat: number; lng: number }> = [
  { city: 'New York', state: 'NY', lat: 40.71, lng: -74.01 },
  { city: 'Los Angeles', state: 'CA', lat: 34.05, lng: -118.24 },
  { city: 'Chicago', state: 'IL', lat: 41.88, lng: -87.63 },
  { city: 'Houston', state: 'TX', lat: 29.76, lng: -95.37 },
  { city: 'Phoenix', state: 'AZ', lat: 33.45, lng: -112.07 },
  { city: 'Philadelphia', state: 'PA', lat: 39.95, lng: -75.16 },
  { city: 'San Antonio', state: 'TX', lat: 29.42, lng: -98.49 },
  { city: 'San Diego', state: 'CA', lat: 32.72, lng: -117.16 },
  { city: 'Dallas', state: 'TX', lat: 32.78, lng: -96.80 },
  { city: 'San Jose', state: 'CA', lat: 37.34, lng: -121.89 },
  { city: 'Austin', state: 'TX', lat: 30.27, lng: -97.74 },
  { city: 'Jacksonville', state: 'FL', lat: 30.33, lng: -81.66 },
  { city: 'Fort Worth', state: 'TX', lat: 32.75, lng: -97.33 },
  { city: 'Columbus', state: 'OH', lat: 39.96, lng: -82.99 },
  { city: 'Charlotte', state: 'NC', lat: 35.23, lng: -80.84 },
  { city: 'San Francisco', state: 'CA', lat: 37.77, lng: -122.42 },
  { city: 'Indianapolis', state: 'IN', lat: 39.77, lng: -86.16 },
  { city: 'Seattle', state: 'WA', lat: 47.61, lng: -122.33 },
  { city: 'Denver', state: 'CO', lat: 39.74, lng: -104.98 },
  { city: 'Nashville', state: 'TN', lat: 36.17, lng: -86.78 },
  { city: 'Oklahoma City', state: 'OK', lat: 35.47, lng: -97.52 },
  { city: 'El Paso', state: 'TX', lat: 31.76, lng: -106.49 },
  { city: 'Washington', state: 'DC', lat: 38.90, lng: -77.04 },
  { city: 'Las Vegas', state: 'NV', lat: 36.17, lng: -115.14 },
  { city: 'Louisville', state: 'KY', lat: 38.25, lng: -85.76 },
  { city: 'Memphis', state: 'TN', lat: 35.15, lng: -90.05 },
  { city: 'Portland', state: 'OR', lat: 45.52, lng: -122.68 },
  { city: 'Baltimore', state: 'MD', lat: 39.29, lng: -76.61 },
  { city: 'Milwaukee', state: 'WI', lat: 43.04, lng: -87.91 },
  { city: 'Albuquerque', state: 'NM', lat: 35.08, lng: -106.65 },
  { city: 'Tucson', state: 'AZ', lat: 32.22, lng: -110.97 },
  { city: 'Fresno', state: 'CA', lat: 36.74, lng: -119.77 },
  { city: 'Sacramento', state: 'CA', lat: 38.58, lng: -121.49 },
  { city: 'Kansas City', state: 'MO', lat: 39.10, lng: -94.58 },
  { city: 'Mesa', state: 'AZ', lat: 33.42, lng: -111.83 },
  { city: 'Atlanta', state: 'GA', lat: 33.75, lng: -84.39 },
  { city: 'Omaha', state: 'NE', lat: 41.26, lng: -95.94 },
  { city: 'Colorado Springs', state: 'CO', lat: 38.83, lng: -104.82 },
  { city: 'Raleigh', state: 'NC', lat: 35.78, lng: -78.64 },
  { city: 'Long Beach', state: 'CA', lat: 33.77, lng: -118.19 },
  { city: 'Virginia Beach', state: 'VA', lat: 36.85, lng: -75.98 },
  { city: 'Minneapolis', state: 'MN', lat: 44.98, lng: -93.27 },
  { city: 'Tampa', state: 'FL', lat: 27.95, lng: -82.46 },
  { city: 'New Orleans', state: 'LA', lat: 29.95, lng: -90.07 },
  { city: 'Arlington', state: 'TX', lat: 32.74, lng: -97.11 },
  { city: 'Bakersfield', state: 'CA', lat: 35.37, lng: -119.02 },
  { city: 'Honolulu', state: 'HI', lat: 21.31, lng: -157.86 },
  { city: 'Anaheim', state: 'CA', lat: 33.84, lng: -117.91 },
  { city: 'Aurora', state: 'CO', lat: 39.73, lng: -104.83 },
  { city: 'Santa Ana', state: 'CA', lat: 33.75, lng: -117.87 },
  { city: 'Corpus Christi', state: 'TX', lat: 27.80, lng: -97.40 },
  { city: 'Riverside', state: 'CA', lat: 33.95, lng: -117.40 },
  { city: 'Lexington', state: 'KY', lat: 38.05, lng: -84.50 },
  { city: 'St. Louis', state: 'MO', lat: 38.63, lng: -90.20 },
  { city: 'Pittsburgh', state: 'PA', lat: 40.44, lng: -80.00 },
  { city: 'Anchorage', state: 'AK', lat: 61.22, lng: -149.90 },
  { city: 'Stockton', state: 'CA', lat: 37.96, lng: -121.29 },
  { city: 'Cincinnati', state: 'OH', lat: 39.10, lng: -84.51 },
  { city: 'St. Paul', state: 'MN', lat: 44.95, lng: -93.09 },
  { city: 'Greensboro', state: 'NC', lat: 36.07, lng: -79.79 },
  { city: 'Toledo', state: 'OH', lat: 41.66, lng: -83.56 },
  { city: 'Newark', state: 'NJ', lat: 40.74, lng: -74.17 },
  { city: 'Plano', state: 'TX', lat: 33.02, lng: -96.70 },
  { city: 'Henderson', state: 'NV', lat: 36.04, lng: -114.98 },
  { city: 'Orlando', state: 'FL', lat: 28.54, lng: -81.38 },
  { city: 'Chandler', state: 'AZ', lat: 33.30, lng: -111.84 },
  { city: 'Laredo', state: 'TX', lat: 27.51, lng: -99.51 },
  { city: 'Madison', state: 'WI', lat: 43.07, lng: -89.40 },
  { city: 'Durham', state: 'NC', lat: 35.99, lng: -78.90 },
  { city: 'Lubbock', state: 'TX', lat: 33.58, lng: -101.86 },
  { city: 'Garland', state: 'TX', lat: 32.91, lng: -96.64 },
  { city: 'Winston-Salem', state: 'NC', lat: 36.10, lng: -80.24 },
  { city: 'Glendale', state: 'AZ', lat: 33.54, lng: -112.19 },
  { city: 'Hialeah', state: 'FL', lat: 25.86, lng: -80.28 },
  { city: 'Reno', state: 'NV', lat: 39.53, lng: -119.81 },
  { city: 'Baton Rouge', state: 'LA', lat: 30.45, lng: -91.15 },
  { city: 'Irvine', state: 'CA', lat: 33.68, lng: -117.83 },
  { city: 'Chesapeake', state: 'VA', lat: 36.77, lng: -76.29 },
  { city: 'Irving', state: 'TX', lat: 32.82, lng: -96.95 },
  { city: 'Scottsdale', state: 'AZ', lat: 33.49, lng: -111.93 },
  { city: 'North Las Vegas', state: 'NV', lat: 36.20, lng: -115.12 },
  { city: 'Fremont', state: 'CA', lat: 37.55, lng: -121.99 },
  { city: 'Gilbert', state: 'AZ', lat: 33.35, lng: -111.79 },
  { city: 'San Bernardino', state: 'CA', lat: 34.11, lng: -117.30 },
  { city: 'Birmingham', state: 'AL', lat: 33.52, lng: -86.81 },
  { city: 'Rochester', state: 'NY', lat: 43.16, lng: -77.61 },
  { city: 'Richmond', state: 'VA', lat: 37.54, lng: -77.43 },
  { city: 'Spokane', state: 'WA', lat: 47.66, lng: -117.43 },
  { city: 'Des Moines', state: 'IA', lat: 41.60, lng: -93.61 },
  { city: 'Montgomery', state: 'AL', lat: 32.36, lng: -86.30 },
  { city: 'Modesto', state: 'CA', lat: 37.64, lng: -120.99 },
  { city: 'Fayetteville', state: 'NC', lat: 35.05, lng: -78.88 },
  { city: 'Tacoma', state: 'WA', lat: 47.25, lng: -122.44 },
  { city: 'Shreveport', state: 'LA', lat: 32.53, lng: -93.75 },
  { city: 'Salt Lake City', state: 'UT', lat: 40.76, lng: -111.89 },
  { city: 'Akron', state: 'OH', lat: 41.08, lng: -81.52 },
  { city: 'Little Rock', state: 'AR', lat: 34.75, lng: -92.29 },
  { city: 'Augusta', state: 'GA', lat: 33.47, lng: -82.01 },
  { city: 'Grand Rapids', state: 'MI', lat: 42.96, lng: -85.67 },
  { city: 'Huntington Beach', state: 'CA', lat: 33.66, lng: -117.99 },
  { city: 'Columbus', state: 'GA', lat: 32.46, lng: -84.99 },
  { city: 'Providence', state: 'RI', lat: 41.82, lng: -71.42 },
  { city: 'Oxnard', state: 'CA', lat: 34.20, lng: -119.18 },
  { city: 'Knoxville', state: 'TN', lat: 35.96, lng: -83.92 },
  { city: 'Overland Park', state: 'KS', lat: 38.98, lng: -94.67 },
  { city: 'Chattanooga', state: 'TN', lat: 35.04, lng: -85.31 },
  { city: 'Mobile', state: 'AL', lat: 30.69, lng: -88.04 },
  { city: 'Fort Lauderdale', state: 'FL', lat: 26.12, lng: -80.14 },
  { city: 'Tempe', state: 'AZ', lat: 33.43, lng: -111.94 },
  { city: 'Santa Clarita', state: 'CA', lat: 34.39, lng: -118.54 },
  { city: 'Cape Coral', state: 'FL', lat: 26.56, lng: -81.95 },
  { city: 'Yonkers', state: 'NY', lat: 40.93, lng: -73.90 },
  { city: 'Worcester', state: 'MA', lat: 42.26, lng: -71.80 },
  { city: 'Moreno Valley', state: 'CA', lat: 33.94, lng: -117.23 },
  { city: 'Fontana', state: 'CA', lat: 34.09, lng: -117.43 },
  { city: 'Glendale', state: 'CA', lat: 34.14, lng: -118.26 },
  { city: 'Huntsville', state: 'AL', lat: 34.73, lng: -86.59 },
  { city: 'Jackson', state: 'MS', lat: 32.30, lng: -90.18 },
  { city: 'Amarillo', state: 'TX', lat: 35.22, lng: -101.83 },
  { city: 'Aurora', state: 'IL', lat: 41.76, lng: -88.32 },
  { city: 'Tallahassee', state: 'FL', lat: 30.44, lng: -84.28 },
  { city: 'Springfield', state: 'MO', lat: 37.21, lng: -93.29 },
  { city: 'Peoria', state: 'IL', lat: 40.69, lng: -89.59 },
  { city: 'Rockford', state: 'IL', lat: 42.27, lng: -89.09 },
  { city: 'Oceanside', state: 'CA', lat: 33.20, lng: -117.38 },
  { city: 'Rancho Cucamonga', state: 'CA', lat: 34.11, lng: -117.59 },
  { city: 'Ontario', state: 'CA', lat: 34.07, lng: -117.65 },
  { city: 'Garden Grove', state: 'CA', lat: 33.77, lng: -117.94 },
  { city: 'Clarksville', state: 'TN', lat: 36.53, lng: -87.36 },
  { city: 'Vancouver', state: 'WA', lat: 45.64, lng: -122.66 },
  { city: 'Elk Grove', state: 'CA', lat: 38.41, lng: -121.37 },
  { city: 'Salem', state: 'OR', lat: 44.93, lng: -123.04 },
  { city: 'Cary', state: 'NC', lat: 35.79, lng: -78.78 },
  { city: 'Hayward', state: 'CA', lat: 37.67, lng: -122.08 },
  { city: 'Palmdale', state: 'CA', lat: 34.58, lng: -118.12 },
  { city: 'Eugene', state: 'OR', lat: 44.05, lng: -123.09 },
  { city: 'Fort Collins', state: 'CO', lat: 40.59, lng: -105.08 },
  { city: 'Lancaster', state: 'CA', lat: 34.70, lng: -118.15 },
  { city: 'Salinas', state: 'CA', lat: 36.68, lng: -121.65 },
  { city: 'Corona', state: 'CA', lat: 33.88, lng: -117.57 },
  { city: 'Macon', state: 'GA', lat: 32.84, lng: -83.63 },
  { city: 'Sunnyvale', state: 'CA', lat: 37.37, lng: -122.04 },
  { city: 'Pomona', state: 'CA', lat: 34.06, lng: -117.75 },
  { city: 'Springfield', state: 'MA', lat: 42.10, lng: -72.59 },
  { city: 'Fort Wayne', state: 'IN', lat: 41.13, lng: -85.13 },
  { city: 'Fayetteville', state: 'AR', lat: 36.06, lng: -94.16 },
  { city: 'Brownsville', state: 'TX', lat: 25.90, lng: -97.50 },
  { city: 'Glendale', state: 'CO', lat: 39.71, lng: -104.94 },
  { city: 'Santa Rosa', state: 'CA', lat: 38.44, lng: -122.71 },
  { city: 'Peoria', state: 'AZ', lat: 33.58, lng: -112.23 },
  { city: 'Providence', state: 'RI', lat: 41.82, lng: -71.42 },
  { city: 'Chattanooga', state: 'TN', lat: 35.04, lng: -85.31 },
  { city: 'Pembroke Pines', state: 'FL', lat: 26.01, lng: -80.34 },
  { city: 'Savannah', state: 'GA', lat: 32.08, lng: -81.10 },
  { city: 'Paterson', state: 'NJ', lat: 40.91, lng: -74.17 },
  { city: 'Torrance', state: 'CA', lat: 33.84, lng: -118.34 },
  { city: 'Bridgeport', state: 'CT', lat: 41.17, lng: -73.20 },
  { city: 'McAllen', state: 'TX', lat: 26.20, lng: -98.23 },
  { city: 'Syracuse', state: 'NY', lat: 43.05, lng: -76.15 },
  { city: 'Killeen', state: 'TX', lat: 31.12, lng: -97.73 },
  { city: 'Lakewood', state: 'CO', lat: 39.70, lng: -105.08 },
  { city: 'Pasadena', state: 'CA', lat: 34.15, lng: -118.14 },
  { city: 'Mesquite', state: 'TX', lat: 32.77, lng: -96.60 },
  { city: 'Hollywood', state: 'FL', lat: 26.01, lng: -80.15 },
  { city: 'Escondido', state: 'CA', lat: 33.12, lng: -117.09 },
  { city: 'Sunnyvale', state: 'TX', lat: 32.80, lng: -96.56 },
  { city: 'Alexandria', state: 'VA', lat: 38.80, lng: -77.05 },
  { city: 'Bellevue', state: 'WA', lat: 47.61, lng: -122.20 },
  { city: 'Miramar', state: 'FL', lat: 25.99, lng: -80.33 },
  { city: 'Surprise', state: 'AZ', lat: 33.63, lng: -112.37 },
  { city: 'Gainesville', state: 'FL', lat: 29.65, lng: -82.32 },
  { city: 'Waco', state: 'TX', lat: 31.55, lng: -97.15 },
  { city: 'Orange', state: 'CA', lat: 33.79, lng: -117.85 },
  { city: 'Fullerton', state: 'CA', lat: 33.87, lng: -117.93 },
  { city: 'Sioux Falls', state: 'SD', lat: 43.55, lng: -96.73 },
  { city: 'Cedar Rapids', state: 'IA', lat: 42.01, lng: -91.64 },
  { city: 'Visalia', state: 'CA', lat: 36.33, lng: -119.29 },
  { city: 'Waterbury', state: 'CT', lat: 41.56, lng: -73.04 },
  { city: 'Stamford', state: 'CT', lat: 41.05, lng: -73.54 },
  { city: 'Warren', state: 'MI', lat: 42.49, lng: -83.03 },
  { city: 'Hampton', state: 'VA', lat: 37.03, lng: -76.35 },
  { city: 'Columbia', state: 'SC', lat: 34.00, lng: -81.03 },
  { city: 'Sterling Heights', state: 'MI', lat: 42.58, lng: -83.03 },
  { city: 'Murfreesboro', state: 'TN', lat: 35.85, lng: -86.39 },
  { city: 'Hartford', state: 'CT', lat: 41.76, lng: -72.68 },
  { city: 'Lansing', state: 'MI', lat: 42.73, lng: -84.56 },
  { city: 'Concord', state: 'CA', lat: 37.98, lng: -122.03 },
  { city: 'Roseville', state: 'CA', lat: 38.75, lng: -121.29 },
  { city: 'Paterson', state: 'NJ', lat: 40.91, lng: -74.17 },
  { city: 'Pasadena', state: 'TX', lat: 29.69, lng: -95.21 },
  { city: 'Pomona', state: 'CA', lat: 34.06, lng: -117.75 },
  { city: 'Bellevue', state: 'NE', lat: 41.15, lng: -95.91 },
  { city: 'Olathe', state: 'KS', lat: 38.88, lng: -94.82 },
  { city: 'Midland', state: 'TX', lat: 31.99, lng: -102.08 },
  { city: 'McKinney', state: 'TX', lat: 33.20, lng: -96.64 },
  { city: 'Hayward', state: 'CA', lat: 37.67, lng: -122.08 },
  { city: 'Kent', state: 'WA', lat: 47.38, lng: -122.23 },
  { city: 'Rockford', state: 'IL', lat: 42.27, lng: -89.09 },
  { city: 'Pembroke Pines', state: 'FL', lat: 26.01, lng: -80.34 },
  { city: 'West Valley City', state: 'UT', lat: 40.69, lng: -111.99 },
  { city: 'Escondido', state: 'CA', lat: 33.12, lng: -117.09 },
  { city: 'Lakewood', state: 'NJ', lat: 40.10, lng: -74.22 },
  { city: 'Jackson', state: 'MI', lat: 42.25, lng: -84.40 },
  { city: 'Sunnyvale', state: 'CA', lat: 37.37, lng: -122.04 },
  { city: 'Eugene', state: 'OR', lat: 44.05, lng: -123.09 },
  { city: 'High Point', state: 'NC', lat: 35.96, lng: -80.00 },
  { city: 'Odessa', state: 'TX', lat: 31.85, lng: -102.37 },
  { city: 'Thornton', state: 'CO', lat: 39.87, lng: -104.97 },
  { city: 'Newport News', state: 'VA', lat: 37.09, lng: -76.47 },
  { city: 'Rancho Cucamonga', state: 'CA', lat: 34.11, lng: -117.59 },
  { city: 'Tempe', state: 'AZ', lat: 33.43, lng: -111.94 },
  { city: 'Springfield', state: 'IL', lat: 39.80, lng: -89.65 },
  { city: 'Naperville', state: 'IL', lat: 41.79, lng: -88.15 },
  { city: 'Elk Grove', state: 'CA', lat: 38.41, lng: -121.37 },
  { city: 'Garden Grove', state: 'CA', lat: 33.77, lng: -117.94 },
  { city: 'Vancouver', state: 'WA', lat: 45.64, lng: -122.66 },
  { city: 'Peoria', state: 'AZ', lat: 33.58, lng: -112.23 },
  { city: 'Fort Collins', state: 'CO', lat: 40.59, lng: -105.08 },
  { city: 'Oceanside', state: 'CA', lat: 33.20, lng: -117.38 },
  { city: 'Beaumont', state: 'TX', lat: 30.08, lng: -94.13 },
  { city: 'Ontario', state: 'CA', lat: 34.07, lng: -117.65 },
  { city: 'Frisco', state: 'TX', lat: 33.15, lng: -96.82 },
  { city: 'Cary', state: 'NC', lat: 35.79, lng: -78.78 },
  { city: 'Worcester', state: 'MA', lat: 42.26, lng: -71.80 },
  { city: 'Brownsville', state: 'TX', lat: 25.90, lng: -97.50 },
  { city: 'Overland Park', state: 'KS', lat: 38.98, lng: -94.67 },
  { city: 'Aurora', state: 'IL', lat: 41.76, lng: -88.32 },
  { city: 'Salem', state: 'OR', lat: 44.93, lng: -123.04 },
  { city: 'Palmdale', state: 'CA', lat: 34.58, lng: -118.12 },
  { city: 'Lancaster', state: 'CA', lat: 34.70, lng: -118.15 },
  { city: 'Macon', state: 'GA', lat: 32.84, lng: -83.63 },
  { city: 'Pomona', state: 'CA', lat: 34.06, lng: -117.75 },
  { city: 'Fort Wayne', state: 'IN', lat: 41.13, lng: -85.13 },
  { city: 'Fayetteville', state: 'AR', lat: 36.06, lng: -94.16 },
  { city: 'Pasadena', state: 'CA', lat: 34.15, lng: -118.14 },
  { city: 'Mesquite', state: 'TX', lat: 32.77, lng: -96.60 },
  { city: 'Hollywood', state: 'FL', lat: 26.01, lng: -80.15 },
  { city: 'Knoxville', state: 'TN', lat: 35.96, lng: -83.92 },
  { city: 'Providence', state: 'RI', lat: 41.82, lng: -71.42 },
  { city: 'Santa Rosa', state: 'CA', lat: 38.44, lng: -122.71 },
  { city: 'Columbia', state: 'SC', lat: 34.00, lng: -81.03 },
  { city: 'Hampton', state: 'VA', lat: 37.03, lng: -76.35 },
  { city: 'Warren', state: 'MI', lat: 42.49, lng: -83.03 },
  { city: 'Stamford', state: 'CT', lat: 41.05, lng: -73.54 },
  { city: 'Waco', state: 'TX', lat: 31.55, lng: -97.15 },
];

const STREET_NAMES = ['Oak St', 'Maple Ave', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Lake Dr', 'Park Blvd', 'River Rd', 'Sunset Ave', 'Valley Way', 'Summit Dr', 'Grove St', 'Hill Rd', 'Forest Ln', 'Meadow Ct', 'Spring St', 'Willow Way', 'Birch Ave', 'Cherry Ln', 'Highland Rd'];

const PROPERTY_FEATURES = {
  house: ['Open floor plan', 'Chef\'s kitchen', 'Master suite', 'Hardwood floors', '2-car garage', 'Private backyard', 'Newly renovated', 'Energy efficient', 'Smart home features', 'Finished basement'],
  apartment: ['In-unit laundry', 'Rooftop deck', 'Concierge service', 'Pet friendly', 'City views', 'Modern finishes', 'Walk-in closets', 'Central AC', 'Fitness center', 'Rooftop pool'],
  condo: ['HOA included', 'Secure parking', 'Doorman', 'Gym access', 'Storage unit', 'Guest suite', 'Updated kitchen', 'Quartz counters', 'Floor-to-ceiling windows', 'Balcony'],
  townhouse: ['End unit', 'Private patio', 'Attached garage', 'Three levels', 'Updated baths', 'New appliances', 'Roof deck', 'Exposed brick', 'High ceilings', 'Natural light'],
};

// Generate gradient colors for property photos
const PHOTO_GRADIENTS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#fccb90', '#d57eeb'],
  ['#a1c4fd', '#c2e9fb'],
  ['#fd7043', '#ff8a65'],
  ['#26c6da', '#00acc1'],
  ['#66bb6a', '#43a047'],
  ['#ef5350', '#e53935'],
  ['#ab47bc', '#8e24aa'],
  ['#5c6bc0', '#3949ab'],
  ['#ff7043', '#ff5722'],
];

// ── Property type ─────────────────────────────────────────────────────────────

type PropertyType = 'house' | 'apartment' | 'condo' | 'townhouse';

type Property = {
  id: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  features: string[];
  description: string;
  lat: number;
  lng: number;
  gradient: [string, string];
  daysOnMarket: number;
  pricePerSqft: number;
  hoa?: number;
  garage: boolean;
  pool: boolean;
};

// ── Generate 150 properties ───────────────────────────────────────────────────

function generateProperties(): Property[] {
  const props: Property[] = [];
  const types: PropertyType[] = ['house', 'apartment', 'condo', 'townhouse'];
  const priceRanges: Record<PropertyType, [number, number]> = {
    house: [285000, 1850000],
    apartment: [125000, 650000],
    condo: [185000, 980000],
    townhouse: [225000, 750000],
  };

  for (let i = 0; i < 150; i++) {
    const rng = seeded(i * 9871 + 12345);
    const cityData = USA_CITIES[i % USA_CITIES.length];
    const type = pick(types, rng);
    const [minP, maxP] = priceRanges[type];
    const price = Math.round((minP + rng() * (maxP - minP)) / 1000) * 1000;
    const beds = type === 'apartment' ? Math.floor(rng() * 3) + 1 : Math.floor(rng() * 4) + 2;
    const baths = Math.max(1, Math.floor(beds * (0.5 + rng() * 0.5)));
    const sqft = type === 'apartment' ? 450 + Math.floor(rng() * 900) : 950 + Math.floor(rng() * 2800);
    const streetNum = 100 + Math.floor(rng() * 9900);
    const street = STREET_NAMES[Math.floor(rng() * STREET_NAMES.length)];
    const features = PROPERTY_FEATURES[type];
    const numFeatures = 4 + Math.floor(rng() * 4);
    const selectedFeatures: string[] = [];
    const usedIdx = new Set<number>();
    for (let j = 0; j < numFeatures; j++) {
      let idx = Math.floor(rng() * features.length);
      while (usedIdx.has(idx)) idx = (idx + 1) % features.length;
      usedIdx.add(idx);
      selectedFeatures.push(features[idx]);
    }
    const gradient = PHOTO_GRADIENTS[i % PHOTO_GRADIENTS.length] as [string, string];
    const descriptions = [
      `Stunning ${type} in the heart of ${cityData.city}. Beautifully maintained with modern updates throughout. Perfect for professionals or families seeking quality living.`,
      `Gorgeous ${type} with thoughtful design and premium finishes. Ideal location with easy access to shopping, dining, and top-rated schools.`,
      `Light-filled ${type} featuring an open concept layout and high-end finishes. Enjoy the perfect blend of comfort and style in this exceptional property.`,
      `Move-in ready ${type} with recent renovations and designer touches. Situated in one of ${cityData.city}'s most sought-after neighborhoods.`,
      `Exceptional ${type} offering spacious rooms and modern amenities. Nestled in a vibrant community with excellent walkability scores.`,
    ];

    props.push({
      id: `prop-${i}`,
      type,
      address: `${streetNum} ${street}`,
      city: cityData.city,
      state: cityData.state,
      price,
      beds,
      baths,
      sqft,
      yearBuilt: 1970 + Math.floor(rng() * 55),
      features: selectedFeatures,
      description: descriptions[Math.floor(rng() * descriptions.length)],
      lat: cityData.lat + (rng() - 0.5) * 0.1,
      lng: cityData.lng + (rng() - 0.5) * 0.1,
      gradient,
      daysOnMarket: Math.floor(rng() * 60) + 1,
      pricePerSqft: Math.round(price / sqft),
      hoa: type !== 'house' ? Math.round(rng() * 500 + 100) : undefined,
      garage: type === 'house' || type === 'townhouse' ? rng() > 0.3 : false,
      pool: rng() > 0.7,
    });
  }
  return props;
}

const ALL_PROPERTIES = generateProperties();

// ── Main component ────────────────────────────────────────────────────────────

type FilterState = {
  search: string;
  type: string;
  minPrice: number;
  maxPrice: number;
  minBeds: number;
  radius: number;
  locationSearch: string;
};

const TYPE_LABELS: Record<string, string> = {
  all: 'All Types',
  house: 'Houses',
  apartment: 'Apartments',
  condo: 'Condos',
  townhouse: 'Townhouses',
};

function PropertyPhoto({ gradient, type, sqft }: { gradient: [string, string]; type: PropertyType; sqft: number }) {
  const icons: Record<PropertyType, string> = { house: '🏠', apartment: '🏢', condo: '🏙️', townhouse: '🏘️' };
  return (
    <div style={{
      height: 160,
      background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 48,
      borderRadius: '10px 10px 0 0',
      flexShrink: 0,
      position: 'relative',
    }}>
      {icons[type]}
      <div style={{ position: 'absolute', bottom: 8, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
        {sqft.toLocaleString()} sq ft
      </div>
    </div>
  );
}

function formatPrice(price: number): string {
  if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function RealtorApp() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    minPrice: 0,
    maxPrice: 5000000,
    minBeds: 0,
    radius: 0,
    locationSearch: '',
  });
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'newest' | 'beds'>('price-asc');
  const [savedProperties, setSavedProperties] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [scheduleModal, setScheduleModal] = useState(false);

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };

  // Find center for radius search
  const radiusCenter = useMemo(() => {
    if (!filters.locationSearch.trim()) return null;
    const loc = USA_CITIES.find((c) =>
      c.city.toLowerCase().includes(filters.locationSearch.toLowerCase()) ||
      c.state.toLowerCase().includes(filters.locationSearch.toLowerCase())
    );
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  }, [filters.locationSearch]);

  const filteredProperties = useMemo(() => {
    let props = ALL_PROPERTIES.filter((p) => {
      if (filters.type !== 'all' && p.type !== filters.type) return false;
      if (p.price < filters.minPrice || p.price > filters.maxPrice) return false;
      if (p.beds < filters.minBeds) return false;
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        if (!p.address.toLowerCase().includes(q) && !p.city.toLowerCase().includes(q) && !p.state.toLowerCase().includes(q) && !p.type.includes(q)) return false;
      }
      if (filters.locationSearch.trim()) {
        const q = filters.locationSearch.toLowerCase();
        const matchCity = p.city.toLowerCase().includes(q) || p.state.toLowerCase().includes(q);
        if (filters.radius > 0 && radiusCenter) {
          const dist = haversineDistance(p.lat, p.lng, radiusCenter.lat, radiusCenter.lng);
          return dist <= filters.radius;
        }
        if (!matchCity) return false;
      }
      return true;
    });

    props.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return a.daysOnMarket - b.daysOnMarket;
      if (sortBy === 'beds') return b.beds - a.beds;
      return 0;
    });

    return props;
  }, [filters, sortBy, radiusCenter]);

  const toggleSaved = (id: string) => {
    setSavedProperties((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc', fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif", overflow: 'hidden' }}>
      {/* Header */}
      <header style={{ background: '#1a3c5e', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16, height: 56, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 800, fontSize: 20 }}>
          <span style={{ fontSize: 24 }}>🏡</span>
          <span>HomeFind</span>
        </div>
        <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
          <input
            placeholder="Search by city, address, or ZIP code…"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 16px 8px 36px',
              borderRadius: 10,
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>🔍</span>
        </div>
        <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
          {filteredProperties.length} properties found
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setView('grid')}
            style={{ padding: '6px 12px', borderRadius: 8, background: view === 'grid' ? 'rgba(255,255,255,0.25)' : 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: 'white', cursor: 'pointer', fontSize: 13 }}
          >
            ⊞ Grid
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            style={{ padding: '6px 12px', borderRadius: 8, background: view === 'list' ? 'rgba(255,255,255,0.25)' : 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: 'white', cursor: 'pointer', fontSize: 13 }}
          >
            ≡ List
          </button>
        </div>
      </header>

      {/* Filter bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '10px 24px', display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
        <select value={filters.type} onChange={(e) => setFilter('type', e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: 'white', color: '#334155' }}>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>Price:</span>
          <select
            value={filters.minPrice}
            onChange={(e) => setFilter('minPrice', Number(e.target.value))}
            style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: 'white', color: '#334155' }}
          >
            {[0, 100000, 200000, 300000, 500000, 750000, 1000000].map((v) => <option key={v} value={v}>{v === 0 ? 'No min' : `$${(v/1000).toFixed(0)}K`}</option>)}
          </select>
          <span style={{ color: '#94a3b8' }}>–</span>
          <select
            value={filters.maxPrice}
            onChange={(e) => setFilter('maxPrice', Number(e.target.value))}
            style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: 'white', color: '#334155' }}
          >
            {[200000, 500000, 750000, 1000000, 1500000, 2000000, 5000000].map((v) => <option key={v} value={v}>{v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : `$${(v/1000).toFixed(0)}K`}</option>)}
          </select>
        </div>

        <select value={filters.minBeds} onChange={(e) => setFilter('minBeds', Number(e.target.value))} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: 'white', color: '#334155' }}>
          {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n === 0 ? 'Any beds' : `${n}+ beds`}</option>)}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            placeholder="Location (city/state)"
            value={filters.locationSearch}
            onChange={(e) => setFilter('locationSearch', e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, width: 140, color: '#334155' }}
          />
          <select
            value={filters.radius}
            onChange={(e) => setFilter('radius', Number(e.target.value))}
            style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: 'white', color: '#334155' }}
          >
            {[0, 5, 10, 25, 50, 100].map((r) => <option key={r} value={r}>{r === 0 ? 'Any radius' : `${r} mi`}</option>)}
          </select>
        </div>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: 'white', marginLeft: 'auto', color: '#334155' }}>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="newest">Newest Listed</option>
          <option value="beds">Most Bedrooms</option>
        </select>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Property list */}
        <div style={{ flex: selectedProperty ? '0 0 55%' : '1', overflow: 'auto', padding: 16 }}>
          {filteredProperties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏚️</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>No properties found</div>
              <div style={{ fontSize: 14, marginTop: 8 }}>Try adjusting your filters</div>
            </div>
          ) : (
            <div style={{ display: view === 'grid' ? 'grid' : 'flex', gridTemplateColumns: selectedProperty ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 16, flexDirection: 'column' }}>
              {filteredProperties.map((prop) => (
                <article
                  key={prop.id}
                  onClick={() => setSelectedProperty(prop)}
                  style={{
                    background: 'white',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: selectedProperty?.id === prop.id ? '2px solid #1a3c5e' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    boxShadow: selectedProperty?.id === prop.id ? '0 0 0 3px rgba(26,60,94,0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
                    display: view === 'list' ? 'flex' : 'block',
                  }}
                >
                  {view === 'grid' && <PropertyPhoto gradient={prop.gradient} type={prop.type} sqft={prop.sqft} />}
                  {view === 'list' && (
                    <div style={{ width: 120, flexShrink: 0, background: `linear-gradient(135deg, ${prop.gradient[0]}, ${prop.gradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                      {prop.type === 'house' ? '🏠' : prop.type === 'apartment' ? '🏢' : prop.type === 'condo' ? '🏙️' : '🏘️'}
                    </div>
                  )}
                  <div style={{ padding: 14, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#1a3c5e' }}>{formatPrice(prop.price)}</div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleSaved(prop.id); }}
                        style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 0 }}
                      >
                        {savedProperties.has(prop.id) ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#475569', marginTop: 4 }}>
                      <span>🛏 {prop.beds} bd</span>
                      <span>🚿 {prop.baths} ba</span>
                      <span>{prop.sqft.toLocaleString()} sqft</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{prop.address}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{prop.city}, {prop.state}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 600 }}>{prop.type.charAt(0).toUpperCase() + prop.type.slice(1)}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#15803d', fontSize: 11, fontWeight: 600 }}>{prop.daysOnMarket}d on market</span>
                      {prop.pool && <span style={{ padding: '2px 8px', borderRadius: 20, background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 600 }}>Pool</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Property detail */}
        {selectedProperty && (
          <div style={{ flex: '0 0 45%', overflow: 'auto', background: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ height: 220, background: `linear-gradient(135deg, ${selectedProperty.gradient[0]}, ${selectedProperty.gradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
                {selectedProperty.type === 'house' ? '🏠' : selectedProperty.type === 'apartment' ? '🏢' : selectedProperty.type === 'condo' ? '🏙️' : '🏘️'}
              </div>
              <button
                type="button"
                onClick={() => setSelectedProperty(null)}
                style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => toggleSaved(selectedProperty.id)}
                style={{ position: 'absolute', top: 12, right: 52, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {savedProperties.has(selectedProperty.id) ? '❤️' : '🤍'}
              </button>
            </div>

            <div style={{ padding: 24, flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1a3c5e' }}>{formatPrice(selectedProperty.price)}</div>
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>${selectedProperty.pricePerSqft.toLocaleString()}/sqft</div>

              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>{selectedProperty.address}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>{selectedProperty.city}, {selectedProperty.state}</div>

              <div style={{ display: 'flex', gap: 20, marginTop: 16, padding: '16px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                {[
                  { icon: '🛏', label: 'Beds', value: selectedProperty.beds },
                  { icon: '🚿', label: 'Baths', value: selectedProperty.baths },
                  { icon: '📐', label: 'Sq Ft', value: selectedProperty.sqft.toLocaleString() },
                  { icon: '📅', label: 'Year Built', value: selectedProperty.yearBuilt },
                ].map((stat) => (
                  <div key={stat.label} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 20 }}>{stat.icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>About this property</div>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>{selectedProperty.description}</p>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>Features & Amenities</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {selectedProperty.features.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                      <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span>
                      {f}
                    </div>
                  ))}
                  {selectedProperty.garage && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}><span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span>Garage</div>}
                  {selectedProperty.pool && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}><span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span>Swimming Pool</div>}
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {selectedProperty.hoa && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>HOA/Month</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>${selectedProperty.hoa}/mo</div>
                  </div>
                )}
                <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Est. Mortgage</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>${Math.round(selectedProperty.price * 0.004).toLocaleString()}/mo</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Days on Market</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>{selectedProperty.daysOnMarket} days</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Coordinates</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginTop: 2 }}>{selectedProperty.lat.toFixed(3)}, {selectedProperty.lng.toFixed(3)}</div>
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setScheduleModal(true)}
                  style={{ flex: 1, padding: '14px', borderRadius: 12, background: '#1a3c5e', color: 'white', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Schedule Tour
                </button>
                <button
                  type="button"
                  style={{ flex: 1, padding: '14px', borderRadius: 12, background: '#eff6ff', color: '#1a3c5e', fontSize: 15, fontWeight: 700, border: '2px solid #1a3c5e', cursor: 'pointer' }}
                >
                  Contact Agent
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Tour Modal */}
      {scheduleModal && selectedProperty && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, width: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Schedule a Tour</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state}</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>Preferred Date</label>
              <input type="date" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, color: '#1e293b' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>Preferred Time</label>
              <select style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, color: '#1e293b' }}>
                {['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>Tour Type</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['In-Person', 'Virtual'].map((type) => (
                  <label key={type} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1', cursor: 'pointer', textAlign: 'center', fontSize: 14 }}>
                    <input type="radio" name="tourType" value={type} style={{ marginRight: 6 }} defaultChecked={type === 'In-Person'} />
                    {type}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setScheduleModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setScheduleModal(false)}
                style={{ flex: 2, padding: '12px', borderRadius: 12, background: '#1a3c5e', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
              >
                Confirm Tour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
