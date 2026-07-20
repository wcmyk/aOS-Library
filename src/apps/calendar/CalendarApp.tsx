import { useMemo, useState } from 'react';
import { useMailStore } from '../../state/useMailStore';
import { useCompanyStore } from '../../state/useCompanyStore';
import { generateRoleTasks } from '../../data/simulator/roleTasks';
import './calendar.css';

// macOS Calendar replica. Events are derived from the live simulation:
// interview invitations in the inbox, Workday task deadlines, biweekly
// paydays, and employment start dates.

type CalEvent = {
  id: string;
  date: string;           // YYYY-MM-DD
  time?: string;
  title: string;
  cal: 'interviews' | 'work' | 'payroll' | 'personal';
  detail?: string;
};

const CAL_META: Record<CalEvent['cal'], { label: string; color: string }> = {
  interviews: { label: 'Interviews', color: '#ff9f0a' },
  work: { label: 'Work', color: '#0a84ff' },
  payroll: { label: 'Payroll', color: '#30d158' },
  personal: { label: 'Personal', color: '#bf5af2' },
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextMondayAfter(d: Date): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + ((1 + 7 - out.getDay()) % 7 || 7));
  return out;
}

const STAGE_LABEL: Record<string, string> = {
  'phone-screen': 'Phone Screen',
  director: 'Director Interview',
  panel: 'Panel Interview',
};

export function CalendarApp() {
  const emails = useMailStore((s) => s.emails);
  const accounts = useCompanyStore((s) => s.employerAccounts);
  const today = new Date();
  const [monthAnchor, setMonthAnchor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(ymd(today));
  const [visible, setVisible] = useState<Record<CalEvent['cal'], boolean>>({ interviews: true, work: true, payroll: true, personal: true });

  const events = useMemo<CalEvent[]>(() => {
    const out: CalEvent[] = [];

    // Interviews from inbox invitations
    emails.filter((e) => e.folder === 'inbox' && e.jobMeta && STAGE_LABEL[e.jobMeta.stage]).forEach((e) => {
      const when = nextMondayAfter(new Date(e.date));
      const time = e.jobMeta!.stage === 'phone-screen' ? '2:00 PM' : e.jobMeta!.stage === 'director' ? '3:00 PM' : '10:00 AM';
      out.push({
        id: `iv-${e.id}`,
        date: ymd(when),
        time,
        title: `${STAGE_LABEL[e.jobMeta!.stage]} — ${e.jobMeta!.company}`,
        cal: 'interviews',
        detail: `${e.jobMeta!.role} · hosted by ${e.jobMeta!.stage === 'director' ? e.jobMeta!.managerName : e.jobMeta!.recruiter} · join from the Zoom app`,
      });
    });

    // Work: task deadlines + start dates
    accounts.filter((a) => a.employmentStatus === 'active' || a.employmentStatus === 'onboarding').forEach((acc) => {
      out.push({ id: `start-${acc.id}`, date: acc.startDate, title: `First day — ${acc.companyName}`, cal: 'work', detail: `${acc.title} · ${acc.location}` });
      generateRoleTasks(acc).slice(0, 6).forEach((t) => {
        const d = new Date(t.dueAt);
        out.push({
          id: `task-${acc.id}-${t.id}`,
          date: ymd(d),
          time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          title: `Due: ${t.title}`,
          cal: 'work',
          detail: `${acc.companyName} · ${t.complexity} · submit in Workday`,
        });
      });

      // Paydays: biweekly from start date, next 4
      const start = new Date(acc.startDate);
      const pay = new Date(start);
      while (pay < today) pay.setDate(pay.getDate() + 14);
      for (let i = 0; i < 4; i++) {
        out.push({ id: `pay-${acc.id}-${i}`, date: ymd(pay), title: `Payday — ${acc.companyName}`, cal: 'payroll', detail: 'Direct deposit to Chase Total Checking ····1666' });
        pay.setDate(pay.getDate() + 14);
      }
    });

    // Personal seed
    const rent = new Date(today.getFullYear(), today.getMonth(), 28);
    out.push({ id: 'rent', date: ymd(rent), title: 'Rent due', cal: 'personal', detail: 'Autopay from Chase Total Checking' });

    return out;
  }, [emails, accounts, today]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    events.filter((e) => visible[e.cal]).forEach((e) => {
      map.set(e.date, [...(map.get(e.date) ?? []), e]);
    });
    return map;
  }, [events, visible]);

  // Month grid
  const gridDays = useMemo(() => {
    const first = new Date(monthAnchor);
    const startOffset = first.getDay();
    const cells: Date[] = [];
    const cursor = new Date(first);
    cursor.setDate(cursor.getDate() - startOffset);
    for (let i = 0; i < 42; i++) {
      cells.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return cells;
  }, [monthAnchor]);

  const monthLabel = monthAnchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  return (
    <div className="cal-shell">
      <aside className="cal-sidebar">
        <div className="cal-side-title">Calendars</div>
        {(Object.keys(CAL_META) as CalEvent['cal'][]).map((c) => (
          <label key={c} className="cal-toggle">
            <input type="checkbox" checked={visible[c]} onChange={() => setVisible((v) => ({ ...v, [c]: !v[c] }))} />
            <span className="cal-check" style={{ background: visible[c] ? CAL_META[c].color : 'transparent', borderColor: CAL_META[c].color }}>
              {visible[c] && <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.6"><path d="m3 8.5 3.5 3.5L13 5" /></svg>}
            </span>
            {CAL_META[c].label}
          </label>
        ))}
        <div className="cal-side-title cal-side-gap">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <div className="cal-agenda">
          {selectedEvents.length === 0 && <div className="cal-agenda-empty">No events</div>}
          {selectedEvents.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')).map((e) => (
            <div key={e.id} className="cal-agenda-row">
              <span className="cal-dot" style={{ background: CAL_META[e.cal].color }} />
              <div>
                <div className="cal-agenda-title">{e.title}</div>
                <div className="cal-agenda-sub">{e.time ?? 'All day'}{e.detail ? ` · ${e.detail}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="cal-main">
        <header className="cal-toolbar">
          <h1>{monthLabel}</h1>
          <div className="cal-toolbar-right">
            <div className="cal-seg">
              <button type="button" onClick={() => setMonthAnchor((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
              <button type="button" onClick={() => { setMonthAnchor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(ymd(today)); }}>Today</button>
              <button type="button" onClick={() => setMonthAnchor((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} aria-label="Next month">›</button>
            </div>
          </div>
        </header>
        <div className="cal-dow">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="cal-grid">
          {gridDays.map((d) => {
            const key = ymd(d);
            const dayEvents = eventsByDate.get(key) ?? [];
            const isToday = key === ymd(today);
            const inMonth = d.getMonth() === monthAnchor.getMonth();
            return (
              <button key={key} type="button"
                className={`cal-cell ${inMonth ? '' : 'dim'} ${key === selectedDate ? 'selected' : ''}`}
                onClick={() => setSelectedDate(key)}>
                <span className={`cal-daynum ${isToday ? 'today' : ''}`}>{d.getDate()}</span>
                <span className="cal-chips">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span key={e.id} className="cal-chip" style={{ background: `${CAL_META[e.cal].color}26`, color: CAL_META[e.cal].color }}>
                      <span className="cal-chip-dot" style={{ background: CAL_META[e.cal].color }} />
                      {e.title}
                    </span>
                  ))}
                  {dayEvents.length > 3 && <span className="cal-more">{dayEvents.length - 3} more</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
