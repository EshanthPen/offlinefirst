const TAG = {
  Mathematics: 'Mathematics',
  Science:     'Science',
  Literacy:    'Literacy'
};

const LETTER = {
  Mathematics: 'Math',
  Science:     'Sci',
  Literacy:    'Lit'
};

const COVER_CLASS = {
  Mathematics: 'cover cover-math',
  Science:     'cover cover-science',
  Literacy:    'cover cover-literacy'
};

export default function Cover({ subject, height = 120, big = false }) {
  const cls = COVER_CLASS[subject] || COVER_CLASS.Mathematics;
  const letter = LETTER[subject] || subject?.[0] || '?';
  const tag = TAG[subject] || subject;
  return (
    <div className={cls} style={{ height }}>
      <span className={`cover-initial${big ? ' big' : ''}`}>{letter}</span>
      <span className="cover-tag">{tag}</span>
    </div>
  );
}
