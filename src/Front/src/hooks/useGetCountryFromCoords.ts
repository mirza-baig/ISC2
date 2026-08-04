import { useMutation } from '@tanstack/react-query';
import { CountryInfo } from 'types/index';

import { CurrencyCodes, getCurrencyByCountryCode } from 'utils/index';

const DEFAULT_COUNTRY: CountryInfo = { country: 'US', currency: CurrencyCodes.USD };

const mutation = async (): Promise<CountryInfo> => {
  if (!navigator.geolocation) {
    return Promise.resolve(DEFAULT_COUNTRY);
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
        );

        if (!res.ok) {
          reject('There was an error when reversing coordinates');
        }

        const { address } = await res.json();
        const country = address.country_code?.toUpperCase() || DEFAULT_COUNTRY.country;

        resolve({
          country,
          currency: getCurrencyByCountryCode(country),
        });
      },
      () => resolve(DEFAULT_COUNTRY),
      { timeout: 10000 }
    );
  });
};

export default function useGetCountryFromCoords() {
  const { data, mutateAsync, isPending, error } = useMutation({
    mutationFn: mutation,
  });

  return {
    country: data,
    isGettingCountry: isPending,
    getCountryError: error,
    getCountryFromCoordsAsync: mutateAsync,
  };
}
