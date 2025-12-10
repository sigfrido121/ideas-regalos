export interface User {
  id: string;
  name: string;
  avatar: string; // Emoji or URL
  color: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: number;
}

export interface Gift {
  id: string;
  userId: string;
  imageData: string; // Base64
  title: string;
  description: string;
  comments: Comment[];
  createdAt: number;
}

export const USERS: User[] = [
  { id: 'u1', name: 'Alex', avatar: '🎅', color: 'bg-red-600' },
  { id: 'u2', name: 'Paola', avatar: '🤶', color: 'bg-red-500' },
  { id: 'u3', name: 'Yerko', avatar: '⛄', color: 'bg-green-600' },
  { id: 'u4', name: 'Vero', avatar: '🦌', color: 'bg-green-500' },
  { id: 'u5', name: 'Raúl', avatar: '🍪', color: 'bg-amber-600' },
  { id: 'u6', name: 'Andrea', avatar: '🧣', color: 'bg-amber-500' },
  { id: 'u7', name: 'Angelica', avatar: '🍪', color: 'bg-amber-600' },
];