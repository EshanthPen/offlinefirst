const PALETTE = ['#1967D2', '#1E8E3E', '#E8710A', '#9334E6', '#D93025', '#12B5CB', '#F9AB00', '#5E35B1'];

export function colorFromName(name) {
  if (!name) return PALETTE[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function Avatar({ name, initial, color, size = 32, style }) {
  const c = color || colorFromName(name);
  const txt = (initial || (name || '?').split(/\s+/).map(s => s[0]).slice(0, 2).join('')).toUpperCase();
  return (
    <span
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: '50%',
        background: c, color: 'white',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42, fontWeight: 600, flexShrink: 0,
        ...style
      }}
    >
      {txt}
    </span>
  );
}
