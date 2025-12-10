import { Gift, User, USERS, Comment } from '../types';

// Simulating MongoDB + Express endpoints locally

const STORAGE_KEY = 'xmas_wishlist_db_v1';

const getDb = (): { gifts: Gift[] } => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return { gifts: [] };
};

const saveDb = (data: { gifts: Gift[] }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    alert("¡Memoria llena! Intenta borrar algunos regalos antiguos. (LocalStorage limit reached)");
  }
};

export const api = {
  getUsers: async (): Promise<User[]> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 300));
    return USERS;
  },

  getGiftsByUser: async (userId: string): Promise<Gift[]> => {
    await new Promise(r => setTimeout(r, 300));
    const db = getDb();
    return db.gifts
      .filter(g => g.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  createGift: async (userId: string, imageData: string, title: string, description: string): Promise<Gift> => {
    await new Promise(r => setTimeout(r, 600)); // Simulate upload time
    const db = getDb();
    
    const newGift: Gift = {
      id: Date.now().toString(),
      userId,
      imageData,
      title,
      description,
      comments: [],
      createdAt: Date.now(),
    };

    db.gifts.push(newGift);
    saveDb(db);
    return newGift;
  },
  
  deleteGift: async (giftId: string): Promise<void> => {
     await new Promise(r => setTimeout(r, 200));
     const db = getDb();
     db.gifts = db.gifts.filter(g => g.id !== giftId);
     saveDb(db);
  },

  addComment: async (giftId: string, userId: string, text: string): Promise<Comment> => {
    await new Promise(r => setTimeout(r, 200));
    const db = getDb();
    const giftIndex = db.gifts.findIndex(g => g.id === giftId);
    
    if (giftIndex === -1) throw new Error("Gift not found");

    const newComment: Comment = {
      id: Date.now().toString(),
      userId,
      text,
      createdAt: Date.now()
    };

    // Ensure array exists (migration for old data)
    if (!db.gifts[giftIndex].comments) {
      db.gifts[giftIndex].comments = [];
    }

    db.gifts[giftIndex].comments.push(newComment);
    saveDb(db);
    return newComment;
  }
};

// Helper to resize images before storage to save space (since we are using LocalStorage)
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