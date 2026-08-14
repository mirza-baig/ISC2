interface DefaultFilterKeyValue {
  FilterKey: string;
  FilterValue: string;
}

export const buildFilterGroup = (attribute: string, values: string[]): string =>
  `(${values.map((value) => `${attribute}:${value}`).join(' OR ')})`;

export const buildDefaultFilterGroups = (
  defaultFilters: DefaultFilterKeyValue[] | undefined
): string[] => {
  if (!defaultFilters?.length) {
    return [];
  }

  const groups = defaultFilters.map((filter) =>
    buildFilterGroup(filter.FilterKey, filter.FilterValue.split(','))
  );

  return groups[0] === '(:)' ? [] : groups;
};
