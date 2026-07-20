import { useMemo, useState } from 'react';
import './amazon.css';
import { useWalletStore, nextOrderId, type WalletOrder } from '../../../state/useWalletStore';
import { AZ_PRODUCTS } from '../../../data/amazonCatalog';

const BASE_URL = import.meta.env.BASE_URL;
const img = (id: string) => id.includes('.') ? `${BASE_URL}assets/amazon/${id}` : `${BASE_URL}assets/amazon/${id}.jpg`;

/** Payment methods mirror the Chase accounts in the banking app. */
const CARDS: { id: string; kind: 'checking' | 'credit'; name: string; short: string; last4: string; network: string; grad: string }[] = [
  { id: 'chk', kind: 'checking', name: 'Chase Total Checking (Debit)', short: 'TOTAL CHECKING', last4: '1666', network: 'VISA DEBIT', grad: 'linear-gradient(135deg,#1657a8,#2f7bd6)' },
  { id: 'cc-freedom', kind: 'credit', name: 'Chase Freedom Unlimited', short: 'FREEDOM', last4: '6399', network: 'VISA', grad: 'linear-gradient(135deg,#2f7bd6,#59a5ec)' },
  { id: 'cc-sapphire', kind: 'credit', name: 'Chase Sapphire Reserve', short: 'SAPPHIRE RESERVE', last4: '0077', network: 'VISA', grad: 'linear-gradient(135deg,#0a1c3a,#173d78)' },
];

function MiniCard({ grad, short, last4 }: { grad: string; short: string; last4: string }) {
  return (
    <span className="az-minicard" style={{ background: grad }} aria-hidden="true">
      <span className="az-minicard-brand">CHASE</span>
      <span className="az-minicard-chip" />
      <span className="az-minicard-name">{short}</span>
      <span className="az-minicard-num">•••• {last4}</span>
    </span>
  );
}
const TAX_RATE = 0.08875; // NYC combined sales tax

/* ─── Product catalog ────────────────────────────────────────────────────────── */

type Dept = 'electronics' | 'components' | 'grocery' | 'chemicals' | 'home-kitchen' | 'office' | 'clothing' | 'books' | 'toys' | 'health' | 'sports' | 'smarthome';
type Badge = { kind: 'overall' | 'choice' | 'best' | 'deal'; text: string };

type Product = {
  id: string;
  title: string;
  dept?: Dept; // defaults to 'grocery'
  condition?: string; // e.g. 'Renewed', 'Used - Like New'
  imageId?: string; // overrides the default image (id) — used by shared chemical container photos
  price: number;
  listPrice?: number;
  unit?: string;
  rating: number;
  reviews: number;
  bought?: string;
  badge?: Badge;
  sponsored?: boolean;
  coupon?: number;
  prime?: boolean;
  delivery: string;
  fastest?: string;
};

/* ── Industrial & Scientific: 30 lab / household / industrial chemicals ── */
// [title, container image, price, rating, reviews]
const CHEM: [string, string, number, number, number][] = [
  ['Sodium Chloride (Fine Lab-Grade Salt), 2.5 kg', 'powder-jar', 14.99, 4.8, 4120],
  ['Sodium Bicarbonate (Pure Baking Soda), 5 lb', 'powder-jar', 12.49, 4.9, 9870],
  ['Citric Acid (Anhydrous, Food Grade), 2 lb', 'powder-jar', 13.99, 4.8, 15230],
  ['Isopropyl Alcohol 99% (Technical Grade), 1 Gallon', 'jug', 24.99, 4.8, 22100],
  ['Acetone (ACS Reagent Grade), 1 Gallon', 'jug', 29.99, 4.7, 6410],
  ['Hydrogen Peroxide 3% (Stabilized), 500 mL', 'clear-bottle', 8.49, 4.7, 5340],
  ['Distilled Water (Lab Purified), 1 Gallon', 'jug', 6.99, 4.9, 31200],
  ['Denatured Ethanol (95% Lab Solvent), 1 Gallon', 'jug', 27.5, 4.6, 4180],
  ['Vegetable Glycerin (USP Kosher), 32 oz', 'clear-bottle', 15.99, 4.8, 18900],
  ['White Distilled Vinegar (Acetic Acid 5%), 1 Gal', 'jug', 7.49, 4.8, 12040],
  ['Epsom Salt (Magnesium Sulfate USP), 5 lb', 'crystal-bag', 11.99, 4.9, 27600],
  ['Borax (Sodium Tetraborate), 4 lb', 'powder-jar', 13.49, 4.8, 16720],
  ['Copper(II) Sulfate Pentahydrate, 2 lb', 'crystal-bag', 21.99, 4.7, 3980],
  ['Potassium Nitrate (Saltpeter, 99%), 2 lb', 'crystal-bag', 18.99, 4.6, 5210],
  ['Calcium Chloride (Anhydrous Pellets), 5 lb', 'powder-jar', 16.99, 4.7, 6870],
  ['Sodium Hydroxide (Lye, Food Grade), 2 lb', 'powder-jar', 15.49, 4.8, 9240],
  ['Ammonium Hydroxide Solution (10%), 500 mL', 'amber-bottle', 12.99, 4.5, 2110],
  ['Muriatic Acid (Hydrochloric Acid 31.45%), 1 Gal', 'amber-bottle', 19.99, 4.6, 4530],
  ['Activated Charcoal Powder (Ultra Fine), 1 lb', 'powder-jar', 17.99, 4.8, 20130],
  ['Ascorbic Acid (Vitamin C, Pharma Grade), 2 lb', 'powder-jar', 22.99, 4.9, 13420],
  ['Potassium Chloride (Fine Powder, 99%), 2 lb', 'powder-jar', 15.99, 4.7, 4890],
  ['Zinc Oxide Powder (USP, Non-Nano), 1 lb', 'vial-box', 13.99, 4.7, 6210],
  ['Titanium Dioxide (Cosmetic Grade), 1 lb', 'vial-box', 16.49, 4.6, 3320],
  ['Sodium Thiosulfate Pentahydrate, 2 lb', 'crystal-bag', 18.49, 4.6, 2740],
  ['Silver Nitrate (ACS Reagent, 25 g)', 'amber-bottle', 39.99, 4.7, 1180],
  ['Iron(III) Oxide (Red Rouge Powder), 1 lb', 'vial-box', 12.99, 4.6, 4410],
  ['Methylene Blue Solution (1%, Lab Stain), 100 mL', 'amber-bottle', 14.99, 4.7, 2560],
  ['Calcium Carbonate (Precipitated, 99%), 5 lb', 'powder-jar', 14.49, 4.8, 7130],
  ['Propylene Glycol (USP/Food Grade), 1 Gallon', 'jug', 23.99, 4.8, 15980],
  ['70% Isopropyl Alcohol Surface Spray, 32 oz', 'spray-bottle', 9.99, 4.7, 33410],
];
const CHEM_BADGES: Record<number, Badge> = {
  0: { kind: 'best', text: '#1 Best Seller' },
  10: { kind: 'choice', text: "Amazon's Choice" },
  18: { kind: 'overall', text: 'Overall Pick' },
  29: { kind: 'choice', text: "Amazon's Choice" },
};
const CHEM_PRODUCTS: Product[] = CHEM.map(([title, container, price, rating, reviews], i) => ({
  id: `chem-${i}`,
  dept: 'chemicals' as const,
  imageId: `chem-${container}`,
  title,
  price,
  rating,
  reviews,
  badge: CHEM_BADGES[i],
  bought: reviews > 15000 ? '2K+ bought in past month' : undefined,
  prime: true,
  delivery: i % 3 === 0 ? 'Tomorrow, Jul 20' : 'Mon, Jul 22',
}));

const PRODUCTS: Product[] = [
  ...CHEM_PRODUCTS,
  /* ── Electronics ── */
  {
    id: 'macbook', dept: 'electronics',
    title: 'Apple MacBook Pro 14" Laptop — M4 chip, 16GB RAM, 512GB SSD, Space Black',
    price: 1599, listPrice: 1799, rating: 4.8, reviews: 12840, bought: '2K+ bought in past month',
    badge: { kind: 'best', text: '#1 Best Seller' }, coupon: 5, prime: true, delivery: 'Tomorrow, Jul 20', fastest: 'Today 7 PM',
  },
  {
    id: 'samsung-phone', dept: 'electronics',
    title: 'Samsung Galaxy S25 Ultra 5G Smartphone, 256GB, Titanium Gray (Unlocked)',
    price: 1099.99, listPrice: 1299.99, rating: 4.7, reviews: 20310, bought: '3K+ bought in past month',
    badge: { kind: 'choice', text: "Amazon's Choice" }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'pixel-phone', dept: 'electronics',
    title: 'Google Pixel 9 Pro 5G Smartphone, 128GB, Hazel (Unlocked)',
    price: 899, listPrice: 999, rating: 4.7, reviews: 15600, bought: '2K+ bought in past month',
    badge: { kind: 'overall', text: 'Overall Pick' }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'samsung-tab', dept: 'electronics',
    title: 'Samsung Galaxy Tab S10 11" Tablet, 128GB, WiFi, with S Pen',
    price: 649.99, rating: 4.6, reviews: 8420, sponsored: true, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'samsung-watch', dept: 'electronics',
    title: 'Samsung Galaxy Watch7 Smartwatch, 44mm, Bluetooth, Health Tracking',
    price: 279.99, listPrice: 329.99, rating: 4.5, reviews: 6110, coupon: 10, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'pixel-buds', dept: 'electronics',
    title: 'Google Pixel Buds Pro 2 Wireless Earbuds with Active Noise Cancellation',
    price: 199.99, listPrice: 229.99, rating: 4.6, reviews: 9280, prime: true, delivery: 'Tomorrow, Jul 20', fastest: 'Today 7 PM',
  },
  {
    id: 'console', dept: 'electronics',
    title: 'Next-Gen 4K Gaming Console, 1TB SSD, with Wireless Controller',
    price: 499, rating: 4.8, reviews: 42800, bought: '5K+ bought in past month',
    badge: { kind: 'best', text: '#1 Best Seller' }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'headphones', dept: 'electronics',
    title: 'Wireless Noise-Cancelling Over-Ear Headphones, 40-Hour Battery',
    price: 249, listPrice: 349, rating: 4.7, reviews: 61300, bought: '8K+ bought in past month',
    badge: { kind: 'choice', text: "Amazon's Choice" }, coupon: 15, prime: true, delivery: 'Tomorrow, Jul 20', fastest: 'Today 7 PM',
  },
  {
    id: 'vr-headset', dept: 'electronics',
    title: 'All-in-One VR Headset, 256GB, with Two Motion Controllers',
    price: 499, rating: 4.7, reviews: 21400, badge: { kind: 'overall', text: 'Overall Pick' }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'drone', dept: 'electronics',
    title: '4K Foldable Camera Drone with 3-Axis Gimbal, 46-Min Flight Time',
    price: 799, listPrice: 999, rating: 4.6, reviews: 9260, badge: { kind: 'deal', text: 'Limited time deal' }, coupon: 10, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'action-cam', dept: 'electronics',
    title: '5K Waterproof Action Camera with HyperSteady Stabilization',
    price: 299, rating: 4.5, reviews: 12470, sponsored: true, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'speaker', dept: 'electronics',
    title: 'Portable Waterproof Bluetooth Speaker, 24-Hour Playtime',
    price: 89, rating: 4.6, reviews: 33200, bought: '4K+ bought in past month', prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'ereader', dept: 'electronics',
    title: '6" Glare-Free E-Reader, 16GB, Waterproof, Adjustable Warm Light',
    price: 139, rating: 4.7, reviews: 28900, badge: { kind: 'choice', text: "Amazon's Choice" }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'laptop-refurb', dept: 'electronics', condition: 'Renewed (Refurbished)',
    title: 'Renewed Ultrabook Laptop 14", 16GB RAM, 512GB SSD, Silver',
    price: 749, listPrice: 1099, rating: 4.5, reviews: 8210, bought: '1K+ bought in past month',
    coupon: 8, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'phone-renewed', dept: 'electronics', condition: 'Renewed',
    title: 'Renewed Flagship 5G Smartphone, 256GB, Midnight Blue (Unlocked)',
    price: 549, listPrice: 899, rating: 4.4, reviews: 15420, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'tablet-used', dept: 'electronics', condition: 'Used - Like New',
    title: 'Pre-Owned 11" Tablet, 128GB, WiFi — Inspected & Guaranteed',
    price: 329, rating: 4.3, reviews: 3980, prime: true, delivery: 'Mon, Jul 22',
  },
  {
    id: 'watch-renewed', dept: 'electronics', condition: 'Renewed',
    title: 'Renewed Smartwatch, 44mm, GPS + Cellular, Sport Loop',
    price: 189, listPrice: 279, rating: 4.4, reviews: 5210, coupon: 10, prime: true, delivery: 'Mon, Jul 22',
  },

  /* ── Computers & Components ── */
  {
    id: 'gpu-ai', dept: 'components',
    title: 'AI Accelerator GPU Graphics Card, 24GB GDDR6X, PCIe 4.0, Triple Fan',
    price: 1599, listPrice: 1899, rating: 4.7, reviews: 5240, bought: '1K+ bought in past month',
    badge: { kind: 'deal', text: 'Limited time deal' }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'cpu', dept: 'components',
    title: '16-Core 32-Thread Desktop CPU Processor, Socket AM5, Unlocked',
    price: 429, listPrice: 499, rating: 4.8, reviews: 24100, bought: '4K+ bought in past month',
    badge: { kind: 'best', text: '#1 Best Seller' }, prime: true, delivery: 'Tomorrow, Jul 20', fastest: 'Today 7 PM',
  },
  {
    id: 'ram', dept: 'components',
    title: 'DDR5 Desktop Memory RAM 32GB (2 x 16GB) 6000MHz Kit, RGB',
    price: 109.99, listPrice: 139.99, unit: '($3.44 / GB)', rating: 4.8, reviews: 33210, bought: '6K+ bought in past month',
    badge: { kind: 'choice', text: "Amazon's Choice" }, coupon: 10, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'ssd', dept: 'components',
    title: '1TB NVMe PCIe Gen4 M.2 Internal SSD, up to 7,000 MB/s',
    price: 79.99, listPrice: 109.99, rating: 4.8, reviews: 51200, bought: '9K+ bought in past month',
    badge: { kind: 'best', text: '#1 Best Seller' }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'chips', dept: 'components',
    title: 'Semiconductor Microcontroller Chips Assortment Kit (50 pcs, DIP & SMD)',
    price: 24.99, rating: 4.5, reviews: 3120, prime: true, delivery: 'Mon, Jul 22',
  },
  {
    id: 'wafer', dept: 'components',
    title: 'Silicon Semiconductor Wafer Display Piece, 200mm (Collector Grade)',
    price: 89.99, rating: 4.6, reviews: 870, sponsored: true, prime: true, delivery: 'Mon, Jul 22',
  },
  {
    id: 'monitor', dept: 'components',
    title: '27" 4K UHD Monitor, 144Hz, HDR400, USB-C, Height-Adjustable',
    price: 329, listPrice: 429, rating: 4.7, reviews: 18720, bought: '2K+ bought in past month',
    badge: { kind: 'best', text: '#1 Best Seller' }, coupon: 10, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'keyboard', dept: 'components',
    title: 'Mechanical Gaming Keyboard, Hot-Swappable, RGB, Tenkeyless',
    price: 89, rating: 4.7, reviews: 24560, badge: { kind: 'choice', text: "Amazon's Choice" }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'mouse', dept: 'components',
    title: 'Wireless Gaming Mouse, 26K DPI Sensor, 70-Hour Battery',
    price: 59, listPrice: 79, rating: 4.6, reviews: 31240, coupon: 10, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'webcam', dept: 'components',
    title: '1080p HD Webcam with Dual Microphones & Privacy Cover',
    price: 39, listPrice: 59, rating: 4.5, reviews: 40130, bought: '3K+ bought in past month',
    coupon: 20, prime: true, delivery: 'Tomorrow, Jul 20',
  },

  /* ── Grocery & Gourmet Food ── */
  {
    id: 'buldak-2x',
    title: 'Samyang Buldak Hot Chicken Flavor Ramen (2x Spicy), Pack of 5',
    price: 9.48, listPrice: 12.99, unit: '($1.90 / Count)', rating: 4.8, reviews: 41250, bought: '10K+ bought in past month',
    badge: { kind: 'best', text: '#1 Best Seller' }, coupon: 10, prime: true, delivery: 'Tomorrow, Jul 20', fastest: 'Today 7 PM',
  },
  {
    id: 'buldak-carbonara',
    title: 'Samyang Buldak Carbonara Hot Chicken Flavor Ramen, Pack of 5',
    price: 10.99, unit: '($2.20 / Count)', rating: 4.7, reviews: 18740, bought: '5K+ bought in past month',
    badge: { kind: 'overall', text: 'Overall Pick' }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'buldak-3x',
    title: 'Samyang Buldak 3x Spicy Extra Hot Chicken Flavor Ramen, Pack of 5',
    price: 11.49, listPrice: 13.99, unit: '($2.30 / Count)', rating: 4.6, reviews: 22910, bought: '3K+ bought in past month',
    coupon: 15, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'topramen-chicken',
    title: 'Nissin Top Ramen Chicken Flavor Instant Ramen Noodle Soup, 24 Pack',
    price: 7.68, listPrice: 9.36, unit: '($0.32 / Count)', rating: 4.8, reviews: 68420, bought: '20K+ bought in past month',
    badge: { kind: 'choice', text: "Amazon's Choice" }, prime: true, delivery: 'Tomorrow, Jul 20', fastest: 'Today 7 PM',
  },
  {
    id: 'topramen-beef',
    title: 'Nissin Top Ramen Beef Flavor Instant Ramen Noodle Soup, 24 Pack',
    price: 7.68, unit: '($0.32 / Count)', rating: 4.7, reviews: 39110, bought: '9K+ bought in past month',
    prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'shin-ramyun',
    title: 'Nongshim Shin Ramyun Spicy Noodle Soup, Pack of 20',
    price: 18.99, listPrice: 23.49, unit: '($0.95 / Count)', rating: 4.8, reviews: 51200, bought: '8K+ bought in past month',
    badge: { kind: 'best', text: '#1 Best Seller' }, coupon: 5, prime: true, delivery: 'Tomorrow, Jul 20', fastest: 'Today 7 PM',
  },
  {
    id: 'cup-noodles',
    title: 'Nissin Cup Noodles Chicken Flavor Ramen Soup, 24 Cups',
    price: 14.28, unit: '($0.60 / Count)', rating: 4.7, reviews: 44300, bought: '7K+ bought in past month',
    sponsored: true, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'indomie',
    title: 'Indomie Mi Goreng Instant Stir Fry Noodles, Pack of 30',
    price: 19.99, listPrice: 24.99, unit: '($0.67 / Count)', rating: 4.8, reviews: 62100, bought: '6K+ bought in past month',
    badge: { kind: 'choice', text: "Amazon's Choice" }, coupon: 8, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'chapagetti',
    title: 'Nongshim Chapagetti Chajang Noodle, Pack of 8',
    price: 12.49, unit: '($1.56 / Count)', rating: 4.7, reviews: 15980, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'jin-ramen',
    title: 'Ottogi Jin Ramen Spicy Instant Noodle, Pack of 20',
    price: 16.99, unit: '($0.85 / Count)', rating: 4.6, reviews: 12040, coupon: 10, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'sapporo',
    title: 'Sapporo Ichiban Original Ramen Noodle Soup, Pack of 24',
    price: 21.6, unit: '($0.90 / Count)', rating: 4.6, reviews: 9870, prime: true, delivery: 'Mon, Jul 22',
  },
  {
    id: 'maruchan',
    title: 'Maruchan Ramen Chicken Flavor Instant Noodle Soup, 24 Pack',
    price: 6.98, unit: '($0.29 / Count)', rating: 4.7, reviews: 58700, bought: '15K+ bought in past month',
    prime: true, delivery: 'Tomorrow, Jul 20', fastest: 'Today 7 PM',
  },
  {
    id: 'pocky',
    title: 'Glico Pocky Chocolate Biscuit Sticks, Pack of 10',
    price: 13.49, unit: '($1.35 / Count)', rating: 4.8, reviews: 27600, bought: '4K+ bought in past month',
    prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'hichew',
    title: 'Hi-Chew Sensationally Chewy Candy Assorted Fruit, 12 Pack',
    price: 11.99, unit: '($1.00 / Count)', rating: 4.8, reviews: 33900, badge: { kind: 'overall', text: 'Overall Pick' }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'ramune',
    title: 'Hata Ramune Japanese Marble Soda Original, 6 Bottles',
    price: 15.99, unit: '($2.67 / Count)', rating: 4.6, reviews: 8120, coupon: 5, prime: true, delivery: 'Mon, Jul 22',
  },
  {
    id: 'honey-butter',
    title: 'Haitai Honey Butter Chip Korean Potato Chips, 3 Pack',
    price: 12.99, unit: '($4.33 / Count)', rating: 4.7, reviews: 6450, prime: true, delivery: 'Mon, Jul 22',
  },
];

/* ── Consumer catalog (100 products across 10 departments) mapped in from
   data/amazonCatalog.ts so the general-store departments ship alongside the
   specialty ones. ── */
const CAT_TO_DEPT: Record<string, Dept> = {
  'Electronics': 'electronics',
  'Home & Kitchen': 'home-kitchen',
  'Office Products': 'office',
  'Clothing & Shoes': 'clothing',
  'Books': 'books',
  'Toys & Games': 'toys',
  'Health & Personal Care': 'health',
  'Grocery': 'grocery',
  'Sports & Outdoors': 'sports',
  'Smart Home': 'smarthome',
};
const AZ_BADGE: Record<string, Badge> = {
  'Best Seller': { kind: 'best', text: '#1 Best Seller' },
  "Amazon's Choice": { kind: 'choice', text: "Amazon's Choice" },
  'Overall Pick': { kind: 'overall', text: 'Overall Pick' },
  'Limited time deal': { kind: 'deal', text: 'Limited time deal' },
};
const CONSUMER_PRODUCTS: Product[] = AZ_PRODUCTS.map((p, i) => ({
  id: p.id,
  dept: CAT_TO_DEPT[p.category],
  title: `${p.brand} ${p.title}`,
  imageId: p.photo.split('/').pop(),
  price: p.price,
  listPrice: p.listPrice,
  rating: p.rating,
  reviews: p.reviews,
  badge: p.badge ? AZ_BADGE[p.badge] : undefined,
  bought: p.reviews > 60000 ? `${Math.min(9, Math.round(p.reviews / 40000))}K+ bought in past month` : undefined,
  prime: p.prime,
  coupon: p.listPrice && p.listPrice > p.price * 1.3 ? 5 : undefined,
  delivery: i % 3 === 0 ? 'Tomorrow, Jul 20' : 'Mon, Jul 22',
}));
PRODUCTS.push(...CONSUMER_PRODUCTS);

const DEPARTMENTS: { id: 'all' | Dept; label: string; query: string; results: string }[] = [
  { id: 'all', label: 'All Departments', query: 'today’s deals', results: 'over 30,000' },
  { id: 'electronics', label: 'Electronics', query: 'laptops, phones & tablets', results: 'over 8,000' },
  { id: 'components', label: 'Computers & Components', query: 'pc components & chips', results: 'over 6,000' },
  { id: 'chemicals', label: 'Industrial & Scientific', query: 'lab chemicals & reagents', results: 'over 5,000' },
  { id: 'grocery', label: 'Grocery & Gourmet Food', query: 'instant ramen', results: 'over 4,000' },
  { id: 'home-kitchen', label: 'Home & Kitchen', query: 'air fryers & cookware', results: 'over 9,000' },
  { id: 'office', label: 'Office Products', query: 'desks, chairs & supplies', results: 'over 5,000' },
  { id: 'clothing', label: 'Clothing & Shoes', query: 'sneakers & essentials', results: 'over 12,000' },
  { id: 'books', label: 'Books', query: 'bestsellers & new releases', results: 'over 20,000' },
  { id: 'toys', label: 'Toys & Games', query: 'building sets & board games', results: 'over 7,000' },
  { id: 'health', label: 'Health & Personal Care', query: 'vitamins & essentials', results: 'over 6,000' },
  { id: 'sports', label: 'Sports & Outdoors', query: 'fitness & camping gear', results: 'over 8,000' },
  { id: 'smarthome', label: 'Smart Home', query: 'cameras, plugs & hubs', results: 'over 3,000' },
];

const BRANDS: Record<'all' | Dept, string[]> = {
  all: ['Apple', 'Samsung', 'Google', 'NVIDIA', 'Nissin', 'Samyang'],
  electronics: ['Apple', 'Samsung', 'Google', 'Sony', 'Anker'],
  components: ['Intel', 'AMD', 'NVIDIA', 'Corsair', 'Kingston', 'Samsung'],
  chemicals: ['LabPure', 'ChemWorld', 'Duda Energy', 'Pure Organic', 'Alpha Chem'],
  grocery: ['Samyang', 'Nissin', 'Nongshim', 'Maruchan', 'Indomie', 'Ottogi'],
  'home-kitchen': ['Instant Pot', 'COSORI', "De'Longhi", 'Ninja', 'KitchenAid'],
  office: ['HP', 'Logitech', 'Fellowes', 'Sharpie', 'Post-it'],
  clothing: ['Levi\'s', 'Hanes', 'adidas', 'New Balance', 'Carhartt'],
  books: ['Penguin', 'HarperCollins', 'Random House', 'Simon & Schuster'],
  toys: ['LEGO', 'Hasbro', 'Mattel', 'Ravensburger', 'Melissa & Doug'],
  health: ['Oral-B', 'Nature Made', 'CeraVe', 'Philips', 'Braun'],
  sports: ['Gaiam', 'Bowflex', 'CamelBak', 'Coleman', 'Wilson'],
  smarthome: ['Ring', 'ecobee', 'TP-Link', 'Kasa', 'Chamberlain myQ'],
};

const deptOf = (p: Product): Dept => p.dept ?? 'grocery';
const prodImg = (id: string) => img(PRODUCTS.find((p) => p.id === id)?.imageId ?? id);

function Stars({ value }: { value: number }) {
  const pct = (value / 5) * 100;
  return (
    <span className="az-stars" role="img" aria-label={`${value} out of 5 stars`}>
      <span className="az-stars-bg">★★★★★</span>
      <span className="az-stars-fg" style={{ width: `${pct}%` }}>★★★★★</span>
    </span>
  );
}

function Price({ value, list, unit }: { value: number; list?: number; unit?: string }) {
  const [dollars, cents] = value.toFixed(2).split('.');
  const whole = Number(dollars).toLocaleString('en-US');
  return (
    <div className="az-price-row">
      <span className="az-price">
        <span className="sym">$</span>
        <span className="whole">{whole}</span>
        <span className="frac">{cents}</span>
      </span>
      {unit ? <span className="az-unit">{unit}</span> : null}
      {list ? (
        <span className="az-was">
          List: <s>${list.toLocaleString('en-US', { minimumFractionDigits: 2 })}</s>
        </span>
      ) : null}
    </div>
  );
}

function AmazonSmile({ scale = 1 }: { scale?: number }) {
  return (
    <svg width={80 * scale} height={26 * scale} viewBox="0 0 80 26" aria-hidden="true">
      <text x="1" y="19" fontFamily="Helvetica Neue, Arial" fontWeight="800" fontSize="22" letterSpacing="-1.4" fill="#fff">
        amazon
      </text>
      <path d="M8 22 C 28 28, 58 28, 72 20" fill="none" stroke="#ff9900" strokeWidth="3.1" strokeLinecap="round" />
      <path d="M72 20 l-6.5-2 M72 20 l-1.8 6" fill="none" stroke="#ff9900" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

export function AmazonSite() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [added, setAdded] = useState<string | null>(null);
  const [dept, setDept] = useState<'all' | Dept>('all');
  const [sort, setSort] = useState('featured');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payCardId, setPayCardId] = useState('chk');
  const [placedOrder, setPlacedOrder] = useState<WalletOrder | null>(null);
  const addOrder = useWalletStore((s) => s.addOrder);

  const activeDept = DEPARTMENTS.find((d) => d.id === dept) ?? DEPARTMENTS[0];
  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const p = PRODUCTS.find((x) => x.id === id);
          if (!p) return null;
          const price = p.coupon ? p.price * (1 - p.coupon / 100) : p.price;
          return { id, title: p.title, price, qty };
        })
        .filter(Boolean) as { id: string; title: string; price: number; qty: number }[],
    [cart],
  );
  const subtotal = cartLines.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = subtotal * TAX_RATE;
  const orderTotal = subtotal + tax;

  const placeOrder = () => {
    if (cartLines.length === 0) return;
    const card = CARDS.find((c) => c.id === payCardId) ?? CARDS[0];
    const id = nextOrderId();
    const order: WalletOrder = {
      id,
      date: new Date().toISOString(),
      desc: `AMAZON.COM*${id} AMZN.COM/BILL WA`,
      total: Math.round(orderTotal * 100) / 100,
      itemCount: cartLines.reduce((s, l) => s + l.qty, 0),
      items: cartLines,
      accountId: card.id,
      accountKind: card.kind,
      last4: card.last4,
      cardName: card.name,
    };
    addOrder(order);
    setPlacedOrder(order);
    setCart({});
  };

  const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const products = useMemo(() => {
    const copy = PRODUCTS.filter((p) => dept === 'all' || deptOf(p) === dept);
    if (sort === 'price-asc') copy.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') copy.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') copy.sort((a, b) => b.rating - a.rating);
    else if (sort === 'reviews') copy.sort((a, b) => b.reviews - a.reviews);
    return copy;
  }, [dept, sort]);

  const addToCart = (id: string) => {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
    setAdded(id);
    window.setTimeout(() => setAdded((cur) => (cur === id ? null : cur)), 1600);
  };

  return (
    <div className="az">
      {/* Top nav */}
      <div className="az-top">
        <div className="az-cell az-logo">
          <AmazonSmile scale={1.1} />
          <span className="az-logo-tld">.com</span>
        </div>
        <div className="az-cell az-deliver">
          <span className="pin">
            <svg width="15" height="16" viewBox="0 0 15 16" fill="#fff"><path d="M7.5 0C4 0 1.5 2.6 1.5 5.9 1.5 10 7.5 16 7.5 16s6-6 6-10.1C13.5 2.6 11 0 7.5 0zm0 8.2a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6z" /></svg>
          </span>
          <span className="lines">
            <span className="l1">Deliver to Michael</span>
            <span className="l2">New York 10001</span>
          </span>
        </div>
        <form className="az-search" onSubmit={(e) => e.preventDefault()}>
          <select className="az-search-cat" aria-label="Search category" value={dept} onChange={(e) => setDept(e.target.value as 'all' | Dept)}>
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>{d.id === 'all' ? 'All' : d.label}</option>
            ))}
          </select>
          <input value={activeDept.query} readOnly aria-label="Search Amazon" placeholder="Search Amazon" />
          <button type="submit" className="az-search-btn" aria-label="Search">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="#111"><path d="M21.4 18.6l-5.3-5.3A6.8 6.8 0 1 0 10 17a6.8 6.8 0 0 0 3.3-.9l5.3 5.3a2 2 0 0 0 2.8-2.8zM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5z" /></svg>
          </button>
        </form>
        <div className="az-cell az-flag">
          <svg width="22" height="15" viewBox="0 0 22 15" style={{ borderRadius: 2 }}><rect width="22" height="15" fill="#b22234" /><g fill="#fff"><rect y="1.15" width="22" height="1.15" /><rect y="3.46" width="22" height="1.15" /><rect y="5.77" width="22" height="1.15" /><rect y="8.08" width="22" height="1.15" /><rect y="10.38" width="22" height="1.15" /><rect y="12.69" width="22" height="1.15" /></g><rect width="9" height="8.08" fill="#3c3b6e" /></svg>
          <span>EN ▾</span>
        </div>
        <div className="az-cell az-acct">
          <span className="l1">Hello, Michael</span>
          <span className="l2">Account &amp; Lists ▾</span>
        </div>
        <div className="az-cell az-acct">
          <span className="l1">Returns</span>
          <span className="l2">&amp; Orders</span>
        </div>
        <button type="button" className="az-cell az-cart" onClick={() => { setPlacedOrder(null); setCheckoutOpen(true); }}>
          <span className="az-cart-ico">
            <span className="count">{cartCount}</span>
            <svg width="38" height="32" viewBox="0 0 38 32" fill="none" aria-hidden="true">
              <path d="M2 4h5l3.6 16.4a2.4 2.4 0 0 0 2.35 1.9h14.3a2.4 2.4 0 0 0 2.34-1.8L34.5 10H9" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="14.5" cy="28" r="2.6" fill="#fff" />
              <circle cx="28.5" cy="28" r="2.6" fill="#fff" />
            </svg>
          </span>
          <span className="word">Cart</span>
        </button>
      </div>

      {/* Sub nav */}
      <div className="az-sub">
        <a className="all">
          <svg width="16" height="12" viewBox="0 0 16 12"><path d="M0 1h16M0 6h16M0 11h16" stroke="#fff" strokeWidth="1.6" /></svg>
          All
        </a>
        <a onClick={() => setDept('all')}>Today&apos;s Deals</a>
        <a onClick={() => setDept('electronics')}>Electronics</a>
        <a onClick={() => setDept('components')}>Computers</a>
        <a onClick={() => setDept('chemicals')}>Industrial</a>
        <a onClick={() => setDept('grocery')}>Grocery</a>
        <a>Sell</a>
        <span className="spacer" />
        <a className="deal" onClick={() => setDept('electronics')}>
          New deals in <b>Electronics</b>
        </a>
      </div>

      {/* Body */}
      <div className="az-body">
        <aside className="az-rail">
          <h4>Department</h4>
          {DEPARTMENTS.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`opt dept-row ${dept === d.id ? 'active' : 'link'}`}
              onClick={() => setDept(d.id)}
            >
              <span className="lbl">{dept === d.id ? <b>{d.label}</b> : d.label}</span>
            </button>
          ))}
          <h4>Brands</h4>
          {BRANDS[dept].map((b) => (
            <label key={b} className="opt">
              <input type="checkbox" /> <span className="lbl">{b}</span>
            </label>
          ))}
          <h4>Customer Reviews</h4>
          <div className="opt link">
            <Stars value={4} /> <span className="lbl">&amp; Up</span>
          </div>
          <h4>Price</h4>
          <div className="opt link"><span className="lbl">Under $25</span></div>
          <div className="opt link"><span className="lbl">$25 to $100</span></div>
          <div className="opt link"><span className="lbl">$100 &amp; Above</span></div>
          <h4>Deals &amp; Discounts</h4>
          <label className="opt"><input type="checkbox" /> <span className="lbl">All Discounts</span></label>
          <label className="opt"><input type="checkbox" /> <span className="lbl">Today&apos;s Deals</span></label>
          <h4>Prime</h4>
          <label className="opt prime-opt"><input type="checkbox" defaultChecked /> <span className="az-prime-badge">✓prime</span></label>
        </aside>

        <main className="az-main">
          <div className="az-results-head">
            <div>
              <div className="count">
                1-{products.length} of {activeDept.results} results for <span className="q">&ldquo;{activeDept.query}&rdquo;</span>
              </div>
              <h1>{dept === 'all' ? 'Results' : activeDept.label}</h1>
              <div className="subnote">Check each product page for other buying options.</div>
            </div>
            <label className="az-sortbar">
              Sort by:
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
                <option value="reviews">Newest Arrivals</option>
              </select>
            </label>
          </div>

          <div className="az-grid">
            {products.map((p) => {
              const price = p.coupon ? p.price * (1 - p.coupon / 100) : p.price;
              return (
                <article key={p.id} className="az-card">
                  {p.sponsored ? <span className="az-sponsored">Sponsored ⓘ</span> : null}
                  {p.badge ? (
                    <span className={`az-badge ${p.badge.kind}`}>
                      {p.badge.kind === 'choice' ? (
                        <>
                          <b>Amazon&apos;s</b> Choice
                        </>
                      ) : (
                        p.badge.text
                      )}
                    </span>
                  ) : !p.sponsored ? (
                    <span className="az-badge-spacer" />
                  ) : null}
                  <div className="az-thumb">
                    <img src={prodImg(p.id)} alt={p.title} loading="lazy" />
                  </div>
                  <div className="az-title">{p.title}</div>
                  {p.condition ? <div className="az-condition">{p.condition}</div> : null}
                  <div className="az-rating">
                    <span className="val">{p.rating.toFixed(1)}</span>
                    <Stars value={p.rating} />
                    <span className="n">{p.reviews.toLocaleString()}</span>
                  </div>
                  {p.bought ? <div className="az-bought">{p.bought}</div> : null}
                  <Price value={price} list={p.listPrice} unit={p.unit} />
                  {p.coupon ? (
                    <label className="az-coupon">
                      <input type="checkbox" className="box" defaultChecked /> <b>Save {p.coupon}%</b> with coupon
                    </label>
                  ) : null}
                  {p.prime ? (
                    <div className="az-prime">
                      <span className="az-prime-badge">✓prime</span> <span>FREE delivery</span> <b>{p.delivery}</b>
                    </div>
                  ) : null}
                  {p.fastest ? (
                    <div className="az-fastest">
                      Or fastest delivery <b>{p.fastest}</b>
                    </div>
                  ) : null}
                  <button type="button" className={`az-add ${cart[p.id] ? 'added' : ''}`} onClick={() => addToCart(p.id)}>
                    {cart[p.id] ? `✓ In Cart (${cart[p.id]})` : 'Add to cart'}
                  </button>
                </article>
              );
            })}
          </div>
        </main>
      </div>

      {/* Added-to-cart toast (fixed, no layout shift) */}
      {added ? (
        <div className="az-toast">
          <span className="az-toast-check">✓</span> Added to Cart · {cartCount} item{cartCount === 1 ? '' : 's'}
        </div>
      ) : null}

      {/* Cart / Checkout overlay */}
      {checkoutOpen ? (
        <div className="az-modal-scrim" onClick={() => setCheckoutOpen(false)}>
          <div className="az-checkout" onClick={(e) => e.stopPropagation()}>
            <div className="az-checkout-head">
              <h2>{placedOrder ? 'Order placed' : 'Shopping Cart'}</h2>
              <button type="button" className="az-x" aria-label="Close" onClick={() => setCheckoutOpen(false)}>×</button>
            </div>

            {placedOrder ? (
              <div className="az-order-confirm">
                <div className="az-confirm-check">✓</div>
                <h3>Thank you, your order is confirmed</h3>
                <p className="az-order-no">Order # {placedOrder.id}</p>
                <p>
                  {money(placedOrder.total)} charged to <b>{placedOrder.cardName}</b> (••{placedOrder.last4}).
                </p>
                <p className="az-confirm-note">
                  This purchase now appears in your Chase account activity. Open the <b>Chase</b> app to see the transaction and updated balance.
                </p>
                <button type="button" className="az-place-btn" onClick={() => setCheckoutOpen(false)}>Continue shopping</button>
              </div>
            ) : cartLines.length === 0 ? (
              <div className="az-cart-empty">
                <p>Your Amazon Cart is empty.</p>
                <button type="button" className="az-place-btn" onClick={() => setCheckoutOpen(false)}>Continue shopping</button>
              </div>
            ) : (
              <div className="az-checkout-body">
                <div className="az-cart-lines">
                  {cartLines.map((l) => (
                    <div key={l.id} className="az-cart-line">
                      <div className="az-cart-thumb"><img src={prodImg(l.id)} alt="" /></div>
                      <div className="az-cart-info">
                        <div className="az-cart-title">{l.title}</div>
                        <div className="az-cart-qty">Qty: {l.qty}</div>
                      </div>
                      <div className="az-cart-price">{money(l.price * l.qty)}</div>
                    </div>
                  ))}
                </div>

                <div className="az-pay">
                  <h4>Payment method</h4>
                  {CARDS.map((c) => (
                    <label key={c.id} className={`az-pay-card ${payCardId === c.id ? 'sel' : ''}`}>
                      <input type="radio" name="paycard" checked={payCardId === c.id} onChange={() => setPayCardId(c.id)} />
                      <MiniCard grad={c.grad} short={c.short} last4={c.last4} />
                      <span className="az-pay-meta">
                        <span className="az-pay-name">{c.name}</span>
                        <span className="az-pay-sub">No recent transactions history</span>
                      </span>
                      <span className="az-pay-num">{c.network} ••••{c.last4}</span>
                    </label>
                  ))}
                </div>

                <div className="az-summary">
                  <div><span>Items ({cartCount}):</span><span>{money(subtotal)}</span></div>
                  <div><span>Shipping:</span><span className="az-free">FREE</span></div>
                  <div><span>Estimated tax:</span><span>{money(tax)}</span></div>
                  <div className="az-summary-total"><span>Order total:</span><span>{money(orderTotal)}</span></div>
                  <button type="button" className="az-place-btn" onClick={placeOrder}>Place your order</button>
                  <p className="az-place-note">By placing your order the total is charged to your selected Chase card.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Footer */}
      <div className="az-backtotop">Back to top</div>
      <div className="az-foot">
        <div>
          <h5>Get to Know Us</h5>
          <a>Careers</a><a>Blog</a><a>About Amazon</a><a>Investor Relations</a>
        </div>
        <div>
          <h5>Make Money with Us</h5>
          <a>Sell on Amazon</a><a>Become an Affiliate</a><a>Advertise Your Products</a>
        </div>
        <div>
          <h5>Amazon Payment Products</h5>
          <a>Amazon Business Card</a><a>Shop with Points</a><a>Reload Your Balance</a>
        </div>
        <div>
          <h5>Let Us Help You</h5>
          <a>Your Account</a><a>Your Orders</a><a>Shipping Rates</a><a>Help</a>
        </div>
      </div>
      <div className="az-copy">© 1996–2026, aOS Marketplace demo · A storefront simulation</div>
    </div>
  );
}
