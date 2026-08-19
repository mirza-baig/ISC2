import { Field, LinkField, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import { z } from 'zod';

export const AddUserInformationSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().min(1).max(255).email('email'),
  forAllocation: z.boolean(),
});

export type AddUserInformation = z.infer<typeof AddUserInformationSchema>;

export type AllocationDetailsTab = 'remaining' | 'allocated';

export type AllocationDetailsMode = 'existing' | 'file';

export type AllocationRemoveUserModalFields = {
  heading?: TextField;
  description?: TextField;
  primaryCtaLabel?: TextField;
  secondaryCtaLabel?: TextField;
};

export type AllocationDetailsFields = {
  backToAllocationsLink: LinkField;
  labelsTitlesAndMore: Field<string>;
  messagesAndNotices: Field<string>;
  removeUserFromAllocationModalNotice: {
    fields: AllocationRemoveUserModalFields;
  };
};

export const CSVRecordsSchema = z
  .object({
    email: z.string().min(1).max(255).email(),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    checked: z.boolean().optional().default(false),
    emailAlreadyAllocated: z.boolean().optional().default(false),
    isAvailableToAllocate: z.boolean().optional().default(false),
  })
  .array();

export type CSVRecords = z.infer<typeof CSVRecordsSchema>;

export type SelectedEmails = Map<string, true>;
