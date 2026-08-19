import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from 'constants/index';
import { useUserSession } from 'providers/index';
import { getServiceLayerAPI } from 'utils/getServiceLayerAPI';
import { Channel } from 'types/index';
import { useLoggedUser } from 'hooks/index';
import { getChannel } from 'utils/product-form';

export type DistributionChannel = Pick<Channel, 'key' | 'id'>;

export default function useGetDistributionChannel() {
  const { userCountry, geolocationCountry } = useUserSession();
  const { user } = useLoggedUser();
  const country = user ? userCountry : geolocationCountry;

  const { data, isPending, error } = useQuery<DistributionChannel>({
    queryKey: [QUERY_KEYS.DISTRIBUTION_CHANNEL, country],
    queryFn: async () => {
      const api = await getServiceLayerAPI();

      const { data } = await api.post('', {
        query: 'GET_CHANNELS',
        variables: {
          where: `roles contains all ("ProductDistribution")`,
        },
      });

      const channels: Channel[] = data?.data?.channels?.results;
      const channel = getChannel(channels, country);
      return { id: channel?.id, key: channel?.key, channels };
    },
    enabled: Boolean(country?.trim()),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  return {
    distributionChannel: data as Channel,
    distributionChannelError: error,
    isGettingDistributionChannel: isPending,
  };
}
