import baseMascot from '../../assets/mascot.png';

export default function MascotVariant({ accessory, alt }) {
  return (
    <span className="mascot-variant" aria-hidden="true">
      <img src={baseMascot} alt={alt || ''} className="mascot-variant__base" loading="lazy" decoding="async" />
      <img src={accessory} alt="" className="mascot-variant__accessory" loading="lazy" decoding="async" />
    </span>
  );
}
