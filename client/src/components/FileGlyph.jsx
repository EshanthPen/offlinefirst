import Icon from './Icon';

const MAP = {
  quiz:   { name: 'file-quiz',    color: '#1E8E3E' },
  lesson: { name: 'file-generic', color: '#1967D2' }
};

export default function FileGlyph({ type, size = 24 }) {
  const m = MAP[type] || MAP.lesson;
  return <Icon name={m.name} size={size} color={m.color} />;
}
