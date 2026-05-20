import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import FileGlyph from './FileGlyph';

export default function MaterialRow({ item }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="lms-material-row"
      onClick={() => {
        if (!item.lesson_id) return;
        if (item.type === 'quiz') navigate(`/quiz/${item.lesson_id}`);
        else navigate(`/lesson/${item.lesson_id}`);
      }}
    >
      <FileGlyph type={item.type} size={24} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lms-material-name">{item.name}</div>
        {item.sub && <div className="lms-material-sub">{item.sub}</div>}
      </div>
      {item.due && (
        <span className="lms-chip" style={{ flexShrink: 0 }}>
          <Icon name="clock" size={12} /> {item.due}
        </span>
      )}
      <Icon name="chevron-right" size={16} color="var(--lms-ink-faint)" />
    </button>
  );
}
