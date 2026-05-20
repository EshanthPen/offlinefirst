const ICONS = {
  home:        '<path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
  book:        '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V22h16"/>',
  library:     '<rect x="3" y="4" width="6" height="16" rx="1.2"/><rect x="11" y="4" width="6" height="16" rx="1.2"/><path d="M19 4h2v16h-2z"/>',
  chart:       '<line x1="4" y1="20" x2="4" y2="10"/><line x1="10" y1="20" x2="10" y2="6"/><line x1="16" y1="20" x2="16" y2="13"/><line x1="22" y1="20" x2="2" y2="20"/>',
  calendar:    '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
  settings:    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  search:      '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>',
  sun:         '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>',
  moon:        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  check:       '<polyline points="4 12 10 18 20 6"/>',
  'check-thin':'<polyline points="5 12 10 17 19 7"/>',
  x:           '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  'chevron-right': '<polyline points="9 6 15 12 9 18"/>',
  'chevron-left':  '<polyline points="15 6 9 12 15 18"/>',
  'arrow-right':   '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/>',
  'arrow-left':    '<line x1="20" y1="12" x2="4" y2="12"/><polyline points="10 6 4 12 10 18"/>',
  more:        '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  download:    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload:      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  bell:        '<path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2v1h16v-1z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  'check-circle': '<circle cx="12" cy="12" r="9.5"/><polyline points="8 12.5 11 15.5 16 9.5"/>',
  'x-circle':     '<circle cx="12" cy="12" r="9.5"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>',
  clock:       '<circle cx="12" cy="12" r="9.5"/><polyline points="12 7 12 12 15.5 14"/>',
  trophy:      '<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4a2 2 0 0 0 2 2h1"/><path d="M17 6h3a2 2 0 0 1-2 2h-1"/><line x1="12" y1="13" x2="12" y2="17"/><path d="M8 21h8"/><path d="M9 17h6"/>',
  bookmark:    '<path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4z"/>',
  wifi:        '<path d="M5 12.55a11 11 0 0 1 14 0"/><path d="M2 8.82a16 16 0 0 1 20 0"/><path d="M8.5 16.1a6 6 0 0 1 7 0"/><circle cx="12" cy="20" r="0.8" fill="currentColor"/>',
  'wifi-off':  '<line x1="3" y1="3" x2="21" y2="21"/><path d="M16.5 11a8 8 0 0 1 3.5 1.55"/><path d="M5 12.55a11 11 0 0 1 5-2.4"/><path d="M10.5 5.05A16 16 0 0 1 22 8.82"/><circle cx="12" cy="20" r="0.8" fill="currentColor"/>',
  refresh:     '<polyline points="21 4 21 10 15 10"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><polyline points="3 20 3 14 9 14"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>',
  star:        '<polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/>',
  layers:      '<polygon points="12 2 22 8 12 14 2 8"/><polyline points="2 14 12 20 22 14"/>',
  user:        '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  volume:      '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  stop:        '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
  globe:       '<circle cx="12" cy="12" r="9.5"/><line x1="2.5" y1="12" x2="21.5" y2="12"/><path d="M12 2.5c2.8 3 4.2 6.2 4.2 9.5s-1.4 6.5-4.2 9.5"/><path d="M12 2.5c-2.8 3-4.2 6.2-4.2 9.5s1.4 6.5 4.2 9.5"/>',
  accessibility:'<circle cx="12" cy="4.5" r="1.6" fill="currentColor"/><path d="M5 9.5c2.5 1 4.5 1.4 7 1.4s4.5-.4 7-1.4"/><path d="M12 10.9V15"/><path d="M9 21l3-6 3 6"/>',
  qr:          '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="14" x2="17" y2="14"/><line x1="14" y1="17" x2="14" y2="20"/><line x1="17" y1="17" x2="17" y2="20"/><line x1="20" y1="14" x2="20" y2="17"/><line x1="20" y1="20" x2="21" y2="20"/>',
  edit:        '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  target:      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  trend:       '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
  type:        '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
  users:       '<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 20a5 5 0 0 1 5-2"/>',
  zap:         '<polygon points="13 2 4 14 12 14 11 22 20 10 12 10 13 2"/>',
  plus:        '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  monitor:     '<rect x="3" y="4" width="18" height="13" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  trash:       '<polyline points="4 7 20 7"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/>',
  save:        '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>'
};

export function BrandMark({ size = 28, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} style={{ flexShrink: 0 }}>
      <rect x="3" y="7" width="18" height="18" rx="5" fill="currentColor" />
      <circle cx="22" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

export default function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.75, style, className }) {
  const html = ICONS[name];
  if (!html) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
