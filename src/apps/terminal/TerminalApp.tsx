import { useEffect, useMemo, useRef, useState } from 'react';
import { apps } from '../../data/apps';
import { useShellStore } from '../../state/useShellStore';
import { useProfileStore } from '../../state/useProfileStore';
import { useCompanyStore } from '../../state/useCompanyStore';
import { useMailStore } from '../../state/useMailStore';
import { useWalletStore } from '../../state/useWalletStore';
import { useDevStore, subscriptionCharges } from '../../state/useDevStore';
import { useCircuitLabStore } from '../../state/useCircuitLabStore';
import { useThemeStore } from '../../state/useThemeStore';
import { useWallpaperStore, WALLPAPERS } from '../../state/useWallpaperStore';
import './terminal.css';

// macOS Terminal replica (zsh). The virtual filesystem and most commands are
// live views over simulation state: employment, mail, bank, orders, theme.

type Line = { text: string; kind?: 'cmd' | 'err' };

const MOTD = 'Last login: on ttys000';

function fmtMoney(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TerminalApp() {
  const profileName = useProfileStore((s) => s.fullName);
  const employerAccounts = useCompanyStore((s) => s.employerAccounts);
  const emails = useMailStore((s) => s.emails);
  const orders = useWalletStore((s) => s.orders);
  const cashAdjustment = useDevStore((s) => s.cashAdjustment);
  const subscriptions = useDevStore((s) => s.subscriptions);
  const bankTransfers = useDevStore((s) => s.bankTransfers);
  const taxRefunds = useDevStore((s) => s.taxRefunds);
  const labInventory = useCircuitLabStore((s) => s.inventory);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const wallpaperId = useWallpaperStore((s) => s.selectedId);
  const setWallpaper = useWallpaperStore((s) => s.setWallpaper);
  const openWindow = useShellStore((s) => s.openWindow);

  const user = (profileName || 'user').split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  const activeEmployment = employerAccounts.filter((a) => a.employmentStatus === 'active' || a.employmentStatus === 'onboarding');

  const [lines, setLines] = useState<Line[]>([{ text: MOTD }]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('~');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  // ── Virtual filesystem (live views over sim state) ──────────────────────────
  const fs = useMemo(() => {
    const documents: Record<string, string> = {
      'resume.txt': `${profileName || 'aOS Member'}\nNew graduate — aOS workforce simulation.\nApply on LinkedIn, interview over Zoom, get paid through Workday/ADP/Chase.`,
    };
    for (const emp of activeEmployment) {
      const key = `offer-${(emp.companyName ?? 'company').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
      documents[key] = `OFFER OF EMPLOYMENT\n\nCompany:  ${emp.companyName}\nRole:     ${emp.title}\nBase:     ${fmtMoney(emp.compensation ?? 0)} / year\nStart:    ${emp.startDate ?? 'TBD'}\nStatus:   ${emp.employmentStatus}`;
    }
    const downloads: Record<string, string> = {};
    for (const o of orders.slice(0, 12)) {
      downloads[`amazon-order-${o.id}.txt`] = `AMAZON ORDER ${o.id}\nCharged to: ${o.cardName ?? o.accountId} (...${o.last4 ?? '????'})\nTotal: ${fmtMoney(o.total)}\n\nItems:\n${(o.items ?? []).map((it) => `  ${it.qty} x ${it.title} — ${fmtMoney(it.price)}`).join('\n') || '  (details unavailable)'}`;
    }
    const pictures: Record<string, string> = {};
    for (const w of WALLPAPERS) pictures[`${w.id}.heic`] = `[binary image data — wallpaper "${w.name}"]`;
    return {
      '~': { dirs: ['Desktop', 'Documents', 'Downloads', 'Pictures'], files: { 'README.txt': 'Welcome to aOS.\nThis Mac is part of the workforce readiness simulation.\nType `help` to see what the shell can do.' } },
      '~/Desktop': { dirs: [], files: {} },
      '~/Documents': { dirs: [], files: documents },
      '~/Downloads': { dirs: [], files: downloads },
      '~/Pictures': { dirs: [], files: pictures },
    } as Record<string, { dirs: string[]; files: Record<string, string> }>;
  }, [profileName, activeEmployment, orders]);

  // Estimated checking balance — mirrors the Chase app's ledger math.
  const checkingBalance = useMemo(() => {
    let total = cashAdjustment;
    for (const emp of activeEmployment) {
      const biweekly = Math.round(((emp.compensation ?? 0) / 26) * 100) / 100;
      const start = new Date(emp.startDate ?? Date.now());
      const periods = Math.max(0, Math.min(4, Math.floor((Date.now() - start.getTime()) / (14 * 86400000)) + 1));
      total += biweekly * periods;
    }
    for (const c of subscriptionCharges(subscriptions)) total -= c.amount;
    for (const o of orders) if (o.accountKind !== 'credit') total -= o.total;
    for (const t of bankTransfers) {
      if (t.from === 'chk') total -= t.amount;
      if (t.to === 'chk') total += t.amount;
    }
    for (const r of taxRefunds) total += r.amount;
    return total;
  }, [cashAdjustment, activeEmployment, subscriptions, orders, bankTransfers, taxRefunds]);

  const resolve = (path: string): string => {
    if (!path || path === '~' || path === '~/') return '~';
    let base = path.startsWith('~') ? path : `${cwd}/${path}`;
    base = base.replace(/\/+$/, '');
    const parts: string[] = [];
    for (const seg of base.split('/')) {
      if (seg === '' || seg === '.') continue;
      if (seg === '..') parts.pop();
      else parts.push(seg);
    }
    if (parts[0] !== '~') parts.unshift('~');
    return parts.join('/') === '~' ? '~' : parts.join('/');
  };

  const run = (raw: string): Line[] => {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    const [cmd, ...args] = trimmed.split(/\s+/);
    const arg = args.join(' ');
    const out: Line[] = [];
    const print = (text: string) => out.push({ text });
    const err = (text: string) => out.push({ text, kind: 'err' });

    switch (cmd) {
      case 'help':
        print('aOS zsh — connected to the simulation:');
        print('  ls / cd / cat / pwd     browse your files (offers, receipts, wallpapers)');
        print('  open -a <App>           launch an app (open -a Safari, open -a "Chase Bank")');
        print('  apps                    list every installed app');
        print('  jobs                    your current employment');
        print('  balance                 estimated Chase checking balance');
        print('  mail                    unread inbox summary');
        print('  orders                  recent Amazon orders');
        print('  inventory               owned items (Amazon + CIRCUTE)');
        print('  theme dark|light        switch system appearance');
        print('  wallpaper list|set <id> change the desktop wallpaper');
        print('  neofetch, date, whoami, uname, sw_vers, history, clear, echo');
        break;
      case 'ls': {
        const path = resolve(args[0] ?? cwd);
        const node = fs[path];
        if (!node) { err(`ls: ${args[0]}: No such file or directory`); break; }
        const entries = [...node.dirs.map((d) => `${d}/`), ...Object.keys(node.files)];
        print(entries.length ? entries.join('    ') : '');
        break;
      }
      case 'cd': {
        const path = resolve(args[0] ?? '~');
        if (!fs[path]) { err(`cd: no such file or directory: ${args[0]}`); break; }
        setCwd(path);
        break;
      }
      case 'pwd':
        print(cwd.replace('~', `/Users/${user}`));
        break;
      case 'cat': {
        if (!args[0]) { err('usage: cat <file>'); break; }
        const dir = resolve(args[0].includes('/') ? args[0].slice(0, args[0].lastIndexOf('/')) : cwd);
        const fname = args[0].includes('/') ? args[0].slice(args[0].lastIndexOf('/') + 1) : args[0];
        const content = fs[dir]?.files[fname];
        if (content == null) err(`cat: ${args[0]}: No such file or directory`);
        else content.split('\n').forEach(print);
        break;
      }
      case 'clear':
        setLines([]);
        return [];
      case 'echo':
        print(arg);
        break;
      case 'date':
        print(new Date().toString());
        break;
      case 'whoami':
        print(user);
        break;
      case 'hostname':
        print('aOS.local');
        break;
      case 'uname':
        print(args.includes('-a') ? 'Darwin aOS.local 24.5.0 Darwin Kernel Version 24.5.0 RELEASE_ARM64_T6041 arm64' : 'Darwin');
        break;
      case 'sw_vers':
        print('ProductName:    macOS');
        print('ProductVersion: 15.5');
        print('BuildVersion:   24F74');
        break;
      case 'uptime':
        print(` ${new Date().toLocaleTimeString('en-US', { hour12: false })}  up 3 days, 4:12, 1 user, load averages: 1.82 2.04 2.11`);
        break;
      case 'history':
        history.forEach((h, i) => print(`  ${String(i + 1).padStart(4)}  ${h}`));
        break;
      case 'apps':
        apps.filter((a) => !a.dockHidden).forEach((a) => print(`  ${a.name}`));
        break;
      case 'open': {
        if (args[0] === '-a') {
          const name = args.slice(1).join(' ').replace(/^"|"$/g, '');
          const app = apps.find((a) => a.name.toLowerCase() === name.toLowerCase())
            ?? apps.find((a) => a.name.toLowerCase().includes(name.toLowerCase()));
          if (!app) { err(`Unable to find application named '${name}'`); break; }
          openWindow(app.id);
          print(`Opening ${app.name}…`);
        } else {
          err('usage: open -a <application name>');
        }
        break;
      }
      case 'jobs': {
        if (activeEmployment.length === 0) { print('no current employment — apply on LinkedIn (Safari)'); break; }
        activeEmployment.forEach((emp, i) => {
          print(`[${i + 1}]  ${emp.companyName} — ${emp.title} (${emp.employmentStatus}) · ${fmtMoney(emp.compensation ?? 0)}/yr`);
        });
        break;
      }
      case 'balance':
      case 'bank':
        print(`Chase Total Checking (est.): ${fmtMoney(checkingBalance)}`);
        print('Open the Chase Bank app for the full ledger: open -a "Chase Bank"');
        break;
      case 'mail': {
        const inbox = emails.filter((e) => e.folder === 'inbox');
        const unread = inbox.filter((e) => !e.read);
        print(`${inbox.length} messages in inbox, ${unread.length} unread`);
        unread.slice(0, 5).forEach((e) => print(`  • ${e.subject}`));
        break;
      }
      case 'orders': {
        if (orders.length === 0) { print('no orders yet — shop at Amazon (Safari)'); break; }
        orders.slice(0, 8).forEach((o) => print(`  ${o.id}  ${fmtMoney(o.total)}  ${o.itemCount ?? (o.items?.length ?? 0)} item(s)  → ${o.cardName ?? o.accountId}`));
        break;
      }
      case 'inventory': {
        const amazonItems = new Map<string, number>();
        for (const o of orders) for (const it of o.items ?? []) amazonItems.set(it.title, (amazonItems.get(it.title) ?? 0) + it.qty);
        const lab = Object.values(labInventory);
        if (amazonItems.size === 0 && lab.length === 0) { print('inventory is empty'); break; }
        for (const [title, qty] of [...amazonItems].slice(0, 10)) print(`  ${qty} x ${title}`);
        for (const item of lab.slice(0, 10)) print(`  ${item.quantity} x ${item.name} [${item.sku}]`);
        break;
      }
      case 'theme': {
        if (args[0] === 'dark' || args[0] === 'light') {
          setThemeMode(args[0]);
          print(`Appearance set to ${args[0]}.`);
        } else {
          print(`Current appearance: ${themeMode}. Usage: theme dark|light`);
        }
        break;
      }
      case 'wallpaper': {
        if (args[0] === 'list' || !args[0]) {
          WALLPAPERS.forEach((w) => print(`  ${w.id === wallpaperId ? '*' : ' '} ${w.id} — ${w.name}`));
          if (!args[0]) print('Usage: wallpaper set <id>');
        } else if (args[0] === 'set' && args[1]) {
          const w = WALLPAPERS.find((x) => x.id === args[1]);
          if (!w) { err(`wallpaper: unknown id '${args[1]}' — try 'wallpaper list'`); break; }
          setWallpaper(w.id);
          print(`Wallpaper set to ${w.name}.`);
        } else {
          err('usage: wallpaper list | wallpaper set <id>');
        }
        break;
      }
      case 'neofetch': {
        const art = [
          '                    c.\'',
          '                 ,xNMM.',
          '               .OMMMMo',
          '               lMM"',
          '     .;loddo:.  .olloddol;.',
          '   cKMMMMMMMMMMNWMMMMMMMMMM0:',
          ' .KMMMMMMMMMMMMMMMMMMMMMMMWd.',
          ' XMMMMMMMMMMMMMMMMMMMMMMMX.',
          ';MMMMMMMMMMMMMMMMMMMMMMMM:',
          ':MMMMMMMMMMMMMMMMMMMMMMMM:',
          '.MMMMMMMMMMMMMMMMMMMMMMMMX.',
          ' kMMMMMMMMMMMMMMMMMMMMMMMMWd.',
          ' .XMMMMMMMMMMMMMMMMMMMMMMMMMMk',
          '  .XMMMMMMMMMMMMMMMMMMMMMMMMK.',
          '    kMMMMMMMMMMMMMMMMMMMMMMd',
          '     ;KMMMMMMMWXXWMMMMMMMk.',
          '       .cooc,.    .,coo:.',
        ];
        const info = [
          `${user}@aOS.local`,
          '─────────────────',
          'OS: macOS 15.5 (aOS simulation)',
          'Host: MacBook Pro (14-inch)',
          'Kernel: Darwin 24.5.0',
          `Shell: zsh 5.9`,
          `Theme: ${themeMode}`,
          `Jobs: ${activeEmployment.length} active`,
          `Checking: ${fmtMoney(checkingBalance)}`,
          `Unread mail: ${emails.filter((e) => e.folder === 'inbox' && !e.read).length}`,
        ];
        for (let i = 0; i < Math.max(art.length, info.length); i++) {
          print(`${(art[i] ?? '').padEnd(34)}${info[i] ?? ''}`);
        }
        break;
      }
      case 'sudo':
        err(`${user} is not in the sudoers file. This incident will be reported.`);
        break;
      case 'exit':
      case 'logout':
        print('[Process completed]');
        break;
      case 'mkdir':
      case 'touch':
      case 'rm':
        err(`${cmd}: read-only file system — this Mac is managed by the simulation`);
        break;
      default:
        err(`zsh: command not found: ${cmd}`);
    }
    return out;
  };

  const prompt = `${user}@aOS ${cwd === '~' ? '~' : cwd.split('/').pop()} %`;

  const submit = () => {
    const raw = input;
    const echoed: Line = { text: `${prompt} ${raw}`, kind: 'cmd' };
    const result = run(raw);
    if (raw.trim() === 'clear') {
      setInput('');
      setHistory((h) => [...h, raw.trim()].slice(-200));
      setHistIdx(-1);
      return;
    }
    setLines((l) => [...l, echoed, ...result]);
    if (raw.trim()) setHistory((h) => [...h, raw.trim()].slice(-200));
    setHistIdx(-1);
    setInput('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit();
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistIdx((idx) => {
        const next = idx === -1 ? history.length - 1 : Math.max(0, idx - 1);
        if (history[next] != null) setInput(history[next]);
        return next;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistIdx((idx) => {
        if (idx === -1) return -1;
        const next = idx + 1;
        if (next >= history.length) { setInput(''); return -1; }
        setInput(history[next]);
        return next;
      });
    } else if ((e.key === 'l' || e.key === 'k') && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      setLines((l) => [...l, { text: `${prompt} ${input}^C`, kind: 'cmd' }]);
      setInput('');
    }
  };

  return (
    <div className="term-shell" onMouseDown={() => inputRef.current?.focus()}>
      <div className="term-titlebar">{user} — -zsh — 80×24</div>
      <div className="term-scroll" ref={scrollRef}>
        {lines.map((l, i) => (
          <div key={i} className={`term-line ${l.kind ?? ''}`}>{l.text || ' '}</div>
        ))}
        <div className="term-inputrow">
          <span className="term-prompt">{prompt}</span>
          <input
            ref={inputRef}
            className="term-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoFocus
            aria-label="Terminal input"
          />
        </div>
      </div>
    </div>
  );
}
