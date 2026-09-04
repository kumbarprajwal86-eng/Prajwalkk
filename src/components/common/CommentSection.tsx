import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Pin, Heart, Smile, AtSign, MessageSquare, Send, CheckCircle2, Trash2 } from 'lucide-react';
import { Comment } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';

interface CommentSectionProps {
  videoId: string;
  videoCreatorId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ videoId, videoCreatorId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
  const [newText, setNewText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { user, openAuthPrompt } = useAuthStore();

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/${videoId}`);
      setComments(res.data);
    } catch (e) {
      console.error('Failed to fetch comments', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned) return -1;
    if (b.isPinned) return 1;
    if (sortBy === 'top') {
      return b.likes - a.likes;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !user) return;
    try {
      const res = await api.post(`/comments/${videoId}`, { text: newText.trim() });
      setComments([res.data, ...comments]);
      setNewText('');
      setShowEmojiPicker(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post comment.');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      openAuthPrompt('Want to like this comment? Sign in to make your opinion count.');
      return;
    }
    try {
      const res = await api.post(`/comments/like/${commentId}`);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, likes: res.data.likes } : c))
      );
    } catch (e) {
      // ignore
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete comment.');
    }
  };

  const addEmoji = (emoji: string) => {
    setNewText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const addMention = (username: string) => {
    setNewText((prev) => prev + ` @${username} `);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
    return `${Math.floor(diffSec / 2592000)} months ago`;
  };

  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      {/* Header & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>{comments.length} Comments</span>
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Sort by:</span>
          <button
            onClick={() => setSortBy('top')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              sortBy === 'top' ? 'bg-white/20 text-white font-bold' : 'text-gray-400 hover:bg-white/10'
            }`}
          >
            Top comments
          </button>
          <button
            onClick={() => setSortBy('newest')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              sortBy === 'newest' ? 'bg-white/20 text-white font-bold' : 'text-gray-400 hover:bg-white/10'
            }`}
          >
            Newest first
          </button>
        </div>
      </div>

      {/* Add comment input */}
      {user ? (
        <form onSubmit={handleAddComment} className="flex gap-4 mb-8">
          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Add a comment... (use @ to mention)"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 focus:border-white py-2 pr-20 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
              />
              <div className="absolute right-2 top-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-gray-400 hover:text-white"
                  title="Insert emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => addMention('techpulse')}
                  className="text-gray-400 hover:text-[#818CF8]"
                  title="Mention creator"
                >
                  <AtSign className="w-5 h-5" />
                </button>
              </div>

              {showEmojiPicker && (
                <div className="absolute right-0 top-10 bg-[#161B26] border border-white/15 rounded-xl shadow-2xl p-3 z-30 flex gap-2 text-xl">
                  {['🔥', '❤️', '🙌', '🎉', '💡', '🚀', '⭐', '💯'].map((em) => (
                    <button key={em} type="button" onClick={() => addEmoji(em)} className="hover:scale-125 transition-transform">
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setNewText('')}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-400 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newText.trim()}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#818CF8] hover:bg-[#818CF8]/90 disabled:opacity-50 disabled:cursor-not-allowed text-black flex items-center gap-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5" /> Comment
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-[#161B26] rounded-2xl mb-8 flex items-center justify-between border border-white/10">
          <p className="text-sm text-gray-300">Please sign in to join the discussion and post comments.</p>
          <button
            type="button"
            onClick={() => openAuthPrompt('Sign in to join the discussion and post comments.')}
            className="px-4 py-2 bg-[#FF4D6D] text-white rounded-full text-xs font-bold hover:bg-[#FF4D6D]/90 transition-all shadow"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-3 bg-white/10 rounded" />
                <div className="w-full h-4 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedComments.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">No comments yet. Be the first to comment!</div>
      ) : (
        <div className="space-y-6">
          {sortedComments.map((comment) => (
            <div key={comment._id} className={`flex gap-4 group/comm ${comment.isPinned ? 'bg-white/[0.03] p-4 rounded-2xl border border-white/10' : ''}`}>
              <img src={comment.user.avatar} alt={comment.user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {comment.isPinned && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mb-2">
                    <Pin className="w-3.5 h-3.5 text-white fill-white" />
                    <span>Pinned by {comment.user.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    {comment.user.name}
                    {comment.user.verified && <CheckCircle2 className="w-3 h-3 text-gray-400 fill-gray-400/20" />}
                  </span>
                  <span className="text-[11px] text-gray-400">{formatTimeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-200 mt-1.5 whitespace-pre-wrap leading-relaxed">{comment.text}</p>

                {/* Actions Bar */}
                <div className="flex items-center gap-4 mt-2.5 text-xs text-gray-400">
                  <button onClick={() => handleLikeComment(comment._id)} className="flex items-center gap-1 hover:text-white transition-colors">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {comment.likes > 0 && <span>{comment.likes}</span>}
                  </button>
                  <button className="hover:text-white transition-colors">
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>

                  {comment.isCreatorHearted && (
                    <div className="flex items-center gap-1 bg-[#FF4D6D]/15 text-[#FF4D6D] px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <Heart className="w-3 h-3 fill-[#FF4D6D]" />
                      <span>Creator Hearted</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!user) {
                        openAuthPrompt('Want to reply to this comment? Sign in to join the discussion.');
                      } else {
                        setReplyingTo(replyingTo === comment._id ? null : comment._id);
                      }
                    }}
                    className="hover:text-white font-semibold"
                  >
                    Reply
                  </button>

                  {(user?._id === comment.user._id || user?.role === 'admin') && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="opacity-0 group-hover/comm:opacity-100 hover:text-[#FF4D6D] transition-all ml-auto"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Reply Form */}
                {replyingTo === comment._id && (
                  <div className="mt-3 flex gap-3 pl-4 border-l-2 border-white/10">
                    <input
                      type="text"
                      placeholder={`Reply to @${comment.user.username}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 bg-[#161B26] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (replyText.trim()) {
                          const newRep: Comment = {
                            _id: `rep-${Date.now()}`,
                            videoId,
                            user: { _id: user!._id, name: user!.name, username: user!.username, avatar: user!.avatar },
                            text: replyText.trim(),
                            likes: 0,
                            dislikes: 0,
                            createdAt: new Date().toISOString(),
                          };
                          setComments((prev) =>
                            prev.map((c) => (c._id === comment._id ? { ...c, replies: [...(c.replies || []), newRep] } : c))
                          );
                          setReplyText('');
                          setReplyingTo(null);
                        }
                      }}
                      className="px-3 py-1 bg-[#818CF8] text-black text-xs font-bold rounded-xl"
                    >
                      Send
                    </button>
                  </div>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 space-y-4 pl-6 border-l-2 border-white/10">
                    {comment.replies.map((rep) => (
                      <div key={rep._id} className="flex gap-3">
                        <img src={rep.user.avatar} alt={rep.user.name} className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{rep.user.name}</span>
                            <span className="text-[10px] text-gray-500">{formatTimeAgo(rep.createdAt)}</span>
                          </div>
                          <p className="text-xs text-gray-300 mt-1">{rep.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
