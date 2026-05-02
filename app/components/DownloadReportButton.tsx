import React, { useState } from 'react';

interface Props {
  onDownload: () => Promise<void>;
  disabled?: boolean;
}

export default function DownloadReportButton({ onDownload, disabled = false }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    // Give SVGs and Charts time to fully mount in the hidden div
    await new Promise(resolve => setTimeout(resolve, 600));
    await onDownload();
    setIsGenerating(false);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || isGenerating}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 disabled:opacity-60 transition shadow-lg text-white"
    >
      {isGenerating ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>📄 Download Report</>
      )}
    </button>
  );
}
