import { Download, FilePenLine, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob } from '../utils/download';

export default function EditMetadataPage() {
  const { t } = useTranslation('common');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  
  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: '',
    producer: ''
  });

  React.useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const limitMB = TOOL_SIZE_LIMITS['edit-metadata']?.maxSingleMB || 50;

  const handleProcess = async () => {
    if (!file) return;
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      setIsProcessing(true);
      setError(null);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const resultBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'editMetadataPDF',
        { bytes, metadata }
      );

      const blob = new Blob([resultBytes], { type: 'application/pdf' });
      const name = file.name.replace(/\.pdf$/i, '') + '-metadata.pdf';
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      setIsSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message || 'Failed to edit metadata.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMetadata(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadein" id="edit_metadata_container">
      <SEO slug="edit-pdf-metadata" />
      <ToolHeader slug="edit-pdf-metadata" limitMB={limitMB} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <FilePenLine className="w-5 h-5 text-emerald-600" />
              <span>{t('editMetadata.selectDocument', { defaultValue: 'Select Document' })}</span>
            </div>

            {!file ? (
              <FileUploader
                onFilesSelected={(files) => {
                  if (files && files.length > 0) {
                    setFile(files[0]);
                    setError(null);
                    setIsSuccess(false);
                    if (downloadUrl) {
                      URL.revokeObjectURL(downloadUrl);
                      setDownloadUrl(null);
                    }
                  }
                }}
                accept=".pdf,application/pdf"
                maxSizeMB={limitMB}
                id="edit_metadata_uploader"
              />
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between" id="loaded_metadata_file">
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setError(null);
                    setIsSuccess(false);
                    if (downloadUrl) {
                      URL.revokeObjectURL(downloadUrl);
                      setDownloadUrl(null);
                    }
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white border border-slate-200 py-1.5 px-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              </div>
            )}

            {isSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 font-bold" id="metadata_success_banner">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                  <span>{t('toolCommon.success', { defaultValue: 'Metadata Updated Successfully! Your modified PDF has been generated.' })}</span>
                </div>
                {downloadUrl && (
                  <div className="pt-2">
                    <a
                      href={downloadUrl}
                      download={downloadName}
                      id="manual_download_link"
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Download className="w-4 h-4 animate-bounce" />
                      <span>{t('toolCommon.download', { defaultValue: 'Download PDF with Metadata' })}</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {file && (
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('editMetadata.documentProperties', { defaultValue: 'Document Properties' })}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="meta_title" className="text-xs font-bold text-slate-700">{t("editMetadata.lblTitle")}</label>
                    <input
                      id="meta_title"
                      type="text"
                      name="title"
                      value={metadata.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                      placeholder="Document Title"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="meta_author" className="text-xs font-bold text-slate-700">{t("editMetadata.lblAuthor")}</label>
                    <input
                      id="meta_author"
                      type="text"
                      name="author"
                      value={metadata.author}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                      placeholder="Document Author"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="meta_subject" className="text-xs font-bold text-slate-700">{t("editMetadata.lblSubject")}</label>
                    <input
                      id="meta_subject"
                      type="text"
                      name="subject"
                      value={metadata.subject}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                      placeholder="Document Subject"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="meta_keywords" className="text-xs font-bold text-slate-700">{t("editMetadata.lblKeywords")}</label>
                    <input
                      id="meta_keywords"
                      type="text"
                      name="keywords"
                      value={metadata.keywords}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                      placeholder="keyword1, keyword2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="meta_creator" className="text-xs font-bold text-slate-700">{t("editMetadata.lblCreator")}</label>
                    <input
                      id="meta_creator"
                      type="text"
                      name="creator"
                      value={metadata.creator}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                      placeholder="Application Name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="meta_producer" className="text-xs font-bold text-slate-700">{t("editMetadata.lblProducer")}</label>
                    <input
                      id="meta_producer"
                      type="text"
                      name="producer"
                      value={metadata.producer}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                      placeholder="PDF Producer Tool"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">{t('editMetadata.metadataUpdate', { defaultValue: 'Metadata Update' })}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{t('editMetadata.metadataUpdateDesc', { defaultValue: 'Updates your document info tags without modifying page contents or layout quality.' })}</p>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            {error && (
              <div className="flex items-start space-x-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={!file || isProcessing}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/10 ${
                file && !isProcessing
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 pointer-events-none shadow-none'
              }`}
            >
              {isProcessing ? (
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
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 text-slate-700 leading-relaxed" id="metadata_guide_section">
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t("editMetadata.guideTitle")}
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            {t("editMetadata.guideDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t("editMetadata.stdProps")}
            </h3>
            <ul className="text-xs space-y-1.5 text-slate-600 list-disc pl-4">
              <li>{t("editMetadata.liTitle")}</li>
              <li>{t("editMetadata.liAuthor")}</li>
              <li>{t("editMetadata.liKeywords")}</li>
              <li>{t("editMetadata.liCreator")}</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t("editMetadata.whyEdit")}
            </h3>
            <ul className="text-xs space-y-1.5 text-slate-600 list-disc pl-4">
              <li>{t("editMetadata.liLeaks")}</li>
              <li>{t("editMetadata.liPres")}</li>
              <li>{t("editMetadata.liReg")}</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">{t('editMetadata.howToEdit', { defaultValue: 'How to Edit PDF Properties with PdfMinty in 3 Steps' })}</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600">
            <li>{t("editMetadata.step1")}</li>
            <li>{t("editMetadata.step2")}</li>
            <li>{t("editMetadata.step3")}</li>
          </ol>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-900">
          <p className="font-bold">{t("editMetadata.zeroUploadGuarantee")}</p>
          <p className="leading-normal text-slate-600">
            {t("editMetadata.offlineNotice")}
          </p>
        </div>
      </section>
    </div>
  );
}
