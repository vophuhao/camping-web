/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
// import { reportApi } from '../../services/api/report';
import { toast } from 'react-toastify';
import '../style/ReportButton.css';

interface ReportButtonProps {
  itemId: string;
  itemType: 'document' | 'post' | 'comment' | 'user';
  onReported?: () => void;
}

const ReportButton: React.FC<ReportButtonProps> = ({ itemId, itemType, onReported }) => {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    { value: 'spam', label: 'Spam' },
    { value: 'inappropriate_content', label: 'Nội dung không phù hợp' },
    { value: 'harassment', label: 'Quấy rối' },
    { value: 'fake_information', label: 'Thông tin sai sự thật' },
    { value: 'copyright_violation', label: 'Vi phạm bản quyền' },
    { value: 'other', label: 'Khác' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    try {
      setSubmitting(true);
      // await reportApi.createReport({
      //   reportedItemId: itemId,
      //   reportedItemType: itemType,
      //   reason,
      //   description
      // });
      
      setShowModal(false);
      setReason('');
      setDescription('');
      onReported?.();
      toast.success('Báo cáo đã được gửi thành công!');
    } catch (error: any) {
      console.error('Error reporting:', error);
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi gửi báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button 
        className="report-button"
        onClick={() => setShowModal(true)}
        title="Báo cáo nội dung này"
      >
        <Flag size={16} />
        Báo cáo
      </button>

      {showModal && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <div className="report-modal-header">
              <h3>Báo cáo nội dung</h3>
              <button 
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="report-form">
              <div className="form-group">
                <label>Lý do báo cáo *</label>
                <select 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                >
                  <option value="">Chọn lý do báo cáo</option>
                  {reasons.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Mô tả chi tiết (tùy chọn)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả thêm về vấn đề bạn gặp phải..."
                  rows={4}
                  maxLength={500}
                />
                <div className="char-count">
                  {description.length}/500
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="submit-button"
                  disabled={!reason || submitting}
                >
                  {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportButton;