import { Text, Field, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { ReactNode, useCallback, useState } from 'react';
import clsx from 'clsx';

import { ProfileEditCta } from './ProfileEditCta';

import { ProfileSectionProps } from '../profile.types';

type ChildrenProps = Pick<ProfileSectionProps, 'editMode' | 'cancelEditMode'>;

export namespace ProfileSection {
  export type Props = {
    heading: Field<string>;
    editCta: LinkField;
    children?: (props: ChildrenProps) => ReactNode;
  };
}

export const ProfileSection = ({ heading, editCta, children }: ProfileSection.Props) => {
  const [editMode, setEditMode] = useState(false);

  const openEditMode = useCallback(() => setEditMode(true), []);

  const cancelEditMode = useCallback(() => setEditMode(false), []);

  return (
    <div
      className={clsx(
        'p-8 flex flex-col space-y-2 first:rounded-t-xl last:rounded-b-xl',
        editMode && 'bg-gray-10 !border !border-black'
      )}
    >
      <header className="w-full flex flex-row justify-between space-x-2 items-start">
        <Text field={heading} tag="h3" className="body-l" />
        {!editMode && <ProfileEditCta editCta={editCta} onButtonClick={openEditMode} />}
      </header>

      {children && children({ editMode, cancelEditMode })}
    </div>
  );
};
