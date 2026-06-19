import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Loader2, X, Users, School, Trophy, Link as LinkIcon, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUpload } from './ImageUpload';

interface Member {
  id: string;
  name: string;
  title: string;
  image: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
  email?: string;
  order: number;
}

const PANEL_TYPES = [
  { id: "Advisory_Panel", title: "Advisory Panel" },
  { id: "Executive_Panel", title: "Executive Panel" },
  { id: "Deputy_Executive_Panel", title: "Deputy Executive Panel" },
  { id: "Senior_Sub_Executive_Panel", title: "Senior Sub-Executive Panel" },
  { id: "Sub_Executive_Panel", title: "Sub-Executive Panel" },
  { id: "Junior_Sub_Executive_Panel", title: "Junior Sub-Executive Panel" },
  { id: "Working_Committee", title: "Working Committee" },
  { id: "General_Members", title: "General Members" },
];

export function GoverningPanelEditor() {
  const [semesters, setSemesters] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('Hall_of_Fame');
  const [selectedPanel, setSelectedPanel] = useState<string>(PANEL_TYPES[0].id);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Semesters creation dialog
  const [showSemesterForm, setShowSemesterForm] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState('');

  // Member Form State
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState(1);

  // Fetch list of Semesters
  const fetchSemesters = async () => {
    try {
      const semestersRef = collection(db, 'All_Data', 'Governing_Panel', 'Semesters');
      const snapshot = await getDocs(semestersRef);
      const fetched = snapshot.docs.map(doc => doc.id);
      
      // Sort semesters by year/season descending
      const sorted = fetched.sort((a, b) => {
        const extractYearAndSeason = (name: string) => {
          const match = name.match(/(Fall|Spring)\s+(\d{4})/);
          if (match) {
            const seasonOrder = match[1] === 'Fall' ? 1 : 0;
            return { season: seasonOrder, year: parseInt(match[2]) };
          }
          return { season: -1, year: 0 };
        };
        const aInfo = extractYearAndSeason(a);
        const bInfo = extractYearAndSeason(b);
        if (bInfo.year !== aInfo.year) return bInfo.year - aInfo.year;
        return bInfo.season - aInfo.season;
      });

      setSemesters(sorted);
      if (sorted.length > 0 && selectedSemester === '') {
        setSelectedSemester(sorted[0]);
      }
    } catch (err) {
      console.error('Error fetching semesters:', err);
    }
  };

  // Fetch panel members
  const fetchMembers = async () => {
    if (!selectedSemester) return;
    try {
      setLoading(true);
      let membersRef;
      if (selectedSemester === 'Hall_of_Fame') {
        membersRef = collection(db, 'All_Data', 'Governing_Panel', 'Hall_of_Fame');
      } else {
        membersRef = collection(
          db,
          'All_Data',
          'Governing_Panel',
          'Semesters',
          selectedSemester,
          selectedPanel
        );
      }

      const snapshot = await getDocs(membersRef);
      const fetched: Member[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Handle single-document non-standard format if present (skip rendering non-standard entries as individual members to keep it editable)
        if (!data.Name && !data.name) return;

        fetched.push({
          id: doc.id,
          name: data.Name || data.name || 'Unknown',
          title: data.Title || data.title || data.Designation || '',
          image: data.Image || data.image || data.Photo || '',
          facebook: data.Facebook || data.facebook || '',
          linkedin: data.Linkedin || data.linkedin || '',
          github: data.Github || data.github || '',
          email: data.Email || data.email || '',
          order: data.Order || 99,
        });
      });

      // Sort by Order ascending
      fetched.sort((a, b) => a.order - b.order);
      setMembers(fetched);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [selectedSemester, selectedPanel]);

  const handleEdit = (mem: Member) => {
    setEditingId(mem.id);
    setName(mem.name);
    setTitle(mem.title);
    setImage(mem.image);
    setFacebook(mem.facebook || '');
    setLinkedin(mem.linkedin || '');
    setGithub(mem.github || '');
    setEmail(mem.email || '');
    setOrder(mem.order);
    setShowMemberForm(true);
  };

  const handleCloseMemberForm = () => {
    setShowMemberForm(false);
    setEditingId(null);
    setName('');
    setTitle('');
    setImage('');
    setFacebook('');
    setLinkedin('');
    setGithub('');
    setEmail('');
    setOrder(members.length + 1);
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSemesterName.trim()) return;

    // Validate format (e.g. Spring 2026 or Fall 2025)
    const regex = /^(Spring|Fall)\s+\d{4}$/;
    if (!regex.test(newSemesterName.trim())) {
      alert('Semester name must be in the format: "Spring 2026" or "Fall 2025"');
      return;
    }

    try {
      setSaving(true);
      // In Firestore, to initialize a subcollection parent document, we can write a small metadata field
      const semesterRef = doc(db, 'All_Data', 'Governing_Panel', 'Semesters', newSemesterName.trim());
      await setDoc(semesterRef, { CreatedAt: Timestamp.now() });
      
      await fetchSemesters();
      setSelectedSemester(newSemesterName.trim());
      setNewSemesterName('');
      setShowSemesterForm(false);
    } catch (err) {
      console.error('Error creating semester:', err);
      alert('Failed to create semester');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);

      const payload = {
        Name: name,
        Title: title,
        Image: image,
        Facebook: facebook,
        Linkedin: linkedin,
        Github: github,
        Email: email,
        Order: Number(order),
      };

      let membersRef;
      if (selectedSemester === 'Hall_of_Fame') {
        membersRef = collection(db, 'All_Data', 'Governing_Panel', 'Hall_of_Fame');
      } else {
        membersRef = collection(
          db,
          'All_Data',
          'Governing_Panel',
          'Semesters',
          selectedSemester,
          selectedPanel
        );
      }

      const docId = editingId || doc(collection(db, 'temp')).id;
      const docRef = doc(membersRef, docId);

      await setDoc(docRef, payload);

      await fetchMembers();
      handleCloseMemberForm();
    } catch (err) {
      console.error('Error saving member:', err);
      alert('Failed to save panel member');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      let docRef;
      if (selectedSemester === 'Hall_of_Fame') {
        docRef = doc(db, 'All_Data', 'Governing_Panel', 'Hall_of_Fame', id);
      } else {
        docRef = doc(
          db,
          'All_Data',
          'Governing_Panel',
          'Semesters',
          selectedSemester,
          selectedPanel,
          id
        );
      }

      await deleteDoc(docRef);
      await fetchMembers();
    } catch (err) {
      console.error('Error deleting member:', err);
      alert('Failed to delete member');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Governing Panel</h2>
          <p className="text-gray-400 text-sm">Manage governing semesters, panels, sub-panels, and student executives.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowSemesterForm(true)}
            className="bg-transparent border border-gray-800 text-white hover:bg-white/5 font-semibold h-12 rounded-xl"
          >
            <School className="w-4 h-4 mr-2" /> New Semester
          </Button>
          <Button
            onClick={() => {
              handleCloseMemberForm();
              setShowMemberForm(true);
            }}
            className="bg-[#2ECC71] text-black hover:bg-[#27AE60] font-bold gap-2 px-5 py-3 h-12 rounded-xl transition-all shadow-lg shadow-[#2ECC71]/20"
          >
            <UserPlus className="w-5 h-5" /> Add Member
          </Button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-black/40 p-4 border border-gray-850 rounded-2xl">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#2ECC71]"
          >
            <option value="Hall_of_Fame">🏆 Hall of Fame (Legends)</option>
            {semesters.map((sem) => (
              <option key={sem} value={sem}>
                📅 {sem}
              </option>
            ))}
          </select>
        </div>

        {selectedSemester !== 'Hall_of_Fame' && (
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Panel</label>
            <select
              value={selectedPanel}
              onChange={(e) => setSelectedPanel(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#2ECC71]"
            >
              {PANEL_TYPES.map((panel) => (
                <option key={panel.id} value={panel.id}>
                  👥 {panel.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Semester Creation Dialog */}
      {showSemesterForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-850">
              <h3 className="text-lg font-bold text-white">Create Semester</h3>
              <button onClick={() => setShowSemesterForm(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSemester} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Semester Name</label>
                <input
                  type="text"
                  required
                  value={newSemesterName}
                  onChange={(e) => setNewSemesterName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#2ECC71]"
                  placeholder="e.g. Spring 2026 or Fall 2025"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setShowSemesterForm(false)}
                  className="bg-transparent border border-gray-800 text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#2ECC71] text-black hover:bg-[#27AE60]"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Form Modal */}
      {showMemberForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">
                {editingId ? 'Edit Panel Member' : 'Add Panel Member'}
              </h3>
              <button onClick={handleCloseMemberForm} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2ECC71] transition-colors"
                      placeholder="e.g. Istiak Ahmed Riad"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">Title / Designation</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2ECC71] transition-colors"
                      placeholder="e.g. President or Vice President"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">Display Order</label>
                    <input
                      type="number"
                      required
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2ECC71] transition-colors"
                      placeholder="Lower values show first"
                    />
                  </div>
                </div>

                {/* Avatar Upload */}
                <div>
                  <ImageUpload
                    label="Member Photo"
                    currentUrl={image}
                    onUploadComplete={(url) => setImage(url)}
                    onClear={() => setImage('')}
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4 pt-4 border-t border-gray-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-[#2ECC71]" /> Social Coordinates (Optional)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Facebook URL</label>
                    <input
                      type="url"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2ECC71]"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2ECC71]"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">GitHub URL</label>
                    <input
                      type="url"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2ECC71]"
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2ECC71]"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <Button
                  type="button"
                  onClick={handleCloseMemberForm}
                  className="bg-transparent border border-gray-800 text-white hover:bg-white/5 font-semibold h-11 px-6 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#2ECC71] text-black hover:bg-[#27AE60] font-bold h-11 px-6 rounded-xl min-w-[100px] flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Grid list */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-[#2ECC71] animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 border border-gray-800 rounded-2xl bg-black/20">
          <p className="text-gray-500">No members found in this panel. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="border border-gray-850 rounded-2xl bg-black/40 backdrop-blur-sm p-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-900 border border-gray-850">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-950">
                      <Users className="w-12 h-12" />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm line-clamp-1">{member.name}</h4>
                  <p className="text-[#2ECC71] text-xs line-clamp-1">{member.title}</p>
                  <span className="text-[10px] text-gray-500 bg-gray-900 py-0.5 px-2 rounded-full border border-gray-850 mt-1 inline-block">
                    Order: {member.order}
                  </span>
                </div>
              </div>

              <div className="flex gap-1 pt-3 border-t border-gray-850 mt-3">
                <Button
                  onClick={() => handleEdit(member)}
                  size="sm"
                  className="flex-1 bg-transparent hover:bg-[#2ECC71]/15 text-white hover:text-[#2ECC71] border border-gray-800 hover:border-[#2ECC71]/20 font-semibold"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDeleteMember(member.id)}
                  size="sm"
                  variant="destructive"
                  className="px-2.5 bg-red-650 hover:bg-red-750"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
