import { Search, X, Loader2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  isDebouncing: boolean;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  isDebouncing,
  placeholder,
}) => {
  const { t } = useTranslation('common');
  const effectivePlaceholder =
    placeholder || t('home.search.placeholder', { defaultValue: 'Search PDF tools...' });
  const effectiveAriaLabel = t('home.search.ariaLabel', { defaultValue: 'Search PDF tools' });

  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
        <Search className="w-4 h-4" aria-hidden="true" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={effectivePlaceholder}
        aria-label={effectiveAriaLabel}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md pl-11 pr-11 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/30 shadow-xs transition-all duration-200"
      />

      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {isDebouncing && (
          <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" aria-hidden="true" />
        )}
        {!isDebouncing && value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Clear search text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
