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
  likes?: number;
  dislikes?: number;
  createdAt: number;
}