import { useMutation } from '@tanstack/react-query';

import { PoAttachment } from 'types/index';
import useLoggedUser from '../useLoggedUser';

type UploadOrderFilesPayload = {
  orderNumber: string;
  files: PoAttachment[];
};

const stripDataUrlPrefix = (base64: string) => base64.replace(/^data:[^,]*;base64,/, '');

export default function useUploadOrderFiles() {
  const { externalID } = useLoggedUser();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ orderNumber, files }: UploadOrderFilesPayload) => {
      if (!externalID) {
        throw new Error('Missing externalID for order file upload');
      }

      const response = await fetch('/api/salesforce/b2b/uploadOrderFiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          files: files.map(({ fileName, base64 }) => ({
            filename: fileName,
            data: stripDataUrlPrefix(base64),
          })),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw errorBody ?? new Error(`Order file upload failed with status ${response.status}`);
      }
    },
  });

  return {
    uploadOrderFilesAsync: mutateAsync,
    isUploadingOrderFiles: isPending,
    uploadOrderFilesError: error,
  };
}
