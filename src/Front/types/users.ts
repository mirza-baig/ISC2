import { POSTAL_CODES_PATTERNS } from 'constants/postalCodesPatterns';
import { CUSTOMER_ORDER_REFERENCE_MAX_LENGTH, PO_NUMBER_MAX_LENGTH } from 'constants/checkout';
import { z } from 'zod';

export const COUNTRIES_REQUIRING_STATES = ['US'];

export const AddressSchema = z
  .object({
    street: z.string().trim().min(1).max(255),
    streetTwo: z.string().trim().max(255).optional(),
    countryCode: z.string().trim().min(1).max(80),
    stateCode: z.string().trim().max(40).optional(),
    city: z.string().trim().min(1).max(40),
    postalCode: z.string().trim().max(20),
  })
  .superRefine((input, ctx) => {
    const countryCode = input.countryCode?.toUpperCase() as keyof typeof POSTAL_CODES_PATTERNS;
    const postalCode = input.postalCode;

    if (countryCode && POSTAL_CODES_PATTERNS[countryCode]) {
      const pattern = POSTAL_CODES_PATTERNS[countryCode];

      if (!pattern?.test(postalCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'incorrect_postal_code',
          path: ['postalCode'],
        });
      }
    }

    const requiresState = COUNTRIES_REQUIRING_STATES.includes(countryCode);
    if (requiresState && !input.stateCode?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'state_required',
        path: ['stateCode'],
      });
    }
  });

export const PhotoSchema = z.object({
  base64: z.string().trim().min(1),
});

export const PoAttachmentSchema = z.object({
  fileName: z.string().trim().min(1),
  base64: z.string().trim().min(1),
});

export type Address = z.infer<typeof AddressSchema>;
export type PoAttachment = z.infer<typeof PoAttachmentSchema>;

/**
 * Raises the issue the form fields provider already renders as the standard
 * "{field} is required" message. Conditional requirements live here rather than on
 * the field schema because they depend on business account data, which is carried
 * into the form as the `isPo*Required` / `isCourseDeliveryDateRequired` flags.
 */
const addRequiredIssue = (ctx: z.RefinementCtx, path: string) =>
  ctx.addIssue({
    code: z.ZodIssueCode.too_small,
    minimum: 1,
    inclusive: true,
    type: 'string',
    path: [path],
  });

export const PersonalInformationSchema = z
  .object({
    firstName: z.string().trim().min(1).max(40),
    lastName: z.string().trim().min(1).max(80),
    employer: z.string().trim().max(80).optional(),
    email: z.string().trim().min(1).max(80).email('email'),
    phoneNumber: z.string().trim().max(15).optional(),
    billingAddress: AddressSchema,
    mailingAddress: AddressSchema.optional(),
    isSameAddress: z.boolean(),
    agreeTerms: z.boolean(),
    photo: PhotoSchema.optional(),
    isB2Bcart: z.boolean(),
    // Business buyer purchase information (checkout step one).
    poNumber: z.string().trim().max(PO_NUMBER_MAX_LENGTH).optional(),
    poAttachment: PoAttachmentSchema.optional(),
    customerOrderReference: z.string().trim().max(CUSTOMER_ORDER_REFERENCE_MAX_LENGTH).optional(),
    courseDeliveryDate: z.string().trim().optional(),
    isBusinessBuyer: z.boolean().optional(),
    isPoRequired: z.boolean().optional(),
    isPoAttachmentRequired: z.boolean().optional(),
    isCourseDeliveryDateRequired: z.boolean().optional(),
  })
  .superRefine((input, ctx) => {
    if (!input.agreeTerms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'checkbox_required',
        path: ['agreeTerms'],
      });
    }

    if (!input.isBusinessBuyer) {
      return;
    }

    if (input.isPoRequired && !input.poNumber?.trim()) {
      addRequiredIssue(ctx, 'poNumber');
    }

    if (input.isPoAttachmentRequired && !input.poAttachment?.fileName?.trim()) {
      addRequiredIssue(ctx, 'poAttachment');
    }

    if (input.isCourseDeliveryDateRequired && !input.courseDeliveryDate?.trim()) {
      addRequiredIssue(ctx, 'courseDeliveryDate');
    }
  });

export type PersonalInformation = z.infer<typeof PersonalInformationSchema>;

export type UpdateUserPayload = Omit<PersonalInformation, 'agreeTerms' | 'isSameAddress'> & {
  PreferredLanguage?: string;
  /** Salesforce Contact `OtherPhone`, where business buyers' checkout phone edits land. */
  otherPhone?: string;
};

export type UpdateUserPicturePayload = {
  FileName: string;
  PhotoData: string;
};
