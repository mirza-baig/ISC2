import { z } from 'zod';

export const ALLOWED_LANGUAGES = ['English', 'German', 'Japanese', 'Chinese', 'Spanish'] as const;

export type AllowedLanguage = (typeof ALLOWED_LANGUAGES)[number];

export const LanguagePreferenceSchema = z.object({
  PreferredLanguage: z
    .string()
    .trim()
    .min(1, 'Language preference is required')
    .max(50, 'Language preference is too long')
    .refine(
      (val) => ALLOWED_LANGUAGES.includes(val as AllowedLanguage),
      (val) => ({
        message: `Invalid language: "${val}". Must be one of: ${ALLOWED_LANGUAGES.join(', ')}`,
      })
    ),
});

export type LanguagePreferenceUpdate = z.infer<typeof LanguagePreferenceSchema>;

export function validateLanguagePreference(language: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    LanguagePreferenceSchema.parse({ PreferredLanguage: language });
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || 'Invalid language preference',
      };
    }
    return {
      isValid: false,
      error: 'Unknown validation error',
    };
  }
}
