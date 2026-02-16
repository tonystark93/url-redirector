import { RedirectRule } from '../../types';

interface RuleItemProps {
  rule: RedirectRule;
  globalEnabled: boolean;
  onToggle: (id: string) => void;
  onEdit: (rule: RedirectRule) => void;
  onDelete: (id: string) => void;
}

export default function RuleItem({ rule, globalEnabled, onToggle, onEdit, onDelete }: RuleItemProps) {
  const isActive = rule.enabled && globalEnabled;

  return (
    <div
      className={`group relative bg-white border rounded-xl p-3 transition-all duration-200 hover:shadow-sm animate-fade-in ${
        isActive ? 'border-slate-200' : 'border-slate-100 opacity-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Toggle */}
        <label className="toggle-switch mt-0.5">
          <input
            type="checkbox"
            checked={rule.enabled}
            onChange={() => onToggle(rule.id)}
          />
          <span className="toggle-slider" />
        </label>

        {/* Rule content */}
        <div className="flex-1 min-w-0">
          {/* Source URL */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-s font-medium uppercase tracking-wider text-slate-400 shrink-0">From</span>
            <span className="text-s font-mono text-slate-700 truncate" title={rule.sourceUrl}>
              {rule.sourceUrl}
            </span>
          </div>

          {/* Arrow + Destination */}
          <div className="flex items-center gap-1.5">
            <span className="text-s font-medium uppercase tracking-wider text-indigo-400 shrink-0 flex items-center gap-0.5">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              To
            </span>
            <span className="text-s font-mono text-indigo-600 truncate" title={rule.destinationUrl}>
              {rule.destinationUrl}
            </span>
          </div>

          {/* Match type badge */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-s font-medium ${
              rule.matchType === 'regex'
                ? 'bg-violet-50 text-violet-600 border border-violet-200'
                : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}>
              {rule.matchType === 'regex' ? '.*' : '⊃'} {rule.matchType}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(rule)}
            className="p-1.5 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            title="Edit rule"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete rule"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
