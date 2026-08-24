import { useState } from 'react';

import { useLoggedUser } from 'hooks/index';
import { useShopperContext } from 'providers/index';
import { PrintableOrder } from 'types/index';
import { exportOrderHistoryToExcel } from 'utils/index';
import { ORDER_HISTORY_EXPORT_DEFAULT_LABELS } from 'constants/index';
import { SheetIcon } from 'icons/index';
import { Button } from 'ui/index';

type OrderHistoryExportButtonProps = {
  orders: PrintableOrder[];
  exportExcelCtaLabel?: string;
};

/**
 * Downloads the order history as an .xlsx workbook.
 *
 * The export is built from the orders already fetched for the page, so it needs no
 * request of its own. Organization and Buyer are not on the orders payload — they come
 * from the shopper context and the logged-in user, the same sources the rest of the
 * business screens read them from.
 */
const OrderHistoryExportButton = ({
  orders,
  exportExcelCtaLabel,
}: OrderHistoryExportButtonProps) => {
  const { user } = useLoggedUser();
  const { shopperContext } = useShopperContext();
  const [isExporting, setIsExporting] = useState(false);

  const exportOrders = async () => {
    setIsExporting(true);

    try {
      await exportOrderHistoryToExcel(orders, {
        organization: shopperContext?.organization?.name,
        buyer: user?.fullName,
      });
    } catch (error) {
      console.error('Error during order history export', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      label={exportExcelCtaLabel || ORDER_HISTORY_EXPORT_DEFAULT_LABELS.exportExcelCtaLabel}
      onClick={exportOrders}
      isLoading={isExporting}
      Icon={<SheetIcon size={15} />}
      className="whitespace-nowrap !self-start sm:!self-center print:hidden"
    />
  );
};

export default OrderHistoryExportButton;
