import { useEffect, useMemo, useRef, useState } from 'react';
import { useMailStore, type Email, type JobMeta } from '../../state/useMailStore';
import { useProfileStore } from '../../state/useProfileStore';
import { advanceStage } from '../outlook/OutlookApp';
import { CompanyLogo } from '../../data/brands';
import './zoom.css';

// Zoom replica with live interviews. Interview invitations in the inbox
// become joinable meetings; the interviewer asks stage- and role-specific
// questions in the meeting, and completing the conversation advances the
// hiring pipeline (the follow-up lands in your email).

const BASE_URL = import.meta.env.BASE_URL;

type Stage = 'phone-screen' | 'director' | 'panel';

const STAGE_LABEL: Record<Stage, string> = {
  'phone-screen': 'Phone Screen',
  director: 'Director Interview',
  panel: 'Panel Interview',
};

const DONE_KEY = 'zm_done_interviews';
const loadDone = (): Record<string, boolean> => {
  try { return JSON.parse(localStorage.getItem(DONE_KEY) ?? '{}'); } catch { return {}; }
};

function questionsFor(meta: JobMeta): string[] {
  const role = meta.role;
  if (meta.stage === 'phone-screen') {
    return [
      `Thanks for making the time. To start, walk me through your background and what drew you to the ${role} opening at ${meta.company}.`,
      'What is a project you are genuinely proud of? What was your specific contribution, and what would you do differently now?',
      `What do you know about ${meta.company}, and why this team rather than somewhere else?`,
      'Logistics before we wrap: what is your timeline, and are there other processes we should know about?',
    ];
  }
  if (meta.stage === 'director') {
    return [
      `Good to meet you. I lead the org this ${role} sits in. Tell me about the most complex piece of work you have owned end to end.`,
      'Describe a time you disagreed with a teammate or a decision. How did you handle it, and how did it resolve?',
      'When you join a new team, how do you ramp up? What would your first 30 days here look like?',
      'What questions do you have for me about the roadmap or the team?',
    ];
  }
  return [
    `Welcome to the panel. First, a technical one: for the kind of work a ${role} does here, walk us through how you would approach a problem you have never seen before — be concrete about your process.`,
    'Tell us about a time something you shipped went wrong in production or with a client. What happened, and what did you change afterward?',
    'Design question: sketch, in words, how you would structure a solution that has to scale to 10x its initial load. What breaks first?',
    'Last one from the culture side: what kind of feedback is hardest for you to hear, and how do you want a manager to deliver it?',
  ];
}

export function ZoomApp() {
  const emails = useMailStore((s) => s.emails);
  const sendEmail = useMailStore((s) => s.sendEmail);
  const fullName = useProfileStore((s) => s.fullName);
  const [tab, setTab] = useState<'home' | 'meetings'>('home');
  const [inCall, setInCall] = useState<Email | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>(loadDone);
  const [transcript, setTranscript] = useState<Array<{ who: 'them' | 'me'; text: string }>>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [typing, setTyping] = useState(false);
  const [wrapped, setWrapped] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const interviews = useMemo(() =>
    emails.filter((e) => e.folder === 'inbox' && e.jobMeta && (e.jobMeta.stage === 'phone-screen' || e.jobMeta.stage === 'director' || e.jobMeta.stage === 'panel')),
    [emails]);
  const upcoming = interviews.filter((e) => !done[e.id]);

  const meta = inCall?.jobMeta ?? null;
  const questions = useMemo(() => (meta ? questionsFor(meta) : []), [meta]);
  const interviewer = meta
    ? meta.stage === 'director'
      ? { name: meta.managerName, title: 'Director of Engineering', photo: `${BASE_URL}assets/zoom/interviewer-m.webp` }
      : { name: meta.recruiter, title: 'Talent Acquisition', photo: `${BASE_URL}assets/zoom/interviewer-f.webp` }
    : null;

  const startCall = (e: Email) => {
    setInCall(e);
    setTranscript([]);
    setQIndex(0);
    setWrapped(false);
    setAnswer('');
    setTyping(true);
    setTimeout(() => {
      setTranscript([{ who: 'them', text: `Hi ${fullName.split(' ')[0]}, can you hear me alright? Great — let's get started.` }]);
      setTimeout(() => {
        setTranscript((t) => [...t, { who: 'them', text: questionsFor(e.jobMeta!)[0] }]);
        setTyping(false);
      }, 1400);
    }, 900);
  };

  const submitAnswer = () => {
    const text = answer.trim();
    if (!text || typing || wrapped || !meta || !inCall) return;
    setTranscript((t) => [...t, { who: 'me', text }]);
    setAnswer('');
    const next = qIndex + 1;
    setTyping(true);
    setTimeout(() => {
      if (next < questions.length) {
        const ack = ['Thanks, that helps.', 'Understood — good context.', 'Great, noted.'][next % 3];
        setTranscript((t) => [...t, { who: 'them', text: `${ack} ${questions[next]}` }]);
        setQIndex(next);
      } else {
        setTranscript((t) => [...t, { who: 'them', text: `That's everything from my side — thank you, this was a strong conversation. The team will review notes and you'll hear from us by email with next steps. Have a great rest of your day.` }]);
        setWrapped(true);
        const updated = { ...done, [inCall.id]: true };
        setDone(updated);
        localStorage.setItem(DONE_KEY, JSON.stringify(updated));
        setTimeout(() => advanceStage(meta, (e) => sendEmail({ ...e, folder: 'inbox' })), 2500);
      }
      setTyping(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 60);
    }, 1500);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 60);
  };

  // ── In-call view ──
  if (inCall && meta && interviewer) {
    return (
      <div className="zm-shell zm-call">
        <header className="zm-call-top">
          <span className="zm-shield">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#6ecf6e"><path d="M12 2 4 5v6c0 5 3.4 9.2 8 11 4.6-1.8 8-6 8-11V5zm-1.8 13.5-3.2-3.2 1.4-1.4 1.8 1.8 4.6-4.6 1.4 1.4z" /></svg>
          </span>
          Zoom Meeting — {STAGE_LABEL[meta.stage as Stage]} · {meta.company}
          <span className="zm-call-clock">{clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </header>

        <div className="zm-call-body">
          <div className="zm-stage">
            <div className="zm-tile zm-tile-main">
              <img src={interviewer.photo} alt="" />
              <span className="zm-tile-name">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z" /></svg>
                {interviewer.name} ({interviewer.title})
              </span>
            </div>
            <div className="zm-tile zm-tile-self">
              {videoOff
                ? <span className="zm-self-initials">{fullName.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                : <span className="zm-self-cam">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="rgba(255,255,255,0.35)"><circle cx="12" cy="8.5" r="3.8" /><path d="M4 20.5a8 8 0 0 1 16 0z" /></svg>
                  </span>}
              <span className="zm-tile-name">{fullName} (You){muted ? ' · Muted' : ''}</span>
            </div>
          </div>

          <aside className="zm-chatpane">
            <div className="zm-chatpane-head">Meeting Chat</div>
            <div className="zm-transcript" ref={scrollRef}>
              {transcript.map((m, i) => (
                <div key={i} className={`zm-msg ${m.who}`}>
                  <span className="zm-msg-who">{m.who === 'them' ? interviewer.name : 'You'}</span>
                  <p>{m.text}</p>
                </div>
              ))}
              {typing && <div className="zm-typing">{interviewer.name} is speaking…</div>}
              {wrapped && <div className="zm-wrapdone">Interview complete. Watch your inbox for next steps.</div>}
            </div>
            <div className="zm-answerbox">
              <textarea
                rows={3}
                placeholder={wrapped ? 'The interview has ended.' : 'Type your answer…'}
                value={answer}
                disabled={wrapped}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }}
              />
              <button type="button" onClick={submitAnswer} disabled={wrapped || !answer.trim()}>Send</button>
            </div>
          </aside>
        </div>

        <footer className="zm-toolbar">
          <button type="button" className={muted ? 'zm-danger-text' : ''} onClick={() => setMuted((m) => !m)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z" />{muted && <path d="M4 4 L20 20" stroke="#e02828" strokeWidth="2.4" />}</svg>
            {muted ? 'Unmute' : 'Mute'}
          </button>
          <button type="button" className={videoOff ? 'zm-danger-text' : ''} onClick={() => setVideoOff((v) => !v)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="6" width="12" height="12" rx="2" /><path d="M15 12.5 21 16V8z" />{videoOff && <path d="M3 4 L21 20" stroke="#e02828" strokeWidth="2.4" />}</svg>
            {videoOff ? 'Start Video' : 'Stop Video'}
          </button>
          <button type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8.5" r="3" /><path d="M3 19a6 6 0 0 1 12 0z" /><circle cx="17" cy="9.5" r="2.4" /><path d="M14.5 19c0-2 1.2-3.7 3-4.4 1.9.7 3 2.4 3 4.4z" /></svg>
            Participants
          </button>
          <button type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.7 2 11.2c0 2.5 1.3 4.7 3.4 6.2L4 21l4.2-1.7c1.2.3 2.5.5 3.8.5 5.5 0 10-3.7 10-8.2S17.5 3 12 3z" /></svg>
            Chat
          </button>
          <button type="button" className="zm-share">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="13" rx="2" /><path d="M12 15V8.5M9 11l3-3 3 3" stroke="#0b5c1d" strokeWidth="2" fill="none" /></svg>
            Share Screen
          </button>
          <button type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.5" fill="#e02828" stroke="none" /></svg>
            Record
          </button>
          <button type="button" className="zm-leave" onClick={() => setInCall(null)}>Leave</button>
        </footer>
      </div>
    );
  }

  // ── Client home ──
  return (
    <div className="zm-shell">
      <header className="zm-nav">
        <span className="zm-logo">zoom</span>
        <nav>
          <button type="button" className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>Home</button>
          <button type="button" className={tab === 'meetings' ? 'active' : ''} onClick={() => setTab('meetings')}>Meetings</button>
          <button type="button">Team Chat</button>
          <button type="button">Contacts</button>
        </nav>
        <span className="zm-nav-avatar">{fullName.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
      </header>

      <div className="zm-home">
        <div className="zm-actions">
          <button type="button" className="zm-action zm-action-orange">
            <span><svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><rect x="3" y="6" width="12" height="12" rx="2" /><path d="M15 12.5 21 16V8z" /></svg></span>
            New Meeting
          </button>
          <button type="button" className="zm-action">
            <span><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg></span>
            Join
          </button>
          <button type="button" className="zm-action">
            <span><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></svg></span>
            Schedule
          </button>
          <button type="button" className="zm-action">
            <span><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><rect x="3" y="5" width="18" height="13" rx="2" /><path d="M12 15V8.5M9 11l3-3 3 3" /></svg></span>
            Share Screen
          </button>
        </div>

        <div className="zm-panel">
          <div className="zm-clock">
            <div className="zm-time">{clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
            <div className="zm-date">{clock.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>
          <div className="zm-upcoming-title">{upcoming.length > 0 ? 'Upcoming interviews' : 'No upcoming meetings'}</div>
          {upcoming.length === 0 && (
            <p className="zm-empty">Interview invitations you receive by email appear here automatically, ready to join.</p>
          )}
          {upcoming.map((e) => (
            <div key={e.id} className="zm-meeting">
              <CompanyLogo company={e.jobMeta!.company} size={34} />
              <div className="zm-meeting-main">
                <strong>{STAGE_LABEL[e.jobMeta!.stage as Stage]} — {e.jobMeta!.role}</strong>
                <span>{e.jobMeta!.company} · Host: {e.jobMeta!.stage === 'director' ? e.jobMeta!.managerName : e.jobMeta!.recruiter}</span>
              </div>
              <button type="button" className="zm-join" onClick={() => startCall(e)}>Join</button>
            </div>
          ))}
          {interviews.filter((e) => done[e.id]).length > 0 && (
            <div className="zm-done-note">
              {interviews.filter((e) => done[e.id]).length} completed interview{interviews.filter((e) => done[e.id]).length > 1 ? 's' : ''} — feedback arrives by email.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
