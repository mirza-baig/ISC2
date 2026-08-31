const SUPPORTED_KINDS = ['refinementList', 'menu', 'toggle', 'range', 'query', 'sortBy'] as const;

const IGNORED_KINDS = ['page', 'configure'] as const;

const KNOWN_KINDS: readonly string[] = [...SUPPORTED_KINDS, ...IGNORED_KINDS, 'hitsPerPage'];

const UNSAFE_ATTRIBUTES: readonly string[] = ['__proto__', 'constructor', 'prototype'];

export interface AlgoliaRangeRefinement {
  min?: number;
  max?: number;
}

export interface AlgoliaSearchState {
  indexName: string;
  refinements: Record<string, string[]>;
  menus: Record<string, string>;
  toggles: string[];
  ranges: Record<string, AlgoliaRangeRefinement>;
  query: string;
  sortByIndexName: string;
  unsupported: string[];
}

const splitParam = (key: string): { indexName: string; kind: string; rest: string[] } | null => {
  const match = key.match(/^([^[]+)\[([^\]]+)\](.*)$/);
  if (!match) {
    return null;
  }

  const [, indexName, kind, remainder] = match;
  const rest = Array.from(remainder.matchAll(/\[([^\]]*)\]/g)).map((m) => m[1]);

  return { indexName, kind, rest };
};

const parseRange = (value: string): AlgoliaRangeRefinement | null => {
  const [rawMin, rawMax] = value.split(':');
  const range: AlgoliaRangeRefinement = {};

  const min = Number(rawMin);
  if (rawMin !== undefined && rawMin !== '' && Number.isFinite(min)) {
    range.min = min;
  }

  const max = Number(rawMax);
  if (rawMax !== undefined && rawMax !== '' && Number.isFinite(max)) {
    range.max = max;
  }

  return range.min === undefined && range.max === undefined ? null : range;
};

const toSearchParams = (searchString: string): URLSearchParams => {
  const afterHash = searchString.split('#')[0];
  const queryPart = afterHash.includes('?')
    ? afterHash.slice(afterHash.indexOf('?') + 1)
    : afterHash;

  let decoded = queryPart;
  try {
    decoded = decodeURIComponent(queryPart);
  } catch {
    decoded = queryPart;
  }

  return new URLSearchParams(decoded.replace(/^&+/, ''));
};

const isUsableAttribute = (attribute: string | undefined): attribute is string =>
  !!attribute && !UNSAFE_ATTRIBUTES.includes(attribute);

export function parseAlgoliaSearchState(searchString: string | undefined | null) {
  const refinements = new Map<string, string[]>();
  const menus = new Map<string, string>();
  const ranges = new Map<string, AlgoliaRangeRefinement>();
  const toggles: string[] = [];
  const unsupported: string[] = [];

  let indexName = '';
  let query = '';
  let sortByIndexName = '';

  const build = (): AlgoliaSearchState => ({
    indexName,
    refinements: Object.fromEntries(refinements),
    menus: Object.fromEntries(menus),
    toggles,
    ranges: Object.fromEntries(ranges),
    query,
    sortByIndexName,
    unsupported,
  });

  if (!searchString?.trim()) {
    return build();
  }

  let params: URLSearchParams;
  try {
    params = toSearchParams(searchString);
  } catch {
    return build();
  }

  for (const [key, value] of params.entries()) {
    const parsed = splitParam(key);

    if (!parsed) {
      unsupported.push(key);
      continue;
    }

    const { indexName: paramIndex, kind, rest } = parsed;
    const [attribute] = rest;

    if (!indexName && KNOWN_KINDS.includes(kind)) {
      indexName = paramIndex;
    }

    if ((IGNORED_KINDS as readonly string[]).includes(kind) || kind === 'hitsPerPage') {
      continue;
    }

    switch (kind) {
      case 'refinementList': {
        if (!isUsableAttribute(attribute) || !value) break;
        refinements.set(attribute, [...(refinements.get(attribute) ?? []), value]);
        break;
      }

      case 'menu': {
        if (!isUsableAttribute(attribute) || !value) break;
        menus.set(attribute, value);
        break;
      }

      case 'toggle': {
        if (isUsableAttribute(attribute) && value === 'true') toggles.push(attribute);
        break;
      }

      case 'range': {
        if (!isUsableAttribute(attribute) || !value) break;
        const range = parseRange(value);
        if (range) ranges.set(attribute, range);
        break;
      }

      case 'query':
        if (value) query = value;
        break;

      case 'sortBy':
        if (value) sortByIndexName = value;
        break;

      default:
        unsupported.push(key);
        break;
    }
  }

  return build();
}

export default parseAlgoliaSearchState;
