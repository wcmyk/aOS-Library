import { useEffect, useRef } from 'react';
import { useNotifyStore } from '../state/useNotifyStore';
import { useMailStore } from '../state/useMailStore';
import { useMessagesStore } from '../state/useMessagesStore';
import { apps } from '../data/apps';
import './notificationcenter.css';

// macOS-style notification banners, top-right. Watches the mail and messages
// stores so every new inbox email or text produces a banner regardless of
// which app is focused.

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function NotificationCenter() {
  const banners = useNotifyStore((s) => s.banners);
  const dismiss = useNotifyStore((s) => s.dismiss);
  const push = useNotifyStore((s) => s.push);
  const emails = useMailStore((s) => s.emails);
  const threads = useMessagesStore((s) => s.threads);
  const seenEmails = useRef<Set<string> | null>(null);
  const seenTexts = useRef<Map<string, number> | null>(null);

  useEffect(() => {
    const inbox = emails.filter((e) => e.folder === 'inbox');
    if (seenEmails.current === null) {
      seenEmails.current = new Set(inbox.map((e) => e.id));
      return;
    }
    inbox.forEach((e) => {
      if (!seenEmails.current!.has(e.id)) {
        seenEmails.current!.add(e.id);
        push({ appId: 'outlook', appName: 'Outlook', title: e.subject, body: stripHtml(e.body).slice(0, 110) });
      }
    });
  }, [emails, push]);

  useEffect(() => {
    if (seenTexts.current === null) {
      seenTexts.current = new Map(threads.map((t) => [t.id, t.messages.length]));
      return;
    }
    threads.forEach((t) => {
      const prev = seenTexts.current!.get(t.id) ?? 0;
      if (t.messages.length > prev) {
        const latest = t.messages[t.messages.length - 1];
        if (!latest.fromMe) {
          push({ appId: 'messages', appName: 'Messages', title: t.sender, body: latest.text.slice(0, 110) });
        }
        seenTexts.current!.set(t.id, t.messages.length);
      }
    });
  }, [threads, push]);

  if (banners.length === 0) return null;

  return (
    <div className="ntc-stack">
      {banners.map((b) => {
        const app = apps.find((a) => a.id === b.appId);
        return (
          <div key={b.id} className="ntc-banner" onClick={() => dismiss(b.id)}>
            {app && <img src={app.icon} alt="" className="ntc-icon" />}
            <div className="ntc-body">
              <div className="ntc-app">{b.appName}</div>
              <div className="ntc-title">{b.title}</div>
              <div className="ntc-text">{b.body}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
