import React from 'react';
import '../style/ForumCategorySection.css';

interface Category {
  id: string;
  name: string;
  color?: string;
  count: number;
}

interface ForumCategorySectionProps {
  categories: Category[];
  onCategoryClick?: (id: string) => void;
  selectedCategories?: string[];
}

const ForumCategorySection: React.FC<ForumCategorySectionProps> = ({ categories, onCategoryClick, selectedCategories = [] }) => {
  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-extrabold text-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
        📚 Danh mục chủ đề
      </h3>
      <div className="flex flex-col gap-1.5">
        {categories.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">Chưa có chủ đề nào.</div>
        ) : (
          categories.map(cat => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <button
                type="button"
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 w-full text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 outline-hidden ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-muted/40 text-foreground hover:bg-muted'
                }`}
                key={cat.id}
                onClick={onCategoryClick ? () => onCategoryClick(cat.id) : undefined}
              >
                <span className="truncate pr-2">{cat.name}</span>
                <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                  ({cat.count})
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
};

export default ForumCategorySection; 