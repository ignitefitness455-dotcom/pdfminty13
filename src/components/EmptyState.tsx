import { FileText, LucideIcon } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileText,
  title,
  description,
  className = '',
}) => {
  const { t } = useTranslation('common');

  const displayTitle =
    title || t('emptyState.title', { defaultValue: 'Upload a PDF to get started' });
  const displayDesc =
    description ||
    t('emptyState.desc', {
      defaultValue: 'Choose a document above to process, edit, or configure using this tool.',
    });

  return (
    <div
      className={`p-8 bg-slate-50/60 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-2.5 ${className}`}
      id="empty_state_container"
    >
      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs text-slate-400 dark:text-slate-500">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">{displayTitle}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
        {displayDesc}
      </p>
    </div>
  );
};

export default EmptyState;
