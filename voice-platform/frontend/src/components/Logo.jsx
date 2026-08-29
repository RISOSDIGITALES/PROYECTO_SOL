export default function Logo({ size = "normal" }) {
  const fontSize = size === "small" ? 18 : 26;
  return (
    <div className="g54-lockup" style={{ gap: 2 }}>
      <span className="word" style={{ fontSize }}>Growth</span>
      <span className="g54-badge" style={{ width: fontSize + 8, height: fontSize + 8, fontSize: fontSize - 8 }}>54</span>
      <span className="word" style={{ fontSize }}>ai</span>
    </div>
  );
}
