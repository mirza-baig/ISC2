import { useLoggedUser } from 'hooks/index';
import { useShopperContext } from 'providers/index';
import { PrintableOrder } from 'types/index';
import { exportOrderHistoryToExcel } from 'utils/index';
import { ORDER_HISTORY_EXPORT_DEFAULT_LABELS } from 'constants/index';

type OrderHistoryExportButtonProps = {
  orders: PrintableOrder[];
  exportExcelCtaLabel?: string;
  className?: string;
};

const OrderHistoryExportButton = ({
  orders,
  exportExcelCtaLabel,
}: OrderHistoryExportButtonProps) => {
  const { user } = useLoggedUser();
  const { shopperContext } = useShopperContext();

  const exportOrders = async () => {
    try {
      await exportOrderHistoryToExcel(orders, {
        organization: shopperContext?.organization?.name,
        buyer: user?.fullName,
      });
    } catch (error) {
      console.error('Error during order history export', error);
    }
  };

  return (
    <button
      type="button"
      onClick={exportOrders}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs ml-auto border border-gray-50 bg-gray-10 text-gray-70 ml-auto"
      title="Export Orders History"
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 16.5 16.5"
        fill="none"
        aria-hidden="true"
        className="mr-1"
      >
        <path
          d="M15 10.5V13.5C15 13.8978 14.842 14.2794 14.5607 14.5607C14.2794 14.842 13.8978 15 13.5 15H3C2.60218 15 2.22064 14.842 1.93934 14.5607C1.65804 14.2794 1.5 13.8978 1.5 13.5V10.5M12 6.75L8.25 10.5L4.5 6.75M8.25 10.5V1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
      </svg>
      {exportExcelCtaLabel || ORDER_HISTORY_EXPORT_DEFAULT_LABELS.exportExcelCtaLabel}
    </button>
  );
};

export default OrderHistoryExportButton;
