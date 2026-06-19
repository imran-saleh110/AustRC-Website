import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Search, Loader2, X, Trophy } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { useAdminStyles } from './useAdminStyles';

interface Achievement { id: string; Name: string; Description: string; Order: number; images: string[]; }

export function AchievementsEditor() {
  const s = useAdminStyles(); const t = s.t;
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName]           = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder]         = useState(1);
  const [images, setImages]       = useState<string[]>([]);

  const col = collection(db, 'All_Data', 'Achievement', 'achievement');

  const parse = (id: string, data: any): Achievement => {
    const imgs: string[] = [];
    for (let i = 1; i <= 10; i++) { const u = data[`Image_${i}`] || data[`image_${i}`]; if (u) imgs.push(u); }
    return { id, Name: data.Name || '', Description: data.Description || '', Order: data.Order || 0, images: imgs };
  };

  const fetch_ = async () => {
    try { setLoading(true); const q = query(col, orderBy('Order', 'asc')); const snap = await getDocs(q); setAchievements(snap.docs.map(d => parse(d.id, d.data()))); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetch_(); }, []);

  const reset = () => { setShowForm(false); setEditingId(null); setName(''); setDescription(''); setOrder(achievements.length + 1); setImages([]); };

  const handleEdit = (a: Achievement) => { setEditingId(a.id); setName(a.Name); setDescription(a.Description); setOrder(a.Order); setImages(a.images); setShowForm(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim() || !description.trim()) return;
    try {
      setSaving(true);
      const payload: any = { Name: name, Description: description, Order: Number(order) };
      images.forEach((img, i) => { payload[`Image_${i + 1}`] = img; });
      const id = editingId || doc(collection(db, 'temp')).id;
      await setDoc(doc(db, 'All_Data', 'Achievement', 'achievement', id), payload);
      await fetch_(); reset();
    } catch (e) { alert('Failed to save'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this achievement?')) return;
    try { await deleteDoc(doc(db, 'All_Data', 'Achievement', 'achievement', id)); await fetch_(); }
    catch { alert('Failed to delete'); }
  };

  const filtered = achievements.filter(a => a.Name.toLowerCase().includes(searchQuery.toLowerCase()) || a.Description.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .ai-input:focus { border-color: ${t.brandGreen} !important; }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: t.textPrimary, fontSize: 28, fontWeight: 800, margin: 0 }}>Achievements Board</h2>
          <p style={{ color: t.textSecondary, fontSize: 13, margin: '4px 0 0' }}>Add and edit club achievements, awards, and trophy images.</p>
        </div>
        <button onClick={() => { reset(); setShowForm(true); }} style={s.btnPrimary}><Plus size={16} /> Add Achievement</button>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: t.textMuted, pointerEvents: 'none' }} />
        <input className="ai-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search achievements…"
          style={{ ...s.inputBase, paddingLeft: 40 }} />
      </div>

      {/* Modal */}
      {showForm && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: 700 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${t.brandGreen}, transparent)`, borderRadius: '20px 20px 0 0' }} />
            <div style={s.modalHeader}>
              <h3 style={{ color: t.textPrimary, fontSize: 18, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Achievement' : 'Add Achievement'}</h3>
              <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={s.modalBody}>
              <div>
                <label style={s.label}>Achievement Name / Title</label>
                <input className="ai-input" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Champion – National Robotics Competition 2025" style={s.inputBase} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={s.label}>Display Order</label>
                  <input className="ai-input" type="number" required value={order} onChange={e => setOrder(Number(e.target.value))} style={s.inputBase} />
                </div>
              </div>
              <div>
                <label style={s.label}>Description</label>
                <textarea className="ai-input" required rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Details about the award, participants, and project…" style={{ ...s.inputBase, resize: 'vertical' }} />
              </div>
              {/* Images */}
              <div style={s.divider}>
                <div>
                  <h4 style={{ color: t.textPrimary, fontSize: 14, fontWeight: 700, margin: 0 }}>Carousel Images <span style={{ color: t.textMuted, fontWeight: 400 }}>(Max 10)</span></h4>
                  <p style={{ color: t.textSecondary, fontSize: 12, margin: '4px 0 0' }}>Upload one or more photos from the event.</p>
                </div>
                {images.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                    {images.map((img, i) => (
                      <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: `1px solid ${t.borderDefault}` }}>
                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                          style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#fff', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {images.length < 10 && <ImageUpload label="" onUploadComplete={url => setImages([...images, url])} />}
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

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Loader2 size={32} color={t.brandGreen} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>No achievements found. Click "Add Achievement" to create one.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(ach => (
            <div key={ach.id} style={s.card}>
              <div style={s.cardBody}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(46,204,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trophy size={16} color={t.brandGreen} />
                  </div>
                  <span style={s.tag}>#{ach.Order}</span>
                </div>
                <h3 style={{ color: t.textPrimary, fontSize: 15, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ach.Name}</h3>
                <p style={{ color: t.textSecondary, fontSize: 13, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ach.Description}</p>
                {ach.images.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
                    {ach.images.map((img, i) => <img key={i} src={img} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: `1px solid ${t.borderDefault}`, flexShrink: 0 }} />)}
                  </div>
                )}
              </div>
              <div style={s.cardFooter}>
                <button onClick={() => handleEdit(ach)} style={s.btnEdit}><Edit2 size={13} /> Edit</button>
                <button onClick={() => handleDelete(ach.id)} style={s.btnDanger}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
