import React from 'react';

type PreviewModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  summary: string;
  coverUrl?: string;
  topics?: string[];
  tags?: string[];
  contentHtml: string;
};

const PreviewModal: React.FC<PreviewModalProps> = ({ open, onClose, title, summary, coverUrl, topics = [], tags = [], contentHtml }) => {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3 className="dialog-title">Xem trước bài viết</h3>
          <button className="dialog-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <div className="dialog-body">
          {coverUrl && (
            <img src={coverUrl} alt="Cover" style={{ width: '100%', borderRadius: 12, marginBottom: 12 }} />
          )}
          <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 6 }}>{title || 'Tiêu đề bài viết'}</div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>{summary || 'Mô tả ngắn gọn hiển thị ở đây.'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {topics.map((t, i) => (
              <span key={`topic-${i}`} className="modern-preview-topic">{t}</span>
            ))}
            {tags.map((t, i) => (
              <span key={`tag-${i}`} className="modern-preview-topic">#{t}</span>
            ))}
          </div>
          <div className="modern-preview-body" dangerouslySetInnerHTML={{ __html: contentHtml || '<p>Nội dung bài viết sẽ hiển thị ở đây.</p>' }} />
        </div>
        <div className="dialog-footer">
          <button className="modern-preview-btn" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;