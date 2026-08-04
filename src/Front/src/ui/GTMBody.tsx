interface GTMBodyProps {
  gtmID?: string;
}

const GTMBody = ({ gtmID }: GTMBodyProps) => {
  if (!gtmID) {
    return null;
  }

  return (
    <noscript
      dangerouslySetInnerHTML={{
        __html: `<iframe
      src="https://www.googletagmanager.com/ns.html?id=${gtmID}"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
    ></iframe>`,
      }}
    />
  );
};

export default GTMBody;
