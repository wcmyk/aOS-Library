// Fleshed-out simulated professionals: deterministic profiles with photo
// headshots (generated via Higgsfield), work history, education, and activity.
// Photos p1-p3 are women, p4-p6 men, p7-p9 mixed senior — names are matched to
// the right photo pool so a given name always maps to the same face.

const BASE_URL = import.meta.env.BASE_URL;

export type Person = {
  name: string;
  photo: string;
  headline: string;
  company: string;
  location: string;
  connections: string;
  about: string;
  education: { school: string; degree: string; years: string };
  history: Array<{ role: string; company: string; years: string }>;
  openTo?: string;
};

const FEM_PHOTOS = ['p1.webp', 'p2.webp', 'p3.webp', 'p10.webp', 'p11.webp', 'p14.webp', 'p15.webp'];
const MASC_PHOTOS = ['p4.webp', 'p5.webp', 'p6.webp', 'p12.webp', 'p13.webp', 'p16.webp'];
const SENIOR_PHOTOS = ['p7.webp', 'p8.webp', 'p9.webp', 'p16.webp', 'p17.webp'];

const FEM_NAMES = ['Elena', 'Sophia', 'Priya', 'Nadia', 'Cassandra', 'Isabelle', 'Mei', 'Serena', 'Yuna', 'Anastasia', 'Vivienne', 'Leila', 'Zara', 'Iris', 'Naomi', 'Ingrid', 'Amara', 'Lyra', 'Wren', 'Solen'];

const SCHOOLS: Array<[string, string]> = [
  ['University of Michigan', 'BS, Computer Science'],
  ['Carnegie Mellon University', 'MS, Software Engineering'],
  ['Georgia Tech', 'BS, Industrial Engineering'],
  ['University of Texas at Austin', 'BBA, Finance'],
  ['Cornell University', 'BS, Operations Research'],
  ['University of Washington', 'BS, Informatics'],
  ['NYU Stern School of Business', 'MBA'],
  ['University of Illinois Urbana-Champaign', 'BS, Statistics'],
  ['Purdue University', 'BS, Electrical Engineering'],
  ['UC Berkeley', 'BA, Economics'],
];

const ABOUTS = [
  'I build systems that hold up under pressure — and teams that do the same. Most of my time goes to distributed infrastructure, mentoring, and the occasional deep-dive blog post.',
  'Passionate about turning messy data into decisions people actually make. Previously scaled analytics from two dashboards to a company-wide platform.',
  'Client-first, hypothesis-driven, allergic to 80-slide decks that say nothing. I work at the intersection of strategy and implementation.',
  'Engineer turned product-minded generalist. I care about latency budgets, clean interfaces, and writing things down.',
  'Ten years across markets, risk, and quantitative research. I like problems where the math has to survive contact with production.',
  'Recruiting is matchmaking with higher stakes. I focus on early-career talent and making the hiring process feel human.',
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

export function personPhoto(name: string, senior = false): string {
  const h = hash(name);
  const first = name.split(' ')[0];
  const pool = senior ? SENIOR_PHOTOS : FEM_NAMES.includes(first) ? FEM_PHOTOS : MASC_PHOTOS;
  return `${BASE_URL}assets/people/${pool[h % pool.length]}`;
}

export function buildPerson(name: string, role: string, company: string, location?: string): Person {
  const h = hash(name + company);
  const senior = /director|principal|staff|head|vp|lead|manager/i.test(role);
  const school = SCHOOLS[h % SCHOOLS.length];
  const gradYear = 2012 + (h % 10);
  const prevCompanies = ['Deloitte', 'IBM', 'Accenture', 'Capital One', 'Oracle', 'Cisco', 'Salesforce', 'Wells Fargo'];
  const prev = prevCompanies[(h >> 4) % prevCompanies.length];
  const years = 2 + (h % 5);
  return {
    name,
    photo: personPhoto(name, senior),
    headline: `${role} at ${company}`,
    company,
    location: location ?? ['New York, NY', 'San Francisco Bay Area', 'Chicago, IL', 'Seattle, WA', 'Austin, TX', 'Boston, MA'][h % 6],
    connections: h % 3 === 0 ? '500+' : `${100 + (h % 400)}`,
    about: ABOUTS[h % ABOUTS.length],
    education: { school: school[0], degree: school[1], years: `${gradYear - 4} – ${gradYear}` },
    history: [
      { role, company, years: `${2026 - years} – Present · ${years} yrs` },
      { role: role.replace(/^Senior |^Staff |^Principal /, ''), company: prev, years: `${2026 - years - 3} – ${2026 - years} · 3 yrs` },
    ],
    openTo: h % 4 === 0 ? 'Providing services: Mentoring and Career Coaching' : undefined,
  };
}
