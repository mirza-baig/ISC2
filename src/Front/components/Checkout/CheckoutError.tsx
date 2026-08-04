import { NextImage } from '@sitecore-jss/sitecore-jss-nextjs';
import { useCheckoutProcess } from 'providers/checkoutProcess';
import RichTextUI from 'ui/RichTextUI';
import { useState } from 'react';

const CheckoutError = () => {
  const { fields, errorLabels } = useCheckoutProcess();
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const copyDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: window.location.href,
      consoleErrors: 'Please check browser console for [PAYMENT-INTENT-DEBUG] messages',
    };

    navigator.clipboard
      .writeText(JSON.stringify(debugInfo, null, 2))
      .then(() => alert('Debug information copied to clipboard'))
      .catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = JSON.stringify(debugInfo, null, 2);
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Debug information copied to clipboard');
      });
  };

  return (
    <div>
      <div className="bg-gray-10 px-5 py-10 md:px-16 md:pt-16 md:pb-27">
        <NextImage width={47} height={42} field={fields.alertIcon} />
        <h1 className="headline-l md:headline-xl mt-2 mb-8">{errorLabels.title}</h1>
        <h2 className="body-m">{errorLabels.subTitle}</h2>
      </div>
      <div className="px-5 md:px-72 py-10 md:pt-28">
        <h3 className="eyebrow p-2 border-b text-gray-70 border-gray-30 uppercase">
          {errorLabels.tryAgainListTitle}
        </h3>
        <ul className="flex flex-col gap-3 mt-3 list-circle list-inside">
          <RichTextUI value={fields.tryAgainList.value} className="body-m checkout-error-list" />
        </ul>

        {/* Debug helper section */}
        <div className="mt-8 pt-8 border-t border-gray-30">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showDebugInfo ? 'Hide' : 'Show'} Debug Information
          </button>

          {showDebugInfo && (
            <div className="mt-4 p-4 bg-gray-50 rounded border">
              <p className="text-sm text-gray-700 mb-3">
                If you are experiencing payment issues, please:
              </p>
              <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1 mb-4">
                <li>Open browser Developer Tools (F12)</li>
                <li>Go to Console tab</li>
                <li>
                  Look for messages starting with{' '}
                  <code className="bg-gray-200 px-1 rounded">[PAYMENT-INTENT-DEBUG]</code>
                </li>
                <li>Copy those messages and the information below to report the issue</li>
              </ol>

              <button
                onClick={copyDebugInfo}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Copy Debug Info to Clipboard
              </button>

              <div className="mt-3 text-xs text-gray-600">
                <p>
                  <strong>User Agent:</strong> {navigator.userAgent}
                </p>
                <p>
                  <strong>Timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
                <p>
                  <strong>Timestamp:</strong> {new Date().toISOString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutError;
