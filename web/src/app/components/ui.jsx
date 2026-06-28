export function SectionTitle({ icon, title }) {
  return <div className="section-title"><span>{icon}</span><strong>{title}</strong></div>;
}

export function Metric({ label, value }) {
  return <div className="metric-card"><span>{label}</span><strong>{value}</strong></div>;
}

export function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function Slider({ label, value, min, max, suffix = '', onChange }) {
  return (
    <label className="field">
      <span>{label}<b>{value}{suffix}</b></span>
      <input type="range" value={value} min={min} max={max} onChange={event => onChange(Number(event.target.value))} />
    </label>
  );
}
