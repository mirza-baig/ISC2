import { Image, ImageField, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';

import { useLoggedUser } from 'hooks/index';
import { UserIcon } from 'src/icons';

interface CartHeaderProps {
  fields: {
    link: LinkField;
    logoImage: ImageField;
  };
}

const CartHeader = ({ fields }: CartHeaderProps) => {
  const { user } = useLoggedUser();

  return (
    <section className="h-30 md:h-40 border-b border-gray-30">
      <div className="max-width-container h-full flex justify-between items-center">
        <a href={fields.link?.value?.href || '/'}>
          <Image field={fields.logoImage} className="w-18 md:w-28" />
        </a>

        {user?.fullName && (
          <div className="flex max-w-1/2">
            <div className="flex space-x-2 items-center text-sm md:text-lg font-semibold truncate">
              <span className="self-center">
                <UserIcon className="self-center" size={24} />
              </span>
              <span tabIndex={0} className="self-center truncate">
                {user.fullName.trim()}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CartHeader;
