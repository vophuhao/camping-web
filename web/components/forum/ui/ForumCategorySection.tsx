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
    <section className="forum-category-section">
      <h3 className="forum-category-title">📚 Danh mục chủ đề</h3>
      <div className="forum-category-list">
        {categories.length === 0 ? (
          <div className="forum-category-empty">Chưa có chủ đề nào.</div>
        ) : (
          categories.map(cat => (
            <div
              className={`forum-category-item${selectedCategories.includes(cat.id) ? ' selected' : ''}`}
              key={cat.id}
              style={{ background: cat.color || '#e0e7ff', cursor: onCategoryClick ? 'pointer' : undefined }}
              onClick={onCategoryClick ? () => onCategoryClick(cat.id) : undefined}
            >
              <span className="forum-category-name">{cat.name}</span>
              <span className="forum-category-count">({cat.count})</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default ForumCategorySection; 