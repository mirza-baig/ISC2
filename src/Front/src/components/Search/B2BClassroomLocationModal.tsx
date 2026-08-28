// Private classes are deferred to a later phase (bug sweep 2026-08-19) — this whole file is
// commented out rather than deleted so the modal can be restored by uncommenting when the
// feature ships. Its only render site (SearchWrapper.tsx) is commented out to match.
// `export {}` keeps this a module (rather than a global script) so `import * as X` from the
// generated component registry (src/temp/componentBuilder.ts) still type-checks.
export {};
//
// import { useEffect, useMemo, useState } from 'react';

// import { CloseIcon } from 'icons/index';
// import { useGetAllCountries, useGetAllStates, useLoggedUser } from 'hooks/index';
// import {
//   useB2BPrivateClass,
//   useB2BPrivateClassLabels,
//   EMPTY_CUSTOM_ADDRESS,
//   type AddressChoice,
//   type AddressCustomFields,
// } from './B2BPrivateClassContext';
// import {
//   formatCustomAddress,
//   formatUserAddress,
//   getAddressErrors,
//   getPostalCodePattern,
//   getStatesForCountry,
//   isStateRequired,
// } from './b2bAddress';

// /**
//  * "Classroom Location" modal for the B2B PLP private-class questions. Opened (callback-based) from
//  * a row/cart "At Location" choice or the Event Location "Edit" link, PRE-FILLED from the current
//  * selection so editing shows the existing address (#8/#9). Confirms the full selection back to the
//  * surface that opened it (into its draft); committing happens on that surface's Update.
//  *
//  * ADDRESS SOURCES: "My Mailing Address" / "My Billing Address" are the signed-in account's addresses
//  * from `useLoggedUser()` — the same `user.mailingAddress` / `user.billingAddress` checkout reads —
//  * and are formatted for display rather than assumed to be US-shaped. "Other Address" collects a
//  * custom address inline with the same country/state/postal behaviour as the checkout form; see
//  * `b2bAddress.ts`, which imports checkout's rules rather than restating them.
//  */

// const B2BClassroomLocationModal = (): JSX.Element | null => {
//   const { locationModalOpen, locationModalInitial, closeLocationModal, confirmLocation } =
//     useB2BPrivateClass();
//   const L = useB2BPrivateClassLabels();

//   // Same two lists checkout's dropdowns use. Both are `react-query` hooks with `refetchOnMount:
//   // false`, so opening the modal on a page that has already loaded them costs nothing.
//   const { allCountries } = useGetAllCountries();
//   const { allStates } = useGetAllStates();
//   const { user } = useLoggedUser();

//   const [choice, setChoice] = useState<AddressChoice>('');
//   const [custom, setCustom] = useState<AddressCustomFields>(EMPTY_CUSTOM_ADDRESS);
//   // Errors are only surfaced after a Confirm attempt — flagging a half-typed postal code as invalid
//   // while someone is still typing it reads as the form fighting them.
//   const [showErrors, setShowErrors] = useState(false);

//   // Pre-fill from the current selection each time the modal opens (#8/#9).
//   useEffect(() => {
//     if (locationModalOpen) {
//       setChoice(locationModalInitial?.addressChoice ?? '');
//       setCustom(locationModalInitial?.customAddress ?? EMPTY_CUSTOM_ADDRESS);
//       setShowErrors(false);
//     }
//   }, [locationModalOpen, locationModalInitial]);

//   const states = useMemo(
//     () => getStatesForCountry(allStates, custom.countryCode),
//     [allStates, custom.countryCode]
//   );
//   const errors = useMemo(() => getAddressErrors(custom, allStates), [custom, allStates]);

//   // The account's own addresses, formatted internationally (no stray commas where a country has no
//   // state or no postal code). Empty until the account data loads or if nobody is signed in.
//   const accountAddresses = useMemo(
//     () => ({
//       mailing: formatUserAddress(user?.mailingAddress, allStates),
//       billing: formatUserAddress(user?.billingAddress, allStates),
//     }),
//     [user?.mailingAddress, user?.billingAddress, allStates]
//   );

//   if (!locationModalOpen) {
//     return null;
//   }

//   // Named branches rather than `accountAddresses[choice]` so the lookup key stays a literal.
//   const accountAddressFor = (which: AddressChoice): string => {
//     if (which === 'mailing') return accountAddresses.mailing;
//     if (which === 'billing') return accountAddresses.billing;
//     return '';
//   };

//   const resolvedAddress =
//     choice === 'other'
//       ? formatCustomAddress(custom, allCountries, allStates)
//       : accountAddressFor(choice);

//   // An account address that hasn't loaded (or doesn't exist) can't be confirmed — there would be
//   // nothing to show on the row afterwards.
//   const canConfirm =
//     choice !== '' &&
//     (choice === 'other' ? Object.keys(errors).length === 0 : resolvedAddress !== '');

//   // Postal code is required exactly where checkout requires it: only for countries that have a
//   // postal-code format at all.
//   const isZipRequired = Boolean(getPostalCodePattern(custom.countryCode));

//   const onCountryChange = (countryCode: string) => {
//     // Clear the state when the country changes — a state code from the previous country is not a
//     // valid value for the new one, and leaving it behind would silently confirm a wrong address.
//     setCustom((c) => ({ ...c, countryCode, stateCode: '' }));
//   };

//   const handleConfirm = () => {
//     if (!canConfirm) {
//       setShowErrors(true);
//       return;
//     }
//     // Hands the full selection back to the surface that opened the modal (into its draft) — the
//     // context closes the modal; committing to the cart/store happens on that surface's Update.
//     confirmLocation({
//       addressChoice: choice,
//       customAddress: custom,
//       eventAddress: resolvedAddress,
//     });
//   };

//   const fieldClass = (invalid: boolean) =>
//     `w-full rounded border px-3 py-2 text-sm ${invalid ? 'border-red-warning' : 'border-gray-50'}`;

//   const requiredMark = (required: boolean) =>
//     required ? <span className="text-red-warning">* </span> : null;

//   return (
//     // Above `z-mini-cart` (99999), which is what the floating cart bubble and the mobile cart
//     // drawer sit at — at the old `z-[1000]` the bubble punched through this overlay. Raised here on
//     // the overlay rather than lowered on the bubble on purpose: the bubble's 99999 is what keeps it
//     // in front of the sticky header and nav bars everywhere else, and this modal is the only
//     // surface that needs to cover it.
//     <div
//       className="modal-overlay z-[100000]"
//       role="dialog"
//       aria-modal="true"
//       aria-label="Classroom Location"
//     >
//       <div className="max-h-[calc(100vh-2rem)] w-[520px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg bg-white-00 p-5 shadow-lg">
//         <div className="mb-4 flex items-center justify-between">
//           <h2 className="body-l font-bold text-black-100">{L.modalTitle}</h2>
//           <button
//             type="button"
//             onClick={closeLocationModal}
//             aria-label="Close"
//             className="cursor-pointer text-gray-70 hover:text-black-100"
//           >
//             <CloseIcon size={16} />
//           </button>
//         </div>

//         <label className="mb-1.5 block text-sm text-black-100">{L.addressPrompt}</label>
//         <select
//           value={choice}
//           onChange={(e) => setChoice(e.target.value as AddressChoice)}
//           className="select-pos w-full cursor-pointer appearance-none rounded border border-gray-50 bg-white-00 px-3 py-2 text-sm"
//           aria-label="Address"
//         >
//           <option value="">{L.addressChoose}</option>
//           <option value="mailing">{L.addressMailing}</option>
//           <option value="billing">{L.addressBilling}</option>
//           <option value="other">{L.addressOther}</option>
//         </select>

//         {(choice === 'mailing' || choice === 'billing') && (
//           <div className="mt-3 rounded border border-gray-50 bg-gray-10 px-3 py-2 text-sm text-gray-90">
//             {accountAddressFor(choice) || L.addressNoneOnFile}
//           </div>
//         )}

//         {choice === 'other' && (
//           <div className="mt-3 grid grid-cols-2 gap-3">
//             {/* Country is deliberately the FIRST field, on its own full-width row: it decides what
//                 the rest of the form even is — whether there is a state list to pick from, and
//                 whether a postal code is asked for — so anything typed above it can be invalidated
//                 by changing it. */}
//             <label className="col-span-2 flex flex-col gap-1">
//               <span className="text-xs text-gray-70">
//                 {requiredMark(true)}
//                 {L.addressCountry}
//               </span>
//               <select
//                 value={custom.countryCode}
//                 onChange={(e) => onCountryChange(e.target.value)}
//                 aria-label={L.addressCountry}
//                 className={`select-pos cursor-pointer appearance-none bg-white-00 ${fieldClass(
//                   showErrors && Boolean(errors.countryCode)
//                 )}`}
//               >
//                 <option value="">{L.addressSelect}</option>
//                 {allCountries?.map((country) => (
//                   <option key={country.countryCode} value={country.countryCode}>
//                     {country.countryName}
//                   </option>
//                 ))}
//               </select>
//             </label>

//             <label className="flex flex-col gap-1">
//               <span className="text-xs text-gray-70">
//                 {requiredMark(true)}
//                 {L.addressField1}
//               </span>
//               <input
//                 type="text"
//                 value={custom.address1}
//                 onChange={(e) => setCustom((c) => ({ ...c, address1: e.target.value }))}
//                 aria-label={L.addressField1}
//                 maxLength={255}
//                 className={fieldClass(showErrors && Boolean(errors.address1))}
//               />
//             </label>

//             <label className="flex flex-col gap-1">
//               <span className="text-xs text-gray-70">{L.addressField2}</span>
//               <input
//                 type="text"
//                 value={custom.address2}
//                 onChange={(e) => setCustom((c) => ({ ...c, address2: e.target.value }))}
//                 aria-label={L.addressField2}
//                 maxLength={255}
//                 className={fieldClass(false)}
//               />
//             </label>

//             <label className="flex flex-col gap-1">
//               <span className="text-xs text-gray-70">
//                 {requiredMark(true)}
//                 {L.addressCity}
//               </span>
//               <input
//                 type="text"
//                 value={custom.city}
//                 onChange={(e) => setCustom((c) => ({ ...c, city: e.target.value }))}
//                 aria-label={L.addressCity}
//                 maxLength={40}
//                 className={fieldClass(showErrors && Boolean(errors.city))}
//               />
//             </label>

//             {/* No state field at all for the many countries that have no state/province list —
//                 same as checkout, which only renders its state dropdown when the list is non-empty. */}
//             {states.length > 0 && (
//               <label className="flex flex-col gap-1">
//                 <span className="text-xs text-gray-70">
//                   {requiredMark(isStateRequired(custom.countryCode, allStates))}
//                   {L.addressState}
//                 </span>
//                 <select
//                   value={custom.stateCode}
//                   onChange={(e) => setCustom((c) => ({ ...c, stateCode: e.target.value }))}
//                   aria-label={L.addressState}
//                   className={`select-pos cursor-pointer appearance-none bg-white-00 ${fieldClass(
//                     showErrors && Boolean(errors.stateCode)
//                   )}`}
//                 >
//                   <option value="">{L.addressSelect}</option>
//                   {states.map((state) => (
//                     <option key={state.stateCode} value={state.stateCode}>
//                       {state.stateName}
//                     </option>
//                   ))}
//                 </select>
//               </label>
//             )}

//             {/* Likewise hidden entirely for countries with no postal-code system (Angola, the
//                 Bahamas, Botswana…), which `POSTAL_CODES_PATTERNS` maps to null. */}
//             {isZipRequired && (
//               <label className="flex flex-col gap-1">
//                 <span className="text-xs text-gray-70">
//                   {requiredMark(true)}
//                   {L.addressZip}
//                 </span>
//                 <input
//                   type="text"
//                   value={custom.zip}
//                   onChange={(e) => setCustom((c) => ({ ...c, zip: e.target.value }))}
//                   aria-label={L.addressZip}
//                   maxLength={20}
//                   className={fieldClass(showErrors && Boolean(errors.zip))}
//                 />
//                 {showErrors && errors.zip === 'invalid' && (
//                   <span className="text-xs text-red-warning">{L.addressZipInvalid}</span>
//                 )}
//               </label>
//             )}
//           </div>
//         )}

//         <div className="mt-5 flex items-center justify-start gap-4">
//           <button
//             type="button"
//             onClick={closeLocationModal}
//             className="cursor-pointer text-sm text-gray-90"
//           >
//             {L.cancel}
//           </button>
//           <button
//             type="button"
//             onClick={handleConfirm}
//             // Left ENABLED for an incomplete "Other" address on purpose — clicking is what reveals
//             // which fields are missing. Disabled only where clicking could never succeed and there
//             // is nothing to point at: no choice made, or an account address that isn't there (the
//             // "no address on file" line already says why).
//             disabled={
//               choice === '' ||
//               ((choice === 'mailing' || choice === 'billing') && resolvedAddress === '')
//             }
//             className="cursor-pointer rounded bg-isc2-green px-4 py-2 text-sm font-semibold text-white-00 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             {L.confirmLocation}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default B2BClassroomLocationModal;
