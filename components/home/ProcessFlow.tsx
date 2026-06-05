// 히어로용 공정 흐름 다이어그램 — 후드→사이클론→백필터→송풍기→스택
// 애니메이션 흐름선 + 장비 노드 (SVG, 의존성 없음)

const NODES = [
  { x: 40, label: "후드", sub: "포집" },
  { x: 190, label: "사이클론", sub: "조분" },
  { x: 340, label: "백필터", sub: "미분" },
  { x: 490, label: "송풍기", sub: "이송" },
  { x: 640, label: "스택", sub: "배출" },
];

export function ProcessFlow() {
  return (
    <svg viewBox="0 0 720 200" className="w-full h-auto" role="img" aria-label="집진 공정 흐름도">
      {/* 흐름선 */}
      {NODES.slice(0, -1).map((n, i) => (
        <g key={i}>
          <line x1={n.x + 90} y1={100} x2={NODES[i + 1].x} y2={100}
            stroke="#0e7c8c" strokeWidth="2" opacity="0.35" />
          <line x1={n.x + 90} y1={100} x2={NODES[i + 1].x} y2={100}
            stroke="#2dd4bf" strokeWidth="2" className="flow-dash" />
        </g>
      ))}

      {/* 노드 */}
      {NODES.map((n, i) => (
        <g key={n.label} className="rise" style={{ animationDelay: `${i * 0.12}s` }}>
          <rect x={n.x} y={70} width={90} height={60} rx={10}
            fill="rgba(255,255,255,0.08)" stroke="#2dd4bf" strokeWidth="1.5" />
          <text x={n.x + 45} y={97} textAnchor="middle" fill="#e6fffb" fontSize="15" fontWeight="700">{n.label}</text>
          <text x={n.x + 45} y={116} textAnchor="middle" fill="#7fd9d0" fontSize="11">{n.sub}</text>
        </g>
      ))}

      {/* 입구 분진 / 출구 청정 라벨 */}
      <text x={20} y={50} fill="#fbbf24" fontSize="12" fontWeight="600">분진 가스 →</text>
      <text x={690} y={50} textAnchor="end" fill="#5eead4" fontSize="12" fontWeight="600">→ 청정 배기</text>
    </svg>
  );
}
