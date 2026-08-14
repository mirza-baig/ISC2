import axios from 'axios';
import config from 'temp/config';
import { emptyB2BLabelGroups, type B2BLabelGroups } from 'types/b2bLabels';

/**
 * Fetches the B2B Product List labels (grouped, Sitecore-managed). Never throws — on any failure it
 * resolves to empty groups so callers render their code fallbacks. Mirrors fetchSearchWrapperSettings.
 */
export const fetchB2BLabels = async (): Promise<B2BLabelGroups> => {
  try {
    const response = await axios.get<B2BLabelGroups>('/api/b2bLabels', {
      headers: {
        'x-api-key': config.sitecoreApiKey,
      },
    });
    return response.data ?? emptyB2BLabelGroups();
  } catch {
    return emptyB2BLabelGroups();
  }
};
