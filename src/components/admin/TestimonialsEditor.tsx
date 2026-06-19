import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUpload } from './ImageUpload';

export function TestimonialsEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 4 voice image URLs
  const [voice1, setVoice1] = useState('');
  const [voice2, setVoice2] = useState('');
  const [voice3, setVoice3] = useState('');
  const [voice4, setVoice4] = useState('');

  const docRef = doc(db, 'All_Data', 'Voice_of_AUSTRC');

  const fetchVoices = async () => {
    try {
      setLoading(true);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setVoice1(data.Voice_1 || '');
        setVoice2(data.Voice_2 || '');
        setVoice3(data.Voice_3 || '');
        setVoice4(data.Voice_4 || '');
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await setDoc(docRef, {
        Voice_1: voice1,
        Voice_2: voice2,
        Voice_3: voice3,
        Voice_4: voice4,
      });
      alert('Testimonial images updated successfully!');
    } catch (err) {
      console.error('Error saving testimonials:', err);
      alert('Failed to update testimonial images');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Voice of AUSTRC</h2>
        <p className="text-gray-400 text-sm">
          Update the testimonial carousel images displayed on the landing page.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-[#2ECC71] animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 bg-black/40 border border-gray-850 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#2ECC71]" />
            <h3 className="text-lg font-bold text-white">Carousel Testimonial Cards</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <ImageUpload
                label="Testimonial Image 1"
                currentUrl={voice1}
                onUploadComplete={(url) => setVoice1(url)}
                onClear={() => setVoice1('')}
              />
            </div>
            <div>
              <ImageUpload
                label="Testimonial Image 2"
                currentUrl={voice2}
                onUploadComplete={(url) => setVoice2(url)}
                onClear={() => setVoice2('')}
              />
            </div>
            <div>
              <ImageUpload
                label="Testimonial Image 3"
                currentUrl={voice3}
                onUploadComplete={(url) => setVoice3(url)}
                onClear={() => setVoice3('')}
              />
            </div>
            <div>
              <ImageUpload
                label="Testimonial Image 4"
                currentUrl={voice4}
                onUploadComplete={(url) => setVoice4(url)}
                onClear={() => setVoice4('')}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-850">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#2ECC71] text-black hover:bg-[#27AE60] font-bold h-12 px-8 rounded-xl transition-all shadow-lg shadow-[#2ECC71]/20 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Testimonials'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
