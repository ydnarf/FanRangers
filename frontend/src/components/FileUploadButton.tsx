import { useRef, useState } from 'react';
import { uploadFile } from '../lib/api';

interface FileUploadButtonProps {
  type: 'thumbnail';
  onUploaded: (filename: string) => void;
  label: string;
}

export default function FileUploadButton({ type, onUploaded, label }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const acceptMap: Record<'thumbnail', string> = {
    thumbnail: 'image/*',
  };

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('uploading');
    setErrorMsg(null);
    try {
      const filename = await uploadFile(type, file);
      setUploadedName(filename);
      setStatus('done');
      onUploaded(filename);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al subir archivo');
      setStatus('error');
    } finally {
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={acceptMap[type]}
        onChange={handleChange}
        className="sr-only"
        aria-label={label}
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === 'uploading'}
        className="text-xs px-3 py-1.5 rounded-md border border-[#2a2a2a] text-[#a3a3a3] hover:border-red-600/50 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'uploading' ? 'Subiendo...' : label}
      </button>
      {status === 'done' && uploadedName && (
        <span className="text-xs text-green-400 flex items-center gap-1">
          <span aria-hidden="true">&#10003;</span>
          {uploadedName}
        </span>
      )}
      {status === 'error' && errorMsg && (
        <span className="text-xs text-red-400">{errorMsg}</span>
      )}
    </span>
  );
}
