import { CheckCircle2, MapPin, Code2, ShieldCheck, Mail, Github, ArrowRight } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { PRIMARY_AUTHOR } from '../config/author';
import { ROUTES } from '../config/routes';

interface AuthorBioProps {
  className?: string;
  showCredentials?: boolean;
}

export const AuthorBio: React.FC<AuthorBioProps> = ({ className = '', showCredentials = true }) => {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const authorName =
    isBn && PRIMARY_AUTHOR.nativeName ? PRIMARY_AUTHOR.nativeName : PRIMARY_AUTHOR.name;
  const authorTitle = isBn
    ? 'প্রধান সফটওয়্যার ইঞ্জিনিয়ার এবং প্রতিষ্ঠাতা'
    : PRIMARY_AUTHOR.jobTitle;
  const authorLocation = isBn ? 'ঢাকা, বাংলাদেশ' : PRIMARY_AUTHOR.location;
  const authorBio = isBn
    ? 'মোহাম্মদ তানভীর মুন্সী একজন ফুল-স্ট্যাক সফটওয়্যার ইঞ্জিনিয়ার ও ওয়েব প্রাইভেসি গবেষক (ঢাকা, বাংলাদেশ)। ক্লায়েন্ট-সাইড ওয়েবঅ্যাসেম্বলি (WebAssembly) এবং ব্রাউজার মেমরি স্যান্ডবক্সিং প্রযুক্তির মাধ্যমে ফাইল আপলোড ছাড়াই শতভাগ নিরাপদ পিডিএফ প্রসেসিং নিশ্চিত করতে তিনি PdfMinty প্রতিষ্ঠা করেছেন।'
    : PRIMARY_AUTHOR.bio;

  return (
    <section
      aria-labelledby="author-bio-heading"
      className={`relative overflow-hidden rounded-3xl bg-surface-container-low border border-border-muted p-6 sm:p-8 shadow-sm transition-all hover:border-emerald-500/30 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border-muted">
        <div className="flex items-center gap-4">
          {/* Avatar representation with glowing verified border */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white font-black text-xl sm:text-2xl tracking-wider">
                <span>TM</span>
              </div>
            </div>
            <div
              className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-md"
              title="Verified Human Author & Engineer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold tracking-wide uppercase">
              <ShieldCheck className="w-3 h-3" />
              <span>{isBn ? 'লেখক ও প্রতিষ্ঠাতা' : 'Article Author & Creator'}</span>
            </div>
            <h3
              id="author-bio-heading"
              className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"
            >
              <span>{authorName}</span>
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
              {authorTitle}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{authorLocation} 🇧🇩</span>
            </div>
          </div>
        </div>

        {/* Quick Social & Contact Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href={PRIMARY_AUTHOR.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Profile"
            className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-border-muted text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Github className="w-4 h-4" />
          </a>
          <a
            href={`mailto:${PRIMARY_AUTHOR.email}`}
            aria-label="Email Creator"
            className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-border-muted text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Mail className="w-4 h-4" />
          </a>
          <Link
            to={`${ROUTES.ABOUT}#creator`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors"
          >
            <span>{isBn ? 'পূর্ণ প্রোফাইল' : 'Full Bio'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Bio text */}
      <div className="py-4 space-y-3">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          {authorBio}
        </p>
      </div>

      {/* Expertise & credentials tags */}
      {showCredentials && (
        <div className="pt-3 border-t border-border-muted/60 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Code2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isBn ? 'প্রযুক্তিগত দক্ষতা ও পর্যালোচনা' : 'Technical Expertise & Review'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRIMARY_AUTHOR.expertise.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-surface-container text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-border-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default AuthorBio;
