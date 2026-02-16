import { useState, useEffect, useCallback } from 'react';
import { RedirectRule, StorageData } from '../types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function OptionsApp() {
  const [rules, setRules] = useState<RedirectRule[]>([]);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState({ sourceUrl: '', destinationUrl: '', matchType: 'contains' as const, enabled: true });

  useEffect(() => {
    chrome.storage.sync.get({ rules: [], globalEnabled: true }, (data: { [key: string]: any }) => {
      setRules((data as StorageData).rules || []);
      setGlobalEnabled((data as StorageData).globalEnabled ?? true);
    });

    // Listen for storage changes from popup
    const listener = (changes: { [key: string]: any }) => {
      if (changes.rules) setRules(changes.rules.newValue || []);
      if (changes.globalEnabled) setGlobalEnabled(changes.globalEnabled.newValue ?? true);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const saveRules = useCallback((newRules: RedirectRule[], newGlobalEnabled?: boolean) => {
    const enabled = newGlobalEnabled ?? globalEnabled;
    chrome.storage.sync.set({ rules: newRules, globalEnabled: enabled });
    setRules(newRules);
    if (newGlobalEnabled !== undefined) setGlobalEnabled(newGlobalEnabled);
  }, [globalEnabled]);

  const handleAdd = () => {
    if (!newRule.sourceUrl.trim() || !newRule.destinationUrl.trim()) return;
    const rule: RedirectRule = { ...newRule, id: generateId() };
    saveRules([...rules, rule]);
    setNewRule({ sourceUrl: '', destinationUrl: '', matchType: 'contains', enabled: true });
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    saveRules(rules.filter((r) => r.id !== id));
  };

  const handleToggle = (id: string) => {
    saveRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const handleUpdate = (updated: RedirectRule) => {
    saveRules(rules.map((r) => (r.id === updated.id ? updated : r)));
    setEditingId(null);
  };

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
          const imported = data.map((r: any) => ({ ...r, id: generateId() }));
          saveRules([...rules, ...imported]);
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteAll = () => {
    if (confirm('Delete all redirect rules? This cannot be undone.')) {
      saveRules([]);
    }
  };

  const filteredRules = rules.filter((rule) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return rule.sourceUrl.toLowerCase().includes(q) || rule.destinationUrl.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">URL Redirect</h1>
              <p className="text-s text-slate-400">
                {rules.length} rule{rules.length !== 1 ? 's' : ''} · {rules.filter(r => r.enabled).length} active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{globalEnabled ? 'Enabled' : 'Disabled'}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={globalEnabled} onChange={() => saveRules(rules, !globalEnabled)} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 gap-4">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              onClick={handleExport}
              disabled={rules.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>

            {rules.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete All
              </button>
            )}

            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Rule
            </button>
          </div>
        </div>

        {/* Add Rule Form */}
        {showAddForm && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 animate-fade-in">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Add New Rule</h3>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end mb-4">
              <div>
                <label className="block text-s font-medium text-slate-500 uppercase tracking-wider mb-1.5">Source URL</label>
                <input
                  type="text"
                  value={newRule.sourceUrl}
                  onChange={(e) => setNewRule({ ...newRule, sourceUrl: e.target.value })}
                  placeholder="http://hello/"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                  autoFocus
                />
              </div>
              <div className="pb-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <div>
                <label className="block text-s font-medium text-slate-500 uppercase tracking-wider mb-1.5">Destination URL</label>
                <input
                  type="text"
                  value={newRule.destinationUrl}
                  onChange={(e) => setNewRule({ ...newRule, destinationUrl: e.target.value })}
                  placeholder="http://hello.google.com/"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(['contains', 'regex'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewRule({ ...newRule, matchType: type })}
                    className={`px-3 py-1 rounded-md text-s font-medium transition-colors ${
                      newRule.matchType === type
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                        : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600'
                    }`}
                  >
                    {type === 'regex' ? '.*' : '⊃'} {type}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
                <button
                  onClick={handleAdd}
                  disabled={!newRule.sourceUrl.trim() || !newRule.destinationUrl.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Add Rule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rules Table */}
        {filteredRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 mb-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">
              {searchQuery ? 'No matching rules found' : 'No redirect rules configured'}
            </p>
            <p className="text-slate-400 text-s">
              {searchQuery ? 'Try a different search term' : 'Click "Add Rule" to get started'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-s font-medium text-slate-400 uppercase tracking-wider w-20">Status</th>
                  <th className="text-left px-4 py-3 text-s font-medium text-slate-400 uppercase tracking-wider">Source URL</th>
                  <th className="text-left px-4 py-3 text-s font-medium text-slate-400 uppercase tracking-wider w-8"></th>
                  <th className="text-left px-4 py-3 text-s font-medium text-slate-400 uppercase tracking-wider">Destination URL</th>
                  <th className="text-left px-4 py-3 text-s font-medium text-slate-400 uppercase tracking-wider w-20">Type</th>
                  <th className="text-right px-4 py-3 text-s font-medium text-slate-400 uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => (
                  <tr
                    key={rule.id}
                    className={`border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 transition-colors ${
                      !rule.enabled || !globalEnabled ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <label className="toggle-switch" style={{ display: 'inline-block' }}>
                          <input type="checkbox" checked={rule.enabled} onChange={() => handleToggle(rule.id)} />
                          <span className="toggle-slider" />
                        </label>
                        <span className={`text-s font-medium ${rule.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {rule.enabled ? 'On' : 'Off'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === rule.id ? (
                        <input
                          type="text"
                          defaultValue={rule.sourceUrl}
                          onBlur={(e) => handleUpdate({ ...rule, sourceUrl: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdate({ ...rule, sourceUrl: (e.target as HTMLInputElement).value })}
                          className="w-full px-2 py-1 border border-indigo-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono text-slate-700 cursor-pointer hover:text-indigo-600" onClick={() => setEditingId(rule.id)}>
                          {rule.sourceUrl}
                        </span>
                      )}
                    </td>
                    <td className="px-1 py-3 text-center">
                      <svg className="w-4 h-4 text-indigo-300 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === rule.id ? (
                        <input
                          type="text"
                          defaultValue={rule.destinationUrl}
                          onBlur={(e) => handleUpdate({ ...rule, destinationUrl: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdate({ ...rule, destinationUrl: (e.target as HTMLInputElement).value })}
                          className="w-full px-2 py-1 border border-indigo-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                        />
                      ) : (
                        <span className="font-mono text-indigo-600 cursor-pointer hover:text-indigo-700" onClick={() => setEditingId(rule.id)}>
                          {rule.destinationUrl}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-s font-medium ${
                        rule.matchType === 'regex'
                          ? 'bg-violet-50 text-violet-600 border border-violet-200'
                          : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        {rule.matchType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingId(editingId === rule.id ? null : rule.id)}
                          className="p-1.5 rounded text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="p-1.5 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
