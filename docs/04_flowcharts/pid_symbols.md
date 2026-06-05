# P&ID 심볼 — ISO 14617 + ISA-5.1

## 표준 체계

| 표준 | 영역 | 사용처 |
|---|---|---|
| **ISO 14617** | 장비 심볼 (국제) | 본 웹앱 기본 |
| **ANSI/ISA-5.1** | 계장 심볼 (미국) | 본 웹앱 기본 |
| DIN 19227 | 계장 (독일) | 옵션 |
| KS A 0904 | 한국 (ISO/ISA 혼용) | 표제란만 |

본 웹앱은 ISO 14617 + ISA-5.1 혼용을 기본, 사용자 옵션으로 DIN 전환 가능.

## 장비 심볼 (집진플랜트 핵심 12종)

| 장비 | SVG 심볼 (drawio Process Engineering 라이브러리 기반) |
|---|---|
| 후드 | 사다리꼴 ▽ + 라벨 |
| 사이클론 | 원통+원뿔 + 입구탄젠셜 |
| 백필터 | 직사각형 + 내부 백 표현 + 펄스제트 |
| 카트리지 필터 | 원통 + 종방향 카트리지 |
| 전기집진기 (EP) | 직사각형 + 평행 라인 (collecting plates) |
| 벤추리 스크러버 | ⌐ 모양 + throat 좁아짐 |
| 패킹베드 | 직사각형 + 내부 hatching (packed) |
| 사이클로닉 분리기 | 원통 + 베인 |
| 미스트엘리미네이터 | 직사각형 + 셰브론 표현 |
| 응축기 | 직사각형 + 튜브번들 |
| 송풍기 | 원형 + 회전 화살표 |
| 굴뚝 (스택) | 원뿔 + CEMS 샘플링점 |
| 호퍼 + 회전밸브 | ▽ + 사각형 + 회전 표시 |

## 계측기 풍선 (Bubble) — ISA-5.1

원형 ○ 안에 글자.

### 첫글자 (측정변수)
| 코드 | 변수 |
|---|---|
| T | Temperature |
| P | Pressure |
| ΔP / PD | Differential Pressure |
| F | Flow |
| L | Level |
| A | Analysis (분진농도, O₂, CO 등) |
| V | Vibration |
| Z | Position |
| Q | Quantity |
| K | Time |

### 두번째 글자 (기능)
| 코드 | 기능 |
|---|---|
| T | Transmitter |
| I | Indicator |
| C | Controller |
| V | Valve |
| S | Switch |
| A | Alarm |
| E | Element (sensor) |
| Y | Computing relay |
| R | Recorder |

### 조합 예시
- TT = 온도 transmitter
- TIT = 온도 indicator transmitter
- PIT = 압력 indicator transmitter
- FIC = 유량 indicator controller
- AIT = 분석 (분진농도) indicator transmitter
- ZIT = 위치 indicator transmitter (rapper, valve)
- ΔPT (PDT) = 차압 transmitter (백필터 청소 트리거)

## 라인 종류

| 매체 | 굵기·종류 | 컬러 (선택) |
|---|---|---|
| Process gas/dust | 굵은 실선 0.7~1.0 mm | 황색 (ANSI A13.1) |
| Compressed air | 가는 실선 0.35 mm | 청색 |
| Cooling water | 가는 실선 | 녹색 |
| Slurry/wastewater | 가는 실선 | 녹색 |
| Steam | 가는 실선 | 적색 |
| Instrument signal (electric) | 점선 | 흑 |
| Instrument signal (pneumatic) | 1점쇄선(짧은) | 흑 |
| Data link (Fieldbus) | 1점쇄선(긴) | 흑 |

## 밸브 심볼

| 형식 | 심볼 |
|---|---|
| Globe valve | ◯⊕ |
| Gate valve | ⋈ |
| Butterfly | ⋈ + 사선 |
| Check valve | ▷⊥ (한방향) |
| Rotary valve | ◯ + sector |
| Slide valve | ▭ + 화살 |
| Blast gate | ▭ + 핸들 |
| Solenoid valve | ◯ + S |
| Diaphragm | ◯ + ▽ (펄스제트) |
| Damper (motorized) | ▭ + M |

## 안전장치

| 장치 | 심볼 |
|---|---|
| PSV (Pressure Safety Valve) | ⊕ + 화살 위 |
| Rupture Disc (파열판) | ⌒ |
| ER (Explosion Relief vent) | NFPA 68 풍선 + 화살 |
| Flame Arrester | ⊞ (메쉬 격자) |
| Isolation valve (분진폭발 격리) | ⋈ + bold |

## 코드 매핑 (lib/drawing/dust/symbols/)

```
lib/drawing/dust/symbols/
├── equipment/
│   ├── hood.svg
│   ├── cyclone.svg
│   ├── baghouse.svg
│   ├── cartridge.svg
│   ├── ep.svg
│   ├── venturi.svg
│   ├── packed-bed.svg
│   ├── mist-eliminator.svg
│   ├── condenser.svg
│   ├── fan.svg
│   ├── stack.svg
│   └── hopper-rv.svg
├── instruments/
│   ├── tt.svg, pt.svg, dpt.svg, ft.svg, at.svg, lt.svg, vt.svg, zit.svg
├── valves/
│   ├── globe.svg, gate.svg, butterfly.svg, check.svg
│   ├── rotary.svg, slide.svg, blast-gate.svg
│   ├── solenoid.svg, diaphragm.svg, damper.svg
└── safety/
    ├── psv.svg, rupture-disc.svg, er-vent.svg, flame-arrester.svg
```

각 SVG는 React Flow 커스텀 노드로 임포트:

```typescript
// lib/drawing/dust/symbols/index.ts
import HoodSvg from './equipment/hood.svg?component';
// ...

export const SYMBOLS = {
  hood: HoodSvg,
  cyclone: CycloneSvg,
  // ...
} as const;
```

## drawio Process Engineering 라이브러리 활용

drawio의 Process Engineering 카테고리 SVG (Apache 2.0)에서 발췌·재사용:
- https://www.drawio.com/blog/process-engineering-shapes
- 다운로드 후 `public/drawio-shapes/` 에 보관, MIT 라이선스 호환 검토 후 채택

대안: pure SVG 직접 그리기 (xyflow 커스텀 노드)
