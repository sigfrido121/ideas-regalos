import { Gift, User, USERS, Comment } from '../types';

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || '/api/gifts';

export const api = {
  getUsers: async (): Promise<User[]> => {
    // Users are still hardcoded in frontend as there is no auth system yet
    return USERS;
  },

  getGiftsByUser: async (userId: string): Promise<Gift[]> => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch gifts');
      const allGifts: Gift[] = await response.json();

      // Filter by user locally
      return allGifts
        .filter(g => g.userId === userId)
        // Backend returns date string/object, frontend expects number (timestamp)
        // or we handle it in the component. Let's normalize here.
        .map(g => ({
          ...g,
          createdAt: new Date(g.createdAt).getTime()
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

    const response = await fetch(API_URL, {
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
    const response = await fetch(`${API_URL}/${giftId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete gift');
  },

  addComment: async (giftId: string, userId: string, text: string): Promise<Comment> => {
    const response = await fetch(`${API_URL}/${giftId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, text })
    });

    if (!response.ok) throw new Error('Failed to add comment');
    return await response.json();
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
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};