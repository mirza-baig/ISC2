export const areStringsEqual = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

export const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
