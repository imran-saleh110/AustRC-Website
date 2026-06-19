import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Calendar, Search, Loader2, X, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminStyles } from './useAdminStyles';

interface Notice {
  id: string;
  Title: string;
  Date: any;
  Short_Description: string;
  Long_Description?: string;
}

export function NoticesEditor() {
  const s = useAdminStyles();
  const t = s.t;

  const [notices, setNotices]         = useState<Notice[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError]   = useState<string | null>(null);

  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle]         = useState('');
  const [dateStr, setDateStr]     = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc]   = useState('');

  const noticesCollection = collection(db, 'All_Data', 'Notice_Board', 'notices');

  const fetchNotices = async () => {
    try {
      setLoading(true); setFetchError(null);
      const q = query(noticesCollection, orderBy('Date', 'desc'));
      const snap = await getDocs(q);
      setNotices(snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, Title: data.Title || '', Date: data.Date, Short_Description: data.Short_Description || '', Long_Description: data.Long_Description || '' };
      }));
    } catch (err: any) {
      setFetchError(err?.code === 'permission-denied' ? 'PERMISSION_DENIED' : err?.message || 'Unknown error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotices(); }, []);

  const reset = () => { setShowForm(false); setEditingId(null); setTitle(''); setDateStr(format(new Date(), 'yyyy-MM-dd')); setShortDesc(''); setLongDesc(''); };

  const handleEdit = (n: Notice) => {
    setEditingId(n.id); setTitle(n.Title);
    const d = n.Date?.toDate ? n.Date.toDate() : new Date(n.Date || Date.now());
    setDateStr(format(d, 'yyyy-MM-dd'));
    setShortDesc(n.Short_Description); setLongDesc(n.Long_Description || '');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !shortDesc.trim()) return;
    try {
      setSaving(true);
      const payload = { Title: title, Date: Timestamp.fromDate(new Date(dateStr)), Short_Description: shortDesc, Long_Description: longDesc };
      if (editingId) await updateDoc(doc(db, 'All_Data', 'Notice_Board', 'notices', editingId), payload);
      else await addDoc(noticesCollection, payload);
      await fetchNotices(); reset();
    } catch (err) { console.error(err); alert('Failed to save notice'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notice?')) return;
    try { await deleteDoc(doc(db, 'All_Data', 'Notice_Board', 'notices', id)); await fetchNotices(); }
    catch (err) { alert('Failed to delete'); }
  };

  const filtered = notices.filter(n => n.Title.toLowerCase().includes(searchQuery.toLowerCase()) || n.Short_Description.toLowerCase().includes(searchQuery.toLowerCase()));
  const fmtDate = (d: any) => { if (!d) return ''; const dt = d.toDate ? d.toDate() : new Date(d); return format(dt, 'MMM dd, yyyy'); };

  const inputStyle = (focused: boolean): React.CSSProperties => ({ ...s.inputBase, ...(focused ? s.inputFocus : s.inputBlur) });

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: t.textPrimary, fontSize: 28, fontWeight: 800, margin: 0 }}>Notice Board</h2>
          <p style={{ color: t.textSecondary, fontSize: 13, margin: '4px 0 0' }}>Manage announcements shown on the homepage and notices page.</p>
        </div>
        <button onClick={() => { reset(); setShowForm(true); }} style={s.btnPrimary}>
          <Plus size={16} /> Add Notice
        </button>
      </div>

      {/* Permission Error */}
      {fetchError === 'PERMISSION_DENIED' && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
            <ShieldAlert size={16} /> Firestore Permission Denied — update your security rules
          </div>
          <code style={{ fontSize: 11, color: '#4ade80', background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '10px 14px', display: 'block', lineHeight: 1.8 }}>
            {'rules_version = \'2\';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    function isAdmin() {\n      return request.auth != null && request.auth.token.email in [\'webdev.austrc@gmail.com\'];\n    }\n\n    match /{document=**} {\n      allow read: if true;\n      allow create, update, delete: if isAdmin();\n    }\n  }\n}'}
          </code>
        </div>
      )}

      {/* Search */}
      <div style={s.searchWrap}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: t.textMuted, pointerEvents: 'none' }} />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search notices…" style={{ ...s.inputBase, paddingLeft: 40 }}
          onFocus={e => Object.assign(e.target.style, s.inputFocus)} onBlur={e => Object.assign(e.target.style, s.inputBlur)} />
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: 600 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${t.brandGreen}, transparent)`, borderRadius: '20px 20px 0 0' }} />
            <div style={s.modalHeader}>
              <h3 style={{ color: t.textPrimary, fontSize: 18, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Notice' : 'Add New Notice'}</h3>
              <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 4 }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={s.modalBody}>
              <div>
                <label style={s.label}>Title</label>
                <InputField value={title} onChange={setTitle} placeholder="Enter notice title" required s={s} />
              </div>
              <div>
                <label style={s.label}>Date</label>
                <input type="date" required value={dateStr} onChange={e => setDateStr(e.target.value)}
                  style={s.inputBase} onFocus={e => Object.assign(e.target.style, s.inputFocus)} onBlur={e => Object.assign(e.target.style, s.inputBlur)} />
              </div>
              <div>
                <label style={s.label}>Short Description</label>
                <TextAreaField value={shortDesc} onChange={setShortDesc} rows={3} placeholder="Brief summary…" required s={s} />
              </div>
              <div>
                <label style={s.label}>Long Description <span style={{ color: t.textMuted, fontSize: 10 }}>(Optional)</span></label>
                <TextAreaField value={longDesc} onChange={setLongDesc} rows={5} placeholder="Full details…" s={s} />
              </div>
              <div style={s.modalFooter}>
                <button type="button" onClick={reset} style={s.btnGhost}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...s.btnPrimary, opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={32} color={t.brandGreen} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>{fetchError ? 'Could not load data.' : 'No notices found. Create one using "Add Notice".'}</div>
      ) : (
        <div style={{ ...s.sectionCard, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${t.borderDefault}` }}>
                {['Date', 'Title', 'Short Description', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((n, i) => (
                <tr key={n.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${t.borderSubtle}` : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: t.textMuted, whiteSpace: 'nowrap' }}>{fmtDate(n.Date)}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: t.textPrimary, fontWeight: 600, maxWidth: 200 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.Title}</span></td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: t.textSecondary, maxWidth: 300 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.Short_Description}</span></td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button onClick={() => handleEdit(n)} style={s.btnEdit}><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(n.id)} style={s.btnDanger}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── tiny helpers so JSX stays clean ── */
function InputField({ value, onChange, placeholder, required, s, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; s: ReturnType<typeof useAdminStyles>; type?: string }) {
  const [focused, setFocused] = useState(false);
  return <input type={type} required={required} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...s.inputBase, ...(focused ? s.inputFocus : s.inputBlur) }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}
function TextAreaField({ value, onChange, placeholder, required, s, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; s: ReturnType<typeof useAdminStyles>; rows?: number }) {
  const [focused, setFocused] = useState(false);
  return <textarea required={required} rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...s.inputBase, resize: 'vertical', ...(focused ? s.inputFocus : s.inputBlur) }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}
