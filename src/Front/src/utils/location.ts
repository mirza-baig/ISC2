export const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

export const getAbsolutePath = (path?: string) => {
  if (!path) {
    return '';
  }

  const domain = new URL(window.location.href);
  const url = path.charAt(0) === '/' ? domain.hostname + path : path;
  return url.toLowerCase();
};

export const removeUrlParameter = (paramToRemove: string) => {
  const url = new URL(window.location.href);
  url.searchParams.delete(paramToRemove);
  window.history.replaceState({}, '', url.toString());
};
