import { ColumnLinks } from 'types/index';
import NavigationLink from 'components/Header/NavigationLink';

type ColumnLinksList = {
  columnLinks: ColumnLinks[];
  containerClassName?: string;
  subContainerClassName?: string;
};

const ColumnLinksList = ({
  columnLinks,
  containerClassName,
  subContainerClassName,
}: ColumnLinksList) => (
  <>
    {columnLinks.map((column: ColumnLinks, i: number) => (
      <div key={i} className={containerClassName}>
        {Boolean(column?.heading?.value) ? (
          <div className={subContainerClassName}>
            <NavigationLink
              className="!py-1 !px-0"
              key={i}
              fields={{
                link: {
                  value: {
                    text: column?.heading?.value?.toString(),
                  },
                },
                icon: column?.icon,
              }}
              displayAs="Headline"
              isActive={false}
            />
          </div>
        ) : (
          <span className="inline-block h-6" />
        )}
        {column?.links.map((link) => (
          <NavigationLink
            key={link.id}
            className={`!py-1 !px-0 ${subContainerClassName}`}
            fields={link?.fields}
            isActive={false}
            id={link.id}
          />
        ))}
      </div>
    ))}
  </>
);

export default ColumnLinksList;
