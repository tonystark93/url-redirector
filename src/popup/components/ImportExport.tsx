import { useRef } from 'react';
import { RedirectRule } from '../../types';

interface ImportExportProps {
  rules: RedirectRule[];
  onImport: (rules: RedirectRule[]) => void;
}

export default function ImportExport({ rules, onImport }: ImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = JSON.stringify(rules, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'url-redirect-rules.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          onImport(data);
        } else {
          alert('Invalid file format. Expected an array of rules.');
        }
      } catch {
        alert('Failed to parse the file. Make sure it\'s valid JSON.');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1 px-2 py-1 text-s text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      <button
        onClick={handleExport}
        disabled={rules.length === 0}
        className="flex items-center gap-1 px-2 py-1 text-s text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>
    </div>
  );
}
