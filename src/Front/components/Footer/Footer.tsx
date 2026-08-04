import {
  ComponentRendering,
  Field,
  Image,
  Link,
  LinkField,
  ImageField,
  Placeholder,
  RouteData,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import { RichTextUI } from 'ui/index';

interface Fields {
  logoImage: ImageField;
  footerHeadline: Field<string>;
  legalCopy: Field<string>;
  socialIcons: FooterSocialIconProps[];
}

export type FooterProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: Fields;
};

export type FooterSocialIconProps = {
  id: string;
  url: string;
  name: string;
  displayName: string;
  fields: {
    icon: ImageField;
    url: LinkField;
  };
};

const Footer = ({
  rendering,
  fields: { logoImage, footerHeadline, legalCopy, socialIcons },
}: FooterProps): JSX.Element => {
  const renderSocialIcons = (socialIcons: FooterSocialIconProps[]) => (
    <div className="flex-1 order-first md:order-none flex flex-column md:justify-end pb-10 md:pb-0">
      {socialIcons.map((icon, index) => (
        <Link key={index} field={icon.fields.url} aria-label={icon.displayName} prefetch={false}>
          <Image field={icon.fields.icon} width={50} height="auto" />
        </Link>
      ))}
    </div>
  );

  return (
    <section className="bg-gray-90 text-white-00 px-5 md:px-16 py-10 md:py-20">
      <Image className="pb-10 md:pb-20" field={logoImage} />
      <div className="pb-10 md:pb-20">
        <div className="flex flex-col-reverse md:flex-row border-y border-gray-50">
          <span className="headline-xl max-w-xs mt-auto pb-10 md:pb-20 pt-24">
            {footerHeadline?.value}
          </span>
          <span className="md:min-w-50 md:ml-auto py-4 md:py-20">
            <Placeholder name="footer-content-body" rendering={rendering} />
          </span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="rich-text-wrap">
          <RichTextUI className="body-s max-w-2xl flex-1" value={legalCopy.value} />
          <a className="text-link-white" href="/sitemap.html" target="_blank">
            Sitemap
          </a>
        </div>
        {socialIcons && renderSocialIcons(socialIcons)}
      </div>
    </section>
  );
};

export default Footer;
