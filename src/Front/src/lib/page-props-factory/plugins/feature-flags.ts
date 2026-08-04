import { SitecorePageProps } from 'lib/page-props';
import { Plugin } from '..';
import clientFactory from 'lib/graphql-client-factory';
import config from 'temp/config';

const FLAGS_ITEM_PATH = '/sitecore/content/ISC2/Main/Data/Feature Flags Folder/Feature Flags';

const ENABLED_OPTION_ID = 'a94828fb-3855-44c1-a85e-a964c03b48d5';

const FLAGS_QUERY = `
  query FeatureFlags($path: String!, $language: String!) {
    item(path: $path, language: $language) {
      field(name: "Flags") {
        value
      }
    }
  }
`;

const normalizeGuid = (value: string): string => value.replace(/[{}]/g, '').toLowerCase();

export const parseFeatureFlags = (raw?: string | null): Record<string, boolean> => {
  const flags: Record<string, boolean> = {};
  if (!raw) return flags;

  for (const [name, id] of new URLSearchParams(raw)) {
    if (!name) continue;
    flags[name] = normalizeGuid(id) === ENABLED_OPTION_ID;
  }

  return flags;
};

class FeatureFlagsPlugin implements Plugin {
  order = 1;

  async exec(props: SitecorePageProps): Promise<SitecorePageProps> {
    try {
      const client = clientFactory();
      const data = await client.request<{ item?: { field?: { value?: string } } }>(FLAGS_QUERY, {
        path: FLAGS_ITEM_PATH,
        language: props.locale || config.defaultLanguage,
      });

      props.featureFlags = parseFeatureFlags(data?.item?.field?.value);
    } catch (error) {
      console.error('[feature-flags] Unable to load feature flags:', error);
      props.featureFlags = {};
    }

    return props;
  }
}

export const featureFlagsPlugin = new FeatureFlagsPlugin();
