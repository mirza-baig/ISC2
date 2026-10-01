import { useMutation } from '@tanstack/react-query';

import { PoAttachment } from 'types/index';

type UploadOrderFilesPayload = {
  orderNumber: string;
  files: PoAttachment[];
};

/** `FileReader` hands back a data URL; Mule wants the bare base64 after the comma. */
const stripDataUrlPrefix = (base64: string) => base64.replace(/^data:[^,]*;base64,/, '');

/** Attaches files to a placed order via Mule (`POST /v1/order/{orderNumber}/files`). */
export default function useUploadOrderFiles() {
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ orderNumber, files }: UploadOrderFilesPayload) => {
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
