import React from 'react';
import { FiPlus } from 'react-icons/fi';
import '../style/ForumPostCreateBar.css';

interface ForumPostCreateBarProps {
  onCreate: () => void;
  avatarUrl?: string;
}

const ForumPostCreateBar: React.FC<ForumPostCreateBarProps> = ({ onCreate, avatarUrl }) => (
  <div className="forum-post-create-bar-ui">
    {avatarUrl && <img src={avatarUrl} alt="avatar" className="forum-create-avatar" width={40} height={40} style={{ objectFit: 'cover' }} />}
    <div className="forum-create-input-wrapper">
      <input
        className="forum-create-input"
        placeholder="Bạn muốn chia sẻ gì?"
        onFocus={onCreate}
        readOnly
      />
      <button className="forum-create-btn-inside" onClick={onCreate} tabIndex={-1} type="button">
        <FiPlus /> <span>Đăng bài</span>
      </button>
    </div>
  </div>
);

export default ForumPostCreateBar; 