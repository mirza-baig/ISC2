import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders } from 'utils/index';

interface EnrollmentValidationRequest {
  productKey: string;
  startDate: string | null;
  endDate: string | null;
}

interface EnrollmentValidationResponse {
  productKey: string;
  isBeforeEnrollment: boolean;
  formattedDate?: string;
}

export default async function validateEnrollmentAccess(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const products = req.body as EnrollmentValidationRequest[];

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid request: products array required' });
    }

    const validationResults: EnrollmentValidationResponse[] = products.map((product) => {
      const { productKey, startDate } = product;

      if (!startDate) {
        return {
          productKey,
          isBeforeEnrollment: false,
        };
      }

      const now = new Date();
      const enrollmentStart = new Date(startDate);

      const isBeforeEnrollment = enrollmentStart > now;

      let formattedDate: string | undefined;
      if (isBeforeEnrollment) {
        formattedDate = new Intl.DateTimeFormat('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(enrollmentStart);
      }

      return {
        productKey,
        isBeforeEnrollment,
        formattedDate,
      };
    });

    return res.status(200).json(validationResults);
  } catch (error) {
    console.error('Error validating enrollment access:', error);
    return res.status(500).json({ error: 'Failed to validate enrollment access' });
  }
}
