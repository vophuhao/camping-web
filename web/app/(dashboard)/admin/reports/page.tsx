'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';
import { getReports, updateReport } from '@/lib/reportApi';
import { toast } from 'sonner';
import {
  RefreshCw, ChevronLeft, ChevronRight,
  ExternalLink, CheckCircle2, XCircle, EyeOff, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

const STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'reviewed', label: 'Đang xem xét' },
  { value: 'resolved', label: 'Đã xử lý' },
  { value: 'dismissed', label: 'Đã từ chối' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'post', label: 'Bài viết diễn đàn' },
  { value: 'free-spot', label: 'Địa điểm chia sẻ' },
];

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate_content: 'Nội dung không phù hợp',
  harassment: 'Quấy rối',
  fake_information: 'Thông tin sai',
  copyright_violation: 'Vi phạm bản quyền',
  other: 'Khác',
};

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ xử lý', color: '#b45309', bg: '#fef3c7' },
  reviewed: { label: 'Đang xem xét', color: '#1d4ed8', bg: '#dbeafe' },
  resolved: { label: 'Đã xử lý', color: '#15803d', bg: '#dcfce7' },
  dismissed: { label: 'Từ chối', color: '#6b7280', bg: '#f3f4f6' },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [noteModal, setNoteModal] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [pendingAction, setPendingAction] = useState<{ reportId: string; status: string; action?: string } | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await getReports({ page, limit: 15, status: statusFilter || undefined, targetType: typeFilter || undefined });
      setReports(res?.data?.data ?? res?.data ?? []);
      setTotalPages(res?.data?.pagination?.totalPages ?? 1);
      setTotal(res?.data?.pagination?.total ?? 0);
    } catch {
      toast.error('Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const openNoteModal = (reportId: string, status: string, action?: string) => {
    setPendingAction({ reportId, status, action });
    setResolveNote('');
    setNoteModal(true);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setActionLoading(pendingAction.reportId);
    try {
      await updateReport(pendingAction.reportId, {
        status: pendingAction.status,
        resolveNote: resolveNote.trim() || undefined,
        action: pendingAction.action as any,
      });
      toast.success('Đã xử lý báo cáo thành công');
      setNoteModal(false);
      fetchReports();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Lỗi xử lý');
    } finally {
      setActionLoading(null);
      setPendingAction(null);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 10 }}>

          Xử lý báo cáo vi phạm
        </h1>

      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {STATUS_TABS.map((tab) => (
          <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1); }} style={{
            padding: '10px 18px', borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            background: statusFilter === tab.value ? 'var(--foreground)' : 'transparent',
            color: statusFilter === tab.value ? 'var(--background)' : 'var(--muted-foreground)',
            borderBottom: statusFilter === tab.value ? '2px solid var(--foreground)' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 13, cursor: 'pointer', outline: 'none' }}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={fetchReports} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Làm mới
        </button>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Tổng: <strong>{total}</strong></span>
      </div>

      <div style={{ background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted-foreground)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
            <div>Đang tải...</div>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted-foreground)' }}>Không có báo cáo nào</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                {['Nội dung bị báo cáo', 'Loại', 'Lý do', 'Người báo cáo', 'Trạng thái', 'Ngày', 'Hành động'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const badge = STATUS_BADGE[report.status] ?? STATUS_BADGE.pending;
                const target = report.target;
                return (
                  <tr key={report._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setSelectedReport(selectedReport?._id === report._id ? null : report)}
                  >
                    <td style={{ padding: '12px 16px', maxWidth: 240 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{target?.title ?? report.targetId}</div>
                      {report.description && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>"{report.description}"</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: report.targetType === 'post' ? '#dbeafe' : '#dcfce7', color: report.targetType === 'post' ? '#1d4ed8' : '#15803d', fontWeight: 600 }}>
                        {report.targetType === 'post' ? '📝 Bài viết' : '🏕️ Địa điểm'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{REASON_LABELS[report.reason] ?? report.reason}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {report.reporterId?.avatarUrl && <img src={report.reporterId.avatarUrl} alt="" style={{ width: 26, height: 26, borderRadius: '50%' }} />}
                        <span style={{ fontSize: 13 }}>{report.reporterId?.username ?? '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: badge.bg, color: badge.color }}>{badge.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                      {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {target?.slug && (
                          <Link href={report.targetType === 'post' ? `/forum/${target.slug}` : `/free-spots/${report.targetId}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 12, textDecoration: 'none' }}>
                            <ExternalLink size={12} />
                          </Link>
                        )}
                        {report.status === 'pending' && (
                          <>
                            <button onClick={() => openNoteModal(report._id, 'resolved', 'hide_target')} disabled={!!actionLoading} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid #ef4444', background: '#fef2f2', color: '#dc2626', fontSize: 12, cursor: 'pointer' }}>
                              <EyeOff size={12} /> Ẩn nội dung
                            </button>
                            <button onClick={() => openNoteModal(report._id, 'dismissed', 'none')} disabled={!!actionLoading} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid #10b981', background: '#f0fdf4', color: '#065f46', fontSize: 12, cursor: 'pointer' }}>
                              <XCircle size={12} /> Bỏ qua
                            </button>
                            <button onClick={() => openNoteModal(report._id, 'resolved', 'none')} disabled={!!actionLoading} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid #2563eb', background: '#eff6ff', color: '#1d4ed8', fontSize: 12, cursor: 'pointer' }}>
                              <CheckCircle2 size={12} /> Giải quyết
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, fontSize: 13 }}>
            <ChevronLeft size={14} /> Trước
          </button>
          <span style={{ fontSize: 13 }}>Trang <strong>{page}</strong> / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, fontSize: 13 }}>
            Sau <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setNoteModal(false)}
        >
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
              {pendingAction?.action === 'hide_target' ? '🚫 Phê duyệt & Ẩn nội dung' : pendingAction?.status === 'dismissed' ? '✅ Từ chối báo cáo' : '✅ Đánh dấu đã giải quyết'}
            </h3>
            {pendingAction?.action === 'hide_target' && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
                ⚠️ Hành động này sẽ ẩn nội dung bị báo cáo khỏi tất cả người dùng.
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Ghi chú (tùy chọn)</label>
              <textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)} placeholder="Nhập ghi chú về quyết định xử lý..." rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setNoteModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 14, cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleConfirmAction} disabled={!!actionLoading} style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: pendingAction?.action === 'hide_target' ? '#ef4444' : pendingAction?.status === 'dismissed' ? '#10b981' : '#2563eb',
                color: '#fff',
              }}>
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
