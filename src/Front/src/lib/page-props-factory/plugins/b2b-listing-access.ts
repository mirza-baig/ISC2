import { SitecorePageProps } from 'lib/page-props';
import { B2B_FEATURE_FLAG, B2B_LISTING_TEMPLATE_NAME } from 'constants/index';
import { Plugin } from '..';

class B2BListingAccessPlugin implements Plugin {
  order = 2;

  async exec(props: SitecorePageProps): Promise<SitecorePageProps> {
    if (props.notFound) return props;

    const isB2BListingPage =
      props.layoutData?.sitecore?.route?.templateName === B2B_LISTING_TEMPLATE_NAME;
    const isB2BFeatureEnabled = Object.entries(props.featureFlags ?? {}).some(
      ([name, enabled]) => name === B2B_FEATURE_FLAG && enabled
    );

    if (isB2BListingPage && !isB2BFeatureEnabled) {
      props.notFound = true;
    }

    return props;
  }
}

export const b2bListingAccessPlugin = new B2BListingAccessPlugin();
