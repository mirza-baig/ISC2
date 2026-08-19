import PrintIcon from 'icons/PrintIcon';
import { useRef } from 'react';
import { printIndividualContent } from 'utils/index';

export namespace OrderPrintButton {
  export type Props = {
    content: HTMLDivElement;
    printInvoiceCtaLabel: string;
  };
}

export default function OrderPrintButton(
  { contentRef, printInvoiceCtaLabel } = OrderPrintButton.Props
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const printDiv = () => {
    const iframe = iframeRef.current;
    const content = contentRef.current;

    printIndividualContent(content, iframe);
  };

  return (
    <>
      <button
        type="button"
        onClick={printDiv}
        aria-label={printInvoiceCtaLabel}
        className="print:hidden cta isc2-transition text-xs-sm sm:text-sm-base text-link-blue hover:text-gray-90 hover:underline"
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
