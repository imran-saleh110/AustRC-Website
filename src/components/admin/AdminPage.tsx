import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Bell, Calendar, Trophy,
  GraduationCap, Users, Globe, LogOut,
  Loader2, Lock, ShieldAlert, Eye, EyeOff,
  MessageSquareQuote,
} from 'lucide-react';

import { DashboardHome } from './DashboardHome';
import { NoticesEditor } from './NoticesEditor';
import { EventsEditor } from './EventsEditor';
import { AchievementsEditor } from './AchievementsEditor';
import { ProjectsEditor } from './ProjectsEditor';
import { GoverningPanelEditor } from './GoverningPanelEditor';
import { SponsorsEditor } from './SponsorsEditor';
import { CollaborationsEditor } from './CollaborationsEditor';
import { TestimonialsEditor } from './TestimonialsEditor';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'austrc@admin2026';
const SESSION_KEY = 'austrc_admin_session';

const MENU = [
  { id: 'dashboard',       label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'notices',         label: 'Notices Board',      icon: Bell },
  { id: 'events',          label: 'Events Manager',     icon: Calendar },
  { id: 'achievements',    label: 'Achievements',       icon: Trophy },
  { id: 'projects',        label: 'Research Projects',  icon: GraduationCap },
  { id: 'governing-panel', label: 'Governing Panel',    icon: Users },
  { id: 'sponsors',        label: 'Sponsors',           icon: Globe },
  { id: 'collaborations',  label: 'Collaborations',     icon: Globe },
  { id: 'testimonials',    label: 'Testimonials',       icon: MessageSquareQuote },
];

/* ─────────────────────────────── styles ─────────────────────────────── */
const S = {
  root:    { display: 'flex', minHeight: '100vh', backgroundColor: '#060606', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' } as React.CSSProperties,
  sidebar: { width: 220, minWidth: 220, backgroundColor: '#030303', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' as const, flexShrink: 0 },
  brand:   { padding: '16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 },
  nav:     { flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column' as const, gap: 2 },
  main:    { flex: 1, overflowY: 'auto' as const, backgroundColor: '#0a0a0a' },
  content: { padding: '36px 40px', maxWidth: 1200 },
};

/* ─────────────────────────────── login ──────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw]           = useState('');
  const [show, setShow]       = useState(false);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    await new Promise(r => setTimeout(r, 500));
    if (pw.trim() === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      onLogin();
    } else {
      setError('Incorrect password. Access denied.');
    }
    setBusy(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* glow blob */}
      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(46,204,113,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}>
        {/* logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, overflow: 'hidden', margin: '0 auto 12px', border: '2px solid #2ECC71' }}>
            <img src="https://ik.imagekit.io/mekt2pafz/Web%20site%20team/logo.png?updatedAt=1769056096931" alt="AUSTRC" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', margin: 0, textTransform: 'uppercase' }}>Aust Robotics Club</h1>
          <p style={{ color: '#555', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', margin: '4px 0 0' }}>Database Administration Console</p>
        </div>

        {/* card */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #2ECC71, transparent)' }} />

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '10px 14px', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={15} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', color: '#555', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Admin Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                <input
                  type={show ? 'text' : 'password'}
                  autoFocus required value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="Enter admin password"
                  style={{ width: '100%', boxSizing: 'border-box', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 44px', color: '#fff', fontSize: 14, outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = '#2ECC71')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 0 }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={busy}
              style={{ background: 'linear-gradient(135deg, #2ECC71, #27AE60)', color: '#000', fontWeight: 700, fontSize: 14, border: 'none', borderRadius: 12, padding: '12px 0', cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: busy ? 0.7 : 1 }}
            >
              {busy ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Lock size={15} /> Access Admin Panel</>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#333', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginTop: 20 }}>Authorized Personnel Only • ©2026 AUSTRC</p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─────────────────────────────── sidebar button ─────────────────────── */
function NavBtn({ item, active, onClick }: { item: typeof MENU[0]; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: 600, textAlign: 'left', width: '100%',
        backgroundColor: active ? '#2ECC71' : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: active ? '#000' : hovered ? '#fff' : '#6b7280',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      <Icon size={15} style={{ flexShrink: 0 }} />
      {item.label}
    </button>
  );
}

/* ─────────────────────────────── main app ───────────────────────────── */
export function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab]           = useState('dashboard');

  useEffect(() => {
    setLoggedIn(sessionStorage.getItem(SESSION_KEY) === 'true');
    setChecking(false);

    // Force dark mode on html element so editor Tailwind classes work correctly
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.add('dark');

    return () => {
      // Restore user's original theme preference on unmount
      const stored = localStorage.getItem('theme');
      if (!hadDark && stored !== 'dark') {
        html.classList.remove('dark');
      }
    };
  }, []);

  const logout = () => {
    if (!confirm('Log out of admin panel?')) return;
    sessionStorage.removeItem(SESSION_KEY);
    setLoggedIn(false);
    setTab('dashboard');
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="#2ECC71" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  return (
    <div style={S.root}>
      {/* ── SIDEBAR ── */}
      <aside style={S.sidebar}>
        {/* brand */}
        <div style={S.brand}>
          <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
            <img src="https://ik.imagekit.io/mekt2pafz/Web%20site%20team/logo.png?updatedAt=1769056096931" alt="AUSTRC" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px' }}>AUST Robotics</div>
            <div style={{ color: '#2ECC71', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Admin Console</div>
          </div>
        </div>

        {/* nav */}
        <nav style={S.nav}>
          {MENU.map(item => (
            <NavBtn key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} />
          ))}
        </nav>

        {/* logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'transparent', color: '#ef4444' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={15} style={{ flexShrink: 0 }} /> Log Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={S.main}>
        <div style={S.content}>
          {tab === 'dashboard'       && <DashboardHome setActiveTab={setTab} />}
          {tab === 'notices'         && <NoticesEditor />}
          {tab === 'events'          && <EventsEditor />}
          {tab === 'achievements'    && <AchievementsEditor />}
          {tab === 'projects'        && <ProjectsEditor />}
          {tab === 'governing-panel' && <GoverningPanelEditor />}
          {tab === 'sponsors'        && <SponsorsEditor />}
          {tab === 'collaborations'  && <CollaborationsEditor />}
          {tab === 'testimonials'    && <TestimonialsEditor />}
        </div>
      </main>
    </div>
  );
}

export default AdminPage;
