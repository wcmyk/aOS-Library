// Amazon catalog: 100 products across 10 departments. Product photos are
// Higgsfield-generated category images in /assets/amazon; each product tints
// the shared category shot so the grid still reads as distinct items.

const BASE_URL = import.meta.env.BASE_URL;

export type AzProduct = {
  id: string;
  title: string;
  brand: string;
  category: AzCategory;
  price: number;
  listPrice?: number;
  rating: number;
  reviews: number;
  prime: boolean;
  badge?: 'Best Seller' | "Amazon's Choice" | 'Overall Pick' | 'Limited time deal';
  bullets: string[];
  photo: string;
  hue: number;
};

export type AzCategory =
  | 'Electronics' | 'Home & Kitchen' | 'Office Products' | 'Clothing & Shoes'
  | 'Books' | 'Toys & Games' | 'Health & Personal Care' | 'Grocery'
  | 'Sports & Outdoors' | 'Smart Home';

export const AZ_CATEGORIES: AzCategory[] = [
  'Electronics', 'Home & Kitchen', 'Office Products', 'Clothing & Shoes', 'Books',
  'Toys & Games', 'Health & Personal Care', 'Grocery', 'Sports & Outdoors', 'Smart Home',
];

const CATEGORY_PHOTO: Record<AzCategory, string> = {
  'Electronics': 'electronics.webp',
  'Home & Kitchen': 'kitchen.webp',
  'Office Products': 'office.webp',
  'Clothing & Shoes': 'clothing.webp',
  'Books': 'books.webp',
  'Toys & Games': 'toys.webp',
  'Health & Personal Care': 'health.webp',
  'Grocery': 'grocery.webp',
  'Sports & Outdoors': 'sports.webp',
  'Smart Home': 'smarthome.webp',
};

type Row = [title: string, brand: string, price: number, list: number | 0, rating: number, reviews: number, bullets: string[]];

const DATA: Record<AzCategory, Row[]> = {
  'Electronics': [
    ['Wireless Noise Cancelling Over-Ear Headphones, 40H Playtime, Bluetooth 5.4', 'Soundcore', 79.99, 99.99, 4.5, 41230, ['Hybrid active noise cancelling reduces ambient sound by up to 95%', '40-hour playtime with USB-C fast charge', 'Multipoint connection pairs two devices at once']],
    ['65" 4K UHD Smart TV with HDR10+ and Voice Remote', 'Hisense', 448.0, 599.99, 4.4, 18754, ['Quantum dot color with Dolby Vision and HDR10+', 'Game Mode Plus with 120Hz VRR', 'Works with Alexa and Google Assistant']],
    ['Portable Bluetooth Speaker, IP67 Waterproof, 24-Hour Battery', 'JBL', 99.95, 129.95, 4.7, 88213, ['Bold JBL Original Pro Sound', 'IP67 waterproof and dustproof for pool and beach', 'PartyBoost pairs multiple compatible speakers']],
    ['USB-C Hub 7-in-1 Adapter with 4K HDMI, 100W PD, SD Card Reader', 'Anker', 34.99, 45.99, 4.6, 52110, ['4K@60Hz HDMI output for dual-display setups', '100W pass-through charging', 'Aluminum unibody stays cool under load']],
    ['1TB Portable SSD, USB 3.2 Gen 2, Up to 1050MB/s', 'Samsung', 89.99, 119.99, 4.8, 63407, ['Transfers a 10GB file in under 10 seconds', 'Shock resistant to 6-foot drops', 'AES 256-bit hardware encryption']],
    ['Wireless Earbuds with Charging Case, Bluetooth 5.3, IPX5', 'TOZO', 25.49, 39.99, 4.4, 312540, ['OrigX acoustic tuning for clear vocals', '8mm dynamic drivers with deep bass', '32-hour total battery with case']],
    ['27" QHD 165Hz IPS Gaming Monitor, 1ms, FreeSync Premium', 'LG', 226.99, 299.99, 4.7, 21873, ['2560x1440 IPS panel with 99% sRGB', '165Hz refresh with 1ms response', 'Three-side virtually borderless design']],
    ['Streaming Media Player 4K with Voice Remote Pro', 'Roku', 39.99, 49.99, 4.6, 97240, ['4K HDR streaming with Dolby Vision', 'Lost remote finder and hands-free voice', 'Private listening through mobile app']],
    ['Digital Camera 4K 48MP Vlogging Kit with Flip Screen and Wide Lens', 'Canon', 379.0, 429.0, 4.5, 8341, ['48MP stills and 4K/30 video', '180-degree flip touchscreen for creators', 'Includes wind muff, 64GB card, and case']],
    ['10.9" Tablet, 64GB, Liquid Retina Display, All-Day Battery', 'Apple', 329.0, 349.0, 4.8, 44120, ['A14 Bionic chip for smooth multitasking', '12MP Ultra Wide front camera with Center Stage', 'Touch ID and all-day battery life']],
  ],
  'Home & Kitchen': [
    ['7-in-1 Electric Pressure Cooker, 6 Quart, Stainless Steel', 'Instant Pot', 89.95, 119.95, 4.7, 154320, ['Pressure cook, slow cook, rice, steam, sauté, yogurt, warm', 'Cooks up to 70% faster than conventional methods', '10+ safety features including overheat protection']],
    ['Air Fryer 5.8QT with Nonstick Basket and 11 Presets', 'COSORI', 99.99, 129.99, 4.6, 128740, ['85% less oil than traditional deep frying', '11 one-touch cooking functions', 'Dishwasher-safe square basket fits a 5lb chicken']],
    ['Espresso Machine 20 Bar with Milk Frother Steam Wand', 'De\'Longhi', 189.95, 249.95, 4.4, 31207, ['20-bar Italian pump for rich crema', 'Manual milk frother for cappuccino and latte art', 'Compact 6-inch-wide stainless footprint']],
    ['Robot Vacuum and Mop Combo, LiDAR Navigation, App Control', 'roborock', 259.99, 359.99, 4.5, 27418, ['LiDAR mapping with no-go zones in app', '3000Pa suction with carpet boost', 'Vacuums and mops in a single pass']],
    ['Knife Set 15-Piece with Block, German Stainless Steel', 'HENCKELS', 129.95, 189.99, 4.8, 39840, ['Precision-stamped fine-edge blades', 'Ergonomic triple-rivet handles', 'Includes shears, sharpening steel, and hardwood block']],
    ['Cotton Sheet Set Queen, 400 Thread Count, Deep Pocket', 'Mellanni', 44.97, 59.97, 4.5, 217530, ['Breathable long-staple cotton sateen', 'Fits mattresses up to 16 inches deep', 'Fade and wrinkle resistant through hundreds of washes']],
    ['Cast Iron Dutch Oven 6QT, Enameled, Oven Safe to 500F', 'Lodge', 79.9, 99.9, 4.7, 48122, ['Even heat distribution for braises and breads', 'Chip-resistant porcelain enamel finish', 'Self-basting lid rings return moisture to food']],
    ['Stand Mixer 5.5 Quart, 10 Speeds, Tilt-Head with Bowl', 'KitchenAid', 349.99, 449.99, 4.8, 25709, ['59-point planetary mixing action', 'Includes flat beater, dough hook, and whisk', 'Power hub fits 10+ optional attachments']],
    ['Bath Towel Set of 6, 100% Turkish Cotton, Hotel Quality', 'Hammam Linen', 39.99, 54.99, 4.6, 88214, ['600 GSM plush loops stay soft after washing', 'OEKO-TEX certified low-impact dyes', 'Two bath, two hand, two washcloths']],
    ['Blackout Curtains 2 Panels, Thermal Insulated, 84" Length', 'NICETOWN', 25.59, 33.99, 4.6, 194327, ['Blocks 85-99% of sunlight and UV rays', 'Insulates against summer heat and winter chill', 'Machine washable triple-weave fabric']],
  ],
  'Office Products': [
    ['Ergonomic Office Chair with Lumbar Support and Flip-Up Arms', 'Hbada', 159.99, 219.99, 4.4, 21873, ['Breathable mesh back with adaptive lumbar', '90-120 degree tilt lock with tension control', 'Flip-up arms tuck the chair under any desk']],
    ['Electric Standing Desk 55x28", Dual Motor, Memory Presets', 'FLEXISPOT', 249.99, 329.99, 4.7, 33108, ['Dual-motor lift raises 27.9" to 47.6" in seconds', 'Four programmable height presets', 'Solid one-piece desktop with cable tray']],
    ['Laser Printer All-in-One Wireless Monochrome with Duplex', 'Brother', 199.99, 249.99, 4.6, 45230, ['Prints up to 32 pages per minute', 'Auto two-sided printing saves paper', '250-sheet tray with mobile printing support']],
    ['Dry Erase Whiteboard 48x36" Magnetic with Aluminum Frame', 'VIZ-PRO', 42.99, 59.99, 4.5, 17240, ['Smooth low-ghosting writing surface', 'Includes marker tray, magnets, and mounting kit', 'Hangs vertically or horizontally']],
    ['Mechanical Keyboard, Hot-Swappable, RGB, Wireless Tri-Mode', 'Keychron', 94.99, 109.99, 4.6, 12873, ['2.4GHz, Bluetooth 5.1, and wired modes', 'Hot-swappable switches without soldering', 'Double-shot PBT keycaps with south-facing RGB']],
    ['Desk Organizer with Drawer, Bamboo 5-Compartment', 'MaxGear', 23.99, 32.99, 4.7, 9214, ['Natural bamboo with smooth finish', 'Sliding drawer for pens and sticky notes', 'Slots sized for files, tablets, and mail']],
    ['Noise Cancelling Wireless Headset with Mic for Calls, Teams Certified', 'Jabra', 179.0, 229.0, 4.4, 7412, ['Certified for Microsoft Teams and Zoom', '37-hour battery with fast charge', 'Boom arm mutes when raised']],
    ['Paper Shredder 12-Sheet Cross-Cut with Pullout Bin', 'Amazon Basics', 64.99, 79.99, 4.5, 68120, ['Shreds credit cards, staples, and paper clips', '5.5-gallon pullout bin', 'Auto start and overheat protection']],
    ['Webcam 1080p 60fps with Ring Light and Privacy Cover', 'Logitech', 99.99, 129.99, 4.5, 23411, ['Full HD 60fps with auto light correction', 'Built-in adjustable ring light', 'Show Mode tilts to present sketches on your desk']],
    ['Planner 2026 Weekly and Monthly, Hardcover with Tabs', 'Legend Planner', 24.99, 34.99, 4.7, 15320, ['Goal-setting framework with habit trackers', 'Lay-flat binding with two ribbon bookmarks', 'Pocket folder, stickers, and pen loop included']],
  ],
  'Clothing & Shoes': [
    ['Men\'s Running Shoes Lightweight Breathable Sneakers', 'adidas', 64.99, 85.0, 4.5, 44120, ['Cloudfoam midsole for stepped-in comfort', 'Breathable mesh upper', 'Durable rubber outsole for road miles']],
    ['Women\'s High-Waisted Leggings with Pockets, 4-Way Stretch', 'CRZ YOGA', 26.0, 32.0, 4.6, 128730, ['Buttery-soft brushed fabric', 'Two deep side pockets fit a phone', 'Squat-proof and quick drying']],
    ['Men\'s Slim-Fit Stretch Chino Pants', 'Amazon Essentials', 24.9, 29.9, 4.4, 74210, ['2% elastane stretch twill', 'Sits at the waist with a slim leg', 'Machine wash and wear']],
    ['Women\'s Waterproof Rain Jacket with Hood, Packable', 'Columbia', 59.99, 90.0, 4.6, 33208, ['Omni-Tech waterproof breathable shell', 'Packs into its own hand pocket', 'Adjustable storm hood and drawcord hem']],
    ['Unisex Classic Low-Top Canvas Sneakers', 'Converse', 55.0, 65.0, 4.8, 91240, ['Iconic canvas upper with vulcanized sole', 'OrthoLite cushioned insole', 'Medial eyelets for airflow']],
    ['Men\'s Crewneck Cotton T-Shirt 6-Pack', 'Hanes', 25.99, 34.99, 4.4, 158730, ['Ring-spun cotton with lay-flat collar', 'Tear-away tag for comfort', 'Preshrunk to keep fit after washing']],
    ['Women\'s Trail Running Shoes with Rock Plate', 'Salomon', 119.95, 140.0, 4.7, 12140, ['Contagrip outsole bites into loose terrain', 'Quicklace single-pull system', 'Protective toe cap and rock plate']],
    ['Merino Wool Hiking Socks 3-Pack, Cushioned', 'Darn Tough', 47.97, 56.97, 4.9, 28417, ['Guaranteed for life by the manufacturer', 'Temperature-regulating merino blend', 'Seamless toe eliminates blisters']],
    ['Men\'s Puffer Jacket Water-Resistant Insulated', 'The North Face', 149.0, 180.0, 4.7, 19230, ['700-fill recycled down insulation', 'DWR finish sheds light rain', 'Stows into its own pocket for travel']],
    ['Women\'s Wide-Leg Linen Blend Pants, Elastic Waist', 'ANRABESS', 33.99, 45.99, 4.3, 21750, ['Airy linen-rayon blend for hot days', 'Elastic back waist with side pockets', 'Flowy wide leg with clean drape']],
  ],
  'Books': [
    ['The Quiet Ledger: A Novel', 'Penguin Press', 16.79, 28.0, 4.6, 21873, ['A sweeping literary mystery across three generations', 'A Read with Jenna book club pick', 'Hardcover, 384 pages']],
    ['Deep Focus: Winning Back Attention in a Distracted Age', 'Portfolio', 18.29, 30.0, 4.7, 33120, ['Practical systems for reclaiming deep work', 'From the bestselling productivity author', 'Includes 90-day focus protocol']],
    ['The Last Cartographer', 'Tor Books', 14.99, 27.99, 4.8, 48123, ['Epic fantasy debut of the year', 'First in a planned trilogy', 'Maps, magic, and a heist across a dying empire']],
    ['Money In Motion: Personal Finance for Your First Decade of Work', 'Simon & Schuster', 15.49, 26.99, 4.6, 17412, ['401(k)s, RSUs, and debt payoff without jargon', 'Worksheets for your first salary negotiation', 'Updated for the current tax year']],
    ['Grandma Vera\'s Sunday Kitchen: 120 Heritage Recipes', 'Clarkson Potter', 21.49, 35.0, 4.8, 9314, ['Braises, breads, and holiday classics', 'Step photography for every technique', 'James Beard Award nominee']],
    ['Atlas of Night Skies: A Visual Tour of the Universe', 'DK', 27.99, 40.0, 4.9, 12408, ['300+ star maps and space photography', 'Month-by-month observing guides', 'Foreword by a NASA astronomer']],
    ['The Interview Loop: Cracking Behavioral and Case Questions', 'Wiley', 19.99, 32.0, 4.5, 8217, ['STAR frameworks with 60 worked answers', 'Case math drills for consulting rounds', 'Hiring-manager commentary on real transcripts']],
    ['Small Habits, Wide Rivers: Essays on Change', 'FSG', 13.99, 25.0, 4.4, 6120, ['Twenty essays on becoming someone new', 'A New York Times Notable selection', 'Paperback original']],
    ['Concrete Gardens: Urban Growing in Small Spaces', 'Chronicle Books', 17.79, 29.95, 4.7, 5314, ['Balcony, windowsill, and rooftop plans', 'Season-by-season planting calendars', 'Troubleshooting guide for low light']],
    ['The Silicon Shore: How a Generation Rebuilt Work', 'Crown', 20.29, 32.5, 4.5, 11208, ['Reported history of the remote-work decade', 'Based on 400 interviews', 'A Financial Times book of the month']],
  ],
  'Toys & Games': [
    ['Building Blocks Creative Set, 1500 Pieces with Storage Box', 'LEGO', 49.99, 59.99, 4.8, 38120, ['Classic bricks in 35 colors', 'Ideas booklet with 12 builds', 'Compatible with all major brick systems']],
    ['Strategy Board Game of Trade and Settlement, 3-4 Players', 'CATAN', 44.0, 55.0, 4.9, 92410, ['The modern classic of resource trading', '60-90 minute games for ages 10+', 'Endlessly variable modular board']],
    ['RC Off-Road Monster Truck 1:16 Scale, 4WD, 2 Batteries', 'DEERC', 59.99, 79.99, 4.5, 21730, ['40 min combined runtime with two packs', 'All-terrain tires and metal drive shafts', '2.4GHz control up to 200 feet']],
    ['1000-Piece Jigsaw Puzzle, National Park Vista', 'Ravensburger', 19.99, 24.99, 4.8, 15230, ['Softclick precision-fit pieces', 'Anti-glare premium board', 'Poster included for reference']],
    ['Kids Art Easel Double-Sided with Chalkboard and Whiteboard', 'Melissa & Doug', 54.99, 69.99, 4.7, 27418, ['Adjustable height wooden frame', 'Paper roll, clips, and paint cups included', 'Folds flat for storage']],
    ['Trading Card Game Booster Bundle, 6 Packs', 'Pokemon', 26.94, 32.94, 4.7, 68210, ['Six sealed booster packs', 'Chance at full-art and ex cards', 'Official product, factory sealed']],
    ['STEM Robot Building Kit, App-Controlled, 400+ Pieces', 'Sillbird', 39.99, 54.99, 4.6, 13470, ['Five buildable robot forms', 'Program routes and actions in the app', 'Rechargeable battery pack included']],
    ['Party Card Game for Adults and Teens, 6+ Players', 'What Do You Meme', 29.99, 34.99, 4.6, 84120, ['435 cards for game night chaos', 'Ages 17+ with family edition available', 'Travel-size box']],
    ['Wooden Train Set 120 Pieces with Table Mat', 'Hape', 74.99, 99.99, 4.7, 8412, ['FSC-certified beechwood tracks', 'Compatible with major wooden railway brands', 'Bridges, crossings, and a mountain tunnel']],
    ['Plush Teddy Bear 18", Ultra Soft', 'GUND', 24.99, 32.0, 4.8, 19240, ['Huggable premium plush', 'Surface-washable materials', 'Ages 1 and up']],
  ],
  'Health & Personal Care': [
    ['Electric Toothbrush with Pressure Sensor, 4 Modes, 2 Heads', 'Oral-B', 79.97, 99.99, 4.6, 87120, ['Round brush head removes more plaque', 'Visible pressure sensor protects gums', 'Two-minute timer with 30-second pacer']],
    ['Vitamin D3 5000 IU Softgels, 360 Count', 'NatureWise', 13.99, 19.99, 4.7, 118240, ['Year supply of high-potency D3', 'In cold-pressed olive oil for absorption', 'Third-party tested, non-GMO']],
    ['Digital Body Weight Scale with Smart App Sync', 'RENPHO', 24.99, 34.99, 4.7, 297410, ['13 body metrics including BMI', 'Syncs with fitness apps over Bluetooth', 'High-precision sensors to 0.2 lb']],
    ['Massage Gun Deep Tissue with 10 Heads, Quiet Brushless Motor', 'TOLOCO', 45.99, 69.99, 4.6, 74210, ['12mm amplitude percussion', '20 adjustable speed levels', 'Carrying case with 10 attachments']],
    ['Sunscreen SPF 50 Mineral Face Lotion, Zinc Oxide', 'EltaMD', 41.0, 45.0, 4.7, 38470, ['Oil-free, fragrance-free formula', 'Transparent zinc for sensitive skin', 'Dermatologist recommended']],
    ['Hair Dryer Brush One-Step Volumizer and Styler', 'REVLON', 41.99, 59.99, 4.5, 384120, ['Dries and volumizes in one pass', 'Ceramic coating reduces heat damage', 'Three heat and speed settings']],
    ['First Aid Kit 299 Pieces for Home, Car, and Travel', 'Johnson & Johnson', 27.97, 34.99, 4.8, 41230, ['Organized fold-out compartments', 'Includes bandages, wraps, and cold pack', 'Meets OSHA workplace guidelines']],
    ['Melatonin 5mg Gummies, Sleep Support, 120 Count', 'Natrol', 11.49, 15.99, 4.6, 98120, ['Strawberry flavor, vegetarian', 'Drug-free occasional sleep support', '99% sugar free formula']],
    ['Water Flosser Cordless Portable with 4 Tips, IPX7', 'Waterpik', 59.99, 79.99, 4.4, 52340, ['ADA accepted for plaque removal', '10 pressure settings with 45-second capacity', 'Travel bag and global voltage']],
    ['Whey Protein Powder 5lb, Chocolate, 24g Protein', 'Optimum Nutrition', 62.99, 74.99, 4.7, 218730, ['24g protein with 5.5g BCAAs per scoop', 'Banned-substance tested', 'Mixes instantly with a spoon']],
  ],
  'Grocery': [
    ['Organic Whole Bean Coffee, Medium Roast, 2lb', 'Lavazza', 18.99, 24.99, 4.6, 88120, ['100% Arabica from sustainable farms', 'Notes of chocolate and dried fruit', 'Roasted and shipped fresh']],
    ['Extra Virgin Olive Oil, Cold Pressed, 1L', 'California Olive Ranch', 17.49, 21.99, 4.8, 44210, ['Certified extra virgin, first cold press', 'Grassy finish with peppery bite', 'Harvest date printed on bottle']],
    ['Mixed Nuts 40oz, Roasted and Lightly Salted', 'Kirkland Signature', 19.87, 24.99, 4.7, 61230, ['Cashews, almonds, pecans, and macadamias', 'Resealable jar for freshness', 'No peanuts or filler']],
    ['Sparkling Water Variety Pack, 24 Cans', 'LaCroix', 12.98, 15.98, 4.6, 39240, ['Three flavors, zero calories and sweeteners', 'Naturally essenced', 'Recyclable slim cans']],
    ['Organic Honey Raw Unfiltered, 32oz', 'Nature Nate\'s', 14.98, 18.98, 4.8, 71240, ['Raw and unfiltered, never heated high', 'Tested free of additives', 'From US and Canadian hives']],
    ['Protein Bars Variety Pack, 20 Grams, 12 Count', 'Quest', 24.99, 29.99, 4.5, 128410, ['Three best-selling flavors', '1g sugar and 13-15g fiber per bar', 'Gluten free']],
    ['Basmati Rice Aged Extra Long Grain, 10lb Bag', 'Royal', 16.49, 19.99, 4.8, 52140, ['Aged 12 months for aroma', 'Grown in Himalayan foothills', 'Naturally gluten free']],
    ['Dark Chocolate Bars 72% Cacao, 6-Pack', 'Ghirardelli', 17.94, 21.94, 4.7, 28470, ['Intense dark with smooth melt', 'Rainforest Alliance certified cocoa', 'Six 3.17oz bars']],
    ['Cold Brew Coffee Concentrate, 32oz', 'Stok', 9.98, 12.49, 4.6, 33210, ['Steeped low and slow for 10 hours', 'Makes 8 servings, keeps 2 weeks', 'Not too bitter, never watery']],
    ['Organic Peanut Butter Creamy No Sugar Added, 2-Pack', 'Santa Cruz', 13.49, 16.99, 4.7, 24410, ['Just organic roasted peanuts and salt', 'No palm oil or added sugar', 'Stir once, refrigerate for spreadable texture']],
  ],
  'Sports & Outdoors': [
    ['Adjustable Dumbbells Pair 5-52.5lb, Quick-Select Dial', 'Bowflex', 429.0, 549.0, 4.8, 44120, ['Replaces 15 sets of weights', 'Dial from 5 to 52.5 pounds in seconds', 'Durable molded plates with metal handle']],
    ['Yoga Mat 6mm Non-Slip with Carrying Strap', 'Gaiam', 21.98, 29.98, 4.6, 118230, ['Sticky non-slip texture both sides', 'Latex-free PVC, 68" length', 'Free yoga class included via app']],
    ['Camping Tent 4-Person with Rainfly, 10-Minute Setup', 'Coleman', 89.99, 119.99, 4.5, 33470, ['WeatherTec welded floors and inverted seams', 'Fits one queen airbed', 'Carry bag with color-coded poles']],
    ['Insulated Stainless Water Bottle 32oz with Straw Lid', 'Hydro Flask', 39.95, 44.95, 4.8, 92140, ['Cold 24 hours, hot 12 hours', 'TempShield double-wall vacuum', 'Dishwasher-safe with lifetime warranty']],
    ['Resistance Bands Set of 5 with Handles and Door Anchor', 'Fit Simplify', 24.97, 34.97, 4.6, 187410, ['10 to 50 lb stackable resistance', 'Ankle straps and carry bag included', 'Illustrated workout guide']],
    ['Pickleball Paddle Set of 2 with 4 Balls and Bag', 'JOOLA', 59.95, 79.95, 4.7, 21840, ['Fiberglass face with honeycomb core', 'USAPA approved for tournament play', 'Two indoor and two outdoor balls']],
    ['Hiking Backpack 40L with Rain Cover, Hydration Ready', 'Osprey', 139.95, 165.0, 4.8, 15230, ['Ventilated trampoline back panel', 'Integrated rain cover in base pocket', 'Trekking pole attachment points']],
    ['Foam Roller High-Density 18" for Muscle Recovery', 'TriggerPoint', 34.99, 44.99, 4.7, 68210, ['Multi-density GRID surface', 'Supports up to 500 pounds', 'Free online instructional videos']],
    ['Bike Helmet Adult with MIPS and Rear Light', 'Giro', 74.95, 94.95, 4.7, 12470, ['MIPS rotational impact protection', 'Integrated USB-rechargeable rear light', 'Roc Loc fit dial with 22 vents']],
    ['Trekking Poles Carbon Fiber Pair, Quick Locks', 'TrailBuddy', 49.99, 64.99, 4.8, 41230, ['7.6oz per pole carbon construction', 'Lever locks adjust 24.5" to 54"', 'Cork grips with tungsten tips']],
  ],
  'Smart Home': [
    ['Smart Speaker with Voice Assistant, Charcoal', 'Amazon', 49.99, 59.99, 4.7, 412300, ['Rich sound with Dolby processing', 'Control music and smart home by voice', 'Built-in hub for compatible devices']],
    ['Video Doorbell Wired with Head-to-Toe HD View', 'Ring', 59.99, 99.99, 4.5, 184200, ['1536p head-to-toe video', 'Two-way talk with noise cancellation', 'Advanced motion zones and alerts']],
    ['Smart Thermostat with Room Sensor, Energy Star', 'ecobee', 219.99, 249.99, 4.6, 33140, ['Saves up to 26% on heating and cooling', 'Included sensor fixes hot and cold rooms', 'Works with all major voice platforms']],
    ['Smart Plug 4-Pack, WiFi Outlets Work with Voice', 'Kasa', 26.99, 34.99, 4.7, 218400, ['Schedule lamps and small appliances', 'Away mode simulates occupancy', 'No hub required, 2.4GHz WiFi']],
    ['Indoor Security Camera 2K Pan and Tilt, Person Detection', 'eufy', 42.99, 54.99, 4.6, 47120, ['360-degree pan with motion tracking', 'On-device AI person and pet detection', 'Local storage, no monthly fees']],
    ['Smart Light Bulbs Color 4-Pack, A19, Music Sync', 'Govee', 33.99, 42.99, 4.5, 88140, ['16 million colors with scenes', 'Sync lights to music with built-in mic', 'Group control in app or by voice']],
    ['Robot Mop for Hard Floors, Cube-Shaped, App Control', 'iRobot', 199.99, 274.99, 4.4, 21470, ['Precision jet spray tackles kitchen grease', 'Learns and maps your home', 'Pads for wet mopping and dry sweeping']],
    ['Smart Lock Keyless Entry with Fingerprint and Keypad', 'ULTRALOQ', 129.99, 179.99, 4.5, 33210, ['0.3-second fingerprint unlock', 'Auto-lock and auto-unlock as you arrive', 'Anti-peep keypad with dynamic codes']],
    ['Mesh WiFi 6 System 3-Pack, Covers 6000 Sq Ft', 'TP-Link', 189.99, 249.99, 4.6, 41870, ['Gigabit speeds through walls and floors', 'One seamless network name', 'Setup in minutes with app walkthrough']],
    ['Smart Garage Door Opener Remote, WiFi', 'Chamberlain myQ', 26.98, 39.98, 4.5, 98120, ['Open and close from anywhere', 'Real-time alerts when the door moves', 'Guest access with scheduled keys']],
  ],
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

const BADGES: Array<AzProduct['badge']> = ['Best Seller', "Amazon's Choice", 'Overall Pick', 'Limited time deal'];

export const AZ_PRODUCTS: AzProduct[] = AZ_CATEGORIES.flatMap((cat) =>
  DATA[cat].map((row, i) => {
    const [title, brand, price, list, rating, reviews, bullets] = row;
    const h = hashStr(cat + title);
    return {
      id: `az-${cat.slice(0, 3).toLowerCase()}-${i}`,
      title, brand,
      category: cat,
      price,
      listPrice: list || undefined,
      rating, reviews,
      prime: h % 5 !== 0,
      badge: h % 4 === 0 ? BADGES[h % BADGES.length] : undefined,
      bullets,
      photo: `${BASE_URL}assets/amazon/${CATEGORY_PHOTO[cat]}`,
      hue: (h % 36) * 10,
    };
  }),
);

export function azSearch(query: string, category: AzCategory | 'All'): AzProduct[] {
  const q = query.trim().toLowerCase();
  return AZ_PRODUCTS.filter((p) => {
    if (category !== 'All' && p.category !== category) return false;
    if (!q) return true;
    return (p.title + ' ' + p.brand + ' ' + p.category).toLowerCase().includes(q);
  });
}
