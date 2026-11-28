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

  getHighlights: async (limit = 8): Promise<{ recent: Gift[]; popular: Gift[] }> => {
    try {
      const response = await fetch(`${GIFTS_API_URL}/highlights?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch highlights');
      const data = await response.json();
      const parse = (list: Gift[]) => (list || []).map(g => ({
        ...g,
        createdAt: typeof g.createdAt === 'string' ? new Date(g.createdAt).getTime() : g.createdAt
      }));
      return { recent: parse(data.recent), popular: parse(data.popular) };
    } catch (error) {
      console.error("API Error (getHighlights):", error);
      return { recent: [], popular: [] };
    }
  },

  // Convierte en el servidor las fotos que el navegador no puede leer (HEIC/HEIF, gigantes)
  normalizeImage: async (file: File): Promise<string> => {
    const base64 = await fileToBase64(file);
    const response = await fetch('/api/images/normalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData: base64, mimeType: file.type, fileName: file.name })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'No se pudo procesar la imagen');
    }
    const data = await response.json();
    return data.imageData;
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
export const resizeImage = (file: File, maxSide = 900): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    // 1) Camino rápido: el navegador decodifica a tamaño reducido (evita colgarse con fotos de 100+ MP)
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file, { resizeWidth: maxSide, resizeQuality: 'medium' });

        // Si el lado vertical sigue siendo enorme (foto vertical), re-escalamos
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Sin canvas 2d');
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        if ('close' in bitmap) (bitmap as ImageBitmap).close();

        resolve(canvas.toDataURL('image/jpeg', 0.72));
        return;
      } catch (e) {
        // Formatos que el navegador no sabe leer (HEIC de Samsung/iPhone): seguimos al fallback
        console.warn('createImageBitmap falló, probando <img>', e);
      }
    }

    // 2) Fallback clásico con <img>, con timeout para no quedar colgado
    let objectUrl: string | null = null;
    let timer: number | undefined;
    const limpiar = () => {
      if (timer) window.clearTimeout(timer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    try {
      objectUrl = URL.createObjectURL(file);
      const img = new Image();

      timer = window.setTimeout(() => {
        limpiar();
        reject(new Error('timeout al leer la imagen'));
      }, 20000);

      img.onload = () => {
        try {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Sin canvas 2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          limpiar();
          resolve(dataUrl);
        } catch (err) {
          limpiar();
          reject(err);
        }
      };

      img.onerror = () => {
        limpiar();
        reject(new Error('el navegador no puede decodificar esta imagen'));
      };

      img.src = objectUrl;
    } catch (err) {
      limpiar();
      reject(err);
    }
  });
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('no se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
