import { useMemo, useState } from 'react';
import { useMailStore } from '../../state/useMailStore';
import { useShellStore } from '../../state/useShellStore';
import './realtor.css';

const BASE_URL = import.meta.env.BASE_URL;
const photo = (name: string) => `${BASE_URL}assets/realtor/${name}.jpg`;
const INTERIORS = ['int-living', 'int-kitchen', 'int-bedroom', 'int-bath', 'backyard', 'int-living2', 'int-kitchen2', 'int-office'];

type Listing = {
  id: string;
  cover: string;
  status: 'sale' | 'rent';
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  year: number;
  building: string;
  address: string;
  city: string;
  type: string;
  agent: string;
  desc: string;
  features: string[];
};

const COVERS = ['house-modern', 'house-suburban', 'condo-tower', 'townhouse', 'villa', 'apartment'];

const LISTINGS: Listing[] = [
  { id: 'h1', cover: 'house-modern', status: 'sale', price: 875000, beds: 4, baths: 3, sqft: 2680, year: 2021, building: 'The Cedarview', address: '412 Lakeshore Dr', city: 'Bellevue, WA', type: 'Single Family Home', agent: 'Dana Whitmore', desc: 'A striking contemporary home with floor-to-ceiling glass, warm oak accents and a chef’s kitchen. Sited on a landscaped lot minutes from downtown, it pairs open-plan living with a private primary suite and a two-car garage.', features: ['Chef’s kitchen with quartz island', 'Floor-to-ceiling windows', 'Primary suite with spa bath', 'Smart-home wiring', 'Two-car garage', 'Fenced backyard'] },
  { id: 'h2', cover: 'house-suburban', status: 'sale', price: 549000, beds: 3, baths: 2, sqft: 1980, year: 2008, building: 'Maple Grove', address: '88 Birchwood Ln', city: 'Naperville, IL', type: 'Single Family Home', agent: 'Marcus Reed', desc: 'Classic suburban charm on a quiet tree-lined street. Freshly painted with a bright eat-in kitchen, a finished basement and a generous fenced yard — ideal for first-time buyers and growing families.', features: ['Finished basement', 'Eat-in kitchen', 'Two-car attached garage', 'Fenced yard', 'New HVAC (2023)', 'Walk to top-rated schools'] },
  { id: 'c1', cover: 'condo-tower', status: 'sale', price: 1180000, beds: 2, baths: 2, sqft: 1420, year: 2019, building: 'One Harbor Residences', address: '900 Marina Blvd #2104', city: 'Boston, MA', type: 'High-Rise Condo', agent: 'Priya Anand', desc: 'A sun-drenched 21st-floor residence with sweeping harbor views. Floor-to-ceiling glass, a designer kitchen and building amenities including a gym, roof deck and 24-hour concierge.', features: ['Harbor views', '24-hour concierge', 'Fitness center & roof deck', 'In-unit laundry', 'Deeded parking', 'Pet friendly'] },
  { id: 't1', cover: 'townhouse', status: 'sale', price: 665000, beds: 3, baths: 3, sqft: 1860, year: 2016, building: 'Elmstone Place', address: '17 Elmstone Row', city: 'Denver, CO', type: 'Townhouse', agent: 'Dana Whitmore', desc: 'A modern brick townhome with three levels of flexible living, a private rooftop terrace and an attached garage. Steps from cafés, parks and light rail.', features: ['Private rooftop terrace', 'Attached garage', 'Hardwood throughout', 'Energy-efficient windows', 'Low HOA', 'Near light rail'] },
  { id: 'v1', cover: 'villa', status: 'sale', price: 2450000, beds: 5, baths: 5, sqft: 4120, year: 2022, building: 'Casa Palma', address: '3 Sunset Ridge', city: 'Scottsdale, AZ', type: 'Luxury Villa', agent: 'Elena Cruz', desc: 'An architectural masterpiece with a resort-style pool, disappearing glass walls and a gourmet outdoor kitchen. Designed for indoor-outdoor living under the desert sky.', features: ['Resort-style pool & spa', 'Disappearing glass walls', 'Outdoor kitchen', 'Home theater', '3-car garage', 'Smart climate control'] },
  { id: 'a1', cover: 'apartment', status: 'rent', price: 2650, beds: 2, baths: 2, sqft: 1120, year: 2018, building: 'Parkview Tower', address: '55 Parkview Ave #310', city: 'Seattle, WA', type: 'Apartment', agent: 'Marcus Reed', desc: 'A bright corner apartment with a private balcony overlooking the park. Modern finishes, in-unit washer/dryer and access to a resident lounge, gym and courtyard.', features: ['Private balcony', 'In-unit washer/dryer', 'Resident gym & lounge', 'Stainless appliances', 'Garage parking available', 'Pet friendly'] },
  { id: 'a2', cover: 'condo-tower', status: 'rent', price: 3450, beds: 2, baths: 2, sqft: 1290, year: 2020, building: 'Skyline Lofts', address: '120 Downtown Sq #1808', city: 'Austin, TX', type: 'Luxury Rental', agent: 'Priya Anand', desc: 'Downtown living at its finest — soaring ceilings, city views and a walkable location near restaurants and music venues. Full-service building with a pool deck and coworking lounge.', features: ['City skyline views', 'Rooftop pool deck', 'Coworking lounge', 'Floor-to-ceiling windows', 'Concierge', 'EV charging'] },
  { id: 'h3', cover: 'house-modern', status: 'sale', price: 1295000, beds: 4, baths: 4, sqft: 3240, year: 2023, building: 'Glasshouse', address: '9 Hillcrest Ct', city: 'Portland, OR', type: 'Single Family Home', agent: 'Elena Cruz', desc: 'Brand-new construction blending warm wood and crisp white volumes. Vaulted great room, wolf appliances and a private studio above the garage.', features: ['New construction', 'Vaulted great room', 'Pro-grade appliances', 'Detached studio', 'EV-ready garage', 'Solar panels'] },
  { id: 'h4', cover: 'house-suburban', status: 'rent', price: 3200, beds: 4, baths: 3, sqft: 2400, year: 2012, building: 'Willow Bend', address: '204 Willow Bend Rd', city: 'Frisco, TX', type: 'Single Family Rental', agent: 'Marcus Reed', desc: 'Spacious family rental with a big backyard, game room and community pool access. Available fully or partially furnished.', features: ['Large fenced backyard', 'Bonus game room', 'Community pool', 'Two-car garage', 'Furnished option', 'Lawn care included'] },
  { id: 't2', cover: 'townhouse', status: 'sale', price: 720000, beds: 3, baths: 3, sqft: 2010, year: 2020, building: 'Harborline Rows', address: '42 Dockside Way', city: 'Charleston, SC', type: 'Townhouse', agent: 'Priya Anand', desc: 'Coastal-modern townhome moments from the waterfront, with a bright open plan, a two-car garage and shared marina access.', features: ['Marina access', 'Open-concept living', 'Two-car garage', 'Impact windows', 'Screened porch', 'Low maintenance'] },
  { id: 'c2', cover: 'condo-tower', status: 'sale', price: 640000, beds: 1, baths: 1, sqft: 880, year: 2017, building: 'The Meridian', address: '300 Center St #1502', city: 'Chicago, IL', type: 'High-Rise Condo', agent: 'Dana Whitmore', desc: 'An efficient one-bedroom with lake glimpses, a full-service building and an unbeatable Loop location.', features: ['Lake glimpses', 'Full-service building', 'Fitness center', 'In-unit laundry', 'Walk score 98', 'Storage locker'] },
  { id: 'v2', cover: 'villa', status: 'rent', price: 8500, beds: 5, baths: 5, sqft: 4600, year: 2021, building: 'Villa Serena', address: '1 Palm Vista', city: 'Miami, FL', type: 'Luxury Villa Rental', agent: 'Elena Cruz', desc: 'A private gated estate with an infinity pool, summer kitchen and lush tropical grounds. Offered furnished for seasonal or annual lease.', features: ['Infinity pool', 'Gated & private', 'Summer kitchen', 'Furnished', 'Staff quarters', 'Smart security'] },
];

// ── Expanded inventory (5× the hand-written selection) ──────────────────────
// Concise tuples are expanded into full listings, with descriptions and
// feature lists synthesised from the property type so each entry reads real.
type Seed = [id: string, cover: string, status: 'sale' | 'rent', price: number, beds: number, baths: number, sqft: number, year: number, building: string, address: string, city: string, type: string, agent: string];

const DESC_BY_COVER: Record<string, string> = {
  'house-mansion': 'A show-stopping modern estate wrapped in glass and concrete, with warm interior lighting, a sculptural staircase and a landscaped motor court. Grand-scale entertaining spaces flow to private garden terraces.',
  'house-cabin': 'A warm timber cabin tucked into the pines, with vaulted wood ceilings, a stone fireplace and a wraparound deck made for morning coffee and quiet evenings under the trees.',
  'house-colonial': 'A classic red-brick colonial with white trim, hardwood floors and generous, light-filled rooms. Mature landscaping and a deep lot give it timeless curb appeal.',
  'house-beach': 'A breezy coastal retreat on stilts with panoramic ocean views, an open great room and expansive decks. Steps from the sand, built for indoor-outdoor living.',
  'house-penthouse': 'A full-floor penthouse crowning the tower, with wraparound terraces, floor-to-ceiling glass and skyline views in every direction. White-glove building with concierge and valet.',
  'house-farmhouse': 'A charming modern farmhouse with a wraparound porch, shiplap accents and a big country kitchen, set on an open lot shaded by a grand old oak.',
  'house-modern': 'A striking contemporary home with floor-to-ceiling glass, warm oak accents and a chef’s kitchen on a landscaped lot.',
  'house-suburban': 'Classic suburban charm on a quiet tree-lined street with a bright eat-in kitchen, finished basement and a generous fenced yard.',
  'condo-tower': 'A sun-drenched high-rise residence with sweeping views, a designer kitchen and full building amenities including a gym and roof deck.',
  'townhouse': 'A modern townhome with flexible multi-level living, a private terrace and an attached garage, steps from cafés and transit.',
  'villa': 'An architectural villa with a resort-style pool, disappearing glass walls and a gourmet outdoor kitchen for year-round entertaining.',
  'apartment': 'A bright apartment with a private balcony, modern finishes, in-unit laundry and access to a resident lounge and courtyard.',
};

const FEAT_BY_COVER: Record<string, string[]> = {
  'house-mansion': ['Grand two-story foyer', 'Chef’s catering kitchen', 'Home theater & wine cellar', 'Resort pool & spa', '4-car garage', 'Smart-home automation'],
  'house-cabin': ['Stone wood-burning fireplace', 'Vaulted timber ceilings', 'Wraparound deck', 'Hot tub', 'Detached workshop', 'Forested private lot'],
  'house-colonial': ['Hardwood floors throughout', 'Formal dining room', 'Updated eat-in kitchen', 'Finished basement', 'Two-car garage', 'Mature landscaping'],
  'house-beach': ['Panoramic ocean views', 'Wraparound decks', 'Open great room', 'Outdoor shower', 'Elevated hurricane-rated build', 'Steps to the beach'],
  'house-penthouse': ['Wraparound private terraces', 'Floor-to-ceiling glass', 'Chef’s kitchen', 'Concierge & valet', 'Two deeded parking spaces', 'Skyline views'],
  'house-farmhouse': ['Wraparound porch', 'Country chef’s kitchen', 'Shiplap accents', 'Barn-style garage', 'Fenced acreage', 'Wood-burning stove'],
  'house-modern': ['Chef’s kitchen with quartz island', 'Floor-to-ceiling windows', 'Primary suite with spa bath', 'Smart-home wiring', 'Two-car garage', 'Fenced backyard'],
  'house-suburban': ['Finished basement', 'Eat-in kitchen', 'Attached garage', 'Fenced yard', 'New HVAC', 'Walk to schools'],
  'condo-tower': ['City views', '24-hour concierge', 'Fitness center & roof deck', 'In-unit laundry', 'Deeded parking', 'Pet friendly'],
  'townhouse': ['Private terrace', 'Attached garage', 'Hardwood throughout', 'Energy-efficient windows', 'Low HOA', 'Near transit'],
  'villa': ['Resort-style pool & spa', 'Disappearing glass walls', 'Outdoor kitchen', 'Home theater', '3-car garage', 'Smart climate control'],
  'apartment': ['Private balcony', 'In-unit washer/dryer', 'Resident gym & lounge', 'Stainless appliances', 'Garage parking', 'Pet friendly'],
};

const SEEDS: Seed[] = [
  ['m1', 'house-mansion', 'sale', 4850000, 6, 7, 6800, 2023, 'The Overlook Estate', '1 Summit Ridge', 'Beverly Hills, CA', 'Luxury Estate', 'Elena Cruz'],
  ['m2', 'house-mansion', 'sale', 3650000, 5, 6, 5400, 2022, 'Glass House', '77 Canyon View Dr', 'Austin, TX', 'Luxury Estate', 'Priya Anand'],
  ['cb1', 'house-cabin', 'sale', 585000, 3, 2, 1650, 2015, 'Pinecrest Lodge', '340 Timberline Trail', 'Big Bear Lake, CA', 'Cabin', 'Marcus Reed'],
  ['cb2', 'house-cabin', 'rent', 2400, 2, 1, 1100, 2010, 'Cedar Hollow', '18 Elk Run Rd', 'Gatlinburg, TN', 'Cabin Rental', 'Dana Whitmore'],
  ['co1', 'house-colonial', 'sale', 725000, 4, 3, 2900, 2004, 'Heritage Row', '212 Chestnut St', 'Princeton, NJ', 'Colonial', 'Dana Whitmore'],
  ['co2', 'house-colonial', 'sale', 615000, 4, 3, 2650, 1998, 'Brickyard Commons', '55 Adams Ave', 'Alexandria, VA', 'Colonial', 'Marcus Reed'],
  ['bh1', 'house-beach', 'sale', 1985000, 4, 4, 3100, 2021, 'Dune Crest', '9 Shoreline Way', 'Malibu, CA', 'Beach House', 'Elena Cruz'],
  ['bh2', 'house-beach', 'rent', 6200, 3, 3, 2200, 2019, 'Tide Watch', '410 Ocean Blvd', 'Outer Banks, NC', 'Beach Rental', 'Priya Anand'],
  ['ph1', 'house-penthouse', 'sale', 3250000, 3, 4, 3400, 2022, 'The Aster', '500 Skyline Ave PH', 'New York, NY', 'Penthouse', 'Priya Anand'],
  ['ph2', 'house-penthouse', 'rent', 12500, 3, 3, 2900, 2021, 'One Vista', '88 Grand Blvd PH2', 'Los Angeles, CA', 'Penthouse Rental', 'Elena Cruz'],
  ['fh1', 'house-farmhouse', 'sale', 895000, 4, 3, 3200, 2020, 'Oakhaven Farm', '1200 County Line Rd', 'Franklin, TN', 'Modern Farmhouse', 'Marcus Reed'],
  ['fh2', 'house-farmhouse', 'sale', 640000, 3, 2, 2400, 2016, 'Willow Creek', '77 Meadow Ln', 'Bozeman, MT', 'Farmhouse', 'Dana Whitmore'],
  ['h5', 'house-modern', 'sale', 1150000, 4, 3, 2980, 2022, 'Northgate', '14 Aspen Ct', 'Boulder, CO', 'Single Family Home', 'Elena Cruz'],
  ['h6', 'house-suburban', 'sale', 479000, 3, 2, 1820, 2006, 'Cherry Hill', '303 Maple Dr', 'Columbus, OH', 'Single Family Home', 'Marcus Reed'],
  ['h7', 'house-suburban', 'rent', 2850, 3, 2, 1750, 2011, 'Sunnyside', '92 Oak St', 'Raleigh, NC', 'Single Family Rental', 'Dana Whitmore'],
  ['h8', 'house-modern', 'rent', 4200, 4, 3, 2600, 2023, 'The Vale', '5 Ridgeline Dr', 'Salt Lake City, UT', 'Single Family Rental', 'Priya Anand'],
  ['c3', 'condo-tower', 'sale', 985000, 2, 2, 1350, 2021, 'Bayfront Tower', '700 Harbor St #1704', 'San Diego, CA', 'High-Rise Condo', 'Elena Cruz'],
  ['c4', 'condo-tower', 'rent', 3950, 2, 2, 1240, 2019, 'The Landmark', '210 Center Ave #1203', 'Nashville, TN', 'Luxury Rental', 'Marcus Reed'],
  ['t3', 'townhouse', 'sale', 689000, 3, 3, 1940, 2019, 'Brownstone Row', '31 Cobble Ct', 'Brooklyn, NY', 'Townhouse', 'Priya Anand'],
  ['t4', 'townhouse', 'rent', 3100, 2, 2, 1500, 2017, 'Market Square', '64 Trade St', 'Pittsburgh, PA', 'Townhouse Rental', 'Dana Whitmore'],
  ['v3', 'villa', 'sale', 3150000, 5, 6, 4800, 2023, 'Casa del Sol', '2 Vineyard Vista', 'Napa, CA', 'Luxury Villa', 'Elena Cruz'],
  ['ap3', 'apartment', 'rent', 2950, 2, 2, 1080, 2020, 'The Foundry', '145 Mill St #405', 'Providence, RI', 'Apartment', 'Marcus Reed'],
  ['ap4', 'apartment', 'rent', 2150, 1, 1, 760, 2018, 'Gaslight Lofts', '88 Lamp St #212', 'Savannah, GA', 'Apartment', 'Priya Anand'],
  ['m3', 'house-mansion', 'rent', 18500, 6, 7, 7200, 2022, 'Hilltop Manor', '1 Crown Rd', 'Greenwich, CT', 'Estate Rental', 'Priya Anand'],
  ['cb3', 'house-cabin', 'sale', 445000, 2, 2, 1280, 2012, 'Snowline Retreat', '55 Powder Ridge', 'Breckenridge, CO', 'Cabin', 'Dana Whitmore'],
  ['co3', 'house-colonial', 'rent', 3400, 4, 3, 2500, 2001, 'Colonial Green', '18 Liberty Ln', 'Concord, MA', 'Colonial Rental', 'Marcus Reed'],
  ['bh3', 'house-beach', 'sale', 2650000, 5, 5, 3800, 2023, 'Sandpiper', '3 Coral Cove', 'Naples, FL', 'Beach House', 'Elena Cruz'],
  ['fh3', 'house-farmhouse', 'rent', 3800, 4, 3, 2900, 2018, 'Harvest Hill', '400 Orchard Rd', 'Sonoma, CA', 'Farmhouse Rental', 'Dana Whitmore'],
  ['ph3', 'house-penthouse', 'sale', 5400000, 4, 5, 4200, 2023, 'The Summit', '1 Park Tower PH', 'Chicago, IL', 'Penthouse', 'Priya Anand'],
  ['h9', 'house-modern', 'sale', 1440000, 5, 4, 3600, 2024, 'Cliffside', '12 Vista Grande', 'Sedona, AZ', 'Single Family Home', 'Elena Cruz'],
  ['h10', 'house-colonial', 'sale', 560000, 4, 3, 2700, 2003, 'Old Town', '90 Founders Way', 'Charleston, SC', 'Colonial', 'Marcus Reed'],
  ['c5', 'condo-tower', 'sale', 1290000, 3, 2, 1620, 2022, 'Aqua Residences', '55 Marina Way #2210', 'Miami, FL', 'High-Rise Condo', 'Priya Anand'],
  ['t5', 'townhouse', 'sale', 745000, 3, 3, 2080, 2021, 'Parkline', '22 Green St', 'Washington, DC', 'Townhouse', 'Dana Whitmore'],
  ['v4', 'villa', 'rent', 9800, 5, 5, 4400, 2020, 'Villa Toscana', '7 Olive Grove', 'Santa Barbara, CA', 'Luxury Villa Rental', 'Elena Cruz'],
  ['fh4', 'house-farmhouse', 'sale', 715000, 4, 3, 2850, 2019, 'Bluebird Farm', '650 Ranch Rd', 'Waco, TX', 'Modern Farmhouse', 'Marcus Reed'],
  ['bh4', 'house-beach', 'rent', 5400, 3, 2, 1900, 2017, 'Seagrass', '210 Beachwalk', 'Santa Cruz, CA', 'Beach Rental', 'Priya Anand'],
  ['cb4', 'house-cabin', 'sale', 525000, 3, 2, 1520, 2014, 'Aspen Nook', '77 Birch Bend', 'Park City, UT', 'Cabin', 'Dana Whitmore'],
  ['m4', 'house-mansion', 'sale', 6200000, 7, 8, 8400, 2024, 'Bellavista', '1 Highgate', 'Atherton, CA', 'Luxury Estate', 'Elena Cruz'],
  ['h11', 'house-suburban', 'sale', 525000, 4, 3, 2200, 2009, 'Fox Run', '141 Deerfield Dr', 'Madison, WI', 'Single Family Home', 'Marcus Reed'],
  ['c6', 'condo-tower', 'rent', 2750, 1, 1, 720, 2018, 'Union Flats', '300 Union St #808', 'Portland, OR', 'Apartment', 'Dana Whitmore'],
  ['ph4', 'house-penthouse', 'rent', 8900, 2, 3, 2100, 2022, 'The Crest', '55 Skyway PH1', 'Seattle, WA', 'Penthouse Rental', 'Priya Anand'],
  ['co4', 'house-colonial', 'sale', 685000, 5, 3, 3100, 1996, 'Wexford', '8 Kings Row', 'Fairfax, VA', 'Colonial', 'Marcus Reed'],
  ['v5', 'villa', 'sale', 2890000, 5, 5, 4500, 2021, 'Villa Aurora', '4 Sunset Mesa', 'Palm Springs, CA', 'Luxury Villa', 'Elena Cruz'],
  ['fh5', 'house-farmhouse', 'sale', 599000, 3, 2, 2300, 2015, 'Maple Ridge', '900 Pasture Ln', 'Asheville, NC', 'Farmhouse', 'Dana Whitmore'],
  ['t6', 'townhouse', 'rent', 3650, 3, 3, 1880, 2020, 'Highline Rows', '17 Rail Yard Way', 'Denver, CO', 'Townhouse Rental', 'Marcus Reed'],
  ['bh5', 'house-beach', 'sale', 1550000, 3, 3, 2400, 2020, 'Pelican Point', '6 Windward Dr', 'Cape Cod, MA', 'Beach House', 'Priya Anand'],
  ['h12', 'house-modern', 'rent', 3800, 3, 2, 2100, 2022, 'Terra', '29 Solstice Ln', 'Scottsdale, AZ', 'Single Family Rental', 'Elena Cruz'],
  ['cb5', 'house-cabin', 'rent', 2900, 3, 2, 1400, 2016, 'Whisper Pines', '212 Lakeview Rd', 'Lake Tahoe, CA', 'Cabin Rental', 'Dana Whitmore'],
];

function buildListings(): Listing[] {
  return SEEDS.map(([id, cover, status, price, beds, baths, sqft, year, building, address, city, type, agent]) => ({
    id, cover, status, price, beds, baths, sqft, year, building, address, city, type, agent,
    desc: DESC_BY_COVER[cover] ?? DESC_BY_COVER['house-modern'],
    features: FEAT_BY_COVER[cover] ?? FEAT_BY_COVER['house-modern'],
  }));
}

// Append the expanded inventory after the seed tables are initialised.
LISTINGS.push(...buildListings());

const AGENTS: Record<string, string> = {
  'Dana Whitmore': 'Senior Listing Agent',
  'Marcus Reed': 'Residential Specialist',
  'Priya Anand': 'Luxury Portfolio Advisor',
  'Elena Cruz': 'Broker Associate',
};

function usd(n: number) { return `$${n.toLocaleString('en-US')}`; }
// 30-yr fixed, 20% down, ~6.75% — rough monthly P&I
function monthly(price: number) {
  const loan = price * 0.8;
  const r = 0.0675 / 12;
  const n = 360;
  const m = (loan * r) / (1 - Math.pow(1 + r, -n));
  return Math.round(m);
}

export function RealtorApp() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'sale' | 'rent'>('all');
  const [beds, setBeds] = useState(0);
  const [sort, setSort] = useState('featured');
  const [favs, setFavs] = useState<Record<string, boolean>>({});
  const [detailId, setDetailId] = useState<string | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [toast, setToast] = useState('');
  const sendEmail = useMailStore((s) => s.sendEmail);
  const openWindow = useShellStore((s) => s.openWindow);

  const results = useMemo(() => {
    let list = LISTINGS.filter((l) => (tab === 'all' ? true : l.status === tab))
      .filter((l) => (beds === 0 ? true : l.beds >= beds))
      .filter((l) => `${l.building} ${l.city} ${l.address} ${l.type}`.toLowerCase().includes(query.toLowerCase()));
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'sqft') list = [...list].sort((a, b) => b.sqft - a.sqft);
    else if (sort === 'newest') list = [...list].sort((a, b) => b.year - a.year);
    return list;
  }, [tab, beds, query, sort]);

  const detail = LISTINGS.find((l) => l.id === detailId) ?? null;
  const gallery = detail ? [detail.cover, ...INTERIORS] : [];

  const priceLabel = (l: Listing) => (l.status === 'rent' ? { big: usd(l.price), unit: '/mo' } : { big: usd(l.price), unit: '' });

  const contactAgent = (l: Listing, kind: 'tour' | 'contact') => {
    const subject = `${l.building} — ${kind === 'tour' ? 'Tour Request' : l.status === 'rent' ? 'Rental Inquiry' : 'Purchase Inquiry'}`;
    sendEmail({
      from: 'user@workspace.aos',
      to: 'leasing@homefind.com',
      subject,
      body: `<p>Hello ${l.agent}, I am interested in <strong>${l.building}</strong> at ${l.address}, ${l.city} (listed at ${usd(l.price)}${l.status === 'rent' ? '/mo' : ''}). ${kind === 'tour' ? 'I would like to schedule a tour.' : 'Please send me next steps.'}</p>`,
      date: new Date().toISOString(),
      folder: 'sent',
    });
    sendEmail({
      from: `HomeFind Realty <${l.agent.split(' ')[0].toLowerCase()}@homefind.com>`,
      to: 'user@workspace.aos',
      subject: `Re: ${subject}`,
      body: `<p>Thanks for reaching out about <strong>${l.building}</strong>! This is ${l.agent}, your ${AGENTS[l.agent]}. I'd be glad to help — I'll follow up shortly to confirm ${kind === 'tour' ? 'a tour time' : 'the details'}.</p>`,
      date: new Date().toISOString(),
      folder: 'inbox',
    });
    setToast(kind === 'tour' ? 'Tour request sent to Outlook' : 'Inquiry sent to Outlook');
    window.setTimeout(() => setToast(''), 1800);
  };

  return (
    <div className="hf" style={{ position: 'relative' }}>
      <header className="hf-top">
        <div className="hf-logo">
          <svg width="26" height="26" viewBox="0 0 26 26"><path d="M13 2L2 11h3v13h6v-7h4v7h6V11h3L13 2z" fill="#0b6efd" /></svg>
          <span>Home<b>Find</b></span>
        </div>
        <nav className="hf-nav">
          <button type="button" className={tab === 'all' ? 'on' : ''} onClick={() => { setTab('all'); setDetailId(null); }}>Discover</button>
          <button type="button" className={tab === 'sale' ? 'on' : ''} onClick={() => { setTab('sale'); setDetailId(null); }}>Buy</button>
          <button type="button" className={tab === 'rent' ? 'on' : ''} onClick={() => { setTab('rent'); setDetailId(null); }}>Rent</button>
        </nav>
        <div className="hf-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#6a7a8c"><path d="M21.4 18.6l-5.3-5.3A6.8 6.8 0 1 0 10 17a6.8 6.8 0 0 0 3.3-.9l5.3 5.3a2 2 0 0 0 2.8-2.8zM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5z" /></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="City, address, or building" />
        </div>
        <div className="hf-avatar">MP</div>
      </header>

      {!detail ? (
        <>
          <div className="hf-filters">
            {[
              { k: 'all', label: 'All' },
              { k: 'sale', label: 'For Sale' },
              { k: 'rent', label: 'For Rent' },
            ].map((f) => (
              <button key={f.k} type="button" className={`pill ${tab === f.k ? 'on' : ''}`} onClick={() => setTab(f.k as typeof tab)}>{f.label}</button>
            ))}
            <select value={beds} onChange={(e) => setBeds(Number(e.target.value))}>
              <option value={0}>Any beds</option>
              <option value={1}>1+ beds</option>
              <option value={2}>2+ beds</option>
              <option value={3}>3+ beds</option>
              <option value={4}>4+ beds</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="sqft">Largest</option>
              <option value="newest">Newest</option>
            </select>
            <span className="hf-count">{results.length} homes</span>
          </div>

          <div className="hf-body">
            <div className="hf-grid">
              {results.map((l) => {
                const pl = priceLabel(l);
                return (
                  <article key={l.id} className="hf-card" onClick={() => { setDetailId(l.id); setHeroIdx(0); }}>
                    <div className="hf-card-photo">
                      <img src={photo(l.cover)} alt={l.building} loading="lazy" />
                      <span className={`hf-tag ${l.status}`}>{l.status === 'rent' ? 'For Rent' : 'For Sale'}</span>
                      <button type="button" className={`hf-heart ${favs[l.id] ? 'fav' : ''}`} aria-label="Save" onClick={(e) => { e.stopPropagation(); setFavs((f) => ({ ...f, [l.id]: !f[l.id] })); }}>
                        {favs[l.id] ? '♥' : '♡'}
                      </button>
                    </div>
                    <div className="hf-card-body">
                      <div className="hf-price">{pl.big}<small>{pl.unit}</small></div>
                      <div className="hf-specs">
                        <span><b>{l.beds}</b> bd</span><span className="dot">•</span>
                        <span><b>{l.baths}</b> ba</span><span className="dot">•</span>
                        <span><b>{l.sqft.toLocaleString()}</b> sqft</span>
                      </div>
                      <div className="hf-addr">{l.address}, {l.city}</div>
                      <div className="hf-bldg">{l.building} · {l.type}</div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="hf-body">
          <div className="hf-detail">
            <button type="button" className="hf-back" onClick={() => setDetailId(null)}>‹ Back to results</button>
            <div className="hf-gallery">
              <img className="main" src={photo(gallery[heroIdx] ?? detail.cover)} alt="" onClick={() => setHeroIdx((i) => (i + 1) % gallery.length)} />
              {gallery.slice(0, 5).filter((_, i) => i !== heroIdx).slice(0, 4).map((g) => (
                <img key={g} src={photo(g)} alt="" onClick={() => setHeroIdx(gallery.indexOf(g))} />
              ))}
            </div>

            <div className="hf-detail-cols">
              <div className="hf-detail-main">
                <h1>{detail.status === 'rent' ? `${usd(detail.price)}/mo` : usd(detail.price)}</h1>
                <p className="hf-detail-sub">{detail.address}, {detail.city} · {detail.building}</p>
                <div className="hf-detail-specs">
                  <div className="s"><b>{detail.beds}</b><span>Beds</span></div>
                  <div className="s"><b>{detail.baths}</b><span>Baths</span></div>
                  <div className="s"><b>{detail.sqft.toLocaleString()}</b><span>Sq Ft</span></div>
                  <div className="s"><b>{detail.year}</b><span>Built</span></div>
                  <div className="s"><b>{detail.type.split(' ')[0]}</b><span>{detail.type.split(' ').slice(1).join(' ') || 'Home'}</span></div>
                </div>
                <h3>About this home</h3>
                <p>{detail.desc}</p>
                <h3>Features &amp; amenities</h3>
                <ul className="hf-features">{detail.features.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>

              <aside className="hf-side">
                <div className="big">{detail.status === 'rent' ? `${usd(detail.price)}/mo` : usd(detail.price)}</div>
                {detail.status === 'sale' ? (
                  <div className="est">Est. <b>{usd(monthly(detail.price))}/mo</b> · 30-yr fixed, 20% down</div>
                ) : (
                  <div className="est">Security deposit <b>{usd(detail.price)}</b> · 12-mo lease</div>
                )}
                <button type="button" className="hf-btn primary" onClick={() => contactAgent(detail, 'tour')}>Schedule a tour</button>
                <button type="button" className="hf-btn ghost" onClick={() => contactAgent(detail, 'contact')}>Contact agent</button>
                <button type="button" className="hf-btn ghost" onClick={() => openWindow('rentcafe')}>Apply via RentCafe</button>
                <div className="hf-agent">
                  <div className="pic">{detail.agent.split(' ').map((w) => w[0]).join('')}</div>
                  <div>
                    <div className="n">{detail.agent}</div>
                    <div className="r">{AGENTS[detail.agent]} · HomeFind Realty</div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {toast ? <div className="hf-toast">{toast}</div> : null}
    </div>
  );
}
