import React from 'react';
import { FiPlus } from 'react-icons/fi';
import '../style/ForumPostCreateBar.css';

interface ForumPostCreateBarProps {
  onCreate: () => void;
  avatarUrl?: string;
}

const ForumPostCreateBar: React.FC<ForumPostCreateBarProps> = ({ onCreate, avatarUrl }) => (
  <div className="flex items-center gap-4 w-full bg-card rounded-2xl border border-border p-4 shadow-sm">
    {avatarUrl ? (
      <img 
        src={avatarUrl} 
        alt="avatar" 
        className="h-10 w-10 rounded-full object-cover border border-border" 
        width={40} 
        height={40} 
      />
    ) : (
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
        C
      </div>
    )}
    <div className="relative flex-1 flex items-center">
      <input
        className="w-full cursor-pointer rounded-xl border border-border bg-muted/50 px-4 py-2.5 pr-28 text-sm outline-none transition-all duration-200 hover:bg-muted focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
        placeholder="Bạn muốn chia sẻ gì?"
        onFocus={onCreate}
        readOnly
      />
      <button 
        className="absolute right-1.5 cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary/95 transition-all duration-200 hover:scale-102"
        onClick={onCreate} 
        tabIndex={-1} 
        type="button"
      >
        <FiPlus className="h-3.5 w-3.5" /> 
        <span className="hidden sm:inline">Đăng bài</span>
      </button>
    </div>
  </div>
);

export default ForumPostCreateBar; 