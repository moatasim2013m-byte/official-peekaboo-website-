export default function SmilingSun({ className = '' }) {
  return (
    <div className={`smiling-sun ${className}`.trim()} role="img" aria-label="شمس مبتسمة">
      <span className="smiling-sun__rays" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, index) => (
          <span
            key={index}
            className="smiling-sun__ray"
            style={{ '--ray-angle': `${index * 36}deg` }}
          />
        ))}
      </span>
      <span className="smiling-sun__face" aria-hidden="true">
        <span className="smiling-sun__eyes">
          <span className="smiling-sun__eye" />
          <span className="smiling-sun__eye" />
        </span>
        <span className="smiling-sun__cheeks">
          <span className="smiling-sun__cheek" />
          <span className="smiling-sun__cheek" />
        </span>
        <span className="smiling-sun__mouth" />
      </span>
    </div>
  );
}
