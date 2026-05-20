import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import FileGlyph from './FileGlyph';

export default function ActivityPost({ post }) {
  const navigate = useNavigate();
  return (
    <article className="lms-post">
      <div className="lms-post-head">
        <span
          className="lms-course-pip"
          style={{ background: post.author_color || 'var(--lms-primary)', width: 36, height: 36, fontSize: 14 }}
        >
          {post.course_name?.[0] || '•'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            type="button"
            className="lms-link"
            onClick={() => post.course_id && navigate(`/course/${post.course_id}`)}
            style={{ fontWeight: 500, fontSize: 14 }}
          >
            {post.course_name}
          </button>
          <div className="lms-post-meta">
            <span>{post.time}</span>
          </div>
        </div>
        <span
          className={`lms-chip ${
            post.kind === 'quiz_posted' ? 'info' : post.kind === 'lesson_updated' ? 'warn' : 'ok'
          }`}
          style={{ flexShrink: 0 }}
        >
          {post.kind_label}
        </span>
      </div>
      {post.body && <div className="lms-post-body">{post.body}</div>}
      {post.attachment && (
        <button
          type="button"
          className="lms-attachment"
          onClick={() => post.attachment.lesson_id && navigate(`/lesson/${post.attachment.lesson_id}`)}
        >
          <FileGlyph type={post.attachment.type} size={32} />
          <div style={{ minWidth: 0 }}>
            <div className="lms-attachment-name">{post.attachment.name}</div>
            {post.attachment.sub && <div className="lms-attachment-sub">{post.attachment.sub}</div>}
          </div>
          <Icon name="chevron-right" size={16} color="var(--lms-ink-faint)" style={{ marginLeft: 'auto' }} />
        </button>
      )}
    </article>
  );
}
