import { WhatsAppMessagePayload, WhatsAppApiResponse } from './types';

const API_BASE_URL = '/api/whatsapp';

export async function sendWhatsAppMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppApiResponse> {
  const response = await fetch(`${API_BASE_URL}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchApplicationStatus(ackNumber: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/status/${encodeURIComponent(ackNumber)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch status: ${response.statusText}`);
  }
  return response.json();
}
