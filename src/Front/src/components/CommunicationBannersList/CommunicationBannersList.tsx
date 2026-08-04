import { Field, ImageField, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import { LOCALSTORAGE_KEYS } from 'constants/localStorageKeys';
import useLocalStorage from 'hooks/useLocalStorage';
import CommunicationBanner from './CommunicationBanner';

interface CommunicationBannersListProps {
  fields: {
    communicationBannersList?: {
      id: string;
      fields: {
        backgroundColor: { fields: { Value: Field<string> } };
        fontColor: { fields: { Value: Field<string> } };
        icon?: ImageField;
        message: TextField;
        isClosable: Field<boolean>;
      };
    }[];
  };
}

const DEFAULT_BACKGROUND_COLOR = '#227CB4';
const DEFAULT_FONT_COLOR = '#FFFFFF';

const CommunicationBannersList = ({ fields }: CommunicationBannersListProps) => {
  const [closedBanners, setClosedBanners] = useLocalStorage<string[]>(
    LOCALSTORAGE_KEYS.BANNERS,
    []
  );

  if (!fields?.communicationBannersList) {
    return null;
  }

  const handleClose = (id: string) => {
    setClosedBanners((prevClosedBanners) => {
      const currentValues = prevClosedBanners || [];
      return [...currentValues, id];
    });
  };

  return (
    <section className="flex flex-col space-y-2">
      {fields.communicationBannersList.map((banner) => {
        const isHidden = closedBanners?.find((closedBanner) => closedBanner === banner.id);

        if (isHidden || !banner.fields.message?.value) {
          return null;
        }

        const bannerFields = {
          id: banner.id,
          backgroundColor:
            banner.fields.backgroundColor?.fields.Value.value || DEFAULT_BACKGROUND_COLOR,
          fontColor: banner.fields.fontColor?.fields.Value.value || DEFAULT_FONT_COLOR,
          icon: banner.fields.icon,
          message: banner.fields.message.value.toString(),
          isClosable: banner.fields.isClosable.value,
        };

        return <CommunicationBanner key={bannerFields.id} fields={{ bannerFields, handleClose }} />;
      })}
    </section>
  );
};

export default CommunicationBannersList;
