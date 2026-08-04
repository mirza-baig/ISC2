export const extractSrc = (htmlString: string): string | undefined => {
  if (!htmlString) {
    return '';
  }
  const srcRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/i;
  const match = htmlString?.match(srcRegex);

  return match ? match[1] : undefined;
};

export const extractAlt = (htmlString: string): string | undefined => {
  if (!htmlString) {
    return '';
  }
  const altRegex = /<img\s+[^>]*alt="([^"]+)"[^>]*>/i;
  const match = htmlString?.match(altRegex);

  return match ? match[1] : undefined;
};
