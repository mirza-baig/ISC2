import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders } from 'utils/index';
import { LanguagePreferenceSchema } from 'types/languagePreference';
import { ContactInformationSchema, EmploymentInformationSchema } from 'types/profile';
import { z } from 'zod';
 
const ALLOWED_UPDATE_FIELDS: readonly string[] = [
  ...Object.keys(ContactInformationSchema.shape),
  ...Object.keys(EmploymentInformationSchema.shape),
  'email',
  'billingAddress',
  'mailingAddress',
  'photo',
  'PreferredLanguage',
  'otherPhone',
];
 
function validateAndSanitizeUserData(userData: Record<string, unknown>): {
  isValid: boolean;
  sanitizedData?: Record<string, unknown>;
  error?: string;
} {
  if (!userData.externalId || typeof userData.externalId !== 'string') {
    return { isValid: false, error: 'Missing or invalid externalId' };
  }
 
  if (!userData.email || typeof userData.email !== 'string') {
    return { isValid: false, error: 'Missing or invalid email' };
  }
 
  const sanitizedData: Record<string, unknown> = {
    externalId: (userData.externalId as string).trim(),
    email: (userData.email as string).trim().toLowerCase(),
  };
 
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedData.email as string)) {
    return { isValid: false, error: 'Invalid email format' };
  }
 
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (field in userData) {
      if (field === 'PreferredLanguage') {
        try {
          const validated = LanguagePreferenceSchema.parse({
            PreferredLanguage: userData['PreferredLanguage'],
          });
          sanitizedData['PreferredLanguage'] = validated.PreferredLanguage;
        } catch (error) {
          if (error instanceof z.ZodError) {
            return {
              isValid: false,
              error: `Invalid PreferredLanguage: ${error.errors[0]?.message}`,
            };
          }
          return { isValid: false, error: 'Invalid PreferredLanguage' };
        }
      } else if (field === 'firstName' || field === 'lastName') {
        const value = field === 'firstName' ? userData['firstName'] : userData['lastName'];
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed.length > 0 && trimmed.length <= 80) {
            if (field === 'firstName') {
              sanitizedData['firstName'] = trimmed;
            } else {
              sanitizedData['lastName'] = trimmed;
            }
          } else {
            return { isValid: false, error: `${field} must be 1-80 characters` };
          }
        }
      } else if (field === 'phoneNumber') {
        const value = userData['phoneNumber'];
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed.length <= 15) {
            sanitizedData['phoneNumber'] = trimmed;
          } else {
            return { isValid: false, error: 'Phone number too long' };
          }
        }
      } else if (field === 'otherPhone') {
        const value = userData['otherPhone'];
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed.length <= 40) {
            sanitizedData['otherPhone'] = trimmed;
          } else {
            return { isValid: false, error: 'Other phone number too long' };
          }
        }
      } else if (field === 'employer') {
        const value = userData['employer'];
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed.length <= 80) {
            sanitizedData['employer'] = trimmed;
          } else {
            return { isValid: false, error: 'Employer name too long' };
          }
        }
      } else if (field === 'billingAddress') {
        sanitizedData['billingAddress'] = userData['billingAddress'];
      } else if (field === 'mailingAddress') {
        sanitizedData['mailingAddress'] = userData['mailingAddress'];
      } else if (field === 'photo') {
        sanitizedData['photo'] = userData['photo'];
      } else if (field === 'nickname') {
        sanitizedData['nickname'] = userData['nickname'];
      } else if (field === 'pronouns') {
        sanitizedData['pronouns'] = userData['pronouns'];
      } else if (field === 'prefix') {
        sanitizedData['prefix'] = userData['prefix'];
      } else if (field === 'suffix') {
        sanitizedData['suffix'] = userData['suffix'];
      } else if (field === 'jobTitle') {
        sanitizedData['jobTitle'] = userData['jobTitle'];
      } else if (field === 'workEmail') {
        sanitizedData['workEmail'] = userData['workEmail'];
      } else if (field === 'workPhone') {
        sanitizedData['workPhone'] = userData['workPhone'];
      } else if (field === 'isGovernmentContractor') {
        sanitizedData['isGovernmentContractor'] = userData['isGovernmentContractor'];
      } else if (field === 'isGovernmentEmployee') {
        sanitizedData['isGovernmentEmployee'] = userData['isGovernmentEmployee'];
      }
    }
  }
 
  const providedFields = Object.keys(userData);
  const allowedFieldNames = ['externalId', 'email', ...ALLOWED_UPDATE_FIELDS];
  const extraFields = providedFields.filter((f) => !allowedFieldNames.includes(f));
 
  if (extraFields.length > 0) {
    console.warn(
      `[SECURITY WARNING] Attempt to update unauthorized fields: ${extraFields.join(
        ', '
      )} by user ${sanitizedData.externalId}`
    );
  }
 
  return { isValid: true, sanitizedData };
}
 
export default async function updateUserData(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'POST');
 
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  const { body } = req;
  const { userData } = body;
 
  if (!userData || typeof userData !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid userData in request body' });
  }
 
  const validation = validateAndSanitizeUserData(userData);
 
  if (!validation.isValid) {
    console.error(
      `[VALIDATION ERROR] ${validation.error} - User: ${userData.externalId || 'unknown'}`
    );
    return res.status(400).json({ error: validation.error });
  }
 
  const sanitizedData = validation.sanitizedData!;
 
  const updatedFields = Object.keys(sanitizedData).filter(
    (k) => k !== 'externalId' && k !== 'email'
  );
  console.log(
    `[UPDATE USER] User ${sanitizedData.externalId} updating fields: ${
      updatedFields.join(', ') || 'none'
    }`
  );
 
  try {
    const response = await fetch(`${process.env.SALESFORCE_CLOUDHUB_URL}/v1/user/updateUserData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        client_id: process.env.SALESFORCE_CLOUDHUB_ID ?? '',
        client_secret: process.env.SALESFORCE_CLOUDHUB_SECRET ?? '',
      },
      body: JSON.stringify({
        userData: sanitizedData,
      }),
    });
 
    const data = await response.json();
 
    if (data.errors) {
      console.error(
        `[MULESOFT ERROR] ${JSON.stringify(data.errors)} - User: ${sanitizedData.externalId}`
      );
      throw data.errors;
    }
 
    return res.status(200).json(data);
  } catch (errors) {
    console.error(
      `[UPDATE USER ERROR] ${JSON.stringify(errors)} - User: ${sanitizedData.externalId}`
    );
    return res.status(500).json({ errors });
  }
}
 