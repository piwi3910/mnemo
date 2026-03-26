import type { ClientPluginAPI } from '../../../types/client';

const { React } = (window as any).__mnemoPluginDeps;
const { createElement: h, useState, useRef, useCallback } = React;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ValidatedFile {
  index: number;
  originalName: string;
  resolvedPath: string;
  size: number;
  status: 'valid' | 'duplicate' | 'invalid' | 'warning';
  errors: string[];
  existingNote?: string;
}

interface ValidateResponse {
  sessionId: string;
  targetFolder: string;
  preserveStructure: boolean;
  files: ValidatedFile[];
}

interface ConfirmResponse {
  created: number;
  overwritten: number;
  errors: string[];
}

type FileAction = 'create' | 'skip' | 'overwrite';

// ─── Styles (inline) ─────────────────────────────────────────────────────────

const S = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    background: 'var(--color-surface-900, #1a1a2e)',
    color: '#e2e8f0',
    borderRadius: 12,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    padding: 28,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 20,
    color: '#f1f5f9',
  },
  label: {
    display: 'block',
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
    padding: '7px 10px',
    color: '#e2e8f0',
    fontSize: 14,
    boxSizing: 'border-box' as const,
    outline: 'none',
  },
  dropzone: (active: boolean) => ({
    border: `2px dashed ${active ? '#7c3aed' : 'rgba(255,255,255,0.2)'}`,
    borderRadius: 8,
    padding: '32px 20px',
    textAlign: 'center' as const,
    color: '#94a3b8',
    fontSize: 14,
    cursor: 'pointer',
    background: active ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)',
    transition: 'all 0.15s',
    marginBottom: 16,
  }),
  btnPrimary: {
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 18px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnSecondary: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 6,
    padding: '8px 18px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  section: {
    marginBottom: 16,
  },
  checkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#cbd5e1',
    cursor: 'pointer',
  },
  fileList: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    maxHeight: 80,
    overflowY: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
  },
  th: {
    textAlign: 'left' as const,
    color: '#64748b',
    padding: '6px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontWeight: 500,
  },
  td: (opacity?: number) => ({
    padding: '6px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    verticalAlign: 'top' as const,
    opacity: opacity ?? 1,
  }),
  select: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4,
    color: '#e2e8f0',
    padding: '2px 6px',
    fontSize: 12,
  },
  summary: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 14,
  },
  resultRow: {
    display: 'flex',
    gap: 24,
    marginBottom: 16,
  },
  resultStat: {
    textAlign: 'center' as const,
  },
  resultNum: {
    fontSize: 28,
    fontWeight: 700,
    color: '#7c3aed',
  },
  resultLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  errorList: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: 13,
    color: '#fca5a5',
    marginTop: 12,
  },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ValidatedFile['status'] }): any {
  const colors: Record<string, string> = {
    valid: '#22c55e',
    warning: '#eab308',
    duplicate: '#eab308',
    invalid: '#ef4444',
  };
  return h('span', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 12,
      color: colors[status] ?? '#94a3b8',
      whiteSpace: 'nowrap' as const,
    },
  },
    h('span', {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: colors[status] ?? '#94a3b8',
        display: 'inline-block',
        flexShrink: 0,
      },
    }),
    status,
  );
}

// ─── Step 1: Select Files ─────────────────────────────────────────────────────

function StepSelect({
  api,
  onValidated,
  onCancel,
}: {
  api: ClientPluginAPI;
  onValidated: (data: ValidateResponse) => void;
  onCancel: () => void;
}): any {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFolder, setTargetFolder] = useState('');
  const [preserveStructure, setPreserveStructure] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const mdFiles = Array.from(incoming).filter((f) =>
      f.name.toLowerCase().endsWith('.md'),
    );
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const fresh = mdFiles.filter((f) => !existing.has(f.name + f.size));
      return [...prev, ...fresh];
    });
  }, []);

  function handleDrop(e: DragEvent): void {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: DragEvent): void {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(): void {
    setDragging(false);
  }

  async function handleValidate(): Promise<void> {
    if (files.length === 0) {
      setError('Please select at least one .md file.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const params = new URLSearchParams();
      if (targetFolder.trim()) params.set('targetFolder', targetFolder.trim());
      params.set('preserveStructure', String(preserveStructure));

      const res = await (api as any).api.fetch(`/validate?${params}`, {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type — browser handles multipart boundary
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => 'Unknown error');
        setError(`Validation failed: ${msg}`);
        return;
      }

      const data = (await res.json()) as ValidateResponse;
      onValidated(data);
    } catch (err: any) {
      setError(err?.message ?? 'Validation failed');
    } finally {
      setLoading(false);
    }
  }

  return h('div', null,
    h('div', { style: S.title }, 'Upload Notes — Step 1: Select Files'),

    // Drop zone
    h('div', {
      style: S.dropzone(dragging),
      onDrop: handleDrop,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onClick: () => fileInputRef.current?.click(),
    },
      h('div', null, 'Drag & drop .md files here'),
      h('div', { style: { marginTop: 6, fontSize: 12 } }, 'or click to browse'),
    ),

    // Hidden file input
    h('input', {
      ref: fileInputRef,
      type: 'file',
      accept: '.md',
      multiple: true,
      style: { display: 'none' },
      onChange: (e: any) => {
        if (e.target.files) addFiles(e.target.files);
        e.target.value = '';
      },
    }),

    // Selected files list
    files.length > 0 && h('div', { style: S.fileList },
      `${files.length} file(s) selected:`,
      files.map((f, i) =>
        h('div', { key: i, style: { marginTop: 2 } }, f.name),
      ),
    ),

    // Target folder
    h('div', { style: S.section },
      h('label', { style: S.label }, 'Target folder (leave empty for root)'),
      h('input', {
        type: 'text',
        style: S.input,
        value: targetFolder,
        placeholder: 'e.g. Notes/Imported',
        onChange: (e: any) => setTargetFolder(e.target.value),
      }),
    ),

    // Preserve structure checkbox
    h('div', { style: { ...S.section, marginBottom: 0 } },
      h('label', { style: S.checkRow },
        h('input', {
          type: 'checkbox',
          checked: preserveStructure,
          onChange: (e: any) => setPreserveStructure(e.target.checked),
        }),
        'Preserve folder structure',
      ),
    ),

    // Error
    error && h('div', {
      style: { color: '#f87171', fontSize: 13, marginTop: 12 },
    }, error),

    // Buttons
    h('div', { style: S.btnRow },
      h('button', { style: S.btnSecondary, onClick: onCancel }, 'Cancel'),
      h('button', {
        style: {
          ...S.btnPrimary,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        },
        onClick: handleValidate,
        disabled: loading,
      }, loading ? 'Validating...' : 'Upload & Validate'),
    ),
  );
}

// ─── Step 2: Review ───────────────────────────────────────────────────────────

function StepReview({
  api,
  data,
  onDone,
  onCancel,
}: {
  api: ClientPluginAPI;
  data: ValidateResponse;
  onDone: (result: ConfirmResponse) => void;
  onCancel: () => void;
}): any {
  const initialActions: Record<number, FileAction> = {};
  for (const f of data.files) {
    if (f.status === 'invalid') {
      initialActions[f.index] = 'skip';
    } else if (f.status === 'duplicate') {
      initialActions[f.index] = 'skip';
    } else {
      initialActions[f.index] = 'create';
    }
  }

  const [actions, setActions] = useState<Record<number, FileAction>>(initialActions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validCount = data.files.filter((f) => f.status === 'valid').length;
  const warningCount = data.files.filter((f) => f.status === 'warning').length;
  const dupCount = data.files.filter((f) => f.status === 'duplicate').length;
  const invalidCount = data.files.filter((f) => f.status === 'invalid').length;

  const importCount = data.files.filter(
    (f) => actions[f.index] !== 'skip',
  ).length;

  async function handleConfirm(): Promise<void> {
    setError('');
    setLoading(true);
    try {
      const payload = {
        sessionId: data.sessionId,
        files: data.files.map((f) => ({
          index: f.index,
          action: actions[f.index] ?? 'skip',
        })),
      };

      const res = await (api as any).api.fetch('/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => 'Unknown error');
        setError(`Import failed: ${msg}`);
        return;
      }

      const result = (await res.json()) as ConfirmResponse;
      onDone(result);
    } catch (err: any) {
      setError(err?.message ?? 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(): Promise<void> {
    try {
      await (api as any).api.fetch(`/session/${data.sessionId}`, {
        method: 'DELETE',
      });
    } catch {
      // best effort
    }
    onCancel();
  }

  return h('div', null,
    h('div', { style: S.title }, 'Upload Notes — Step 2: Review'),

    // Summary
    h('div', { style: S.summary },
      `${validCount} valid, ${warningCount} warning(s), ${dupCount} duplicate(s), ${invalidCount} invalid`,
    ),

    // File table
    h('div', { style: { overflowX: 'auto' as const, marginBottom: 12 } },
      h('table', { style: S.table },
        h('thead', null,
          h('tr', null,
            h('th', { style: S.th }, 'Path'),
            h('th', { style: S.th }, 'Status'),
            h('th', { style: S.th }, 'Action'),
            h('th', { style: S.th }, 'Errors'),
          ),
        ),
        h('tbody', null,
          data.files.map((f) => {
            const isInvalid = f.status === 'invalid';
            const isDup = f.status === 'duplicate';

            return h('tr', { key: f.index },
              // Path
              h('td', { style: { ...S.td(isInvalid ? 0.5 : 1), wordBreak: 'break-all' as const, maxWidth: 220 } },
                f.resolvedPath,
              ),
              // Status
              h('td', { style: S.td(isInvalid ? 0.5 : 1) },
                h(StatusBadge, { status: f.status }),
              ),
              // Action
              h('td', { style: S.td() },
                isDup
                  ? h('select', {
                      style: S.select,
                      value: actions[f.index] ?? 'skip',
                      onChange: (e: any) =>
                        setActions((prev) => ({
                          ...prev,
                          [f.index]: e.target.value as FileAction,
                        })),
                    },
                      h('option', { value: 'skip' }, 'Skip'),
                      h('option', { value: 'overwrite' }, 'Overwrite'),
                    )
                  : h('span', {
                      style: { fontSize: 12, color: isInvalid ? '#64748b' : '#94a3b8' },
                    }, isInvalid ? '—' : 'create'),
              ),
              // Errors
              h('td', { style: { ...S.td(), color: '#f87171', fontSize: 12, maxWidth: 180 } },
                f.errors && f.errors.length > 0
                  ? f.errors.join('; ')
                  : null,
              ),
            );
          }),
        ),
      ),
    ),

    error && h('div', {
      style: { color: '#f87171', fontSize: 13, marginBottom: 10 },
    }, error),

    h('div', { style: S.btnRow },
      h('button', { style: S.btnSecondary, onClick: handleCancel }, 'Cancel'),
      h('button', {
        style: {
          ...S.btnPrimary,
          opacity: loading || importCount === 0 ? 0.6 : 1,
          cursor: loading || importCount === 0 ? 'not-allowed' : 'pointer',
        },
        onClick: handleConfirm,
        disabled: loading || importCount === 0,
      }, loading ? 'Importing...' : `Import ${importCount} file(s)`),
    ),
  );
}

// ─── Step 3: Results ──────────────────────────────────────────────────────────

function StepResults({
  result,
  onClose,
}: {
  result: ConfirmResponse;
  onClose: () => void;
}): any {
  return h('div', null,
    h('div', { style: S.title }, 'Upload Notes — Done'),

    h('div', { style: S.resultRow },
      h('div', { style: S.resultStat },
        h('div', { style: S.resultNum }, result.created),
        h('div', { style: S.resultLabel }, 'Created'),
      ),
      h('div', { style: S.resultStat },
        h('div', { style: { ...S.resultNum, color: '#a78bfa' } }, result.overwritten),
        h('div', { style: S.resultLabel }, 'Overwritten'),
      ),
    ),

    result.errors && result.errors.length > 0 && h('div', { style: S.errorList },
      h('div', { style: { fontWeight: 600, marginBottom: 6 } }, 'Errors:'),
      result.errors.map((e, i) =>
        h('div', { key: i, style: { marginTop: 3 } }, e),
      ),
    ),

    h('div', { style: S.btnRow },
      h('button', { style: S.btnPrimary, onClick: onClose }, 'Done'),
    ),
  );
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────

function UploadModal({ api, onClose }: { api: ClientPluginAPI; onClose: () => void }): any {
  const [step, setStep] = useState<'select' | 'review' | 'results'>('select');
  const [validated, setValidated] = useState<ValidateResponse | null>(null);
  const [result, setResult] = useState<ConfirmResponse | null>(null);

  function handleValidated(data: ValidateResponse): void {
    setValidated(data);
    setStep('review');
  }

  function handleDone(res: ConfirmResponse): void {
    setResult(res);
    setStep('results');
  }

  function handleOverlayClick(e: any): void {
    if (e.target === e.currentTarget) onClose();
  }

  return h('div', { style: S.overlay, onClick: handleOverlayClick },
    h('div', { style: S.modal, onClick: (e: any) => e.stopPropagation() },
      step === 'select' && h(StepSelect, {
        api,
        onValidated: handleValidated,
        onCancel: onClose,
      }),
      step === 'review' && validated && h(StepReview, {
        api,
        data: validated,
        onDone: handleDone,
        onCancel: onClose,
      }),
      step === 'results' && result && h(StepResults, {
        result,
        onClose,
      }),
    ),
  );
}

// ─── Toolbar Button ───────────────────────────────────────────────────────────

function UploadButton({ api }: { api: ClientPluginAPI }): any {
  const [open, setOpen] = useState(false);

  return h('span', null,
    h('button', {
      onClick: () => setOpen(true),
      title: 'Mass upload notes',
      style: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: 'inherit',
        fontSize: 14,
        padding: '4px 8px',
        borderRadius: 4,
      },
    }, '\u2B06 Upload'),
    open && h(UploadModal, { api, onClose: () => setOpen(false) }),
  );
}

// ─── Plugin entry points ──────────────────────────────────────────────────────

export function activate(api: ClientPluginAPI): void {
  (api as any).ui.registerEditorToolbarButton(
    () => h(UploadButton, { api }),
    { id: 'mass-upload-btn', order: 100 },
  );
}

export function deactivate(): void {}
