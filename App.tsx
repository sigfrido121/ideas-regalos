import React, { useState, useEffect } from 'react';
import { User, Gift, USERS } from './types';
import { api, resizeImage } from './services/mockBackend';
import { analyzeGiftImage } from './services/geminiService';

// --- Icons ---
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);
const GiftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>
);
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);
const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);

// --- Sub-components ---

const GiftCard: React.FC<{
  gift: Gift;
  currentUser: User;
  onDelete: (id: string) => void;
  onCommentAdded: () => void;
  users: User[];
}> = ({ gift, currentUser, onDelete, onCommentAdded, users }) => {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <div className="relative aspect-square overflow-hidden bg-slate-100 group">
        <img 
          src={gift.imageData} 
          alt={gift.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="text-white text-sm font-medium">Agregado recientemente</span>
        </div>
      </div>
      
      <div className="p-5 flex flex-col border-b border-slate-100">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-xl text-slate-800 leading-tight">{gift.title}</h3>
          <button 
              onClick={() => onDelete(gift.id)}
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
              title="Eliminar regalo"
          >
              <TrashIcon />
          </button>
        </div>
        <p className="text-slate-600 text-sm mb-2">{gift.description}</p>
        <div className="text-xs text-slate-400">
           {new Date(gift.createdAt).toLocaleDateString()}
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
  const [users, setUsers] = useState<User[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Load users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      const data = await api.getUsers();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  // Load gifts when a user is selected
  useEffect(() => {
    if (selectedUser) {
      loadGifts(selectedUser.id);
    }
  }, [selectedUser]);

  const loadGifts = async (userId: string) => {
    // Only set loading on initial fetch to avoid flickering when commenting
    if (gifts.length === 0) setIsLoading(true);
    const data = await api.getGiftsByUser(userId);
    setGifts(data);
    setIsLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !selectedUser) return;

    setIsUploading(true);
    const file = event.target.files[0];

    try {
      // 1. Resize/Convert image
      const base64Image = await resizeImage(file);

      // 2. Analyze with Gemini
      const analysis = await analyzeGiftImage(base64Image);

      // 3. Save to "Database"
      await api.createGift(selectedUser.id, base64Image, analysis.title, analysis.description);

      // 4. Refresh List
      await loadGifts(selectedUser.id);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Hubo un error al subir la imagen.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (giftId: string) => {
      if(!window.confirm("¿Seguro que quieres borrar este regalo?")) return;
      await api.deleteGift(giftId);
      if(selectedUser) loadGifts(selectedUser.id);
  }

  // --- Views ---

  const LandingPage = () => (
    <div className="min-h-screen bg-xmas-red flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Snowflakes decoration (simple dots) */}
        <div className="absolute top-10 left-10 w-4 h-4 bg-white rounded-full opacity-50 animate-bounce"></div>
        <div className="absolute top-20 right-20 w-3 h-3 bg-white rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute bottom-10 left-1/4 w-2 h-2 bg-white rounded-full opacity-40"></div>

      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl max-w-4xl w-full border-4 border-xmas-gold text-center">
        <h1 className="font-festive text-5xl md:text-6xl text-xmas-red mb-2 drop-shadow-sm">
          Lista de Deseos
        </h1>
        <p className="text-gray-600 mb-8 font-festive text-2xl">¿Quién eres tú?</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="group flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:bg-xmas-cream hover:scale-105 border-2 border-transparent hover:border-xmas-green/20"
            >
              <div className={`w-24 h-24 rounded-full ${user.color} flex items-center justify-center text-5xl shadow-lg mb-4 border-4 border-white group-hover:shadow-xl transition-shadow`}>
                {user.avatar}
              </div>
              <span className="font-bold text-lg text-slate-700 group-hover:text-xmas-green">{user.name}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-white/80 mt-8 font-festive text-xl">🎄 Feliz Navidad y Próspero Año Nuevo 🎄</p>
    </div>
  );

  const DashboardPage = () => {
    if (!selectedUser) return null;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
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
              <div className={`w-10 h-10 rounded-full ${selectedUser.color} flex items-center justify-center text-xl border-2 border-white`}>
                {selectedUser.avatar}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
          
          {/* Upload Section */}
          <section className="mb-12">
            <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-dashed border-xmas-gold hover:border-xmas-red transition-colors text-center relative overflow-hidden group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-xmas-red"></div>
                ) : (
                  <div className={`bg-xmas-cream p-4 rounded-full text-xmas-red group-hover:scale-110 transition-transform duration-300`}>
                    <CameraIcon />
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-800">
                    {isUploading ? "Analizando regalo con IA..." : "Sube una foto de tu deseo"}
                  </h3>
                  <p className="text-slate-500">Toca aquí para agregar algo a tu lista</p>
                </div>
              </div>
            </div>
          </section>

          {/* Gallery */}
          <section>
             <h2 className="font-festive text-4xl text-xmas-red mb-6 flex items-center gap-3 border-b pb-4 border-slate-200">
                <GiftIcon />
                Mi Lista ({gifts.length})
             </h2>
             
            {isLoading && gifts.length === 0 ? (
               <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-xmas-green border-t-transparent"></div>
               </div>
            ) : gifts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="text-2xl font-bold text-slate-700 mb-2">Aún no hay regalos</h3>
                <p className="text-slate-500">¡Sube tu primera foto para empezar la magia!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {gifts.map((gift) => (
                  <GiftCard 
                    key={gift.id} 
                    gift={gift} 
                    currentUser={selectedUser} 
                    onDelete={handleDelete}
                    onCommentAdded={() => loadGifts(selectedUser.id)}
                    users={users}
                  />
                ))}
              </div>
            )}
          </section>

        </main>
      </div>
    );
  };

  return selectedUser ? <DashboardPage /> : <LandingPage />;
};

export default App;