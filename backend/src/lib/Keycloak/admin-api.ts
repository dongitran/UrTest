import axios from 'axios';

async function getKeycloakAdminToken() {
  try {
    const tokenResponse = await axios.post(
      `${Bun.env.KEYCLOAK_URL}/realms/${Bun.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: Bun.env.KEYCLOAK_ADMIN_CLIENT_ID || '',
        client_secret: Bun.env.KEYCLOAK_ADMIN_CLIENT_SECRET || '',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return tokenResponse.data.access_token;
  } catch (error) {
    console.error('Error fetching Keycloak admin token:', error);
    throw new Error('Failed to authenticate with Keycloak Admin API');
  }
}

export async function fetchStaffUsersFromKeycloak() {
  try {
    const accessToken = await getKeycloakAdminToken();

    const groupsResponse = await axios.get(
      `${Bun.env.KEYCLOAK_URL}/admin/realms/${Bun.env.KEYCLOAK_REALM}/groups`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const staffGroup = groupsResponse.data.find((group) => group.name === 'Staff Members');

    if (!staffGroup) {
      throw new Error('Staff Members group not found in Keycloak');
    }

    const staffMembersResponse = await axios.get(
      `${Bun.env.KEYCLOAK_URL}/admin/realms/${Bun.env.KEYCLOAK_REALM}/groups/${staffGroup.id}/members`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return staffMembersResponse.data.map((user) => ({
      email: user.email,
      username: user.username,
    }));
  } catch (error) {
    console.error('Error fetching staff users from Keycloak:', error);
    throw new Error('Failed to fetch staff users from Keycloak');
  }
}
