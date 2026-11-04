import { Download, FilePenLine, AlertCircle, RotateCcw } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { getToolLimit } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import { useUsageLimit } from '../contexts/UsageLimitContext';
import { WorkerManager } from '../core/WorkerManager';
import { addActivityItem } from '../utils/activityStore';
import { downloadBlob, sanitizeDownloadFilename } from '../utils/download';

const EMPTY_METADATA = {
  title: '',
  author: '',
  subject: '',
  keywords: '',
  creator: '',
  producer: '',
};

export default function EditMetadataPage() {
  const { t } = useTranslation('common');
  const { user, isPro } = useAuth();
  const { canPerformTask, openLimitModal } = useUsageLimit();
  const [file, setFile] = useState<File | null>(null);
  const [isReadingMetadata, setIsReadingMetadata] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  const operationTokenRef = useRef(0);
  const isSubmittingRef = useRef(false);

  const [metadata, setMetadata] = useState(EMPTY_METADATA);

  React.useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  React.useEffect(() => {
    const tokenRef = operationTokenRef;
    const submitRef = isSubmittingRef;
    return () => {
      tokenRef.current++;
      submitRef.current = false;
    };
  }, []);

  const limitMB = getToolLimit('edit-pdf-metadata', isPro, Boolean(user)).maxSingleMB;

  const resetFileState = () => {
    operationTokenRef.current++;
    isSubmittingRef.current = false;
    setIsReadingMetadata(false);
    setIsProcessing(false);
    setFile(null);
    setError(null);
    setIsSuccess(false);
    setMetadata(EMPTY_METADATA);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };

  const handleFileSelected = async (selectedFile: File) => {
    const currentToken = ++operationTokenRef.current;
    isSubmittingRef.current = false;
    setIsProcessing(false);
    setError(null);
    setIsSuccess(false);
    setMetadata(EMPTY_METADATA);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    if (selectedFile.size === 0) {
      setFile(null);
      setIsReadingMetadata(false);
      setError(
        t('editMetadata.emptyFileError', {
          defaultValue: 'The selected PDF file is empty (0 bytes). Please select a valid PDF.',
        })
      );
      return;
    }

    setFile(selectedFile);
    setIsReadingMetadata(true);

    try {
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());
      if (operationTokenRef.current !== currentToken) return;

      const existing = await WorkerManager.getInstance().runOperation<{
        title: string;
        author: string;
        subject: string;
        keywords: string;
        creator: string;
        producer: string;
      }>('getMetadataPDF', { bytes }, [bytes.buffer]);
      if (operationTokenRef.current === currentToken) {
        setMetadata(existing);
      }
    } catch (err: unknown) {
      if (operationTokenRef.current === currentToken) {
        const message = err instanceof Error ? err.message : 'Failed to read existing metadata.';
        setFile(null);
        setError(message);
      }
    } finally {
      if (operationTokenRef.current === currentToken) {
        setIsReadingMetadata(false);
      }
    }
  };

  const handleProcess = async () => {
    if (!file || isReadingMetadata || isProcessing || isSubmittingRef.current) return;
    if (!canPerformTask()) {
      openLimitModal({ reason: 'task_limit' });
      return;
    }
    isSubmittingRef.current = true;
    const currentToken = ++operationTokenRef.current;
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      setIsProcessing(true);
      setError(null);
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (operationTokenRef.current !== currentToken) return;

      const resultBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'editMetadataPDF',
        { bytes, metadata },
        [bytes.buffer]
      );
      if (operationTokenRef.current !== currentToken) return;

      const blob = new Blob([resultBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = sanitizeDownloadFilename(file.name.replace(/\.pdf$/i, '') + '-metadata.pdf');
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      addActivityItem({
        toolName: t('tools.editMetadata.title', { defaultValue: 'Edit Metadata' }),
        toolId: 'edit-pdf-metadata',
        fileName: name,
        fileSizeFormatted: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
        status: 'completed',
        tag: 'Edit',
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      if (operationTokenRef.current === currentToken) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message || 'Failed to edit metadata.');
      }
    } finally {
      if (operationTokenRef.current === currentToken) {
        isSubmittingRef.current = false;
        setIsProcessing(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMetadata((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadein" id="edit_metadata_container">
      <SEO slug="edit-pdf-metadata" />
      <ToolHeader slug="edit-pdf-metadata" limitMB={limitMB} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold">
              <FilePenLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('editMetadata.selectDocument', { defaultValue: 'Select Document' })}</span>
            </div>

            {!file ? (
              <FileUploader
                onFilesSelected={(files) => {
                  if (files && files.length > 0) {
                    void handleFileSelected(files[0]);
                  }
                }}
                accept=".pdf,application/pdf"
                maxSizeMB={limitMB}
                id="edit_metadata_uploader"
              />
            ) : (
              <div
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3"
                id="loaded_metadata_file"
              >
                <div className="truncate pr-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetFileState}
                  className="shrink-0 min-h-[40px] text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-2 px-3.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              </div>
            )}

            {error && !file && (
              <div
                className="flex items-start space-x-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-3 rounded-xl font-semibold"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {isSuccess && (
              <div
                className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 dark:text-emerald-300 font-bold"
                id="metadata_success_banner"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                  <span>
                    {t('toolCommon.success', {
                      defaultValue:
                        'Metadata Updated Successfully! Your modified PDF has been generated.',
                    })}
                  </span>
                </div>
                {downloadUrl && (
                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <a
                      href={downloadUrl}
                      download={downloadName}
                      id="manual_download_link"
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Download className="w-4 h-4 animate-bounce" />
                      <span>
                        {t('toolCommon.download', { defaultValue: 'Download PDF with Metadata' })}
                      </span>
                    </a>
                    <button
                      type="button"
                      onClick={resetFileState}
                      className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-emerald-200 dark:border-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                    >
                      {t('toolCommon.processAnother', { defaultValue: 'Edit Another PDF' })}
                    </button>
                  </div>
                )}
              </div>
            )}

            {file && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t('editMetadata.documentProperties', { defaultValue: 'Document Properties' })}
                  </h3>
                  <button
                    type="button"
                    disabled={isReadingMetadata || isProcessing}
                    onClick={() => setMetadata(EMPTY_METADATA)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('editMetadata.clearAll', { defaultValue: 'Clear All Fields' })}</span>
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="meta_title"
                      className="text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      {t('editMetadata.lblTitle')}
                    </label>
                    <input
                      id="meta_title"
                      type="text"
                      name="title"
                      disabled={isReadingMetadata || isProcessing}
                      value={metadata.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium disabled:opacity-60"
                      placeholder="Document Title"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="meta_author"
                      className="text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      {t('editMetadata.lblAuthor')}
                    </label>
                    <input
                      id="meta_author"
                      type="text"
                      name="author"
                      disabled={isReadingMetadata || isProcessing}
                      value={metadata.author}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium disabled:opacity-60"
                      placeholder="Document Author"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="meta_subject"
                      className="text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      {t('editMetadata.lblSubject')}
                    </label>
                    <input
                      id="meta_subject"
                      type="text"
                      name="subject"
                      disabled={isReadingMetadata || isProcessing}
                      value={metadata.subject}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium disabled:opacity-60"
                      placeholder="Document Subject"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="meta_keywords"
                      className="text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      {t('editMetadata.lblKeywords')}
                    </label>
                    <input
                      id="meta_keywords"
                      type="text"
                      name="keywords"
                      disabled={isReadingMetadata || isProcessing}
                      value={metadata.keywords}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium disabled:opacity-60"
                      placeholder="keyword1, keyword2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="meta_creator"
                      className="text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      {t('editMetadata.lblCreator')}
                    </label>
                    <input
                      id="meta_creator"
                      type="text"
                      name="creator"
                      disabled={isReadingMetadata || isProcessing}
                      value={metadata.creator}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium disabled:opacity-60"
                      placeholder="Application Name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="meta_producer"
                      className="text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      {t('editMetadata.lblProducer')}
                    </label>
                    <input
                      id="meta_producer"
                      type="text"
                      name="producer"
                      disabled={isReadingMetadata || isProcessing}
                      value={metadata.producer}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium disabled:opacity-60"
                      placeholder="PDF Producer Tool"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              {t('editMetadata.metadataUpdate', { defaultValue: 'Metadata Update' })}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('editMetadata.metadataUpdateDesc', {
                defaultValue:
                  'Updates your document info tags without modifying page contents or layout quality.',
              })}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {error && file && (
              <div
                className="flex items-start space-x-1.5 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800/60 p-3 rounded-lg"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleProcess}
              disabled={!file || isReadingMetadata || isProcessing}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/10 ${
                file && !isReadingMetadata && !isProcessing
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 dark:bg-slate-800 dark:text-slate-500 pointer-events-none shadow-none'
              }`}
            >
              {isReadingMetadata ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>
                    {t('editMetadata.readingMetadata', { defaultValue: 'Reading Metadata...' })}
                  </span>
                </span>
              ) : isProcessing ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{t('toolCommon.processing', { defaultValue: 'Updating...' })}</span>
                </span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t('toolCommon.process', { defaultValue: 'Update & Download' })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Deep Content & Comprehensive Guide Section */}
      <section
        className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed"
        id="metadata_guide_section"
      >
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('editMetadata.guideTitle')}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {t('editMetadata.guideDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t('editMetadata.stdProps')}
            </h3>
            <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400 list-disc pl-4">
              <li>{t('editMetadata.liTitle')}</li>
              <li>{t('editMetadata.liAuthor')}</li>
              <li>{t('editMetadata.liKeywords')}</li>
              <li>{t('editMetadata.liCreator')}</li>
            </ul>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t('editMetadata.whyEdit')}
            </h3>
            <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400 list-disc pl-4">
              <li>{t('editMetadata.liLeaks')}</li>
              <li>{t('editMetadata.liPres')}</li>
              <li>{t('editMetadata.liReg')}</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t('editMetadata.howToEdit', {
              defaultValue: 'How to Edit PDF Properties with PdfMinty in 3 Steps',
            })}
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>{t('editMetadata.step1')}</li>
            <li>{t('editMetadata.step2')}</li>
            <li>{t('editMetadata.step3')}</li>
          </ol>
        </div>

        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2 text-xs text-emerald-900 dark:text-emerald-300">
          <p className="font-bold">{t('editMetadata.zeroUploadGuarantee')}</p>
          <p className="leading-normal text-slate-600 dark:text-slate-400">
            {t('editMetadata.offlineNotice')}
          </p>
        </div>
      </section>
    </div>
  );
}
