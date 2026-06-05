# 리서치 — PFD/P&ID + 자동생성 (원본)

조사일: 2026-05-07
정제: docs/04_flowcharts/

## 1. 도면 단계

| 단계 | 도면 | 설계 | 정보 |
|---|---|---|---|
| 1 | BFD | 개념 | 블록+화살표 |
| 2 | PFD | 기본 | 주요장비, T/P/F 데이터 |
| 3 | P&ID | 상세 | 모든 배관·밸브·계장·제어 |
| 4 | GA | 배치 | 평면·입면·Plot Plan |
| 5 | Single-Line | 전기 | MCC, 케이블, 보호계전기 |

## 2. 표준 흐름도 5종

### 1) 건식 백필터 단독
[Hood]→[BD]→[Duct]→[Damper]→[Baghouse + ER vent]→[Hopper/RV]→[ID Fan/VFD]→[Stack/CEMS]
Pulse Jet (Air rcv, SV array, Sequencer)

### 2) 사이클론 + 백필터
[Hood]→[Duct]→[Cyclone]→[Baghouse + ER]→[ID Fan]→[Stack]
사이클론·백필터 각 호퍼/RV로 분기 배출

### 3) EP 단독 (시멘트/발전)
[Boiler]→[GGH/Cooler 150°C]→[ESP 2~4 field]→[ID Fan]→[Stack]
양압 방지 시 FD+ID

### 4) 반건식 SDA + 백필터 (소각)
[Furnace]→[Boiler/HX]→[SDA(Ca(OH)2 분무)]→[AC 주입]→[Baghouse]→[ID Fan]→[Stack]

### 5) 습식 벤추리 + 사이클로닉
[Hood]→[Quencher]→[Venturi]→[Cyclonic]→[Mist E]→[ID Fan(FRP/SS316)]→[Stack]

## 3. 표준 P&ID 기호

### 표준
- ISO 14617 (장비, 국제)
- ANSI/ISA-5.1 (계장, 미국)
- DIN 19227 (독일)
- KS A 0904 (표제란)

### 계측기 풍선 (ISA-5.1)
첫글자 = 측정변수 (T/P/F/L/A/Z/Q)
두번째 = 기능 (T=Transmitter, I=Indicator, C=Controller, V=Valve, S=Switch, A=Alarm)
예: TT, PIT, ΔPT(PDT), AIT, FIC

### 라인 종류
- 굵은 실선 = Process gas/dust (0.7~1.0 mm)
- 가는 실선 = Utility (0.35)
- 점선 = 전기 신호
- 1점쇄선(짧은) = 공압 신호
- 1점쇄선(긴) = 데이터링크

## 4. 자동 P&ID 생성 라이브러리

| 라이브러리 | 라이선스 | P&ID 적합도 | 러닝커브 | 코멘트 |
|---|---|---|---|---|
| **React Flow / xyflow** | MIT | ★★★★☆ | 낮음 | React 친화, 1순위 |
| mxGraph / drawio | Apache 2.0 | ★★★★★ | 중간 | Process Engineering 라이브러리 |
| GoJS | 상용 | ★★★★★ | 중간 | 비싼 라이선스 |
| JointJS Core/+ | MPL/상용 | ★★★★★ | 중간 | 2순위 |
| Mermaid | MIT | ★★☆☆☆ | 매우 낮음 | BFD/간이 PFD만 |
| D3 + 커스텀 SVG | BSD | ★★★★☆ | 매우 높음 | 풀 커스텀 |

**1순위 채택**: React Flow (xyflow) + drawio 심볼 발췌

## 5. 텍스트 → 다이어그램 파이프라인

```
[8단 위저드] → [System JSON] → [elkjs/dagre 자동배치]
            → [React Flow nodes/edges] → [PIDViewer 렌더]
            → [SVG/PNG/PDF/DXF 출력]
```

### 핵심 도구
- elkjs (Eclipse Layout Kernel) — 자동배치
- dagre — DAG 레이아웃, React Flow 공식
- netlistsvg (참고) — JSON netlist → SVG 모델

## 6. 라인 컬러 (ANSI A13.1, KS A 0903 호환)

| 매체 | 바탕색 | 글자색 |
|---|---|---|
| Process gas/dust | 황색 | 흑 |
| Compressed air | 청색 | 백 |
| Cooling water | 녹색 | 백 |
| Slurry/wastewater | 녹색 | 백 |
| Steam | 적색 | 백 |
| Instrument air | 청색 | 백 |

## 7. 한국 도면표준 (KS)

- KS A 0005 — 제도 통칙
- KS A 0106 — 도면 크기·양식 (A0~A4)
- KS A 0904/0905/0906 — 표제란·부품란·표시방법

표제란: 우측하단 170×60mm, 회사 로고/도면명/도번/척도/일자/설계·검토·승인란

## 출처

- [Projectmaterials BFD-PFD-PID](https://blog.projectmaterials.com/epc-projects/engineering/bfd-pfd-pid-fid-process/)
- [Creately PFD vs P&ID](https://creately.com/guides/pfd-vs-pid/)
- [ANSI/ISA-5.1 2024](https://blog.ansi.org/ansi/ansi-isa-5-1-2024-instrumentation-symbols/)
- [Vista Projects 363 P&ID Symbols](https://www.vistaprojects.com/common-pid-symbols/)
- [drawio Process Engineering](https://www.drawio.com/blog/process-engineering-shapes)
- [JointJS vs GoJS](https://www.jointjs.com/blog/jointjs-vs-gojs)
- [React Flow](https://reactflow.dev/)
- [xyflow GitHub](https://github.com/xyflow/xyflow)
- [JS Diagram Libraries 2026](https://www.jointjs.com/blog/javascript-diagramming-libraries)
- [netlistsvg](https://github.com/nturley/netlistsvg)
- [Pipe Color Codes ANSI/ASME A13.1](https://www.creativesafetysupply.com/articles/pipe-colorcodes/)
- [NFPA 68 Vent](https://www.isystemsweb.com/nfpa-standards-series-nfpa-68-for-dust-collector-explosion-venting/)
- [GEA SDA](https://www.gea.com/en/products/emission-control/sorption/spray-dryer-absorber/)
