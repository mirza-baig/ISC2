const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_MB * 1024 * 1024; // 5MB;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png'];

export const convertImageToBase64 = (image: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]); // Remove base64 prefix
    };

    reader.onerror = (error) => {
      reject('Error reading file: ' + error);
    };

    reader.readAsDataURL(image);
  });
};

export const isValidImage = (userImage: Blob): boolean => {
  if (userImage.size > MAX_IMAGE_SIZE) {
    throw `File size must be less than ${MAX_IMAGE_SIZE_MB}MB.`;
  }

  if (!VALID_IMAGE_TYPES.includes(userImage.type)) {
    throw 'Only JPG and PNG files are allowed.';
  }

  return true;
};

export const buildBase64Image = (base64Data: string): string => {
  return `data:image/png;base64, ${base64Data}`;
};
