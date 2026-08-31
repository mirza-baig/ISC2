interface DefaultFilterKeyValue {
  FilterKey: string;
  FilterValue: string;
}

const quoteFilterValue = (value: string): string =>
  `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

export const buildFilterGroup = (attribute: string, values: string[]): string =>
  `(${values.map((value) => `${attribute}:${quoteFilterValue(value)}`).join(' OR ')})`;

export const buildDefaultFilterGroups = (
  defaultFilters: DefaultFilterKeyValue[] | undefined
): string[] => {
  if (!defaultFilters?.length) {
    return [];
  }

  const groups = defaultFilters
    .filter((filter) => filter?.FilterKey?.trim() && filter?.FilterValue?.trim())
    .map((filter) =>
      buildFilterGroup(
        filter.FilterKey.trim(),
        filter.FilterValue.split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      )
    )
    .filter((group) => group !== '()');

  return groups;
};
