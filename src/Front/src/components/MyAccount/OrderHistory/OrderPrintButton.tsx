import { RefObject, useRef } from 'react';

import PrintIcon from 'icons/PrintIcon';
import { useDownloadBusinessReceipt, useIsBusinessBuyer, useLoggedUser } from 'hooks/index';
import { useShopperContext } from 'providers/index';
import { buildBusinessReceiptDataFromPrintableOrder, printIndividualContent } from 'utils/index';
import { PrintableOrder } from 'types/index';

export namespace OrderPrintButton {
  export type Props = {
    contentRef: RefObject<HTMLDivElement | null>;
    printInvoiceCtaLabel: string;
    order?: PrintableOrder;
  };
}

export default function OrderPrintButton({
  contentRef,
  printInvoiceCtaLabel,
  order,
}: OrderPrintButton.Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { user, email } = useLoggedUser();
  const { shopperContext } = useShopperContext();
  const isBusinessBuyer = useIsBusinessBuyer();
  const { downloadReceipt, isGeneratingReceipt } = useDownloadBusinessReceipt();

  const printDiv = () => {
    if (isBusinessBuyer && order) {
      const data = buildBusinessReceiptDataFromPrintableOrder({
        order,
        buyerName: user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' '),
        buyerEmail: user?.email || email || '',
        organizationName: shopperContext?.organization?.name,
      });

      downloadReceipt({ data });
      return;
    }

    if (contentRef.current) {
      printIndividualContent(contentRef.current, iframeRef.current);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={printDiv}
        disabled={isGeneratingReceipt}
        aria-label={printInvoiceCtaLabel}
        className="print:hidden cta isc2-transition text-xs-sm sm:text-sm-base text-link-blue hover:text-gray-90 hover:underline disabled:opacity-60"
      >
        <span className="flex gap-x-1 items-center">
          <PrintIcon size={15} />
          {printInvoiceCtaLabel}
        </span>
      </button>
      <iframe title="Print Order" ref={iframeRef} style={{ display: 'none' }} />
    </>
  );
}
