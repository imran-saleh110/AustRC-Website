import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Search, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { useAdminStyles } from './useAdminStyles';

interface Headline {
  heading: string;
  description: string;
  images: string[];
}

interface EventData {
  id: string;
  Event_Name: string;
  Cover_Picture: string;
  Introduction: string;
  Order: number;
  headlines: Headline[];
}

export function EventsEditor() {
  const s = useAdminStyles(); const t = s.t;
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eventName, setEventName] = useState('');
  const [coverPicture, setCoverPicture] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [order, setOrder] = useState(1);
  const [headlines, setHeadlines] = useState<Headline[]>([]);

  const eventsCollection = collection(db, 'All_Data', 'Event_Page', 'All_Events_of_RC');

  // Convert flattened Firestore structure into structured EventData
  const parseFirestoreEvent = (docId: string, data: any): EventData => {
    const headlines: Headline[] = [];
    for (let i = 1; i <= 10; i++) {
      const heading = data[`Headline_${i}`] || data[`headline_${i}`];
      const description = data[`Headline_${i}_description`] || data[`headline_${i}_description`];
      
      if (heading) {
        const images: string[] = [];
        for (let j = 1; j <= 10; j++) {
          const imgUrl = data[`Headline_${i}_Image_${j}`] || data[`Headline_${i}_image_${j}`] || data[`Headline_${i}_img_${j}`] || data[`Headline_${i}_IMG_${j}`];
          if (imgUrl) {
            images.push(imgUrl);
          }
        }
        headlines.push({
          heading,
          description: description || '',
          images,
        });
      }
    }

    return {
      id: docId,
      Event_Name: data.Event_Name || '',
      Cover_Picture: data.Cover_Picture || '',
      Introduction: data.Introduction || '',
      Order: data.Order || 0,
      headlines,
    };
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const q = query(eventsCollection, orderBy('Order', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetched: EventData[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push(parseFirestoreEvent(doc.id, doc.data()));
      });
      setEvents(fetched);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEdit = (event: EventData) => {
    setEditingId(event.id);
    setEventName(event.Event_Name);
    setCoverPicture(event.Cover_Picture);
    setIntroduction(event.Introduction);
    setOrder(event.Order);
    setHeadlines(event.headlines);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setEventName('');
    setCoverPicture('');
    setIntroduction('');
    setOrder(events.length + 1);
    setHeadlines([]);
  };

  // Headline Management
  const addHeadline = () => {
    if (headlines.length >= 10) return;
    setHeadlines([...headlines, { heading: '', description: '', images: [] }]);
  };

  const removeHeadline = (index: number) => {
    setHeadlines(headlines.filter((_, i) => i !== index));
  };

  const updateHeadlineField = (index: number, field: keyof Omit<Headline, 'images'>, value: string) => {
    const updated = [...headlines];
    updated[index][field] = value;
    setHeadlines(updated);
  };

  const addHeadlineImage = (headlineIndex: number, url: string) => {
    const updated = [...headlines];
    if (updated[headlineIndex].images.length >= 10) return;
    updated[headlineIndex].images.push(url);
    setHeadlines(updated);
  };

  const removeHeadlineImage = (headlineIndex: number, imageIndex: number) => {
    const updated = [...headlines];
    updated[headlineIndex].images = updated[headlineIndex].images.filter((_, i) => i !== imageIndex);
    setHeadlines(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !introduction.trim()) return;

    try {
      setSaving(true);
      
      // Construct flat payload
      const payload: any = {
        Event_Name: eventName,
        Cover_Picture: coverPicture,
        Introduction: introduction,
        Order: Number(order),
      };

      // Populate flat headlines
      headlines.forEach((hl, i) => {
        const index = i + 1;
        payload[`Headline_${index}`] = hl.heading;
        payload[`Headline_${index}_description`] = hl.description;
        
        hl.images.forEach((img, j) => {
          payload[`Headline_${index}_Image_${j + 1}`] = img;
        });
      });

      // Use either editingId or create a new document
      const docId = editingId || doc(collection(db, 'temp')).id;
      const docRef = doc(db, 'All_Data', 'Event_Page', 'All_Events_of_RC', docId);

      // Overwrite completely to remove old deleted fields
      await setDoc(docRef, payload);

      await fetchEvents();
      handleCloseForm();
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event? All headlines will be deleted.')) return;
    try {
      const docRef = doc(db, 'All_Data', 'Event_Page', 'All_Events_of_RC', id);
      await deleteDoc(docRef);
      await fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
    }
  };

  const filteredEvents = events.filter(
    (e) =>
      e.Event_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.Introduction.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .ai-input:focus { border-color: ${t.brandGreen} !important; }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: t.textPrimary, fontSize: 28, fontWeight: 800, margin: 0 }}>Events Manager</h2>
          <p style={{ color: t.textSecondary, fontSize: 13, margin: '4px 0 0' }}>Create and edit robotics events, segmented details, and image galleries.</p>
        </div>
        <button onClick={() => { handleCloseForm(); setShowForm(true); }} style={s.btnPrimary}>
          <Plus size={16} /> Add Event
        </button>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: t.textMuted, pointerEvents: 'none' }} />
        <input className="ai-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search events…" style={{ ...s.inputBase, paddingLeft: 40 }} />
      </div>

      {/* Editor Modal */}
      {showForm && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: 800 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${t.brandGreen}, transparent)`, borderRadius: '20px 20px 0 0' }} />
            <div style={s.modalHeader}>
              <h3 style={{ color: t.textPrimary, fontSize: 18, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Event' : 'Add New Event'}</h3>
              <button onClick={handleCloseForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} style={s.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={s.label}>Event Name</label>
                    <input className="ai-input" required value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. AUST Rover Challenge 2026" style={s.inputBase} />
                  </div>
                  <div>
                    <label style={s.label}>Display Order</label>
                    <input className="ai-input" type="number" required value={order} onChange={e => setOrder(Number(e.target.value))} style={s.inputBase} />
                  </div>
                  <div>
                    <label style={s.label}>Introduction</label>
                    <textarea className="ai-input" required rows={6} value={introduction} onChange={e => setIntroduction(e.target.value)} placeholder="Introductory description of the event…" style={{ ...s.inputBase, resize: 'vertical' }} />
                  </div>
                </div>
                <ImageUpload label="Cover Picture" currentUrl={coverPicture} onUploadComplete={url => setCoverPicture(url)} onClear={() => setCoverPicture('')} />
              </div>

              <div style={s.divider}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ color: t.textPrimary, fontSize: 15, fontWeight: 700, margin: 0 }}>Event Headlines / Gallery Sections</h4>
                    <p style={{ color: t.textSecondary, fontSize: 12, margin: '4px 0 0' }}>Add segment details, winners sections, or specific milestones (Max 10).</p>
                  </div>
                  <button type="button" onClick={addHeadline} disabled={headlines.length >= 10}
                    style={{ background: 'rgba(46,204,113,0.08)', color: t.brandGreen, border: `1px solid rgba(46,204,113,0.25)`, borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={14} /> Add Section
                  </button>
                </div>

                {headlines.length === 0 ? (
                  <div style={s.empty}>No sections added yet. Add a section to showcase segment descriptions or photos.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {headlines.map((hl, i) => (
                      <div key={i} style={{ border: `1px solid ${t.borderDefault}`, borderRadius: 14, padding: 16, background: 'rgba(255,255,255,0.02)', position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <button type="button" onClick={() => removeHeadline(i)}
                          style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', color: '#f87171', padding: '5px 8px' }}>
                          <Trash2 size={13} />
                        </button>
                        <span style={{ ...s.tag, alignSelf: 'flex-start' }}>Section #{i + 1}</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                              <label style={s.label}>Heading Title</label>
                              <input className="ai-input" required value={hl.heading} onChange={e => updateHeadlineField(i, 'heading', e.target.value)} placeholder="e.g. Rover segment or Winners list" style={s.inputBase} />
                            </div>
                            <div>
                              <label style={s.label}>Section Description</label>
                              <textarea className="ai-input" rows={4} value={hl.description} onChange={e => updateHeadlineField(i, 'description', e.target.value)} placeholder="Details about this segment/section…" style={{ ...s.inputBase, resize: 'vertical' }} />
                            </div>
                          </div>
                          <div>
                            <label style={s.label}>Gallery Images (Max 10)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
                              {hl.images.map((img, imgIdx) => (
                                <div key={imgIdx} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.borderDefault}` }}>
                                  <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button type="button" onClick={() => removeHeadlineImage(i, imgIdx)}
                                    style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#fff', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <X size={10} /></button>
                                </div>
                              ))}
                            </div>
                            {hl.images.length < 10 && <ImageUpload label="" onUploadComplete={url => addHeadlineImage(i, url)} />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={s.modalFooter}>
                <button type="button" onClick={handleCloseForm} style={s.btnGhost}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...s.btnPrimary, opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Loader2 size={32} color={t.brandGreen} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filteredEvents.length === 0 ? (
        <div style={s.empty}>No events found. Click "Add Event" to create one.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredEvents.map(event => (
            <div key={event.id} style={s.card}>
              <div style={{ aspectRatio: '16/9', background: t.pageBgAlt, position: 'relative', overflow: 'hidden' }}>
                {event.Cover_Picture ? (
                  <img src={event.Cover_Picture} alt={event.Event_Name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted }}><ImageIcon size={36} /></div>
                )}
                <div style={{ position: 'absolute', top: 10, left: 10, ...s.tag }}>#{event.Order}</div>
              </div>
              <div style={s.cardBody}>
                <h3 style={{ color: t.textPrimary, fontSize: 15, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.Event_Name}</h3>
                <p style={{ color: t.textSecondary, fontSize: 13, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.Introduction}</p>
                <p style={{ color: t.brandGreen, fontSize: 11, fontWeight: 700, margin: 0 }}>{event.headlines.length} segments / galleries</p>
              </div>
              <div style={s.cardFooter}>
                <button onClick={() => handleEdit(event)} style={s.btnEdit}><Edit2 size={13} /> Edit</button>
                <button onClick={() => handleDelete(event.id)} style={s.btnDanger}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
