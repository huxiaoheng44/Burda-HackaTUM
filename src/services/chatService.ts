const API_URL = 'https://hackatum-2024.openai.azure.com/openai/deployments/gpt-35-turbo/chat/completions';
const API_KEY = '';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

let conversationHistory: Message[] = [];

export function initializeChat(newsContent: string) {
  conversationHistory = [
    {
      role: 'system',
      content: `You are a helpful AI assistant that answers questions about news articles. 
      Here is the current article content that you should use as context for answering questions:
      
      ${newsContent}
      
      Please use this information to provide accurate and relevant responses to user queries.
      Keep your responses concise and focused on the article content.`
    }
  ];
}

export async function getChatResponse(query: string): Promise<string> {
  try {
    // Add user's message to conversation history
    conversationHistory.push({
      role: 'user',
      content: query
    });

    const response = await fetch(`${API_URL}?api-version=2023-07-01-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY
      },
      body: JSON.stringify({
        messages: conversationHistory,
        temperature: 0.7,
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from chat API');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Add assistant's response to conversation history
    conversationHistory.push({
      role: 'assistant',
      content: assistantMessage
    });

    return assistantMessage;
  } catch (error) {
    console.error('Error in chat service:', error);
    throw error;
  }
}