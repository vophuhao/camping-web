
import mongoose from "mongoose";


const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: false }, // Forum post comment
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: false }, // Document comment
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Upvotes
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Downvotes
  isBest: { type: Boolean, default: false },
  isReported: { type: Boolean, default: false },
  depth: { type: Number, default: 0 }, // Độ sâu của bình luận
  childrenCount: { type: Number, default: 0 }, // Số lượng bình luận con
  updatedAt: { type: Date }, // Ngày chỉnh sửa cuối
  status: { type: String, enum: ['active', 'deleted', 'hidden'], default: 'active' }, // Trạng thái bình luận
});

// Validation: phải có postId HOẶC documentId, không được có cả 2 hoặc không có cái nào
commentSchema.pre('validate', function(next) {
  const hasPostId = !!this.postId;
  const hasDocumentId = !!this.documentId;
  
  if (hasPostId && hasDocumentId) {
    return next(new Error('Comment cannot have both postId and documentId'));
  }
  if (!hasPostId && !hasDocumentId) {
    return next(new Error('Comment must have either postId or documentId'));
  }
  next();
});

// Virtual để tính điểm vote
commentSchema.virtual('voteScore').get(function() {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});

// Index cho performance
commentSchema.index({ postId: 1, parentId: 1, createdAt: -1 });
commentSchema.index({ documentId: 1, parentId: 1, createdAt: -1 });
commentSchema.index({ status: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ upvotes: 1 });
commentSchema.index({ downvotes: 1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
// CommonJS export for backward compatibility
