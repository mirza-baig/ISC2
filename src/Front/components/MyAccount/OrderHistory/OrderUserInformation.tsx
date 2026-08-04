import { OrderPrintLabels } from './OrderHistory';
import { useMemo } from 'react';
import { getActiveState } from 'utils/userUtils';
import { useGetAllStates } from 'hooks/index';
import { PrintableOrder } from 'types/index';

export namespace OrderUserInformation {
  export type Props = {
    order: PrintableOrder;
    labels: OrderPrintLabels;
  };
}

export default function OrderUserInformation({ order, labels } = OrderUserInformation.Props) {
  const { allStates } = useGetAllStates();

  const billingState = useMemo(() => {
    return order?.billingAddress
      ? getActiveState(
          allStates,
          order.billingAddress?.stateCode,
          order.billingAddress?.countryCode
        )
      : '';
  }, [order?.billingAddress, allStates]);

  const mailingState = useMemo(() => {
    return order?.mailingAddress
      ? getActiveState(
          allStates,
          order.mailingAddress?.stateCode,
          order.mailingAddress?.countryCode
        )
      : '';
  }, [order?.mailingAddress, allStates]);

  return (
    <div className="text-sm-base flex w-full mt-2 space-x-10">
      {order?.billingAddress && (
        <div className="w-1/2">
          <div className="space-x-1 pb-2">
            <strong>{labels.billingAddress}</strong>
          </div>
          {order.billingAddress.street && (
            <div className="space-x-1">
              <strong>{labels.addressLabel}:</strong>
              <span>{order.billingAddress.street}</span>
            </div>
          )}
          {order.billingAddress.city && (
            <div className="space-x-1">
              <strong>{labels.cityLabel}:</strong>
              <span>{order.billingAddress.city}</span>
            </div>
          )}
          {billingState && (
            <div className="space-x-1">
              <strong>{labels.regionLabel}:</strong>
              <span>{billingState}</span>
            </div>
          )}
          {order.billingAddress.postalCode && (
            <div className="space-x-1">
              <strong>{labels.postcodeLabel}:</strong>
              <span>{order.billingAddress.postalCode}</span>
            </div>
          )}
          {order.billingAddress.country && (
            <div className="space-x-1">
              <strong>{labels.countryLabel}:</strong>
              <span>{order.billingAddress.country}</span>
            </div>
          )}
        </div>
      )}

      {order?.mailingAddress && !order?.isSameAddress && (
        <div className="w-1/2">
          <div className="space-x-1 pb-2">
            <strong>{labels.mailingAddress}</strong>
          </div>
          {order.mailingAddress.street && (
            <div className="space-x-1">
              <strong>{labels.addressLabel}:</strong>
              <span>{order.mailingAddress.street}</span>
            </div>
          )}
          {order.mailingAddress.city && (
            <div className="space-x-1">
              <strong>{labels.cityLabel}:</strong>
              <span>{order.mailingAddress.city}</span>
            </div>
          )}
          {mailingState && (
            <div className="space-x-1">
              <strong>{labels.regionLabel}:</strong>
              <span>{mailingState}</span>
            </div>
          )}
          {order.mailingAddress.postalCode && (
            <div className="space-x-1">
              <strong>{labels.postcodeLabel}:</strong>
              <span>{order.mailingAddress.postalCode}</span>
            </div>
          )}
          {order.mailingAddress.country && (
            <div className="space-x-1">
              <strong>{labels.countryLabel}:</strong>
              <span>{order.mailingAddress.country}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
