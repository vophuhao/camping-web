/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Flag, X, AlertCircle } from 'lucide-react';
import { createReport } from '@/lib/reportApi';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import '../style/ReportButton.css';

interface ReportButtonProps {
  itemId: string;
  itemType: 'post' | 'free-spot' | 'comment' | 'user';
  onReported?: () => void;
  className?: string;
}

const REASONS = [
  { value: 'spam', label: '🚫 Spam / Quảng cáo' },
  { value: 'inappropriate_content', label: '⚠️ Nội dung không phù hợp' },
  { value: 'harassment', label: '😡 Quấy rối / Xúc phạm' },
  { value: 'fake_information', label: '❌ Thông tin sai sự thật' },
  { value: 'copyright_violation', label: '©️ Vi phạm bản quyền' },
  { value: 'other', label: '💬 Khác' },
];

const ReportButton: React.FC<ReportButtonProps> = ({ itemId, itemType, onReported, className }) => {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const handleOpen = () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để báo cáo nội dung');
      return;
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    // Only support post and free-spot for now
    const validTypes = ['post', 'free-spot'];
    if (!validTypes.includes(itemType)) {
      toast.error('Loại nội dung này chưa được hỗ trợ báo cáo');
      return;
    }

    try {
      setSubmitting(true);
      await createReport({
        targetId: itemId,
        targetType: itemType as 'post' | 'free-spot',
        reason,
        description: description.trim() || undefined,
      });

      setShowModal(false);
      setReason('');
      setDescription('');
      onReported?.();
      toast.success('✅ Báo cáo đã được gửi thành công! Chúng tôi sẽ xem xét sớm nhất.');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi gửi báo cáo';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        className={`report-button ${className || ''}`}
        onClick={handleOpen}
        title="Báo cáo nội dung vi phạm"
      >
        <Flag size={14} />
        Báo cáo
      </button>

      {showModal && (
        <div className="report-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="report-modal">
            <div className="report-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={20} color="#ef4444" />
                <h3>Báo cáo vi phạm</h3>
              </div>
              <button
                className="close-button"
                onClick={() => setShowModal(false)}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="report-form">
              <div className="form-group">
                <label className="form-label-title">Lý do báo cáo <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="reason-options-group">
                  {REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`reason-option-label ${reason === r.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="reason-radio-input"
                      />
                      <span className="reason-label-text">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label-title">Mô tả chi tiết <span style={{ color: '#9ca3af', fontSize: 12 }}>(tùy chọn)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả thêm về vấn đề bạn gặp phải..."
                  rows={3}
                  maxLength={500}
                  className="report-textarea"
                />
                <div className="char-count">
                  {description.length}/500
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: 16 }}>
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