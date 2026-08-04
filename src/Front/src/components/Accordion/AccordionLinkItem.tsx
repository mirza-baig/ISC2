import { Link, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import { useCallback } from 'react';

import { useAnalyticsTracking } from 'hooks/index';
import { getAbsolutePath } from 'utils/location';
import { ANALYTICS_EVENTS } from 'constants/index';

export type AccordionLinkItemProps = ComponentProps & {
  fields: Fields;
  disabled: boolean;
  title: string;
};

interface Fields {
  link: LinkField;
  title: string;
}

const AccordionLinkItem = (props: AccordionLinkItemProps) => {
  const { track } = useAnalyticsTracking();

  const trackLinkPressed = useCallback(() => {
    const clickData = {
      click_text: props.fields.link.value.text?.toLowerCase() || '',
      click_url: getAbsolutePath(props.fields.link.value.href),
    };

    if (props.title === 'Contact') {
      return track({
        ...clickData,
        event: ANALYTICS_EVENTS.VT_INTERRUPTION,
        interruption_type: 'footer_contact_click',
      });
    }

    track({
      ...clickData,
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'engagement',
      subtype: 'footer_click',
      bo1: true,
    });
  }, [props.fields.link, props.title, track]);

  if (!props.fields.link.value.href) {
    return null;
  }

  if (props.disabled) {
    return <span className="text-xsm mt-4 text-gray-50 mb-1">{props.fields.link.value.text}</span>;
  }

  return (
    <Link
      onClick={trackLinkPressed}
      className="text-xsm mt-4 mb-1 text-gray-50 focus-underline-lime"
      field={props.fields.link}
      prefetch={false}
    />
  );
};

export default AccordionLinkItem;
