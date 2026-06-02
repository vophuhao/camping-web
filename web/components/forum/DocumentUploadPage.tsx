import { useState } from 'react';
import '../../styles/pages/documents/DocumentUploadPage.css';

const DocumentUpload = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(files);
      setImagePreviews(files.map(file => URL.createObjectURL(file)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!title.trim() || !description.trim() || !subject) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (images.length === 0) {
      setError('Vui lòng chọn ít nhất một ảnh.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('subject', subject);
      images.forEach(img => formData.append('images', img));
      // API call removed - this is a placeholder component
      setSuccess('Đăng tài liệu thành công!');
      setTitle('');
      setDescription('');
      setSubject('');
      setImages([]);
      setImagePreviews([]);
    } catch {
      setError('Đăng tài liệu thất bại.');
    }
    setLoading(false);
  };

  return (
    <div className="document-upload-container">
      <h2>Đăng tài liệu mới</h2>
      <form className="document-upload-form" onSubmit={handleSubmit}>
        <label>Tiêu đề
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
        </label>
        <label>Mô tả
          <textarea value={description} onChange={e => setDescription(e.target.value)} required />
        </label>
        <label>Chủ đề
          <select value={subject} onChange={e => setSubject(e.target.value)} required>
            <option value="">Chọn chủ đề</option>
            <option value="camping-experience">Kinh nghiệm cắm trại</option>
            <option value="camping-gear">Đồ dùng dã ngoại</option>
            <option value="beautiful-places">Địa điểm đẹp</option>
            <option value="outdoor-cuisine">Ẩm thực ngoài trời</option>
            <option value="trip-sharing">Chia sẻ hành trình</option>
            <option value="qna-support">Hỏi đáp & Hỗ trợ</option>
            <option value="other">Khác</option>
          </select>
        </label>
        <label>Ảnh tài liệu (có thể chọn nhiều)
          <input type="file" accept="image/*" multiple onChange={handleImageChange} />
        </label>
        {imagePreviews.length > 0 && (
          <div className="image-preview-list">
            {imagePreviews.map(src => (
              <img key={src} src={src} alt={`preview-${src}`} className="image-preview" />
            ))}
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Đang đăng...' : 'Đăng tài liệu'}</button>
      </form>
    </div>
  );
};

export default DocumentUpload;