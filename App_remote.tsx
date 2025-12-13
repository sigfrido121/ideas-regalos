import React, { useState, useEffect } from 'react';
import { User, Gift } from './types';
import { api, resizeImage } from './services/mockBackend';
import { analyzeGiftImage } from './services/geminiService';

// --- Icons ---
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);
const GiftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" /></svg>
);
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
);
const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={filled ? "text-red-500" : "text-slate-400"}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);

const AVATAR_OPTIONS = [
  '🎅', '🤶', '⛄', '🦌', '🍪', '🧣', '👴', '👵', '👶', '🧒', '👧', '🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦄', '🐲', '👽', '🤖', '💩', '🤡', '👻', '💀', '🎃', '🤠', '😎', '🤓', '🥳', '🤯', '🤪', '🤬', '🤢', '🤮'
];

// --- Sub-components ---

const EditableDescription: React.FC<{
  initialValue: string;
  onSave: (val: string) => void;
}> = ({ initialValue, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  const handleBlur = () => {
    setIsEditing(false);
    if (value.trim() !== initialValue) {
      onSave(value);
    }
  }

  if (isEditing) {
    return (
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        className="w-full bg-transparent text-slate-600 text-sm mb-4 border-none focus:ring-0 p-0 resize-none"
        style={{ height: 'auto', minHeight: '60px' }}
      />
    )
  }

  return (
    <p
      onClick={() => setIsEditing(true)}
      className="text-slate-600 text-sm mb-4 cursor-text border border-transparent hover:border-slate-200 rounded p-0.5 -m-0.5 transition-colors"
      title="Toca para editar descripción"
    >
      {value || <span className="text-slate-400 italic">Sin descripción...</span>}
    </p>
  )
}

const EditableTitle: React.FC<{
  initialValue: string;
  onSave: (val: string) => void;
}> = ({ initialValue, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  const handleBlur = () => {
    setIsEditing(false);
    if (value.trim() !== initialValue && value.trim()) {
      onSave(value);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    }
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent font-bold text-xl text-slate-800 leading-tight border-none focus:ring-0 p-0"
      />
    )
  }

  return (
    <h3
      onClick={() => setIsEditing(true)}
      className="font-bold text-xl text-slate-800 leading-tight cursor-text border border-transparent hover:border-slate-200 rounded p-0.5 -m-0.5 transition-colors"
      title="Toca para editar título"
    >
      {value}
    </h3>
  )
}

const ImageGalleryModal: React.FC<{
  gifts: Gift[];
  initialIndex: number;
  onClose: () => void;
}> = ({ gifts, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % gifts.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + gifts.length) % gifts.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gifts.length]);

  const currentGift = gifts[currentIndex];

  if (!currentGift) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-[70] flex flex-col justify-center items-center backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-white z-50 bg-gradient-to-b from-black/50 to-transparent">
        <span className="text-sm font-medium">{currentIndex + 1} / {gifts.length}</span>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Navigation Buttons (Desktop) */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/95 hover:text-white hover:bg-white/10 rounded-full transition-all hidden md:block z-50"
      >
        <svg className="w-10 h-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/95 hover:text-white hover:bg-white/10 rounded-full transition-all hidden md:block z-50"
      >
        <svg className="w-10 h-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>

      {/* Image Container */}
      <div
        className="w-full h-full flex flex-col justify-center p-4 md:p-10 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-h-[85vh] w-full flex items-center justify-center">
          <img
            src={currentGift.imageData.startsWith('data:') ? currentGift.imageData : `data:image/jpeg;base64,${currentGift.imageData}`}
            alt={currentGift.title}
            className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
            onTouchEnd={(e) => {
              // Very basic swipe detection could go here, but click-to-nav overlay is safer for now
            }}
          />

          {/* Mobile Navigation Zones (Overlay) */}
          <div className="absolute inset-y-0 left-0 w-1/3 md:hidden" onClick={handlePrev}></div>
          <div className="absolute inset-y-0 right-0 w-1/3 md:hidden" onClick={handleNext}></div>
        </div>

        {/* Caption */}
        <div className="mt-4 text-center max-w-2xl mx-auto">
          <h2 className="text-white text-xl font-bold font-festive">{currentGift.title}</h2>
          <p className="text-white/80 text-sm line-clamp-2 md:line-clamp-none mt-1">{currentGift.description}</p>
        </div>
      </div>
    </div>
  );
};

const EditUserModal: React.FC<{
  user: User;
  onClose: () => void;
  onSave: (name: string, avatar: string) => Promise<void>;
}> = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(name, avatar);
    setIsSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <h3 className="text-xl font-bold text-slate-800 mb-4">{user.id === 'new' ? 'Crear Usuario' : 'Editar Perfil'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col flex-1 overflow-hidden">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xmas-green"
              required
            />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <label className="block text-sm font-medium text-slate-700 mb-2">Avatar</label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 pb-2">
              {AVATAR_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg border-2 transition-all ${avatar === emoji ? 'border-xmas-green bg-green-50 scale-110' : 'border-transparent hover:bg-slate-100'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-2 bg-xmas-green text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const GiftCard: React.FC<{
  gift: Gift;
  currentUser: User;
  onDelete: (id: string) => void;
  onCommentAdded: () => void;
  onInteract: (id: string, action: 'like' | 'dislike') => void;
  onUpdate: (id: string, updates: Partial<Gift>) => void;
  onImageClick: () => void;
  users: User[];
}> = ({ gift, currentUser, onDelete, onCommentAdded, onInteract, onUpdate, onImageClick, users }) => {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const likeCount = gift.likes || 0;
  const dislikeCount = gift.dislikes || 0;

  // Assuming gift.userInteractions is an array of { userId: string, type: 'like' | 'dislike' }
  // If the backend now sends direct counts, the `isLiked` and `isDisliked` logic would need to be updated
  // to reflect how the current user's interaction is tracked, e.g., via a separate property on the gift.
  // For now, keeping the original logic for `isLiked` and `isDisliked` as it was not part of the requested change.
  const likesArray = Array.isArray(gift.likes) ? gift.likes : []; // Fallback for `isLiked`
  const dislikesArray = Array.isArray(gift.dislikes) ? gift.dislikes : []; // Fallback for `isDisliked`

  const isLiked = likesArray.includes(currentUser.id);
  const isDisliked = dislikesArray.includes(currentUser.id);

  const netScore = likeCount - dislikeCount;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await api.addComment(gift.id, currentUser.id, commentText);
      setCommentText("");
      onCommentAdded();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserDetails = (userId: string) => users.find(u => u.id === userId);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition-shadow duration-300 border border-slate-100">
      <div
        className="relative aspect-square overflow-hidden bg-slate-100 group cursor-zoom-in"
        onClick={onImageClick}
      >
        <img
          src={gift.imageData.startsWith('data:') ? gift.imageData : `data:image/jpeg;base64,${gift.imageData}`}
          alt={gift.title}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="text-white text-sm font-medium">Ver en grande</span>
        </div>
        {/* Heart badge (Net Score) */}
        <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm">
          <HeartIcon filled={netScore > 0} />
          <span className={`text-xs font-bold ${netScore > 0 ? 'text-red-600' : 'text-slate-600'}`}>{netScore > 0 ? `+${netScore}` : netScore}</span>
        </div>
      </div>

      <div className="p-5 flex flex-col border-b border-slate-100">
        <div className="flex justify-between items-start mb-2">
          <EditableTitle
            initialValue={gift.title}
            onSave={(val) => onUpdate(gift.id, { title: val })}
          />
          <button
            onClick={() => onDelete(gift.id)}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 ml-2"
            title="Eliminar regalo"
          >
            <TrashIcon />
          </button>
        </div>

        {/* Editable Description */}
        <EditableDescription
          initialValue={gift.description}
          onSave={(val) => onUpdate(gift.id, { description: val })}
        />

        {/* Actions Bar (Like/Dislike) */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center bg-slate-100 rounded-full p-1">
            <button
              onClick={() => onInteract(gift.id, 'like')}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors text-slate-600 hover:bg-white hover:text-green-600 hover:shadow-sm active:scale-95"
            >
              <span>👍</span>
              <span>{likeCount}</span>
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button
              onClick={() => onInteract(gift.id, 'dislike')}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors text-slate-600 hover:bg-white hover:text-red-600 hover:shadow-sm active:scale-95"
            >
              <span>👎</span>
              <span>{dislikeCount}</span>
            </button>
          </div>
          <div className="text-xs text-slate-400 ml-auto">
            {new Date(gift.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-slate-50 p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <MessageIcon />
          Comentarios ({(gift.comments || []).length})
        </div>

        <div className="flex-1 space-y-3 max-h-48 overflow-y-auto pr-1">
          {(gift.comments || []).length === 0 ? (
            <p className="text-slate-400 text-xs italic text-center py-2">Sé el primero en comentar</p>
          ) : (
            (gift.comments || []).map((comment, idx) => {
              const author = getUserDetails(comment.userId);
              return (
                <div key={idx} className="flex gap-2 items-start">
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${author?.color || 'bg-gray-400'} border border-white shadow-sm`}>
                    {author?.avatar || '?'}
                  </div>
                  <div className="bg-white p-2 rounded-r-lg rounded-bl-lg shadow-sm text-sm border border-slate-100 flex-1">
                    <span className="font-bold text-slate-700 block text-xs">{author?.name || 'Desconocido'}</span>
                    <span className="text-slate-600">{comment.text}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmitComment} className="mt-auto relative">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Escribe un comentario..."
            className="w-full pl-3 pr-10 py-2 rounded-full border border-slate-200 text-sm focus:outline-none focus:border-xmas-green focus:ring-1 focus:ring-xmas-green transition-all"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-xmas-green text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const data = await api.getUsers();
    setUsers(data);
  };

  // Load gifts when a user is selected
  useEffect(() => {
    if (selectedUser) {
      loadGifts(selectedUser.id);
    }
  }, [selectedUser]);

  const loadGifts = async (userId: string) => {
    if (gifts.length === 0) setIsLoading(true);
    const data = await api.getGiftsByUser(userId);

    // Sort by hearts (likes - dislikes) descending
    data.sort((a, b) => {
      const scoreA = (a.likes || 0) - (a.dislikes || 0);
      const scoreB = (b.likes || 0) - (b.dislikes || 0);
      return scoreB - scoreA;
    });

    setGifts(data);
    setIsLoading(false);
  };

  const handleUpdateUser = async (name: string, avatar: string) => {
    if (!selectedUser) return;
    try {
      const updated = await api.updateUser(selectedUser.id, name, avatar);
      setSelectedUser(updated);
      await fetchUsers();
    } catch (e) {
      console.error(e);
      alert("Error al actualizar perfil");
    }
  }

  const handleUpdateGift = async (giftId: string, updates: Partial<Gift>) => {
    try {
      await api.updateGift(giftId, updates);
      if (selectedUser) loadGifts(selectedUser.id);
    } catch (e) {
      console.error(e);
    }
  }



  const handleCreateUser = async (name: string, avatar: string) => {
    try {
      await api.createUser(name, avatar);
      await fetchUsers();
      setIsCreatingUser(false);
    } catch (e) {
      console.error(e);
      alert("Error al crear usuario");
    }
  }

  const handleInteract = async (giftId: string, action: 'like' | 'dislike') => {
    if (!selectedUser) return;
    try {
      await api.interact(giftId, selectedUser.id, action);
      // Refresh gifts to show new counts
      loadGifts(selectedUser.id);
    } catch (e) {
      console.error(e);
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = event.target.files;
    console.log('handleFileUpload called', inputFiles);

    if (!inputFiles || inputFiles.length === 0 || !selectedUser) {
      console.log('No files or no user', { files: inputFiles, selectedUser });
      return;
    }

    // CRITICAL FIX: Create a static copy of the files BEFORE clearing the input
    // because event.target.files is a live reference that empties when value is cleared.
    const files = Array.from(inputFiles);

    setIsUploading(true);
    // Reset value to allow uploading same file again
    event.target.value = '';

    try {
      console.log('Processing files (static copy):', files.length);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          console.log(`Processing file ${i}:`, file.name);
          // 1. Resize/Compress Image on client side
          const resizedImage = await resizeImage(file);
          console.log(`Resized image ${i}, length:`, resizedImage.length);

          // 2. Send to backend with placeholder text (user can edit manually)
          console.log(`Uploading file ${i} to backend...`);
          await api.createGift(selectedUser.id, resizedImage, "Nuevo Regalo", "Toca para editar la descripción");
          console.log(`File ${i} uploaded successfully`);
        } catch (err) {
          console.error(`Error uploading file ${i}:`, err);
        }
      }

      // 3. Refresh list after all uploads or partial uploads
      console.log('Refreshing gift list...');
      await loadGifts(selectedUser.id);
      console.log('Gift list refreshed');
    } catch (error) {
      console.error("Batch upload failed", error);
      alert("Error al subir las imágenes.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (giftId: string) => {
    if (!window.confirm("¿Seguro que quieres borrar este regalo?")) return;
    await api.deleteGift(giftId);
    if (selectedUser) loadGifts(selectedUser.id);
  }

  // --- Views ---

  const LandingPage = () => (
    <div className="min-h-screen bg-xmas-red flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Snowflakes decoration */}
      <div className="absolute top-10 left-10 w-4 h-4 bg-white rounded-full opacity-50 animate-bounce"></div>
      <div className="absolute top-20 right-20 w-3 h-3 bg-white rounded-full opacity-60 animate-pulse"></div>
      <div className="absolute bottom-10 left-1/4 w-2 h-2 bg-white rounded-full opacity-40"></div>

      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl max-w-4xl w-full border-4 border-xmas-gold text-center">
        <h1 className="font-festive text-5xl md:text-6xl text-xmas-red mb-2 drop-shadow-sm">
          Lista de Deseos
        </h1>
        <p className="text-gray-600 mb-8 font-festive text-2xl">¿Quién eres tú?</p>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-6">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="group flex flex-col items-center p-2 rounded-xl transition-all duration-300 hover:bg-xmas-cream/50 active:scale-95"
            >
              <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full ${user.color} flex items-center justify-center text-3xl md:text-5xl shadow-md mb-2 border-2 md:border-4 border-white group-hover:shadow-lg transition-transform group-hover:scale-110`}>
                {user.avatar}
              </div>
              <span className="font-bold text-xs md:text-lg text-slate-700 text-center leading-tight break-words w-full px-1">{user.name}</span>
            </button>
          ))}
          {/* Add User Button */}
          <button
            onClick={() => setIsCreatingUser(true)}
            className="group flex flex-col items-center p-2 rounded-xl transition-all duration-300 hover:bg-slate-100 active:scale-95 opacity-60 hover:opacity-100"
          >
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-slate-100 flex items-center justify-center text-3xl md:text-5xl shadow-sm mb-2 border-2 md:border-4 border-dashed border-slate-300 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-500 transition-colors">
              +
            </div>
            <span className="font-medium text-xs md:text-lg text-slate-500 text-center">Nuevo</span>
          </button>
        </div>

        {isCreatingUser && (
          <EditUserModal
            user={{ id: 'new', name: '', avatar: '🙂', color: 'bg-gray-200' }}
            onClose={() => setIsCreatingUser(false)}
            onSave={handleCreateUser}
          />
        )}
      </div>
      <p className="text-white/80 mt-8 font-festive text-xl">🎄 Feliz Navidad y Próspero Año Nuevo 🎄</p>
    </div>
  );

  const DashboardPage = () => {
    if (!selectedUser) return null;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {isEditingUser && (
          <EditUserModal
            user={selectedUser}
            onClose={() => setIsEditingUser(false)}
            onSave={handleUpdateUser}
          />
        )}
        <header className="bg-xmas-green text-white p-4 shadow-lg sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setSelectedUser(null)}
              className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              <BackIcon />
              <span className="font-semibold hidden sm:inline">Cambiar Usuario</span>
            </button>
            <div className="flex items-center gap-3">
              <span className="font-festive text-2xl">Deseos de {selectedUser.name}</span>
              <button
                onClick={() => setIsEditingUser(true)}
                className={`w-10 h-10 rounded-full ${selectedUser.color} flex items-center justify-center text-xl border-2 border-white hover:opacity-90 hover:scale-105 transition-transform cursor-pointer`}
                title="Toca para editar tu perfil"
              >
                {selectedUser.avatar}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
          <section className="mb-12">
            <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-dashed border-xmas-gold hover:border-xmas-red transition-colors text-center relative overflow-hidden group">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="gift-upload"
                disabled={isUploading}
              />
              <label htmlFor="gift-upload" className="cursor-pointer block">
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-xmas-red"></div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-800">
                          Subiendo imágenes...
                        </h3>
                        <p className="text-slate-500">Por favor espera un momento</p>
                      </div>
                    </>
                  ) : (
                    <div className={`bg-xmas-cream p-4 rounded-full text-xmas-red group-hover:scale-110 transition-transform duration-300`}>
                      <CameraIcon />
                    </div>
                  )}
                  <div className="space-y-1">
                    {!isUploading && (
                      <>
                        <h3 className="text-xl font-bold text-slate-800">
                          Sube una foto de tu deseo
                        </h3>
                        <p className="text-slate-500">Toca aquí para agregar algo a tu lista</p>
                      </>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </section>

          <section>
            <h2 className="font-festive text-4xl text-xmas-red mb-6 flex items-center gap-3 border-b pb-4 border-slate-200">
              <GiftIcon />
              Mi Lista ({gifts.length})
            </h2>

            {isLoading && gifts.length === 0 ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-xmas-green border-t-transparent"></div>
              </div>
            ) : (
              /* Gifts List */
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-6 mt-8">
                {gifts.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-400">
                    <p className="font-festive text-2xl mb-2">¡Aún no hay deseos!</p>
                    <p className="text-sm">Sube la primera foto para empezar la lista.</p>
                  </div>
                ) : (
                  gifts.map((gift, index) => (
                    <GiftCard
                      key={gift.id}
                      gift={gift}
                      currentUser={selectedUser}
                      onDelete={handleDelete}
                      onCommentAdded={() => loadGifts(selectedUser.id)}
                      onInteract={handleInteract}
                      onUpdate={handleUpdateGift}
                      onImageClick={() => setSelectedImageIndex(index)}
                      users={users}
                    />
                  ))
                )}
              </div>
            )}
          </section>
        </main>

        {selectedImageIndex !== null && (
          <ImageGalleryModal
            gifts={gifts}
            initialIndex={selectedImageIndex}
            onClose={() => setSelectedImageIndex(null)}
          />
        )}
      </div>
    );
  };

  return selectedUser ? <DashboardPage /> : <LandingPage />;
};

export default App;