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
    <div className="forum-filters-bar">
      {/* Sort filter */}
      {sortOptions.map(opt => (
        <button
          key={opt.id}
          className={`forum-filter-chip${selectedSort === opt.id ? ' active' : ''}`}
          onClick={() => onSortChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default ForumFilters; 