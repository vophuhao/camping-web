import React from 'react';
import '../style/DocumentFilters.css';

interface ForumFiltersProps {
  sortOptions: { id: string; label: string }[];
  selectedSort: string;
  onSortChange: (id: string) => void;
}

const ForumFilters: React.FC<ForumFiltersProps> = ({
  sortOptions,
  selectedSort,
  onSortChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {sortOptions.map(opt => {
        const isActive = selectedSort === opt.id;
        return (
          <button
            key={opt.id}
            className={`cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
              isActive
                ? 'bg-primary text-white shadow-xs scale-102'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
            onClick={() => onSortChange(opt.id)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default ForumFilters; 