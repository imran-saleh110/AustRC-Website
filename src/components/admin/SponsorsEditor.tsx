import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Search, Loader2, X, User, Phone } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { useAdminStyles } from './useAdminStyles';

interface Sponsor { id: string; name: string; service: string; logoUrl: string; priority?: number; contactPerson?: string; contactNumber?: string; }

export function SponsorsEditor() {
  const s = useAdminStyles(); const t = s.t;
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName]           = useState('');
  const [service, setService]     = useState('');
  const [logoUrl, setLogoUrl]     = useState('');
  const [priority, setPriority]   = useState(99);
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const col = collection(db, 'sponsors');

  const fetch_ = async () => {
    try {
      setLoading(true); const snap = await getDocs(col);
      const items = snap.docs.map(d => { const data = d.data(); return { id: d.id, name: data.name || '', service: data.service || '', logoUrl: data.logoUrl || '', priority: data.priority ?? 99, contactPerson: data.contactPerson || '', contactNumber: data.contactNumber || '' }; });
      setSponsors(items.sort((a, b) => (a.priority || 99) - (b.priority || 99)));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetch_(); }, []);

  const reset = () => { setShowForm(false); setEditingId(null); setName(''); setService(''); setLogoUrl(''); setPriority(99); setContactPerson(''); setContactNumber(''); };
  const handleEdit = (sp: Sponsor) => { setEditingId(sp.id); setName(sp.name); setService(sp.service); setLogoUrl(sp.logoUrl); setPriority(sp.priority || 99); setContactPerson(sp.contactPerson || ''); setContactNumber(sp.contactNumber || ''); setShowForm(true); };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim() || !service.trim() || !logoUrl) return;
    try { setSaving(true); const id = editingId || doc(collection(db, 'temp')).id; await setDoc(doc(db, 'sponsors', id), { name, service, logoUrl, priority: Number(priority), contactPerson, contactNumber }); await fetch_(); reset(); }
    catch { alert('Failed to save'); } finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sponsor?')) return;
    try { await deleteDoc(doc(db, 'sponsors', id)); await fetch_(); } catch { alert('Failed to delete'); }
  };

  const filtered = sponsors.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.service.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .ai-input:focus { border-color: ${t.brandGreen} !important; }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: t.textPrimary, fontSize: 28, fontWeight: 800, margin: 0 }}>Sponsors</h2>
          <p style={{ color: t.textSecondary, fontSize: 13, margin: '4px 0 0' }}>Add and edit companies sponsoring AUST Robotics Club events.</p>
        </div>
        <button onClick={() => { reset(); setShowForm(true); }} style={s.btnPrimary}><Plus size={16} /> Add Sponsor</button>
      </div>

      <div style={s.searchWrap}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: t.textMuted, pointerEvents: 'none' }} />
        <input className="ai-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search sponsors…" style={{ ...s.inputBase, paddingLeft: 40 }} />
      </div>

      {showForm && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: 680 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${t.brandGreen}, transparent)`, borderRadius: '20px 20px 0 0' }} />
            <div style={s.modalHeader}>
              <h3 style={{ color: t.textPrimary, fontSize: 18, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Sponsor' : 'Add Sponsor'}</h3>
              <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={s.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={s.label}>Sponsor Name</label>
                    <input className="ai-input" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Huawei Technologies" style={s.inputBase} />
                  </div>
                  <div>
                    <label style={s.label}>Service Provided</label>
                    <input className="ai-input" required value={service} onChange={e => setService(e.target.value)} placeholder="e.g. Title Sponsor or Food Partner" style={s.inputBase} />
                  </div>
                  <div>
                    <label style={s.label}>Priority Order</label>
                    <input className="ai-input" type="number" required value={priority} onChange={e => setPriority(Number(e.target.value))} style={s.inputBase} />
                  </div>
                </div>
                <ImageUpload label="Sponsor Logo" currentUrl={logoUrl} onUploadComplete={setLogoUrl} onClear={() => setLogoUrl('')} />
              </div>
              <div style={s.divider}>
                <h4 style={{ color: t.textPrimary, fontSize: 13, fontWeight: 700, margin: 0 }}>Contact Information <span style={{ color: t.textMuted, fontWeight: 400 }}>(Optional)</span></h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={s.label}>Contact Person</label>
                    <input className="ai-input" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="e.g. John Doe" style={s.inputBase} />
                  </div>
                  <div>
                    <label style={s.label}>Contact Number</label>
                    <input className="ai-input" value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="e.g. +88017…" style={s.inputBase} />
                  </div>
                </div>
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
        <div style={s.empty}>No sponsors found. Click "Add Sponsor" to create one.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {filtered.map(sp => (
            <div key={sp.id} style={s.card}>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                <div style={{ aspectRatio: '1', background: '#fff', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={sp.logoUrl} alt={sp.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
                <h4 style={{ color: t.textPrimary, fontSize: 13, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sp.name}</h4>
                <p style={{ color: t.brandGreen, fontSize: 11, fontWeight: 700, margin: 0 }}>{sp.service}</p>
                <span style={s.tag}>Priority: {sp.priority}</span>
                {sp.contactPerson && <p style={{ color: t.textMuted, fontSize: 11, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><User size={10} />{sp.contactPerson}</p>}
              </div>
              <div style={s.cardFooter}>
                <button onClick={() => handleEdit(sp)} style={s.btnEdit}><Edit2 size={12} /> Edit</button>
                <button onClick={() => handleDelete(sp.id)} style={s.btnDanger}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
