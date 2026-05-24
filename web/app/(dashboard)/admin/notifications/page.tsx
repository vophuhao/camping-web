'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Send, Bell, Users, Trash2, Search, RefreshCw,
  CheckCircle2, ChevronLeft, ChevronRight, X, Plus,
  Clock, ExternalLink, AlertCircle, Check,
} from 'lucide-react';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Thấp', color: '#6b7280', bg: '#f3f4f6' },
  { value: 'medium', label: 'Trung bình', color: '#b45309', bg: '#fef3c7' },
  { value: 'high', label: 'Cao', color: '#dc2626', bg: '#fef2f2' },
];

// ── Compose Form ──────────────────────────────────────────────────────────────

function ComposeTab() {
  const [hosts, setHosts] = useState<any[]>([]);
  const [hostsLoading, setHostsLoading] = useState(true);
  const [hostSearch, setHostSearch] = useState('');
  const [selectedHosts, setSelectedHosts] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [form, setForm] = useState({ title: '', message: '', link: '', priority: 'medium' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; recipientCount: number } | null>(null);

  const fetchHosts = useCallback(async (search = '') => {
    setHostsLoading(true);
    try {
      const res: any = await API.get('/notifications/admin/hosts', { params: { search } });
      setHosts(res?.data?.data ?? res?.data ?? []);
    } catch {
      toast.error('Không thể tải danh sách host');
    } finally {
      setHostsLoading(false);
    }
  }, []);

  useEffect(() => { fetchHosts(); }, [fetchHosts]);

  const toggleHost = (hostId: string) => {
    setSelectedHosts(prev =>
      prev.includes(hostId) ? prev.filter(id => id !== hostId) : [...prev, hostId]
    );
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Tiêu đề và nội dung là bắt buộc');
      return;
    }
    if (!sendToAll && selectedHosts.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 host');
      return;
    }

    setSending(true);
    try {
      const res: any = await API.post('/notifications/admin/send-bulk', {
        recipientIds: sendToAll ? [] : selectedHosts,
        title: form.title,
        message: form.message,
        link: form.link || undefined,
        priority: form.priority,
      });
      const data = res?.data?.data ?? res?.data;
      setResult(data);
      toast.success(`Đã gửi thành công đến ${data?.sent ?? '?'} host!`);
      setForm({ title: '', message: '', link: '', priority: 'medium' });
      setSelectedHosts([]);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Lỗi gửi thông báo');
    } finally {
      setSending(false);
    }
  };

  const filteredHosts = hosts.filter(h =>
    h.username?.toLowerCase().includes(hostSearch.toLowerCase()) ||
    h.email?.toLowerCase().includes(hostSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
      {/* Left: Compose */}
      <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 20px', color: 'var(--foreground)' }}>
          ✍️ Soạn thông báo
        </h2>

        {result && (
          <div style={{
            padding: '14px 18px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #86efac',
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <CheckCircle2 size={18} color="#16a34a" />
            <div>
              <div style={{ fontWeight: 700, color: '#15803d', fontSize: 14 }}>Gửi thành công!</div>
              <div style={{ fontSize: 12, color: '#166534' }}>Đã gửi đến <strong>{result.sent}</strong> host</div>
            </div>
            <button onClick={() => setResult(null)} style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: '#166534' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Tiêu đề <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Tiêu đề thông báo..."
              maxLength={100}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', marginTop: 4 }}>{form.title.length}/100</div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Nội dung <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Nội dung thông báo chi tiết..."
              rows={4}
              maxLength={500}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', marginTop: 4 }}>{form.message.length}/500</div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Link (tùy chọn)
            </label>
            <div style={{ position: 'relative' }}>
              <ExternalLink size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                value={form.link}
                onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                placeholder="/host/properties hoặc URL..."
                style={{ width: '100%', padding: '10px 14px 10px 34px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>Mức độ ưu tiên</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITY_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setForm(p => ({ ...p, priority: opt.value }))}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 10, border: `2px solid ${form.priority === opt.value ? opt.color : 'var(--border)'}`,
                    background: form.priority === opt.value ? opt.bg : 'var(--card)', color: form.priority === opt.value ? opt.color : 'var(--muted-foreground)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !form.title || !form.message}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 0', borderRadius: 12, border: 'none',
              background: sending || !form.title || !form.message ? '#d1d5db' : '#2563eb',
              color: '#fff', fontSize: 15, fontWeight: 800, cursor: sending ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s', marginTop: 4,
            }}
          >
            {sending ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
            {sending ? 'Đang gửi...' : `Gửi thông báo${sendToAll ? ' đến tất cả host' : ` (${selectedHosts.length} host)`}`}
          </button>
        </div>
      </div>

      {/* Right: Recipient Picker */}
      <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px' }}>Người nhận</h3>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `2px solid ${sendToAll ? '#2563eb' : 'var(--border)'}`, background: sendToAll ? '#eff6ff' : 'var(--card)', cursor: 'pointer', marginBottom: 10 }}>
            <input type="checkbox" checked={sendToAll} onChange={e => { setSendToAll(e.target.checked); setSelectedHosts([]); }} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: sendToAll ? '#1d4ed8' : 'var(--foreground)' }}>Tất cả host</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{hosts.length} host đang hoạt động</div>
            </div>
            {sendToAll && <Check size={16} style={{ marginLeft: 'auto', color: '#2563eb' }} />}
          </label>

          {!sendToAll && (
            <>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  value={hostSearch}
                  onChange={e => setHostSearch(e.target.value)}
                  placeholder="Tìm host..."
                  style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {selectedHosts.length > 0 && (
                <div style={{ padding: '6px 10px', borderRadius: 8, background: '#eff6ff', marginBottom: 8, fontSize: 12, color: '#1d4ed8', fontWeight: 700 }}>
                  Đã chọn {selectedHosts.length} host
                  <button onClick={() => setSelectedHosts([])} style={{ marginLeft: 8, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>Bỏ chọn tất cả</button>
                </div>
              )}

              <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {hostsLoading ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Đang tải...</div>
                ) : filteredHosts.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Không có host nào</div>
                ) : filteredHosts.map(host => {
                  const selected = selectedHosts.includes(host._id);
                  return (
                    <label key={host._id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      background: selected ? '#eff6ff' : 'transparent', border: `1px solid ${selected ? '#93c5fd' : 'transparent'}`,
                      transition: 'all 0.1s',
                    }}>
                      <input type="checkbox" checked={selected} onChange={() => toggleHost(host._id)} style={{ width: 14, height: 14, accentColor: '#2563eb' }} />
                      {host.avatarUrl && <img src={host.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{host.username}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{host.email}</div>
                      </div>
                      {host.isVerified && <CheckCircle2 size={13} color="#10b981" />}
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Sent History Tab ─────────────────────────────────────────────────────────

function SentHistoryTab() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const fetchSent = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await API.get('/notifications/admin/sent', { params: { page, limit: 15 } });
      const d = res?.data?.data ?? res?.data;
      setNotifications(d?.notifications ?? d ?? []);
      setTotalPages(d?.totalPages ?? 1);
      setTotal(d?.total ?? 0);
    } catch {
      toast.error('Không thể tải lịch sử thông báo');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchSent(); }, [fetchSent]);

  const handleDeleteOne = async (notificationId: string) => {
    setDeletingId(notificationId);
    try {
      await API.delete(`/notifications/admin/sent/${notificationId}`);
      toast.success('Đã xóa thông báo');
      fetchSent();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Lỗi xóa');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleDeleteBroadcast = async (title: string, createdAt: string) => {
    setDeletingId('bulk');
    try {
      await API.delete('/notifications/admin/broadcast', { data: { title, createdAt } });
      toast.success('Đã xóa toàn bộ thông báo broadcast này');
      fetchSent();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Lỗi xóa');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const PRIORITY_BADGE: Record<string, { label: string; color: string; bg: string }> = {
    low: { label: 'Thấp', color: '#6b7280', bg: '#f3f4f6' },
    medium: { label: 'Trung bình', color: '#b45309', bg: '#fef3c7' },
    high: { label: 'Cao', color: '#dc2626', bg: '#fef2f2' },
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Lịch sử thông báo đã gửi</h2>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>Tổng {total} thông báo đã gửi</p>
        </div>
        <button onClick={fetchSent} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted-foreground)' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: 10 }}>Đang tải...</div>
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)' }}>
          <Bell size={40} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 16, fontWeight: 700 }}>Chưa có thông báo nào đã gửi</div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 6 }}>Hãy gửi thông báo đầu tiên từ tab "Gửi thông báo"</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifications.map((notif: any) => {
            const badge = PRIORITY_BADGE[notif.priority] ?? PRIORITY_BADGE.medium;
            return (
              <div key={notif._id} style={{
                background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)',
                padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{notif.title}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 8px', lineHeight: 1.5 }}>{notif.message}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    {/* Recipient */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {notif.recipient?.avatarUrl && <img src={notif.recipient.avatarUrl} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />}
                      <span style={{ fontSize: 12, color: '#6b7280' }}>→ <strong>{notif.recipient?.username ?? '—'}</strong></span>
                    </div>
                    {notif.link && (
                      <a href={notif.link} style={{ fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <ExternalLink size={11} /> {notif.link}
                      </a>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af' }}>
                      <Clock size={11} /> {new Date(notif.createdAt).toLocaleString('vi-VN')}
                    </span>
                    {notif.isRead && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>✓ Đã đọc</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => setConfirmDelete({ type: 'one', id: notif._id })}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, border: '1px solid #ef4444', background: '#fef2f2', color: '#dc2626', fontSize: 12, cursor: 'pointer' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, fontSize: 13 }}>
            <ChevronLeft size={14} /> Trước
          </button>
          <span style={{ fontSize: 13 }}>Trang <strong>{page}</strong> / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, fontSize: 13 }}>
            Sau <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700 }}>Xóa thông báo?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--muted-foreground)' }}>
              Thông báo sẽ bị xóa vĩnh viễn khỏi hộp thư của host.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 14, cursor: 'pointer' }}>Hủy</button>
              <button
                onClick={() => confirmDelete.type === 'one'
                  ? handleDeleteOne(confirmDelete.id)
                  : handleDeleteBroadcast(confirmDelete.title, confirmDelete.createdAt)}
                disabled={!!deletingId}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {deletingId ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<'compose' | 'sent'>('compose');

  const TABS = [
    { key: 'compose', label: 'Gửi thông báo', icon: Send },
    { key: 'sent', label: 'Đã gửi', icon: Bell },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', color: 'var(--foreground)' }}>
          Quản lý thông báo
        </h1>

      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid var(--border)' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
              borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
              transition: 'all 0.15s',
              background: tab === t.key ? 'var(--foreground)' : 'transparent',
              color: tab === t.key ? 'var(--background)' : 'var(--muted-foreground)',
              borderBottom: tab === t.key ? '2px solid var(--foreground)' : '2px solid transparent',
              marginBottom: -2,
            }}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'compose' ? <ComposeTab /> : <SentHistoryTab />}
    </div>
  );
}
