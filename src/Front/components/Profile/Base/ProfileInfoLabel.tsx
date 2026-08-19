export namespace ProfileInfoLabel {
  export type Props = {
    children?: string | null;
  };
}

export const ProfileInfoLabel = ({ children }: ProfileInfoLabel.Props) => {
  if (children) {
    return <label className="body-m text-sm-base text-gray-70 truncate">{children}</label>;
  }

  return null;
};
