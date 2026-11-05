import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import config from 'temp/config';
import { GET_CERTIFICATION_DETAILS_QUERY } from 'queries/certificationPages';
import { setAPIRouteHeaders } from 'utils/apiUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { itemId } = req.body;

  if (!itemId) {
    return res.status(400).json({ error: 'Certification itemId is required' });
  }

  try {
    console.log('🔷 API: Querying GraphQL with itemId:', itemId);

    const response = await axios.post(
      config.graphQLEndpoint,
      {
        query: GET_CERTIFICATION_DETAILS_QUERY,
        variables: { itemId },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          sc_apikey: config.sitecoreApiKey,
        },
      }
    );

    console.log('🔷 API: GraphQL response:', JSON.stringify(response.data, null, 2));

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching certification details:', error);
    return res.status(500).json({ error: 'Failed to fetch certification details' });
  }
}
