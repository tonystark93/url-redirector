import { useState, useEffect } from 'react';
import { RedirectRule } from '../../types';

interface RuleFormProps {
  rule: RedirectRule | null;
  defaultSourceUrl?: string;
  onSubmit: (rule: any) => void;
  onCancel: () => void;
}

export default function RuleForm({ rule, defaultSourceUrl = '', onSubmit, onCancel }: RuleFormProps) {
  const [sourceUrl, setSourceUrl] = useState(defaultSourceUrl);
  const [destinationUrl, setDestinationUrl] = useState('');
  const [matchType, setMatchType] = useState<'contains' | 'regex'>('contains');
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (rule) {
      setSourceUrl(rule.sourceUrl);
      setDestinationUrl(rule.destinationUrl);
      setMatchType(rule.matchType);
      setEnabled(rule.enabled);
    }
  }, [rule]);

  const validateAndSubmit = () => {
    if (!sourceUrl.trim()) {
      setError('Source URL is required');
      return;
    }
    if (!destinationUrl.trim()) {
      setError('Destination URL is required');
      return;
    }
    if (sourceUrl.trim() === destinationUrl.trim()) {
      setError('Source and destination cannot be the same');
      return;
    }

    if (matchType === 'regex') {
      try {
        new RegExp(sourceUrl);
      } catch {
        setError('Invalid regex pattern');
        return;
      }
    }

    setError('');
    const ruleData = {
      ...(rule ? { id: rule.id } : {}),
      sourceUrl: sourceUrl.trim(),
      destinationUrl: destinationUrl.trim(),
      matchType,
      enabled,
    };
    onSubmit(ruleData);
  };

  const hasOverlap = matchType === 'contains' && destinationUrl.includes(sourceUrl) && sourceUrl.length > 0;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">
          {rule ? 'Edit Rule' : 'New Rule'}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-s text-slate-500">Enabled</span>
          <label className="toggle-switch">
            <input type="checkbox" checked={enabled} onChange={() => setEnabled(!enabled)} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* Source URL */}
      <div>
        <label className="block text-s font-medium text-slate-500 uppercase tracking-wider mb-1">
          Source URL
        </label>
        <input
          type="text"
          value={sourceUrl}
          onChange={(e) => { setSourceUrl(e.target.value); setError(''); }}
          placeholder={matchType === 'regex' ? '^https?://hello/(.*)$' : 'http://hello/'}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
          autoFocus
        />
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

      {/* Destination URL */}
      <div>
        <label className="block text-s font-medium text-slate-500 uppercase tracking-wider mb-1">
          Destination URL
        </label>
        <input
          type="text"
          value={destinationUrl}
          onChange={(e) => { setDestinationUrl(e.target.value); setError(''); }}
          placeholder={matchType === 'regex' ? 'https://hello.google.com/$1' : 'http://hello.google.com/'}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
        />
      </div>

      {/* Match Type */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setMatchType('contains')}
          className={`px-2.5 py-1 rounded-md text-s font-medium transition-colors ${matchType === 'contains'
              ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
              : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600'
            }`}
        >
          Contains
        </button>
        <button
          onClick={() => setMatchType('regex')}
          className={`px-2.5 py-1 rounded-md text-s font-medium transition-colors ${matchType === 'regex'
              ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
              : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600'
            }`}
        >
          Regex
        </button>
      </div>

      {/* Overlap warning */}
      {hasOverlap && (
        <div className="flex items-start gap-2 px-2.5 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <svg className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-s text-amber-700 leading-relaxed">
            Destination contains the source URL. Auto-exclusion regex will be applied to prevent recursive redirects.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-s text-red-500">{error}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={validateAndSubmit}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {rule ? 'Update' : 'Add Rule'}
        </button>
      </div>
    </div>
  );
}
