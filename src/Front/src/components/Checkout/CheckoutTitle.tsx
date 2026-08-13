import { useCheckoutProcess } from 'providers/index';
import { useIsBusinessBuyer } from 'hooks/index';
 
export default function CheckoutTitle() {
  const { stepOneLabels } = useCheckoutProcess();
  const isBusinessBuyer = useIsBusinessBuyer();
 
  const headline = isBusinessBuyer
    ? stepOneLabels.businessPageHeadline || ''
    : stepOneLabels.pageHeadline;
 
  return <h1 className="headline-l md:headline-xl mb-6 md:mb-15">{headline}</h1>;
}
 