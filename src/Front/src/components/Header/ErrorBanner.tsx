import { Field, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import CommunicationBanner from 'components/CommunicationBannersList/CommunicationBanner';
import { useLoggedUser } from 'hooks/index';
import { useCart } from 'providers/index';

interface ErrorBanner {
  fields: {
    id: string;
    backgroundColor: { fields: { Value: Field<string> } };
    fontColor: { fields: { Value: Field<string> } };
    message: TextField;
  };
}

const DEFAULT_BACKGROUND_COLOR = '#FEE2E2';
const DEFAULT_FONT_COLOR = '#B91C1C';

const ErrorBanner = ({ fields }: ErrorBanner) => {
  const { userError } = useLoggedUser();
  const { cartError } = useCart();

  if ((!userError && !cartError) || !fields.message.value) {
    return null;
  }

  const bannerFields = {
    id: 'service-layer-error',
    backgroundColor: fields.backgroundColor.fields.Value.value || DEFAULT_BACKGROUND_COLOR,
    fontColor: fields.fontColor.fields.Value.value || DEFAULT_FONT_COLOR,
    message: fields.message.value?.toString(),
  };

  userError && console.error(userError);
  cartError && console.error(cartError);

  return <CommunicationBanner fields={{ bannerFields, additionalClasses: 'text-center !mb-0' }} />;
};

export default ErrorBanner;
