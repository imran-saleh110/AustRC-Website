import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Search, Loader2, X, Globe } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { useAdminStyles } from './useAdminStyles';

interface Collaboration { id: string; clubName: string; eventName: string; logoUrl: string; }

export function CollaborationsEditor() {
  const s = useAdminStyles(); const t = s.t;
  const [collabs, setCollabs] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clubName, setClubName]   = useState('');
  const [eventName, setEventName] = useState('');
  const [logoUrl, setLogoUrl]     = useState('');

  const col = collection(db, 'collaborations');

  const fetch_ = async () => {
    try { setLoading(true); const snap = await getDocs(col); setCollabs(snap.docs.map(d => { const data = d.data(); return { id: d.id, clubName: data.clubName || '', eventName: data.eventName || '', logoUrl: data.logoUrl || '' }; })); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetch_(); }, []);

  const reset = () => { setShowForm(false); setEditingId(null); setClubName(''); setEventName(''); setLogoUrl(''); };
  const handleEdit = (c: Collaboration) => { setEditingId(c.id); setClubName(c.clubName); setEventName(c.eventName); setLogoUrl(c.logoUrl); setShowForm(true); };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!clubName.trim() || !eventName.trim() || !logoUrl) return;
    try { setSaving(true); const id = editingId || doc(collection(db, 'temp')).id; await setDoc(doc(db, 'collaborations', id), { clubName, eventName, logoUrl }); await fetch_(); reset(); }
    catch { alert('Failed to save'); } finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collaboration?')) return;
    try { await deleteDoc(doc(db, 'collaborations', id)); await fetch_(); } catch { alert('Failed to delete'); }
  };

  const filtered = collabs.filter(c => c.clubName.toLowerCase().includes(searchQuery.toLowerCase()) || c.eventName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .ai-input:focus { border-color: ${t.brandGreen} !important; }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: t.textPrimary, fontSize: 28, fontWeight: 800, margin: 0 }}>Collaborations</h2>
          <p style={{ color: t.textSecondary, fontSize: 13, margin: '4px 0 0' }}>Manage partner university clubs and co-organized tech events.</p>
        </div>
        <button onClick={() => { reset(); setShowForm(true); }} style={s.btnPrimary}><Plus size={16} /> Add Collaboration</button>
      </div>

      <div style={s.searchWrap}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: t.textMuted, pointerEvents: 'none' }} />
        <input className="ai-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search collaborations…" style={{ ...s.inputBase, paddingLeft: 40 }} />
      </div>

      {showForm && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: 640 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${t.brandGreen}, transparent)`, borderRadius: '20px 20px 0 0' }} />
            <div style={s.modalHeader}>
              <h3 style={{ color: t.textPrimary, fontSize: 18, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Collaboration' : 'Add Collaboration'}</h3>
              <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={s.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={s.label}>Partner Club Name</label>
                    <input className="ai-input" required value={clubName} onChange={e => setClubName(e.target.value)} placeholder="e.g. DU Robotics Club" style={s.inputBase} />
                  </div>
                  <div>
                    <label style={s.label}>Co-organized Event Details</label>
                    <textarea className="ai-input" required rows={5} value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. Collaborated to organize DU Tech Fest 2025…" style={{ ...s.inputBase, resize: 'vertical' }} />
                  </div>
                </div>
                <ImageUpload label="Partner Club Logo" currentUrl={logoUrl} onUploadComplete={setLogoUrl} onClear={() => setLogoUrl('')} />
              </div>
              <div style={s.modalFooter}>
                <button type="button" onClick={reset} style={s.btnGhost}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...s.btnPrimary, opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Loader2 size={32} color={t.brandGreen} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>No collaborations found. Click "Add Collaboration" to create one.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {filtered.map(col => (
            <div key={col.id} style={s.card}>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                <div style={{ aspectRatio: '1', background: '#fff', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={col.logoUrl} alt={col.clubName} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
                <h4 style={{ color: t.textPrimary, fontSize: 13, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.clubName}</h4>
                <p style={{ color: t.brandGreen, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{col.eventName}</p>
              </div>
              <div style={s.cardFooter}>
                <button onClick={() => handleEdit(col)} style={s.btnEdit}><Edit2 size={12} /> Edit</button>
                <button onClick={() => handleDelete(col.id)} style={s.btnDanger}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
