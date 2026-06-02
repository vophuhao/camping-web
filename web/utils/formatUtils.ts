/**
 * Format số để hiển thị gọn gàng (K, M)
 * @param value - Số cần format (có thể null/undefined)
 * @returns String đã format hoặc 'Ẩn' nếu null/undefined
 */
export const formatNumber = (value: number | undefined | null): string => {
  if (value === null || value === undefined) return 'Ẩn';
  const n = typeof value === 'number' ? value : 0;
  try {
    return new Intl.NumberFormat('vi', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  } catch (e) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }
};

/**
 * Format số view count để hiển thị gọn gàng
 * @param count - Số lượt xem
 * @returns String đã format
 */
export const formatViewCount = (count: number): string => {
  if (count < 1000) {
    return count.toString();
  } else if (count < 10000) {
    return `${(count / 1000).toFixed(1)}k`.replace('.0', 'k');
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(0)}k`;
  } else {
    return `${(count / 1000000).toFixed(1)}M`.replace('.0', 'M');
  }
};

/**
 * Format số like count
 * @param count - Số lượt thích
 * @returns String đã format
 */
export const formatLikeCount = (count: number): string => {
  if (count < 1000) {
    return count.toString();
  } else if (count < 10000) {
    return `${(count / 1000).toFixed(1)}k`.replace('.0', 'k');
  } else {
    return `${(count / 1000).toFixed(0)}k`;
  }
};

/**
 * Format số comment count
 * @param count - Số bình luận
 * @returns String đã format
 */
export const formatCommentCount = (count: number): string => {
  if (count < 1000) {
    return count.toString();
  } else {
    return `${(count / 1000).toFixed(1)}k`.replace('.0', 'k');
  }
};

/**
 * Format file size (bytes to KB, MB, GB)
 * @param bytes - File size in bytes
 * @returns String đã format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};