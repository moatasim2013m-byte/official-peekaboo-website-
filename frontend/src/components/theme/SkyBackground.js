export default function SkyBackground({ className = '' }) {
  return (
    <div className={`sky-background ${className}`.trim()} aria-hidden="true">
      <div className="sky-background__cloud sky-background__cloud--one" />
      <div className="sky-background__cloud sky-background__cloud--two" />
      <div className="sky-background__cloud sky-background__cloud--three" />
      <div className="sky-background__cloud sky-background__cloud--four" />
      <div className="sky-background__cloud sky-background__cloud--five" />
    </div>
  );
}
