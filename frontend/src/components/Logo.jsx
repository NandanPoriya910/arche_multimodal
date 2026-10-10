import mark from '../assets/arche-logo.png';

// The Arche "A" arch mark (blue → violet gradient, transparent background).
export default function Logo({ size = 32 }) {
  return <img src={mark} width={size} height={size} alt="Arche" draggable="false" style={{ display: 'block', objectFit: 'contain', flex: 'none' }} />;
}
