import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Upload, Trash2, Eye, X, FileText, Image, File, Users,
  UserCheck, Building2, Calendar, HardDrive, FolderOpen, Plus,
  Download, Filter, ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import { useApp, fmt } from '../../store/AppContext';

// ── Helpers ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'client', label: 'Client Documents', icon: UserCheck, color: 'blue' },
  { key: 'staff', label: 'Staff Documents', icon: Users, color: 'green' },
  { key: 'business', label: 'Business Documents', icon: Building2, color: 'accent' },
];

const SUBCATEGORIES: Record<string, { value: string; label: string }[]> = {
  client: [
    { value: 'national_id', label: 'National ID' },
    { value: 'passport_photo', label: 'Passport Photo' },
    { value: 'loan_application', label: 'Loan Application' },
    { value: 'collateral_photo', label: 'Collateral Photo' },
    { value: 'guarantor_id', label: 'Guarantor ID' },
    { value: 'other', label: 'Other' },
  ],
  staff: [
    { value: 'employment_contract', label: 'Employment Contract' },
    { value: 'offer_letter', label: 'Offer Letter' },
    { value: 'id_copy', label: 'ID Copy' },
    { value: 'certification', label: 'Certification' },
    { value: 'performance_review', label: 'Performance Review' },
    { value: 'other', label: 'Other' },
  ],
  business: [
    { value: 'trading_licence', label: 'Trading Licence' },
    { value: 'regulatory_permit', label: 'Regulatory Permit' },
    { value: 'insurance', label: 'Insurance Policy' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'partnership_agreement', label: 'Partnership Agreement' },
    { value: 'other', label: 'Other' },
  ],
};

function getFileIconClass(type: string) {
  if (!type) return 'other';
  if (type.startsWith('image/')) return 'img';
  if (type === 'application/pdf') return 'pdf';
  if (type.includes('word') || type.includes('document')) return 'doc';
  return 'other';
}

function getFileIconLabel(type: string) {
  if (!type) return 'FILE';
  if (type.startsWith('image/')) return 'IMG';
  if (type === 'application/pdf') return 'PDF';
  if (type.includes('word')) return 'DOC';
  return 'FILE';
}

function formatFileSize(bytes: number) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatSubcategory(sub: string) {
  return (sub || 'other').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function DocumentVaultPage() {
  const { state } = useApp();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('client');
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subFilter, setSubFilter] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('category', activeTab);
    if (search) params.set('search', search);
    api.getDocuments(params.toString())
      .then((r: any) => {
        let filtered = r.data || [];
        if (subFilter) filtered = filtered.filter((d: any) => d.subcategory === subFilter);
        setDocs(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab, search, subFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setSubFilter(''); setSelected(new Set()); }, [activeTab]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document permanently?')) return;
    await api.deleteDocument(id);
    load();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} selected documents?`)) return;
    for (const id of selected) await api.deleteDocument(id);
    setSelected(new Set());
    load();
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Stats
  const allDocs = docs;
  const totalSize = allDocs.reduce((s, d) => s + (d.file_size || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">📁 Document Vault</h2>
          <p className="page-subtitle">Secure storage for all business, client & staff documents</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button className="btn btn-danger" onClick={handleBulkDelete}>
              <Trash2 size={14} /> Delete ({selected.size})
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <Plus size={14} /> Upload Document
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="vault-stats">
        <div className="stat-card accent">
          <div className="stat-label">Total Documents</div>
          <div className="stat-value">{docs.length}</div>
          <div className="stat-sub">{formatFileSize(totalSize)} used</div>
          <div className="stat-icon"><FolderOpen size={28} /></div>
        </div>
        {CATEGORIES.map(cat => {
          const count = docs.filter(d => d.category === cat.key).length;
          return (
            <div className={`stat-card ${cat.color}`} key={cat.key}>
              <div className="stat-label">{cat.label.replace(' Documents', '')}</div>
              <div className="stat-value">{activeTab === cat.key ? docs.length : count}</div>
              <div className="stat-sub">{activeTab === cat.key ? 'showing' : 'total'}</div>
              <div className="stat-icon"><cat.icon size={28} /></div>
            </div>
          );
        })}
      </div>

      {/* Tabs + Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {CATEGORIES.map(cat => (
            <div
              key={cat.key}
              className={`tab${activeTab === cat.key ? ' active' : ''}`}
              onClick={() => setActiveTab(cat.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <cat.icon size={14} /> {cat.label}
            </div>
          ))}
        </div>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          {/* Subcategory filter */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <Filter size={12} /> {subFilter ? formatSubcategory(subFilter) : 'All Types'} <ChevronDown size={12} />
            </button>
            {showFilterMenu && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: 4, minWidth: 180,
                zIndex: 100, boxShadow: 'var(--shadow)'
              }}>
                <div
                  onClick={() => { setSubFilter(''); setShowFilterMenu(false); }}
                  style={{
                    padding: '6px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 4,
                    color: !subFilter ? 'var(--accent)' : 'var(--text-secondary)',
                    background: !subFilter ? 'var(--accent-glow)' : 'transparent',
                  }}
                >All Types</div>
                {(SUBCATEGORIES[activeTab] || []).map(sc => (
                  <div
                    key={sc.value}
                    onClick={() => { setSubFilter(sc.value); setShowFilterMenu(false); }}
                    style={{
                      padding: '6px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 4,
                      color: subFilter === sc.value ? 'var(--accent)' : 'var(--text-secondary)',
                      background: subFilter === sc.value ? 'var(--accent-glow)' : 'transparent',
                    }}
                  >{sc.label}</div>
                ))}
              </div>
            )}
          </div>
          <div className="search-bar" style={{ maxWidth: 260 }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Loading documents...
        </div>
      ) : docs.length === 0 ? (
        <div className="vault-empty">
          <div className="vault-empty-icon"><FolderOpen size={32} /></div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No documents found</div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>
            {search ? 'Try a different search term' : `Upload your first ${activeTab} document to get started`}
          </div>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <Upload size={14} /> Upload Document
          </button>
        </div>
      ) : (
        <div className="vault-grid">
          {docs.map(doc => (
            <div
              key={doc.id}
              className={`vault-doc-card${selected.has(doc.id) ? ' selected' : ''}`}
              onClick={() => setPreview(doc)}
            >
              {/* Checkbox */}
              <div
                onClick={e => toggleSelect(doc.id, e)}
                style={{
                  position: 'absolute', top: 12, left: 12,
                  width: 18, height: 18, borderRadius: 4,
                  border: `2px solid ${selected.has(doc.id) ? 'var(--accent)' : 'var(--border-light)'}`,
                  background: selected.has(doc.id) ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s', zIndex: 2,
                }}
              >
                {selected.has(doc.id) && <span style={{ color: '#000', fontSize: 11, fontWeight: 800 }}>✓</span>}
              </div>

              <div className={`vault-file-icon ${getFileIconClass(doc.file_type)}`} style={{ marginLeft: 14 }}>
                {getFileIconLabel(doc.file_type)}
              </div>
              <div className="vault-doc-info">
                <div className="vault-doc-name" title={doc.name}>{doc.name}</div>
                <div style={{ marginBottom: 6 }}>
                  <span className={`vault-category-badge vault-cat-${doc.category}`}>
                    {formatSubcategory(doc.subcategory)}
                  </span>
                </div>
                <div className="vault-doc-meta">
                  <span><UserCheck size={10} /> {doc.entity_name}</span>
                  <span><Calendar size={10} /> {fmt.date(doc.uploaded_at)}</span>
                  <span><HardDrive size={10} /> {formatFileSize(doc.file_size)}</span>
                </div>
                {doc.notes && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                    {doc.notes}
                  </div>
                )}
              </div>

              {/* Hover actions */}
              <div className="vault-doc-actions">
                <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); setPreview(doc); }}>
                  <Eye size={11} />
                </button>
                {doc.file_data && (
                  <button className="btn btn-secondary btn-sm" onClick={e => {
                    e.stopPropagation();
                    const a = document.createElement('a');
                    a.href = doc.file_data;
                    a.download = doc.name;
                    a.click();
                  }}>
                    <Download size={11} />
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          activeCategory={activeTab}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); load(); }}
        />
      )}

      {/* Preview Modal */}
      {preview && (
        <PreviewModal doc={preview} onClose={() => setPreview(null)} onDelete={() => { handleDelete(preview.id); setPreview(null); }} />
      )}
    </div>
  );
}

// ── Upload Modal ────────────────────────────────────────────────────────────
function UploadModal({ activeCategory, onClose, onUploaded }: { activeCategory: string; onClose: () => void; onUploaded: () => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState('');
  const [category, setCategory] = useState(activeCategory);
  const [subcategory, setSubcategory] = useState('');
  const [entityName, setEntityName] = useState('');
  const [entityId, setEntityId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setFilePreview('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSave = async () => {
    if (!file || !entityName) return;
    setSaving(true);
    try {
      let fileData = '';
      // Read file as base64 for demo storage
      const reader = new FileReader();
      fileData = await new Promise<string>((resolve) => {
        reader.onload = e => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      await api.uploadDocument({
        name: file.name,
        category,
        subcategory: subcategory || 'other',
        entity_id: entityId || `auto-${Date.now()}`,
        entity_name: entityName,
        file_type: file.type,
        file_size: file.size,
        file_data: fileData,
        notes,
      });
      onUploaded();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. The file may be too large for local storage.');
    } finally {
      setSaving(false);
    }
  };

  // Entity suggestions based on category
  const [entities, setEntities] = useState<any[]>([]);
  useEffect(() => {
    if (category === 'client') {
      api.getClients('').then((r: any) => setEntities((r.data || []).map((c: any) => ({ id: c.id, name: `${c.first_name} ${c.last_name}` }))));
    } else if (category === 'staff') {
      api.getStaff('').then((r: any) => setEntities((r.data || []).map((s: any) => ({ id: s.id, name: `${s.first_name} ${s.last_name}` }))));
    } else {
      setEntities([]);
    }
  }, [category]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">📤 Upload Document</h3>
          <button className="btn btn-icon-sm" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Dropzone */}
        <div
          className={`vault-dropzone${dragOver ? ' drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
        >
          <input
            ref={fileInput}
            type="file"
            style={{ display: 'none' }}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
          {file ? (
            <div>
              {filePreview && (
                <img src={filePreview} alt="Preview" style={{ maxWidth: 200, maxHeight: 120, borderRadius: 8, marginBottom: 12, boxShadow: 'var(--shadow)' }} />
              )}
              <div className="vault-dropzone-title">{file.name}</div>
              <div className="vault-dropzone-sub">{formatFileSize(file.size)} · {file.type || 'Unknown type'}</div>
              <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 8 }}>Click or drag to replace</div>
            </div>
          ) : (
            <>
              <div className="vault-dropzone-icon"><Upload size={24} /></div>
              <div className="vault-dropzone-title">Drag & drop file here</div>
              <div className="vault-dropzone-sub">or click to browse · PDF, Images, Word, Excel up to 5MB</div>
            </>
          )}
        </div>

        {/* Form */}
        <div style={{ marginTop: 20 }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={category} onChange={e => { setCategory(e.target.value); setSubcategory(''); }}>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select className="form-control" value={subcategory} onChange={e => setSubcategory(e.target.value)}>
                <option value="">Select type...</option>
                {(SUBCATEGORIES[category] || []).map(sc => (
                  <option key={sc.value} value={sc.value}>{sc.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                {category === 'client' ? 'Client Name' : category === 'staff' ? 'Staff Member' : 'Entity Name'}
              </label>
              {entities.length > 0 ? (
                <select
                  className="form-control"
                  value={entityId}
                  onChange={e => {
                    const ent = entities.find(en => en.id === e.target.value);
                    setEntityId(e.target.value);
                    setEntityName(ent?.name || '');
                  }}
                >
                  <option value="">Select {category}...</option>
                  {entities.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
                </select>
              ) : (
                <input className="form-control" placeholder="e.g. Kilimo MF" value={entityName} onChange={e => setEntityName(e.target.value)} />
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <input className="form-control" placeholder="Brief description..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!file || !entityName || saving} onClick={handleSave}>
            {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Uploading...</> : <><Upload size={14} /> Upload Document</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preview Modal ───────────────────────────────────────────────────────────
function PreviewModal({ doc, onClose, onDelete }: { doc: any; onClose: () => void; onDelete: () => void }) {
  const isImage = doc.file_type?.startsWith('image/');
  const isPdf = doc.file_type === 'application/pdf';

  return (
    <div className="vault-preview-overlay" onClick={onClose}>
      <div className="vault-preview-header" onClick={e => e.stopPropagation()}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{doc.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, marginTop: 2 }}>
            <span className={`vault-category-badge vault-cat-${doc.category}`}>
              {formatSubcategory(doc.subcategory)}
            </span>
            <span>{doc.entity_name}</span>
            <span>{fmt.date(doc.uploaded_at)}</span>
            <span>{formatFileSize(doc.file_size)}</span>
            <span>Uploaded by {doc.uploaded_by}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {doc.file_data && (
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const a = document.createElement('a');
              a.href = doc.file_data;
              a.download = doc.name;
              a.click();
            }}>
              <Download size={13} /> Download
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={() => { onDelete(); }}>
            <Trash2 size={13} /> Delete
          </button>
          <button className="btn btn-icon-sm" onClick={onClose}><X size={20} /></button>
        </div>
      </div>
      <div className="vault-preview-body" onClick={e => e.stopPropagation()}>
        {doc.file_data ? (
          isImage ? (
            <img src={doc.file_data} alt={doc.name} />
          ) : isPdf ? (
            <iframe
              src={doc.file_data}
              style={{ width: '100%', maxWidth: 900, height: '75vh', border: 'none', borderRadius: 'var(--radius)', background: '#fff' }}
              title={doc.name}
            />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className={`vault-file-icon ${getFileIconClass(doc.file_type)}`} style={{ width: 80, height: 80, fontSize: 20, margin: '0 auto 16px' }}>
                {getFileIconLabel(doc.file_type)}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Preview not available</div>
              <div style={{ fontSize: 13, marginBottom: 16 }}>Download the file to view it</div>
              <button className="btn btn-primary" onClick={() => {
                const a = document.createElement('a');
                a.href = doc.file_data;
                a.download = doc.name;
                a.click();
              }}>
                <Download size={14} /> Download File
              </button>
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className={`vault-file-icon ${getFileIconClass(doc.file_type)}`} style={{ width: 80, height: 80, fontSize: 20, margin: '0 auto 16px' }}>
              {getFileIconLabel(doc.file_type)}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{doc.name}</div>
            <div style={{ fontSize: 13 }}>No file data available for preview (demo record)</div>
            {doc.notes && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, fontStyle: 'italic' }}>"{doc.notes}"</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
