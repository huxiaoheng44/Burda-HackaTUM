const API_URL = 'https://hackatum-2024.openai.azure.com/openai/deployments/text-embedding-ada-002/embeddings';
const API_KEY = '';

export async function getChatResponse(query: string): Promise<string> {
  try {
    const response = await fetch(`${API_URL}?api-version=2023-05-15`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY || '',
      },
      body: JSON.stringify({
        input: query,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from chat API');
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error in chat service:', error);
    throw error;
  }
}