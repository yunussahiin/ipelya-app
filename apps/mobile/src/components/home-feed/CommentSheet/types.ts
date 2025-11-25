/**
 * CommentSheet Types
 */

export interface CommentSheetProps {
  postId: string;
  visible: boolean;
  onClose: () => void;
  postOwnerUsername?: string;
}

export interface ReplyTo {
  username: string;
  commentId: string;
}
