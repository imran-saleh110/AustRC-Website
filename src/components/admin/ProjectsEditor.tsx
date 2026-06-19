import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Search, Loader2, X, GraduationCap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUpload } from './ImageUpload';

interface ProjectMember {
  name: string;
  designation: string;
}

interface Project {
  id: string;
  Title: string;
  Introduction: string;
  Cover_Picture: string;
  Order: number;
  members: ProjectMember[];
}

export function ProjectsEditor() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [coverPicture, setCoverPicture] = useState('');
  const [order, setOrder] = useState(1);
  const [members, setMembers] = useState<ProjectMember[]>([
    { name: '', designation: '' },
    { name: '', designation: '' },
    { name: '', designation: '' },
    { name: '', designation: '' },
  ]);

  const projectsCollection = collection(db, 'All_Data', 'Research_Projects', 'research_projects');

  // Convert flat owner fields to a clean structured array
  const parseFirestoreProject = (docId: string, data: any): Project => {
    const members: ProjectMember[] = [];
    for (let i = 1; i <= 4; i++) {
      const name = data[`Owner_${i}_Name`] || '';
      const designation = data[`Owner_${i}_Designation_Department`] || '';
      members.push({ name, designation });
    }

    return {
      id: docId,
      Title: data.Title || docId || '',
      Introduction: data.Introduction || '',
      Cover_Picture: data.Cover_Picture || '',
      Order: data.Order || 0,
      members,
    };
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const q = query(projectsCollection, orderBy('Order', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetched: Project[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push(parseFirestoreProject(doc.id, doc.data()));
      });
      setProjects(fetched);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleEdit = (proj: Project) => {
    setEditingId(proj.id);
    setTitle(proj.Title);
    setIntroduction(proj.Introduction);
    setCoverPicture(proj.Cover_Picture);
    setOrder(proj.Order);
    
    // Ensure we always have 4 elements in the members array
    const filledMembers = [...proj.members];
    while (filledMembers.length < 4) {
      filledMembers.push({ name: '', designation: '' });
    }
    setMembers(filledMembers);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle('');
    setIntroduction('');
    setCoverPicture('');
    setOrder(projects.length + 1);
    setMembers([
      { name: '', designation: '' },
      { name: '', designation: '' },
      { name: '', designation: '' },
      { name: '', designation: '' },
    ]);
  };

  const updateMemberField = (index: number, field: keyof ProjectMember, value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !introduction.trim()) return;

    try {
      setSaving(true);

      const payload: any = {
        Title: title,
        Introduction: introduction,
        Cover_Picture: coverPicture,
        Order: Number(order),
      };

      // Populate flat owners
      members.forEach((m, idx) => {
        const num = idx + 1;
        payload[`Owner_${num}_Name`] = m.name;
        payload[`Owner_${num}_Designation_Department`] = m.designation;
      });

      const docId = editingId || doc(collection(db, 'temp')).id;
      const docRef = doc(db, 'All_Data', 'Research_Projects', 'research_projects', docId);

      await setDoc(docRef, payload);

      await fetchProjects();
      handleCloseForm();
    } catch (err) {
      console.error('Error saving project:', err);
      alert('Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this research project?')) return;
    try {
      const docRef = doc(db, 'All_Data', 'Research_Projects', 'research_projects', id);
      await deleteDoc(docRef);
      await fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project');
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.Introduction.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Research Projects</h2>
          <p className="text-gray-400 text-sm">Add and edit R&D projects, cover photos, and project lead details.</p>
        </div>
        <Button
          onClick={() => {
            handleCloseForm();
            setShowForm(true);
          }}
          className="bg-[#2ECC71] text-black hover:bg-[#27AE60] font-bold gap-2 px-5 py-3 h-12 rounded-xl transition-all self-start sm:self-auto shadow-lg shadow-[#2ECC71]/20"
        >
          <Plus className="w-5 h-5" />
          Add Project
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search research projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#2ECC71] transition-colors"
        />
      </div>

      {/* Editor Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121212] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Project' : 'Add New Project'}</h3>
              <button onClick={handleCloseForm} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">Project Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2ECC71] transition-colors"
                      placeholder="e.g. Line Follower Robot with PID Control"
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1">Introduction</label>
                    <textarea
                      required
                      rows={5}
                      value={introduction}
                      onChange={(e) => setIntroduction(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2ECC71] transition-colors"
                      placeholder="Brief overview of research methodology and objectives..."
                    />
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                  <ImageUpload
                    label="Cover Picture"
                    currentUrl={coverPicture}
                    onUploadComplete={(url) => setCoverPicture(url)}
                    onClear={() => setCoverPicture('')}
                  />
                </div>
              </div>

              {/* Project Members Section */}
              <div className="space-y-4 pt-4 border-t border-gray-800">
                <div>
                  <h4 className="text-lg font-bold text-white">Project Owners / Team Members</h4>
                  <p className="text-gray-400 text-xs">Add up to 4 core contributors and their university designations.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {members.map((m, idx) => (
                    <div key={idx} className="border border-gray-850 rounded-xl p-4 bg-black/20 space-y-3">
                      <span className="text-[#2ECC71] text-xs font-bold uppercase tracking-wider">Contributor #{idx + 1}</span>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Name</label>
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) => updateMemberField(idx, 'name', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2ECC71] transition-colors"
                          placeholder="Full Name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Designation & Department</label>
                        <input
                          type="text"
                          value={m.designation}
                          onChange={(e) => updateMemberField(idx, 'designation', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2ECC71] transition-colors"
                          placeholder="e.g. Dept. of EEE, AUST"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <Button
                  type="button"
                  onClick={handleCloseForm}
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

      {/* Projects List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-[#2ECC71] animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 border border-gray-800 rounded-2xl bg-black/20">
          <p className="text-gray-500">No research projects found. Create one by clicking "Add Project".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="border border-gray-800 rounded-2xl bg-black/40 backdrop-blur-sm p-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="aspect-video w-full relative bg-gray-900 overflow-hidden rounded-xl">
                  {project.Cover_Picture ? (
                    <img src={project.Cover_Picture} alt={project.Title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <GraduationCap className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/60 border border-gray-800 rounded-full px-3 py-1 text-xs text-[#2ECC71] font-semibold">
                    Order: {project.Order}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white line-clamp-1">{project.Title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-3">{project.Introduction}</p>
                </div>

                {/* Contributors count */}
                <div className="flex items-center gap-1.5 text-xs text-[#2ECC71] font-semibold bg-[#2ECC71]/5 border border-[#2ECC71]/20 rounded-lg py-1 px-3 w-fit">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {project.members.filter((m) => m.name).length} Contributors
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-850 mt-4">
                <Button
                  onClick={() => handleEdit(project)}
                  className="flex-grow bg-transparent hover:bg-[#2ECC71]/10 text-white hover:text-[#2ECC71] border border-gray-800 hover:border-[#2ECC71]/30 font-semibold rounded-xl"
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                </Button>
                <Button
                  onClick={() => handleDelete(project.id)}
                  variant="destructive"
                  className="px-3 rounded-xl bg-red-650 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
