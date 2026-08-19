import { useCheckoutProcess } from 'providers/index';
import { useIsBusinessBuyer } from 'hooks/index';
import { BUSINESS_STEP_ONE_DEFAULT_LABELS } from 'constants/index';

export default function CheckoutTitle() {
  const { stepOneLabels } = useCheckoutProcess();
  const isBusinessBuyer = useIsBusinessBuyer();

  const headline = isBusinessBuyer
    ? stepOneLabels.businessPageHeadline || BUSINESS_STEP_ONE_DEFAULT_LABELS.pageHeadline
    : stepOneLabels.pageHeadline;

  return <h1 className="headline-l md:headline-xl mb-6 md:mb-15">{headline}</h1>;
}
