export default async function RefreshRepo() {
  try {
    const response = await fetch(`${Bun.env.RUNNER_API_URL}/refresh-repo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Bun.env.RUNNER_X_API_KEY!,
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    console.log('Refresh repo response:', data);
    return data;
  } catch (error) {
    console.error('Error refreshing repo:', error);
    throw error;
  }
}
