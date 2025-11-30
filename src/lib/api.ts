const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const USER_ID = 1; // Default user ID

export async function createList(name: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: USER_ID, name }),
  });
  if (!response.ok) throw new Error('Failed to create list');
  return response.json();
}

export async function getUserLists(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/lists?user_id=${USER_ID}`);
  if (!response.ok) throw new Error('Failed to fetch lists');
  return response.json() || [];
}

export async function getList(id: number): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/lists/${id}`);
  if (!response.ok) throw new Error('Failed to fetch list');
  return response.json();
}

export async function updateList(id: number, name: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/lists/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to update list');
  return response.json();
}

export async function deleteList(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/lists/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete list');
}

export async function markListDone(id: number): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/lists/${id}/done`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: USER_ID }),
  });
  if (!response.ok) throw new Error('Failed to mark list as done');
  return response.json();
}

export async function createItem(
  listId: number,
  name: string,
  quantity: number,
  unit: string
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ list_id: listId, name, quantity, unit, purchased: false }),
  });
  if (!response.ok) throw new Error('Failed to create item');
  return response.json();
}

export async function updateItem(
  id: number,
  name: string,
  quantity: number,
  unit: string,
  purchased: boolean
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, quantity, unit, purchased }),
  });
  if (!response.ok) throw new Error('Failed to update item');
  return response.json();
}

export async function deleteItem(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/items/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete item');
}

export async function getHistory(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/history?user_id=${USER_ID}`);
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json() || [];
}

export async function reuseList(historyId: number): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/history/reuse/${historyId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: USER_ID }),
  });
  if (!response.ok) throw new Error('Failed to reuse list');
  return response.json();
}
