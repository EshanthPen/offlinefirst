import EmptyState from '../components/EmptyState';

export default function Archived() {
  return (
    <div className="lms-page">
      <h1 className="lms-page-title">Archived</h1>
      <EmptyState title="Nothing archived" sub="Classes you archive will show up here." />
    </div>
  );
}
