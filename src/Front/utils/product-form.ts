import { Field, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import {
  AlgoliaApiResponse,
  FormElement,
  FormElementTypes,
  FormFields,
  INNER_PROVIDER_KEY,
  ProductDate,
  ProductHit,
  ProductHitKeyValuePair,
} from 'types/forms';
import { formatDateRange, getUTCTime, getWeekdayRange, sortStartEndDates } from './date';
import { FALLBACK_MODAL_CANCEL_TEXT, FALLBACK_MODAL_CONFIRM_TEXT } from 'constants/index';
import { ProductFormModalType } from 'components/ProductForm/ProductFormModal';
import { Channel, CT_DEFAULT_TIER, StandalonePriceMapping } from 'types/pricing';

interface buildProductFormProps {
  formScaffold: FormElement[];
  fields: {
    headline: TextField;
    labels: TextField;
    toolTips: TextField;
    primaryCtaLabel: string;
  };
}

export interface ProductFormModalLabelsType {
  fields: {
    heading?: Field<string>;
    description?: Field<string>;
    primaryCtaLabel?: Field<string>;
    secondaryCtaLabel?: Field<string>;
    formThirdPartyCTA?: string;
  };
}

export const hyphenToCamelCase = (str: string): string => {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const buildProductFormModal = (
  { fields }: ProductFormModalLabelsType,
  forceShowCta?: boolean
): ProductFormModalType => {
  return {
    heading: fields?.heading,
    description: fields?.description,
    primaryCTA: {
      value: {
        text: `${fields?.primaryCtaLabel?.value || FALLBACK_MODAL_CONFIRM_TEXT}`,
        href: forceShowCta ? '#' : fields?.formThirdPartyCTA,
      },
    },
    secondaryCTA: {
      value: {
        text: `${fields?.secondaryCtaLabel?.value || FALLBACK_MODAL_CANCEL_TEXT}`,
      },
    },
  };
};

export const extractLabels = (
  dataMap: { [name: string]: { key: string } },
  value?: string
): { [name: string]: string } => {
  const formLabels = new URLSearchParams(value?.toString());
  return Object.keys(dataMap).reduce((acc, itemKey: string) => {
    const elementKey = dataMap[itemKey as keyof typeof dataMap].key;
    const label = formLabels.get(elementKey);
    return {
      ...acc,
      [elementKey]: label,
    };
  }, {});
};

export const buildProductForm = ({
  formScaffold,
  fields,
}: buildProductFormProps): FormElement[] => {
  const headline = fields?.headline;
  const labels = fields?.labels;
  const toolTips = fields?.toolTips;
  const primaryCtaLabel = fields?.primaryCtaLabel;
  const formHeadline = headline?.value?.toString();
  const formLabels = new URLSearchParams(labels?.value?.toString());
  const formToolTips = new URLSearchParams(toolTips?.value?.toString());
  return formScaffold.map((field: FormElement) => {
    const mappedElement = field;
    const elementNameValue = hyphenToCamelCase(field.name);
    const elementName = elementNameValue.split('.')?.[0];
    const label = formLabels.get(elementName);
    const toolTip = formToolTips.get(elementName);
    // Only add labels and toolTips if they exist, else use fallback data in mock file
    if (field.type === FormElementTypes.headline && formHeadline) {
      mappedElement.label = formHeadline;
    } else if (label) {
      mappedElement.label = label;
    }

    if (toolTip) {
      mappedElement.tooltip = toolTip;
    }

    if (field.type === FormElementTypes.button && primaryCtaLabel) {
      mappedElement.label = primaryCtaLabel;
    }

    return mappedElement;
  });
};

export const extractAttributeValue = (obj: ProductHit, complexKey: string) => {
  const [key, subKey] = complexKey.split('.');
  return subKey
    ? (obj?.[key as keyof typeof obj] as keyof ProductHitKeyValuePair)?.[subKey as keyof string]
    : obj?.[key as keyof typeof obj];
};

export const getProductSelectorSearchResult = async ({
  facets = [],
  productIds,
  productKeys,
  skus,
}: {
  facets?: string[];
  productIds?: string[];
  productKeys?: string[];
  skus?: string[];
}): Promise<AlgoliaApiResponse> => {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ facets, productIds, productKeys, skus }),
  };
  const response = await fetch(
    `${process.env.PUBLIC_URL}/${process.env.NEXT_PUBLIC_ALGOLIA_API_PATH}/productFormSearch`,
    options
  );
  const result = await response.json();
  return result;
};

export const formatProductSearchResult = (
  data: AlgoliaApiResponse,
  productFormFields: FormElement[]
): AlgoliaApiResponse => {
  const currentTime = new Date();
  const isScheduleFieldInFilters = productFormFields.find(
    (item) => item.name === FormFields.StartDate.key
  );

  const hitArray = data?.hits?.map((item) => {
    const isoStart = getUTCTime({
      time: item.startTime,
      date: item.startDate,
      timeZone: item.timeZoneIana?.key?.replace(/_/g, '/') || item.timeZone,
    });
    const isoEnd = getUTCTime({
      time: item.endTime,
      date: item.endDate,
      timeZone: item.timeZoneIana?.key?.replace(/_/g, '/') || item.timeZone,
    });
    return {
      ...item,
      isoStart,
      isoEnd,
    };
  });

  const hitsData: ProductHit[] = hitArray?.filter((item) => {
    const isThirdPartyItem =
      extractAttributeValue(item, FormFields.TrainingProvider.key) !== INNER_PROVIDER_KEY;
    if (!isThirdPartyItem && isScheduleFieldInFilters) {
      return item?.isoStart && item.isoStart >= currentTime;
    } else {
      return item;
    }
  });
  // filter out result hits which do not have required fields
  const iscRequiredFields: string[] =
    productFormFields
      ?.filter(
        (item) =>
          item.isRequired &&
          // This could be restored in the next project iteration when we turn on filtering by training provider
          //(item.hideForThirdParty || item.hideForThirdParty === undefined) &&
          item.name !== FormFields.BundleOptions.key &&
          item.name !== FormFields.PurchaseOptions.key
      )
      ?.map((item) => item.name?.split('.')?.[0]) || [];

  // This could be restored in the next project iteration when we turn on filtering by training provider
  /* const thirdPartyRequiredFields: string[] =
    productFormFields
      ?.filter((item) => item.isRequired && !item.hideForThirdParty)
      .map((item) => item.name?.split('.')?.[0]) || [];
  */

  const hits = hitsData?.filter((item) => {
    const iscFields = iscRequiredFields.every(
      (requiredFields) => item?.[requiredFields as keyof typeof item]
    );
    // const thirdPartyFields = thirdPartyRequiredFields.every(
    //   (requiredFields) => item[requiredFields as keyof typeof item]
    // );
    return iscFields /* || thirdPartyFields*/;
  });
  return { ...data, hits: hits || [] };
};

export const addMonths = (months: number): Date => {
  const result = new Date();
  const month = months > 0 ? months : 0;
  result.setMonth(result.getMonth() + month);
  return result;
};

export const dateListGenerator = (
  dates: ProductDate[] | undefined,
  item: ProductHit
): ProductDate[] => {
  const isNew = !dates?.some((date) => date.sku === item.sku);
  const dateRange = formatDateRange(item);
  const value: ProductDate[] = [];
  if (isNew) {
    value.push({
      text: dateRange,
      isoStart: item.isoStart,
      isoEnd: item.isoEnd,
      sku: item.sku,
      weekScheduleText: getWeekdayRange(item),
    });
  }
  return sortStartEndDates([...(dates || []), ...value]);
};

export const getRadioButtonsPriceData = (
  item: ProductHit,
  priceRoleKey: string,
  productPrices: StandalonePriceMapping,
  isPurchaseOptions: boolean
) => {
  const price =
    item.sku &&
    (productPrices?.[item.sku]?.[priceRoleKey]?.discounted?.value ||
      productPrices?.[item.sku]?.[priceRoleKey]?.value);

  return {
    label: item?.copyName || item?.title || '',
    value: item.sku,
    ...(productPrices && { price: price || (isPurchaseOptions && {}) }),
  };
};

export const getChannel = (channels: Channel[], country?: string | null): Channel => {
  const channelData = (channels || []).find((item) => {
    const countries = item?.custom?.customFieldsRaw?.find(
      (itemData: { name: string; value: string[] }) => itemData.name === 'countries_dc_ct'
    );
    if (countries?.value && country) {
      return countries.value.includes(country);
    }
    return false;
  });
  const channel = channelData ?? channels?.find(({ key }) => key === CT_DEFAULT_TIER);
  return { id: channel?.id, key: channel?.key, custom: channel?.custom };
};
