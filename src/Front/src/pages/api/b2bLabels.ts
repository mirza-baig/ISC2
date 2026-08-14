import type { NextApiRequest, NextApiResponse } from 'next';
import { B2B_PRODUCT_LIST_LABELS } from 'queries/searchSettings';
import { emptyB2BLabelGroups, type B2BLabelGroups } from 'types/b2bLabels';
import { handledApiPreamble, postSitecoreGraphQL } from 'utils/sitecoreApiRoute';

/**
 * Serves the B2B Product List labels, editable in Sitecore under
 * /sitecore/content/ISC2/Main/Data/B2B Product List Labels. Each child item is a "B2B Label Group"
 * with a Name Value List `labels` field (key=value&key=value). This route fetches those items and
 * returns them grouped by area so the B2B PLP components can render Sitecore-managed labels (with
 * code fallbacks). Mirrors the /api/algoliaSettings pattern (GraphQL + x-api-key auth).
 *
 * It also carries one non-label payload, `productMessageModal`: the Peace of Mind terms popup a
 * `productMessage` link opens on a row. That content is NOT re-authored for B2B — it is read from
 * the same /Data/Popups Folder item the PDP's purchase-option radios open, on this request rather
 * than a second one.
 */

interface GraphQLField {
  value: string;
}

interface GraphQLB2BLabelsResponse {
  data: {
    b2bLabels: {
      children: {
        results: Array<{
          name: string;
          labels: { value: string } | null;
        }>;
      };
    } | null;
    productMessageModal: {
      heading: GraphQLField | null;
      description: GraphQLField | null;
      primaryCtaLabel: GraphQLField | null;
      secondaryCtaLabel: GraphQLField | null;
    } | null;
  };
}

// The keys that actually hold a parsed Name Value List — i.e. every key except the popup content
// the response also carries, which is not a label group.
type LabelGroupKey = Exclude<keyof B2BLabelGroups, 'productMessageModal'>;

// Item name (in Sitecore) -> output group key.
const GROUP_KEY_BY_NAME: Record<string, LabelGroupKey> = {
  'Private Class': 'privateClass',
  'Address Modal': 'addressModal',
  Cart: 'cart',
  'Product Row': 'row',
  Sort: 'sort',
  'Region Labels': 'region',
  Toolbar: 'toolbar',
  'Currency Modal': 'currencyModal',
};

// Name Value List raw value ("key=value&key=value", values URL-encoded) -> { key: value }.
// Pass the RAW string to URLSearchParams so it splits on the real "&" separators first, THEN
// decodes each value — otherwise a value containing an encoded "&" (%26) or "=" (%3D), e.g.
// "Europe, Middle East & Africa", would be split mid-value. (Do NOT pre-decode the whole string.)
const parseNameValueList = (encoded: string | undefined | null): Record<string, string> => {
  if (!encoded) return {};
  const params = new URLSearchParams(encoded);
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
};

const b2bLabels = async (req: NextApiRequest, res: NextApiResponse) => {
  if (handledApiPreamble(req, res)) {
    return;
  }

  try {
    const response = await postSitecoreGraphQL<GraphQLB2BLabelsResponse>(B2B_PRODUCT_LIST_LABELS);

    const groups = emptyB2BLabelGroups();
    const results = response.data?.data?.b2bLabels?.children?.results ?? [];

    results.forEach((item) => {
      const key = GROUP_KEY_BY_NAME[item.name];
      if (key) {
        groups[key] = parseNameValueList(item.labels?.value);
      }
    });

    // Only surface the popup when it actually has something to say. Without a description there is
    // nothing to open, and an empty modal is worse than the inert link the row shows otherwise.
    const modal = response.data?.data?.productMessageModal;
    if (modal?.description?.value) {
      groups.productMessageModal = {
        heading: modal.heading?.value ?? '',
        description: modal.description.value,
        primaryCtaLabel: modal.primaryCtaLabel?.value ?? '',
        secondaryCtaLabel: modal.secondaryCtaLabel?.value ?? '',
      };
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(groups);
  } catch (error) {
    // Non-fatal: components fall back to their built-in defaults when groups are empty.
    res.status(200).json(emptyB2BLabelGroups());
  }
};

export default b2bLabels;
