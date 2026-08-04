import { useEffect, useRef } from 'react';
import { RichText as JSSRichText } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

interface RichTextUIProps {
  className?: string;
  id?: string;
  value?: string;
  clientOnly?: boolean;
}

const SCRIPT_TAG_REGEXP = /<script[\s/>]/i;

const injectScripts = (container: HTMLElement) => {
  container.querySelectorAll('script').forEach((oldScript) => {
    const newScript = document.createElement('script');
    Array.from(oldScript.attributes).forEach((attr) =>
      newScript.setAttribute(attr.name, attr.value)
    );
    newScript.textContent = oldScript.textContent;
    oldScript.parentNode?.replaceChild(newScript, oldScript);
  });
};

const RichTextUI = ({ className, value, id, clientOnly }: RichTextUIProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef<string | undefined>(undefined);

  const needsClientRender = clientOnly || (!!value && SCRIPT_TAG_REGEXP.test(value));

  useEffect(() => {
    if (!needsClientRender) return;

    const container = containerRef.current;
    if (!container) return;
    if (!value) {
      container.innerHTML = '';
      prevValueRef.current = undefined;
      return;
    }
    if (value === prevValueRef.current && container.innerHTML) return;
    prevValueRef.current = value;
    container.innerHTML = value;
    injectScripts(container);
  }, [value, needsClientRender]);

  if (!value) {
    return null;
  }

  return (
    <div className={clsx('rich-text slider-scrollbar cursor-auto', className)} id={id}>
      {needsClientRender ? (
        <div ref={containerRef} suppressHydrationWarning />
      ) : (
        <JSSRichText field={{ value }} />
      )}
    </div>
  );
};

export default RichTextUI;
