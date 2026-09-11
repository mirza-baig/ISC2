import { useCallback, useState } from 'react';

import { BusinessReceiptData, BusinessReceiptLabels } from 'types/index';

type DownloadPayload = {
  data: BusinessReceiptData;
  labels?: BusinessReceiptLabels;
};

export default function useDownloadBusinessReceipt() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadReceipt = useCallback(async ({ data, labels }: DownloadPayload) => {
    setIsGenerating(true);
    setError(null);

    let objectUrl: string | undefined;

    try {
      const [{ pdf }, { BusinessTransactionReceipt }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('components/Order/BusinessTransactionReceipt'),
      ]);

      const blob = await pdf(<BusinessTransactionReceipt data={data} labels={labels} />).toBlob();

      objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `transaction-receipt-${data.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (downloadError) {
      console.error('Failed to generate business transaction receipt', downloadError);
      setError(downloadError as Error);
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      setIsGenerating(false);
    }
  }, []);

  return { downloadReceipt, isGeneratingReceipt: isGenerating, receiptError: error };
}
