import { isChromeOniOS } from './browser';

export const printIndividualContent = (
  content: HTMLDivElement,
  iframe: HTMLIFrameElement | null
) => {
  // Chrome for iOS does not support printing through iFrame. Remove this condition if issue is fixed
  // https://issues.chromium.org/issues/40656820
  if (isChromeOniOS) {
    return buildAndPrintWindow(content);
  }

  return buildAndPrintIframe(content, iframe);
};

export const buildAndPrintIframe = (content: HTMLDivElement, iframe: HTMLIFrameElement | null) => {
  if (iframe?.contentWindow && content) {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    if (iframeDoc) {
      iframeDoc.open();

      iframeDoc.write('<html><head>');

      copyStylesFromParent(iframeDoc.head);
      addPrintStyles(iframeDoc);

      iframeDoc.write('</head><body>');

      iframeDoc.write(content.innerHTML);
      iframeDoc.write('</body></html>');

      // Style issue, force a reflow by accessing a property that triggers it
      iframe.contentWindow.document.body?.offsetHeight;

      setTimeout(() => {
        iframe.contentWindow?.print();
      }, 100);

      return;
    }
  }
  console.error(`Can't print through iFrame : invalid content`);
};

export const buildAndPrintWindow = (content: HTMLDivElement) => {
  const printWindow = window.open('', '', 'height=728,width=1024');

  if (printWindow) {
    printWindow.document.write('<html><head><title>Print</title></head><body>');
    copyStylesFromParent(printWindow.document.head);
    printWindow.document.write(content.innerHTML);
    printWindow.document.write('</body></html>');

    printWindow.document.close();

    printWindow.print();

    printWindow.onafterprint = () => {
      printWindow.close();
    };

    return;
  }
  console.error(`Can't print through window : invalid content`);
};

const copyStylesFromParent = (elementHead: HTMLHeadElement) => {
  const parentStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
  parentStyles.forEach((style) => {
    const clone = style.cloneNode(true);
    elementHead.appendChild(clone);
  });
};

const addPrintStyles = (iframeDoc: Document) => {
  const style = document.createElement('style');
  const printStyles = `
      @media print {
          @page {
            margin: 0;
            size: auto;
          }
          .no-print {
              display: none;
          }
      }
  `;
  style.innerHTML = printStyles;
  iframeDoc.head.appendChild(style);
};
