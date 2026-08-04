import { Button } from 'ui/index';
import { useAllocationDetails, useModal } from 'providers/index';

import AllocationsAddUserModal from './AllocationsAddUserModal';

export default function AddUserToCompanyCTA() {
  const { setModalContent } = useModal();
  const { messages, labels, allocation } = useAllocationDetails();

  const onAddUserModal = () => {
    setModalContent(
      <AllocationsAddUserModal labels={labels} messages={messages} allocation={allocation} />
    );
  };

  return (
    <Button
      variant="secondary"
      className="whitespace-nowrap py-3 !self-start md:!self-center"
      label={labels?.addUsersCtaLabel}
      onClick={onAddUserModal}
    />
  );
}
