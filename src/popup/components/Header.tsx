interface HeaderProps {
  globalEnabled: boolean;
  onToggleGlobal: () => void;
  ruleCount: number;
  activeCount: number;
}

export default function Header({ globalEnabled, onToggleGlobal, ruleCount, activeCount }: HeaderProps) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-slate-100 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-200">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800 leading-tight">URL Redirect</h1>
            <p className="text-s text-slate-400">
              {ruleCount === 0
                ? 'No rules configured'
                : `${activeCount} of ${ruleCount} rule${ruleCount !== 1 ? 's' : ''} active`}
            </p>
          </div>
        </div>

        <label className="toggle-switch" title={globalEnabled ? 'Disable all rules' : 'Enable all rules'}>
          <input type="checkbox" checked={globalEnabled} onChange={onToggleGlobal} />
          <span className="toggle-slider" />
        </label>
      </div>
    </div>
  );
}
