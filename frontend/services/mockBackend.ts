import { Gift, User, Comment } from '../types';

// API Configuration
const USERS_API_URL = '/api/users';
const GIFTS_API_URL = '/api/gifts';

export const api = {
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await fetch(USERS_API_URL);
      if (!response.ok) throw new Error('Failed to fetch users');
      return await response.json();
    } catch (error) {
      console.error("API Error (getUsers):", error);
      return [];
    }
  },

  createUser: async (name: string, avatar: string): Promise<User> => {
    const response = await fetch(USERS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar })
    });
    if (!response.ok) throw new Error('Failed to create user');
    return await response.json();
  },

  updateUser: async (userId: string, name: string, avatar: string): Promise<User> => {
    const response = await fetch(`${USERS_API_URL}/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar })
    });
    if (!response.ok) throw new Error('Failed to update user');
    return await response.json();
  },

  getGiftsByUser: async (userId: string): Promise<Gift[]> => {
    try {
      const response = await fetch(GIFTS_API_URL + "?userId=" + userId);
      if (!response.ok) throw new Error('Failed to fetch gifts');
      const gifts: Gift[] = await response.json();
      return gifts.map(g => ({
        ...g,
        createdAt: typeof g.createdAt === 'string' ? new Date(g.createdAt).getTime() : g.createdAt
      }));
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  createGift: async (userId: string, imageData: string, title: string, description: string): Promise<Gift> => {
    const payload = {
      userId,
      imageData,
      title,
      description,
      comments: []
    };

    const response = await fetch(GIFTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Failed to create gift');
    const newGift = await response.json();
    return {
      ...newGift,
      createdAt: new Date(newGift.createdAt).getTime()
    };
  },

  deleteGift: async (giftId: string): Promise<void> => {
    const response = await fetch(`${GIFTS_API_URL}/${giftId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete gift');
  },

  addComment: async (giftId: string, userId: string, text: string): Promise<Comment> => {
    const response = await fetch(`${GIFTS_API_URL}/${giftId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, text })
    });

    if (!response.ok) throw new Error('Failed to add comment');
    return await response.json();
  },

  interact: async (giftId: string, userId: string, action: 'like' | 'dislike'): Promise<Gift> => {
    const response = await fetch(`${GIFTS_API_URL}/${giftId}/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action })
    });
    if (!response.ok) throw new Error('Failed to update interaction');
    const updatedGift = await response.json();
    return {
      ...updatedGift,
      createdAt: new Date(updatedGift.createdAt).getTime()
    };
  },

  updateGift: async (giftId: string, updates: Partial<{ title: string; description: string }>): Promise<Gift> => {
    const response = await fetch(`${GIFTS_API_URL}/${giftId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update gift');
    const updatedGift = await response.json();
    return {
      ...updatedGift,
      createdAt: new Date(updatedGift.createdAt).getTime()
    };
  }
};

// Helper function remains useful for image processing
export const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const scaleSize = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compress to 60% quality
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};