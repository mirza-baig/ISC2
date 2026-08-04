export const goToTop = (top = 0) => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ left: 0, top, behavior: 'smooth' });
  }
};
