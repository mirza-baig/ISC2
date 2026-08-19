import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import type { AddressSelection, PrivateClassAnswers } from './B2BPrivateClassContext';

/**
 * The local DRAFT of a row's private-class answers (PRIV-1), shared by every surface that edits
 * them — the listing row, the on-page cart line, and the demo row.
 *
 * Field edits stay local so editing on one surface doesn't change the other until Update/Add
 * commits (#5); the draft re-syncs from the committed store whenever that changes (e.g. after the
 * other surface commits).
 *
 * `openLocationModal` is taken as an argument rather than read from the context here, because the
 * cart line receives it as a prop from its parent.
 */
export const useB2BPrivateClassDraft = (
  committed: PrivateClassAnswers,
  openLocationModal: (
    initial: AddressSelection,
    onConfirm: (result: AddressSelection) => void
  ) => void
): {
  draft: PrivateClassAnswers;
  setDraft: Dispatch<SetStateAction<PrivateClassAnswers>>;
  areAnswersDirty: boolean;
  openAddressModal: () => void;
} => {
  const [draft, setDraft] = useState<PrivateClassAnswers>(committed);
  useEffect(() => {
    setDraft(committed);
  }, [committed]);

  // Choosing "At Location" without an address yet opens the Classroom Location modal; its confirm
  // flows back into this draft.
  const applyAddress = (result: AddressSelection) =>
    setDraft((d) => ({
      ...d,
      addressChoice: result.addressChoice,
      customAddress: result.customAddress,
      eventAddress: result.eventAddress,
      locationMode: 'at-location',
    }));

  const openAddressModal = () =>
    openLocationModal(
      {
        addressChoice: draft.addressChoice,
        customAddress: draft.customAddress,
        eventAddress: draft.eventAddress,
      },
      applyAddress
    );

  // The answers half of "dirty". Callers OR in their own quantity comparison, since what quantity
  // is committed differs per surface (a cart line item, the demo store, or a CT line).
  const areAnswersDirty =
    draft.requestedStartDate !== committed.requestedStartDate ||
    draft.locationMode !== committed.locationMode ||
    draft.eventAddress !== committed.eventAddress;

  return { draft, setDraft, areAnswersDirty, openAddressModal };
};
