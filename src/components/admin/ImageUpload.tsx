import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import { UploadCloud, Link2, CheckCircle, Loader2, X, ArrowRight } from 'lucide-react';
import { useAdminStyles } from './useAdminStyles';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  label?: string;
  currentUrl?: string;
  onClear?: () => void;
}

type Mode = 'choose' | 'upload' | 'url';

export function ImageUpload({ onUploadComplete, label, currentUrl, onClear }: ImageUploadProps) {
  const s = useAdminStyles();
  const t = s.t;

  const [mode, setMode]         = useState<Mode>('choose');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]  = useState(0);
  const [error, setError]        = useState<string | null>(null);
  const [urlInput, setUrlInput]  = useState('');
  const [urlHovered, setUrlHovered] = useState(false);

  /* ── file upload ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024)    { setError('File is too large. Max 5MB.'); return; }

    setError(null); setUploading(true); setProgress(0);

    const ext = file.name.split('.').pop();
    const path = `admin_uploads/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const task = uploadBytesResumable(ref(storage, path), file);

    task.on('state_changed',
      snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      err  => { setError('Upload failed. Check Firebase Storage rules.'); setUploading(false); },
      async () => {
        try   { onUploadComplete(await getDownloadURL(task.snapshot.ref)); setUploading(false); setMode('choose'); }
        catch { setError('Failed to retrieve download URL.'); setUploading(false); }
      }
    );
  };

  /* ── url paste ── */
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http')) { setError('Please enter a valid URL (must start with http).'); return; }
    setError(null);
    onUploadComplete(trimmed);
    setUrlInput('');
    setMode('choose');
  };

  /* ── shared styles ── */
  const box: React.CSSProperties = {
    border: `1.5px dashed ${t.borderFocus}`,
    borderRadius: 14,
    background: t.pageBgAlt,
    overflow: 'hidden',
  };

  /* ── already has a value ── */
  if (currentUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {label && <label style={s.label}>{label}</label>}
        <div style={{ ...box, border: `1.5px solid ${t.borderBrand}`, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ position: 'relative' }}>
            <img src={currentUrl} alt="Preview" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
            <button type="button" onClick={onClear}
              style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={13} color={t.brandGreen} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUrl}</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── MODE: choose ── */
  if (mode === 'choose') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {label && <label style={s.label}>{label}</label>}
        <div style={{ ...box, display: 'flex', flexDirection: 'column' }}>
          {/* File upload option */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer', borderBottom: `1px solid ${t.borderSubtle}` }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(46,204,113,0.08)', border: `1px solid rgba(46,204,113,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UploadCloud size={18} color={t.brandGreen} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: t.textPrimary, fontSize: 13, fontWeight: 600 }}>Upload from device</div>
              <div style={{ color: t.textMuted, fontSize: 11 }}>PNG, JPG, WEBP · Max 5MB</div>
            </div>
            <ArrowRight size={14} color={t.textMuted} />
            <input type="file" accept="image/*" onChange={e => { setMode('upload'); handleFileChange(e); }} style={{ display: 'none' }} />
          </label>

          {/* URL paste option */}
          <button type="button" onClick={() => setMode('url')} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: `1px solid rgba(99,102,241,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Link2 size={18} color="#818cf8" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: t.textPrimary, fontSize: 13, fontWeight: 600 }}>Paste image URL</div>
              <div style={{ color: t.textMuted, fontSize: 11 }}>Cloudinary, ImageKit, or any direct link</div>
            </div>
            <ArrowRight size={14} color={t.textMuted} />
          </button>
        </div>
        {error && <div style={{ fontSize: 11, color: '#f87171', background: 'rgba(239,68,68,0.08)', padding: '6px 12px', borderRadius: 8 }}>{error}</div>}
      </div>
    );
  }

  /* ── MODE: uploading file ── */
  if (mode === 'upload' && uploading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {label && <label style={s.label}>{label}</label>}
        <div style={{ ...box, padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Loader2 size={28} color={t.brandGreen} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: t.textSecondary, fontSize: 13, fontWeight: 600 }}>Uploading… {progress}%</span>
          <div style={{ width: '100%', maxWidth: 200, height: 4, background: t.borderDefault, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: t.brandGreen, transition: 'width 0.3s' }} />
          </div>
          <button type="button" onClick={() => { setUploading(false); setMode('choose'); }} style={{ ...s.btnGhost, fontSize: 12, padding: '4px 14px' }}>Cancel</button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── MODE: paste URL ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && <label style={s.label}>{label}</label>}
      <div style={{ ...box, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Link2 size={14} color="#818cf8" />
          <span style={{ color: t.textPrimary, fontSize: 13, fontWeight: 700 }}>Paste image URL</span>
          <button type="button" onClick={() => { setMode('choose'); setError(null); setUrlInput(''); }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><X size={15} /></button>
        </div>

        <form onSubmit={handleUrlSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            autoFocus type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
            placeholder="https://res.cloudinary.com/… or https://ik.imagekit.io/…"
            style={{ ...s.inputBase, fontSize: 13 }}
            onFocus={e => Object.assign(e.target.style, s.inputFocus)}
            onBlur={e => Object.assign(e.target.style, s.inputBlur)}
          />
          {urlInput && (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${t.borderDefault}`, maxHeight: 120 }}>
              <img src={urlInput} alt="Preview" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          {error && <div style={{ fontSize: 11, color: '#f87171' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => { setMode('choose'); setError(null); setUrlInput(''); }} style={{ ...s.btnGhost, flex: 1, fontSize: 13 }}>Back</button>
            <button type="submit" style={{ ...s.btnPrimary, flex: 2, fontSize: 13 }}>Use this URL</button>
          </div>
        </form>

        <p style={{ fontSize: 10, color: t.textMuted, margin: 0, textAlign: 'center' }}>
          💡 Upload to <strong style={{ color: t.textSecondary }}>ImageKit</strong> or <strong style={{ color: t.textSecondary }}>Cloudinary</strong> first, then paste the direct link here.
        </p>
      </div>
    </div>
  );
}
