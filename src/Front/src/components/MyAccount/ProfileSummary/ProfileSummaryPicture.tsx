import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useDeleteUserPicture, useUpdateUserPicture, useUserPicture } from 'hooks/index';
import { LoadingIndicator, UserDataSummary } from 'ui/index';
import { convertImageToBase64, isValidImage } from 'utils/image';
import { useLayout } from 'providers/index';
import { CloseIcon, UploadIcon, TrashIcon } from 'icons/index';
import { ImageField } from '@sitecore-jss/sitecore-jss-nextjs';
import Image from 'next/image';

interface ProfileSummaryPictureProps {
  fields: {
    defaultProfilePicture: ImageField;
    labels: UserDataSummary.Labels;
  };
}

const ProfileSummaryPicture = ({ fields }: ProfileSummaryPictureProps) => {
  const { labels, defaultProfilePicture } = fields;
  const { userPicture, isGettingUserPicture, isBeingApproved, isRefetchingUserPicture } =
    useUserPicture();
  const { updateUserPictureAsync, isUpdatingUserPicture } = useUpdateUserPicture();
  const { deleteUserPictureAsync, isDeletingUserPicture } = useDeleteUserPicture();
  const { addFlashAlert } = useLayout();

  const [newUserPicture, setNewUserPicture] = useState<File | null | undefined>(undefined);
  const [isEditingPicture, setIsEditingPicture] = useState<boolean>(false);

  const maxFileSizeMB = parseFloat(labels.photoUploadSizeInMb);
  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

  useEffect(() => {
    const deletePicture = async () => {
      try {
        await deleteUserPictureAsync();
        addFlashAlert({
          type: 'success',
          label: labels.deleteSuccessfulLabel,
          closable: true,
        });
      } catch (errorMessage) {
        if (errorMessage) {
          addFlashAlert({
            type: 'error',
            label: errorMessage.toString(),
            closable: true,
          });
        }
        setNewUserPicture(undefined);
      }
    };

    const updatePicture = async () => {
      try {
        if (!newUserPicture || !isValidImage(newUserPicture)) {
          return;
        }

        const encodedPicture = await convertImageToBase64(newUserPicture);
        setIsEditingPicture(false);

        await updateUserPictureAsync({
          FileName: newUserPicture.name,
          PhotoData: encodedPicture,
        });
      } catch (errorMessage) {
        if (errorMessage) {
          addFlashAlert({
            type: 'error',
            label: errorMessage.toString(),
            closable: true,
          });
        }
        setNewUserPicture(undefined);
      }
    };

    if (newUserPicture === null) {
      deletePicture();
      return;
    } else if (newUserPicture) {
      updatePicture();
    }
  }, [
    addFlashAlert,
    deleteUserPictureAsync,
    labels.deleteSuccessfulLabel,
    newUserPicture,
    updateUserPictureAsync,
  ]);

  const isLoading = useMemo(
    () =>
      isUpdatingUserPicture ||
      isGettingUserPicture ||
      isDeletingUserPicture ||
      isRefetchingUserPicture,
    [isUpdatingUserPicture, isGettingUserPicture, isDeletingUserPicture, isRefetchingUserPicture]
  );

  const onPictureDelete = () => {
    if (!userPicture.src) {
      return;
    }

    setNewUserPicture(null);
  };

  const validateAndSetNewPicture = (file: File) => {
    if (file.size > maxFileSizeBytes) {
      addFlashAlert({
        type: 'error',
        label: labels.photoUploadLabel.replace('{}', maxFileSizeMB.toString()),
        closable: true,
      });
      return false;
    }

    if (!isValidImage(file)) {
      addFlashAlert({
        type: 'error',
        label: labels.validImageLabel,
        closable: true,
      });
      return false;
    }

    setNewUserPicture(file);
    return true;
  };

  const onPictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.target;
    if (fileInput.files && fileInput.files[0]) {
      const isValid = validateAndSetNewPicture(fileInput.files[0]);
      if (!isValid) {
        fileInput.value = '';
      }
    }
  };

  const ToolIcons = () => {
    return (
      <div className="absolute flex space-x-1 top-0 right-0">
        {userPicture.src && (
          <button
            className="secondary-cta p-0"
            onClick={onPictureDelete}
            aria-label={labels.deletePictureLabel}
          >
            <TrashIcon size={20} />
          </button>
        )}
        <button
          className="secondary-cta p-0"
          onClick={() => {
            setIsEditingPicture(false);
          }}
          aria-label={labels.closeLabel}
        >
          <CloseIcon size={20} />
        </button>
      </div>
    );
  };

  const UploadButton = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
      fileInputRef.current?.click();
    };

    return (
      <>
        <button
          type="button"
          className="flex space-x-2 secondary-cta mt-2 text-xs-sm items-center hover:cursor-pointer"
          onClick={handleButtonClick}
          aria-label={labels.uploadFileCtaLabel}
        >
          <UploadIcon size={13} />
          <span>{labels.uploadFileCtaLabel}</span>
        </button>
        <input
          ref={fileInputRef}
          className="hidden"
          id="user-photo-upload"
          name="user-photo-upload"
          type="file"
          accept="image/png, image/jpeg"
          onChange={onPictureChange}
          value="" // Fix image onchange on second selection
        />
      </>
    );
  };

  const Avatar = () => {
    return (
      <>
        <Image
          src={userPicture.src || defaultProfilePicture?.value?.src || ''}
          alt={userPicture.alt || defaultProfilePicture?.value?.alt?.toString() || ''}
          width={70}
          height={70}
          className="h-full object-cover aspect-square"
        />
        {isBeingApproved && (
          <div className="absolute w-full h-full text-center text-xxsm place-content-center rounded-full bg-gray-30 opacity-80">
            {labels.validationLabel}
          </div>
        )}
      </>
    );
  };

  const EditPhotoButton = () => {
    return (
      <button
        className="isc2-transition text-xs-sm text-link-blue border-link-blue hover:text-gray-90 hover:border-gray-90 hover:border-solid hover:underline hover:cursor-pointer"
        onClick={() => setIsEditingPicture(true)}
        aria-label={labels.editPictureLabel}
      >
        {labels.editPictureLabel}
      </button>
    );
  };

  return (
    <div className="relative w-fit">
      <div className="flex relative w-17.5 h-17.5 rounded-full bg-gray-30 items-center justify-center overflow-hidden">
        {isLoading ? <LoadingIndicator className="self-center !p-0" /> : <Avatar />}
      </div>
      {isEditingPicture && !isLoading && (
        <>
          <ToolIcons />
          <UploadButton />
        </>
      )}
      {!isEditingPicture && !isLoading && <EditPhotoButton />}
    </div>
  );
};

export default ProfileSummaryPicture;
