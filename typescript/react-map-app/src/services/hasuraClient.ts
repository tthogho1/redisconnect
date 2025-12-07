import { Airport, AirportsQueryVariables } from '../types/airport';

const HASURA_ENDPOINT = 'https://apt-panther-30.hasura.app/v1/graphql';
const HASURA_ADMIN_SECRET = 'GLwNuQEwAPIY1hFgp43i5XsSOGTvcu69y2GA5sR1ES51DAOIf5evfCrWfT4KxfPs';

export async function fetchAirportsInBounds(variables: AirportsQueryVariables): Promise<Airport[]> {
  const query = `
    query {
      airports(
        where: {
          type: { _neq: "heliport" }
          latitude_deg: { _gte: ${variables.minLat}, _lte: ${variables.maxLat} }
          longitude_deg: { _gte: ${variables.minLon}, _lte: ${variables.maxLon} }
        }
      ) {
        name
        type
        iata_code
        icao_code
        latitude_deg
        longitude_deg
        home_link
      }
    }
  `;

  try {
    const response = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error('GraphQL query failed');
    }

    return result.data.airports || [];
  } catch (error) {
    console.error('Failed to fetch airports:', error);
    return [];
  }
}
