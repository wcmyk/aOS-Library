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

const FEM_PHOTOS = [
  'p1.webp', 'p2.webp', 'p3.webp', 'p10.webp', 'p11.webp', 'p14.webp', 'p15.webp',
  'p18.webp', 'p19.webp', 'p20.webp', 'p21.webp',   // box braids set
  'p22.webp', 'p23.webp', 'p24.webp', 'p25.webp',   // auburn coastal set
  'p26.webp', 'p27.webp', 'p28.webp', 'p29.webp',   // denim coworking set
  'p30.webp', 'p31.webp', 'p32.webp', 'p33.webp',   // emerald blouse set
  'p50.webp', 'p51.webp', 'p52.webp', 'p53.webp',   // teal hijab cafe set
  'p54.webp', 'p55.webp', 'p56.webp', 'p57.webp',   // golden-hour afro set
  'p58.webp', 'p59.webp', 'p60.webp', 'p61.webp',   // linen blazer gallery set
];
const MASC_PHOTOS = [
  'p4.webp', 'p5.webp', 'p6.webp', 'p12.webp', 'p13.webp', 'p16.webp',
  'p34.webp', 'p35.webp', 'p36.webp', 'p37.webp',   // navy crewneck set
  'p38.webp', 'p39.webp', 'p40.webp', 'p41.webp',   // quarter-zip trail set
  'p42.webp', 'p43.webp', 'p44.webp', 'p45.webp',   // mustard cardigan set
  'p46.webp', 'p47.webp', 'p48.webp', 'p49.webp',   // olive overshirt set
  'p62.webp', 'p63.webp', 'p64.webp', 'p65.webp',   // terracotta street set
  'p66.webp', 'p67.webp', 'p68.webp', 'p69.webp',   // denim library set
];
const SENIOR_PHOTOS = [
  'p7.webp', 'p8.webp', 'p9.webp', 'p16.webp', 'p17.webp',
  'p30.webp', 'p31.webp', 'p38.webp', 'p39.webp',
];

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

// Full-profile extras (activity posts, skills, interests) generated
// deterministically so the same person always renders the same profile page.
export type ProfileExtras = {
  followers: string;
  posts: Array<{ text: string; age: string; reactions: number; comments: number }>;
  skills: Array<{ name: string; endorsements: number }>;
  interests: string[];
  mutuals: string;
};

const POST_TEMPLATES: Array<(role: string, company: string) => string> = [
  (r, c) => `Thrilled to share that our team at ${c} just shipped a project we've been heads-down on for months. Proud of everyone involved — the late-cycle bugs were no joke.`,
  (r, c) => `Reflecting on my first year as a ${r} at ${c}: the biggest lesson is that writing things down beats remembering them. Documentation is a superpower.`,
  (_, c) => `We're hiring at ${c}! If you're early-career and want a team that actually invests in mentorship, my DMs are open. Happy to refer strong candidates.`,
  (r) => `Hot take: the best ${r.toLowerCase()}s I know spend more time deleting work than adding it. Scope discipline is a skill — practice it.`,
  (_, c) => `Grateful to have spoken at our internal ${c} engineering summit this week. Q&A ran 30 minutes over — always a good sign.`,
  () => `Five years ago I almost didn't apply for a role because I met 6 of the 10 requirements. Apply anyway. Let them tell you no — don't do it for them.`,
];

const SKILL_POOLS: Array<[RegExp, string[]]> = [
  [/engineer|developer|swe|software/i, ['Distributed Systems', 'TypeScript', 'System Design', 'Code Review', 'Kubernetes', 'CI/CD']],
  [/data|analyst|analytics/i, ['SQL', 'Python', 'Data Visualization', 'A/B Testing', 'dbt', 'Stakeholder Management']],
  [/product/i, ['Product Strategy', 'Roadmapping', 'User Research', 'SQL', 'Experimentation', 'Cross-functional Leadership']],
  [/consult|strategy/i, ['Strategy', 'Financial Modeling', 'Client Engagement', 'Market Analysis', 'PowerPoint', 'Due Diligence']],
  [/recruit|talent|people|hr/i, ['Technical Recruiting', 'Sourcing', 'Employer Branding', 'Interviewing', 'Offer Negotiation', 'HRIS']],
  [/finance|account/i, ['Financial Analysis', 'Forecasting', 'Excel', 'GAAP', 'Variance Analysis', 'SAP']],
  [/design/i, ['Product Design', 'Figma', 'Design Systems', 'Prototyping', 'User Research', 'Accessibility']],
  [/market/i, ['Growth Marketing', 'SEO/SEM', 'Content Strategy', 'Marketing Analytics', 'Brand Strategy', 'Lifecycle Marketing']],
];

export function buildProfileExtras(person: Person): ProfileExtras {
  const h = hash(person.name + person.headline);
  const role = person.history[0]?.role ?? person.headline;
  const pool = SKILL_POOLS.find(([re]) => re.test(role))?.[1] ?? ['Leadership', 'Communication', 'Project Management', 'Strategic Planning', 'Mentoring', 'Public Speaking'];
  const skills = pool.slice(0, 4 + (h % 3)).map((name, i) => ({ name, endorsements: 8 + ((h >> (i + 2)) % 90) }));
  const p1 = POST_TEMPLATES[h % POST_TEMPLATES.length](role, person.company);
  const p2 = POST_TEMPLATES[(h + 3) % POST_TEMPLATES.length](role, person.company);
  return {
    followers: `${(1 + (h % 8))},${String(100 + (h % 900)).padStart(3, '0')}`,
    posts: [
      { text: p1, age: `${1 + (h % 3)}w`, reactions: 40 + (h % 420), comments: 4 + (h % 38) },
      { text: p2, age: `${1 + ((h >> 3) % 4) + 3}w`, reactions: 25 + ((h >> 2) % 260), comments: 2 + ((h >> 4) % 24) },
    ],
    skills,
    interests: [person.company, person.history[1]?.company ?? 'LinkedIn News', person.education.school],
    mutuals: `${2 + (h % 21)} mutual connections`,
  };
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
