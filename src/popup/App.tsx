import { useState, useEffect, useCallback } from 'react';
import { RedirectRule, StorageData } from '../types';
import Header from './components/Header';
import RuleForm from './components/RuleForm';
import RuleItem from './components/RuleItem';
import ImportExport from './components/ImportExport';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function App() {
  const [rules, setRules] = useState<RedirectRule[]>([]);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<RedirectRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPageUrl, setCurrentPageUrl] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  // Load rules from storage and current tab URL
  useEffect(() => {
    chrome.storage.sync.get({ rules: [], globalEnabled: true }, (data: { [key: string]: any }) => {
      setRules((data as StorageData).rules || []);
      setGlobalEnabled((data as StorageData).globalEnabled ?? true);
    });
    // Get current active tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        setCurrentPageUrl(tabs[0].url);
      }
    });
  }, []);

  // Save rules to storage
  const saveRules = useCallback((newRules: RedirectRule[], newGlobalEnabled?: boolean) => {
    const enabled = newGlobalEnabled ?? globalEnabled;
    chrome.storage.sync.set({ rules: newRules, globalEnabled: enabled });
    setRules(newRules);
    if (newGlobalEnabled !== undefined) {
      setGlobalEnabled(newGlobalEnabled);
    }
  }, [globalEnabled]);

  const handleAddRule = (rule: Omit<RedirectRule, 'id'>) => {
    const newRule: RedirectRule = { ...rule, id: generateId() };
    saveRules([...rules, newRule]);
    setShowForm(false);
  };

  const handleUpdateRule = (updated: RedirectRule) => {
    saveRules(rules.map((r) => (r.id === updated.id ? updated : r)));
    setEditingRule(null);
    setShowForm(false);
  };

  const handleDeleteRule = (id: string) => {
    saveRules(rules.filter((r) => r.id !== id));
  };

  const handleToggleRule = (id: string) => {
    saveRules(
      rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleToggleGlobal = () => {
    saveRules(rules, !globalEnabled);
  };

  const handleEdit = (rule: RedirectRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  const handleImport = (importedRules: RedirectRule[]) => {
    const newRules = importedRules.map((r) => ({ ...r, id: generateId() }));
    saveRules([...rules, ...newRules]);
  };

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const filteredRules = rules.filter((rule) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      rule.sourceUrl.toLowerCase().includes(q) ||
      rule.destinationUrl.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col min-h-[480px]">
      <Header
        globalEnabled={globalEnabled}
        onToggleGlobal={handleToggleGlobal}
        ruleCount={rules.length}
        activeCount={rules.filter((r) => r.enabled).length}
      />

      <div className="px-4 pb-3">
        {/* Search & Actions Bar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
            />
          </div>
          <button
            onClick={() => { setEditingRule(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Rule
          </button>
        </div>

        <div className="flex items-center justify-between">
          <ImportExport rules={rules} onImport={handleImport} />
          <button
            onClick={handleOpenOptions}
            className="flex items-center gap-1 px-2 py-1 text-s text-slate-500 hover:text-indigo-600 transition-colors"
            title="Open full options page"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Options
          </button>
        </div>
      </div>

      {/* Rule Form */}
      {showForm && (
        <div className="px-4 pb-3 animate-slide-in">
          <RuleForm
            rule={editingRule}
            defaultSourceUrl={!editingRule ? currentPageUrl : ''}
            onSubmit={editingRule ? handleUpdateRule : handleAddRule}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {/* Rules List */}
      <div className="flex-1 px-4 pb-4 space-y-2">
        {filteredRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">
              {searchQuery ? 'No matching rules' : 'No redirect rules yet'}
            </p>
            <p className="text-slate-400 text-s">
              {searchQuery ? 'Try a different search term' : 'Click "Add Rule" to create your first redirect'}
            </p>
          </div>
        ) : (
          filteredRules.map((rule) => (
            <RuleItem
              key={rule.id}
              rule={rule}
              globalEnabled={globalEnabled}
              onToggle={handleToggleRule}
              onEdit={handleEdit}
              onDelete={handleDeleteRule}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-100">
        <p className="text-s text-slate-400 text-center mb-1.5">
          URL Redirect v1.0 · Intercepts all request types including iframes
        </p>
        <a
          href="https://chromewebstore.google.com/detail/url-redirect/lllcecekdfpokjhohpgcjdjapelkeakj/reviews?hl=en-GB&authuser=0"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 group"
          title="Rate us on the Chrome Web Store"
        >
          <span className="text-xs text-slate-400 group-hover:text-amber-500 transition-colors">
            Rate us:
          </span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className={`w-4 h-4 transition-all duration-150 ${
                  star <= hoveredStar
                    ? 'text-amber-400 scale-125 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]'
                    : 'text-slate-300 group-hover:text-slate-400'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </a>
      </div>
    </div>
  );
}
