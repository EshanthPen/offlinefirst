import EmptyState from '../components/EmptyState';

export default function Archived() {
  return (
    <div className="lms-page">
      <h1 className="lms-page-title">Archived classes</h1>
      <p className="lms-page-sub">Classes you archive will appear here.</p>
      <EmptyState title="No archived classes" sub="When you archive a class it moves here for safekeeping." />
    </div>
  );
}
