import { useCallback, useState } from 'react';

import { QuoteDocumentData, QuoteDocumentLabels } from 'types/index';

type DownloadPayload = {
  data: QuoteDocumentData;
  labels?: QuoteDocumentLabels;
};

/**
 * Generates and downloads the eCommerce quote PDF.
 *
 * `@react-pdf/renderer` and the quote document are imported on click rather than at
 * module scope — the renderer is a large dependency and nothing on the Payment
 * Information step needs it until the buyer asks for the file.
 */
export default function useDownloadQuote() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadQuote = useCallback(async ({ data, labels }: DownloadPayload) => {
    setIsGenerating(true);
    setError(null);

    let objectUrl: string | undefined;

    try {
      const [{ pdf }, { QuoteDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('components/Checkout/Quote/QuoteDocument'),
      ]);

      const blob = await pdf(<QuoteDocument data={data} labels={labels} />).toBlob();

      objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'quote.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (downloadError) {
      console.error('Failed to generate quote', downloadError);
      setError(downloadError as Error);
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      setIsGenerating(false);
    }
  }, []);

  return { downloadQuote, isGeneratingQuote: isGenerating, quoteError: error };
}
