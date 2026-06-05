# 집진설비 설계 웹앱 — BLUEPRINT v2

작성일: 2026-05-07
참고방: D:\claude\스크류컨베이어 만들기 / D:\claude\벨트컨베이어 만들기
참고자료: F:\전문 / E:\mywiki

---

## 0. 가능성 평가 (먼저 답)

| 영역 | 가능 여부 | 비고 |
|---|---|---|
| 8단 계산엔진 (분진성상→후드→풍량→덕트→집진방식→여재/EP/응축→송풍기→안전) | ✅ 100% 가능 | KOSHA W-1·ACGIH·EPA 식 모두 코드화 가능 |
| 건식/습식/반건식 분기 + 6대 집진방식 매트릭스 | ✅ 100% 가능 | 18조합 결정트리 룰엔진 구현 |
| 사이클론 6종 표준 (Stairmand HE/HT, Lapple, Swift HE/GP, Peterson) | ✅ 100% 가능 | 표준비율표 + Lapple/Barth/Iozia-Leith 식 |
| 전기집진기 EP/WESP (Deutsch + Modified Deutsch-Matts) | ✅ 100% 가능 | 비저항 영향 자동 보정 |
| 응축기 5형식 (PHE/Shell&Tube/핀튜브/공냉/Quench) + 노점 회피 | ✅ 100% 가능 | Verhoff-Banchero 황산노점식 적용 |
| 송풍기 1팬/2팬/N+1 병렬 자동결정 | ✅ 100% 가능 | 매트릭스 기반 룰엔진 |
| 자동 P&ID/PFD/BFD 3단계 도면 생성 | ⚠️ **80% 자동 + 20% 수동조정** | React Flow + drawio 심볼 + 5종 프리셋 |
| 자동 3D 뷰어 + 모바일 AR 배치 | ✅ 가능 (정확도 한계) | R3F + model-viewer, AR 정확도는 단색 바닥 시 ±20cm |
| DXF/PDF 출력 (한국 도면표준 준수) | ✅ 가능 | @dxfjs/writer + @react-pdf/renderer |
| 법규 컴플라이언스 자동 리포트 (대기환경보전법+산안법+KOSHA+화관법) | ✅ 100% 가능 | 입력 15개 → 12항목 자동판정 |
| 분진폭발 위험성 자동 평가 (Kst·MIE·Zone 20/21/22) | ⚠️ **참고용**으로만 | 법적 인증 대체 불가, "전문가 검토 권고" 명시 |
| Lifecycle TCO 5년 견적 | ✅ 100% 가능 | 차압변화 모델 + 필터수명 + 전력비 |
| IoT 차압 대시보드 (Lifetime 미래기능) | ⚠️ MVP 제외, v2.0 | ESP32+MQTT 키트 별도 |

**종합 결론: 요청한 전 항목 구현 가능. 단 P&ID 100% 자동 + 분진폭발 법적인증 대체는 현실적 한계. 이 두 항목은 "보조도구"로 명확히 포지셔닝하면 EPC 엔지니어용 강력한 도구로 완성 가능.**

---

## 1. 설계 진행방식 (Workflow)

사용자가 웹앱에서 따라가는 흐름 — **8단 위저드 (Linear Pipeline)**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 1: 분진/가스 성상 (Dust & Gas Properties)                          │
│  입력: 산업종류·분진명·입경(D50/D90)·밀도·점착성·가연성(Kst/MIE/MIT)·     │
│        부식성·온도·습도·O2·CO·HCl·SO2·Hg 함량                             │
│  출력: 분진폭발 등급(ST1/2/3) · 비저항 추정 · 노점 추정 · 처리방식 후보   │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 2: 후드 설계 (Hood Design)                                         │
│  입력: 발산원 형태·작업종(분진작업 26종 코드)·후드형식(포위/외부/캐노피/  │
│        리시빙/슬롯)·발산원 면적                                          │
│  출력: 제어풍속 V_c (KOSHA W-1 별표13) · 후드 풍량 Q_h · 정압손실        │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 3: 덕트 사이징 (Duct Sizing)                                       │
│  입력: 분기수·길이·굴곡수·합류 T수·분진 반송속도(15~25 m/s)              │
│  출력: 덕트 직경 · 직선·국부 손실 · 등압법/등속법 비교 · 총정압           │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 4: 처리방식 결정 (Treatment: Dry / Wet / Semi-dry)                 │
│  결정트리:                                                                │
│   - 폭발성? → 사이클론+백필터(방폭벤트) [건식] OR 습식                   │
│   - 점착성·고온·산성? → 반건식 SDA 또는 습식                             │
│   - 일반 분진 → 건식                                                      │
│  출력: 처리방식 + 1차/2차/3차 단계 구성                                   │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 5: 집진방식 선정 (6종)                                             │
│  입력: 입경·농도·온도·목표효율·예산                                       │
│  분기:                                                                    │
│   - 5-A 여과집진 (백필터 펄스제트/리버스에어/카트리지) — 여재 12종        │
│   - 5-B 원심집진 (사이클론 6종 + 멀티/더블/인라인)                       │
│   - 5-C 전기집진 (건식 EP / 습식 WESP)                                    │
│   - 5-D 세정집진 (벤추리 / 패킹 / 스프레이)                               │
│   - 5-E 중력집진 (셋틀링 챔버) — 전처리만                                │
│   - 5-F 관성집진 (루버 / 충돌형) — 전처리                                │
│  출력: 1순위/2순위 권장 + 구성도 (예: 사이클론+백필터+활성탄)             │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 6: 응축기/열교환기 결정 (Condenser/HX) + 폐열회수                  │
│  결정트리:                                                                │
│   - T_in > 후단여재한계 + 20°C? → 냉각필요                                │
│   - 점착성/타르? → Direct Quench                                          │
│   - 폐열활용? → Shell&Tube WHB + ROI                                      │
│   - FGD 후단? → GGH                                                       │
│   - 일반 → PHE / 핀튜브 / 공냉                                            │
│  출력: HX형식 · T_out 목표 · 노점 마진 · 응축수량 · 폐열 kW · ROI         │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 7: 송풍기 배치 (Fan Arrangement)                                   │
│  결정매트릭스:                                                            │
│   - Q < 5,000 m³/min · ΔP < 300 mmAq · 단순 → 1팬 ID                     │
│   - Q < 50,000 · ΔP < 600 · 다지점/SDA/장거리 → FD+ID 2팬                │
│   - Q > 50,000 · 대형/이중화 → N+1 병렬 다팬                              │
│  형식: Radial(분진/고온) / Turbo(일반) / Airfoil(청정) /                  │
│        Sirocco(소형) / Axial(저정압)                                      │
│  VFD: 부하변동>20% + 운전>4000h + 모터≥30kW 시 권장                      │
│  출력: 배치도 · 형식 · BHP · VFD ROI · 안전여유                           │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 8: 안전·법규 컴플라이언스 (Safety & Compliance)                    │
│  자동판정 12항목:                                                         │
│   1) 사업장 종별 (1~5종)        7) 별표13 제어풍속 적용값                │
│   2) 배출허용기준 (별표8)        8) 안전검사 도래일 (3년/2년 사이클)      │
│   3) TMS 의무                    9) 유해위험방지계획서 제출 필요          │
│   4) 비산먼지 신고               10) 작업환경측정 주기                    │
│   5) VOC 시설 적용               11) 분진폭발 Zone 20/21/22 구분          │
│   6) 분진작업 26종 적용          12) 적용 가능한 보조금·융자              │
│  출력: 컴플라이언스 리포트 PDF + 체크리스트                              │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 9: 산출물 (Deliverables)                                           │
│   - PFD/P&ID 자동도면 (React Flow + drawio 심볼)                         │
│   - 3D 미리보기 + 모바일 AR (R3F + model-viewer)                          │
│   - 단면도/배치도 SVG (Konva)                                             │
│   - DXF 다운로드 (@dxfjs/writer)                                          │
│   - PDF 설계보고서 8~12페이지 (@react-pdf/renderer + Pretendard)         │
│   - BOM 엑셀 (xlsx)                                                       │
│   - 5년 TCO 그래프 (Recharts)                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

각 단계 출력은 다음 단계 입력으로 흘러가며, 사용자가 한 단계 변경 시 하위 단계만 자동 재계산. 모든 단계 데이터는 단일 JSON 시스템 사양으로 직렬화.

---

## 2. 처리방식 × 집진방식 매트릭스 (18조합)

| | 건식(Dry) | 습식(Wet) | 반건식(Semi-dry/SDA) |
|---|---|---|---|
| 여과(Bag/Cartridge) | ◎ 표준 (목공·금속·시멘트밀·EAF) | × | ◎ SDA + 백필터 (소각·바이오매스) |
| 원심(Cyclone) | ◎ 전처리·곡물·목재 | △ Cyclonic separator (스크러버 후단) | × |
| 전기(EP) | ◎ 시멘트킬른·발전소 | ◎ WESP (서브미크론·산미스트) | △ |
| 세정(Scrubber) | × | ◎ 벤추리·패킹·스프레이 (FGD/유증기/산미스트) | ◎ SDA (석회 슬러리 분무) |
| 중력(Settling) | △ 전처리만 | × | × |
| 관성(Inertial) | △ 전처리·미스트엘리미네이터 | △ 미스트엘리미네이터 | × |

◎ = 표준조합 / △ = 보조 / × = 부적합

핵심 표준 5조합:
1. **건식 백필터 단독** — 일반 산업
2. **건식 사이클론 + 백필터** — 폭발성/고농도
3. **건식 EP** — 시멘트·발전 (대용량 고온)
4. **반건식 SDA + 백필터 + 활성탄** — 소각 (HCl/SOx/Hg/Dioxin)
5. **습식 벤추리 + 사이클로닉 + 미스트E** — 점착성/유증기/산미스트

자세한 매트릭스: `docs/02_collector_matrix/`

---

## 3. 5종 표준 P&ID 흐름도 (자동생성 프리셋)

### 흐름도 1: 건식 백필터 단독
```
[Hood/BD]→[Duct]→[Damper]→[Baghouse + ER벤트]→[Hopper/RV]→[ID Fan/VFD]→[Stack/CEMS]
                                  ↑ Pulse Jet (Air receiver, SV array, Sequencer)
                          계장: ΔPT, TT, AT
```

### 흐름도 2: 사이클론 + 백필터
```
[Hood]→[Duct]→[Cyclone]→[Baghouse + ER]→[ID Fan]→[Stack]
                  ↓RV         ↓RV
              [Coarse Bin] [Fine Bin]
```

### 흐름도 3: EP 단독 (시멘트/발전)
```
[Boiler]→[GGH/Cooler 150°C]→[ESP 2~4 field]→[ID Fan]→[Stack]
                                  ↓Rapper, Hopper/RV
   FD 옵션: [FD Fan]→[Boiler]에서 시작 (양압 방지 시 FD+ID)
```

### 흐름도 4: 반건식 SDA + 백필터 (소각)
```
[Furnace]→[Boiler/HX]→[SDA(Ca(OH)₂)]→[AC injection]→[Baghouse]→[ID Fan]→[Stack]
                            ↑                ↑                   ↓CEMS
                      Lime slurry    Activated Carbon
                                   (Hg/Dioxin 흡착)
```

### 흐름도 5: 습식 벤추리 + 사이클로닉
```
[Hood]→[Quencher]→[Venturi(가변throat)]→[Cyclonic Sep]→[Mist Eliminator]→[ID Fan(FRP/SS316)]→[Stack]
              ↑              ↑                ↓Slurry
          냉각수 분무      ΔP 30~150 mbar   [Slurry tank/Pump]
```

이 5종은 위저드 1단계에서 사용자가 산업 카테고리(목공/시멘트/소각/제련/화학/유증기 등) 선택 시 자동 추천 → 나머지 단계 기본값 자동입력. 사용자는 각 단계에서 수정만.

자세한 다이어그램·심볼: `docs/04_flowcharts/`

---

## 4. 핵심 계산엔진 식 (lib/calc/dust/)

### 4-1. 후드 (KOSHA W-1)
```
포위형:    Q = 60 × A_o × V_c           (A_o=개구면적, V_c=별표13 제어풍속)
외부식:    Q = 60 × V_c × (10X² + A)    (X=발산원거리, A=후드면적)
캐노피:    Q = 1.4 × P × V_c × H        (P=발산원둘레, H=높이)
```

### 4-2. 덕트 손실
```
직선:     ΔP_s = f × (L/D) × ρ × V²/2     (f=Darcy 마찰계수, Moody chart)
국부:     ΔP_l = K × ρ × V²/2              (K=엘보·확대축소·T 등 손실계수)
반송속도: 분진 18~23 m/s, 흄 8~10 m/s, 가스 6~12 m/s
```

### 4-3. 사이클론 (Stairmand HE 기준)
```
표준비율:  a/D=0.5, b/D=0.2, De/D=0.5, S/D=0.5, h/D=1.5, H/D=4.0, B/D=0.375
입구속도:  V_i = 15~20 m/s (효율피크 ≈ 13 m/s)
ΔP:        K × ρ × V_i²/2  (K=NH: HE≈6.4, Lapple≈8, Swift HE≈9.24)
컷오프:    d_50 = √[9μb / (2π·N_e·V_i·(ρ_p-ρ_g))]   (Lapple)
효율:      η(d) = 1/[1+(d_50/d)²]   (단순) 또는 1-exp[-(d/d_50)^n]   (Rosin-Rammler)
```

### 4-4. 전기집진 (Deutsch + Matts)
```
Deutsch:           η = 1 - exp(-A·w/Q)
Modified D-Matts:  η = 1 - exp[-(A·w_k/Q)^k]   (k=0.4~0.7)
SCA:               A/Q (m²/(m³/s))   99% 효율 시 50~80, 99.9% 시 100~200
드리프트속도 w:    비산회 0.05~0.15, 시멘트 0.06~0.08, 펄프 0.1~0.2 m/s
비저항 영향:       <10⁴=재비산, 10⁴~10¹⁰=정상, 10¹⁰~10¹¹=한계, >10¹¹=백코로나
```

### 4-5. 백필터 (A/C ratio)
```
A/C ratio = Q / A_filter (m/min 또는 ft/min)
펄스제트 (일반산업):  1.2~1.5 m/min (4~5 ft/min)
펄스제트 (시멘트):    0.6~0.9 m/min
리버스에어:           0.3~0.6 m/min
카트리지 (용접흄):    0.45~0.75 m/min
ΔP_total = ΔP_clean + K_2 × C × V × t   (Darcy법칙 변형)
```

### 4-6. 응축기 노점 (Verhoff-Banchero)
```
황산노점 [K]: 1000/T_dp = 2.276 - 0.0294·ln(P_H2O) - 0.0858·ln(P_H2SO4)
                          + 0.0062·ln(P_H2O × P_H2SO4)
설계룰:    T_skin ≥ T_dp + 15~20°C (마진)
응축수:    m_cond = Q_dry × (W_in - W_out) × 0.804  [kg/h]
```

### 4-7. 송풍기 동력
```
BHP[kW] = Q[m³/s] × ΔP_total[Pa] / (1000 × η_fan × η_drive × η_motor)
ΔP_total = ΔP_hood + ΔP_duct + ΔP_fitting + ΔP_collector + ΔP_stack + Margin
Q_design = Q_oper × (T_oper+273)/(T_std+273)   (고온환산)
안전여유:  정압 +15~25%, 풍량 +5~10%, 동력 +20~30%
어피니티:  P ∝ N³  (VFD 절감 추정)
```

자세한 코드 매핑: `docs/05_calc_engine/`

---

## 5. 법규 컴플라이언스 엔진 (15 input → 12 output)

### 입력 15개
1. 사업장 소재지(시·도)
2. 업종(KSIC)
3. 연간 대기오염물질 발생량(t)
4. 시간당 배출가스량(Sm³/h)
5. 시설 신·증설일
6. 분진종류(KSIC+CAS)
7. 분진 가연성·Kst
8. 분진 입경 D50
9. 다이옥신 발생 가능성
10. VOC 사용량(t/yr)
11. 작업종(분진작업 26종 코드)
12. 국소배기 배풍량(m³/min)
13. 근로자 수·노출시간
14. 시설용량(소각 t/h, 보일러 MW)
15. 위험물·유해화학물질 취급여부

### 자동 출력 12항목 (PDF 리포트)
1. 사업장 종별 (1~5종)
2. 적용 배출허용기준 (먼지·SOx·NOx·HCl·HF·중금속)
3. TMS 부착 의무
4. 비산먼지 발생사업 신고
5. VOC 배출시설 적용
6. 분진작업 26종 적용 + 의무사항
7. 별표13 제어풍속 적용값 + W-1·W-2·W-3 권장설계
8. 안전검사 도래일 (설치+3년, 이후 2년)
9. 유해위험방지계획서 (작업개시 -15일)
10. 작업환경측정 주기 + 발암성 30년 보존
11. 분진폭발 Zone 20/21/22 + ST등급 + 폭발벤트 면적 + ATEX/IECEx 권장
12. 적용 가능 보조금·융자 매칭

### 룰엔진 시드 데이터 형식 (YAML)
```yaml
# docs/03_compliance/rules/emission_standards.yaml
business_classification:
  - {emission_t: 80,   class: "1종"}
  - {emission_t: 20,   class: "2종"}
  - {emission_t: 10,   class: "3종"}
  - {emission_t: 2,    class: "4종"}
  - {emission_t: 0,    class: "5종"}

dust_works_26:  # 산안법 별표16
  - id: 1, desc: "갱내에서 광물 채굴/운반/파쇄"
  - id: 5, desc: "광물·암석 분쇄/연마"
    obligations: [LEV_required, safety_inspection]
  # ... 26호 전체

control_velocity:  # 별표13
  enclosing:    {gas: 0.4,  particle: 0.7}
  exterior_lateral: {gas: 0.5, particle: 1.0}
  canopy:       {gas: 1.0, particle: 1.5}
```

자세한 룰셋: `docs/03_compliance/`

---

## 6. 폴더 구조 (확정안)

```
D:\claude\집진설비만들기\
├── BLUEPRINT.md                     ← 이 문서
├── ROADMAP.md                       ← 단계별 일정
├── LOG.md                           ← 작업로그(실시간)
├── CHANGELOG.md                     ← 버전 변경
├── CHECKLIST.md                     ← v1.0 출시 체크
├── BACK-CHECKLIST.md                ← 미해결 추적
├── REPORT.md                        ← 검증결과
│
├── reference\
│   ├── 전문\                        ← F:\전문 심볼릭링크 (5폴더)
│   │   ├── 울진소각                  ← F:\전문\경호\11.울진소각
│   │   ├── 청주음폐수에너지화        ← F:\전문\경호\30.청주음폐수에너지화
│   │   ├── 폐열발전설비              ← F:\전문\경호\44.폐열발전설비
│   │   ├── 배관기술자료              ← F:\전문\메인\배관기술자료
│   │   └── 압력손실자료              ← F:\전문\경호\0.프로젝트기타자료
│   └── mywiki\                      ← E:\mywiki 핵심노트
│       ├── report_generator_web_app.md
│       ├── 13_firebase_mcp_guide.md
│       └── ... (8개)
│
├── docs\
│   ├── 01_design_methodology\       ← 진행방식 디테일
│   │   ├── 8stage_workflow.md       ← 8단 위저드 흐름
│   │   ├── data_flow.md             ← Stage→Stage 데이터 전달
│   │   └── decision_tree.md         ← 결정트리 의사코드
│   ├── 02_collector_matrix\         ← 집진방식 18조합
│   │   ├── matrix_18.md             ← 건/습/반건 × 6방식
│   │   ├── cyclone_design.md        ← 사이클론 6종 표준
│   │   ├── ep_design.md             ← EP/WESP Deutsch
│   │   ├── bag_filter_design.md     ← 백필터 A/C·여재 12종
│   │   ├── scrubber_design.md       ← 벤추리·패킹·SDA
│   │   └── industry_standards.md    ← 산업별 표준조합 17개
│   ├── 03_compliance\               ← 법규 룰엔진
│   │   ├── air_quality_act.md       ← 대기환경보전법
│   │   ├── osh_act.md               ← 산안법 + 별표16/13
│   │   ├── kosha_guides.md          ← W-1, D-43, P-131 등
│   │   ├── waste_chem_acts.md       ← 폐기물·화관법
│   │   ├── subsidies.md             ← 보조금·융자
│   │   └── rules\                   ← YAML 룰셋
│   ├── 04_flowcharts\               ← P&ID 표준
│   │   ├── 5_standard_flows.md      ← 5종 프리셋
│   │   ├── pid_symbols.md           ← ISO 14617 + ISA-5.1
│   │   ├── system_json_schema.md    ← JSON 직렬화 스키마
│   │   └── auto_generation.md       ← React Flow 구현가이드
│   ├── 05_calc_engine\              ← 계산식 → 코드 매핑
│   │   ├── 01_dust_properties.md
│   │   ├── 02_hood.md
│   │   ├── 03_duct.md
│   │   ├── 04_treatment_branch.md
│   │   ├── 05a_filter.md
│   │   ├── 05b_cyclone.md
│   │   ├── 05c_ep.md
│   │   ├── 05d_scrubber.md
│   │   ├── 06_condenser_hx.md
│   │   ├── 07_fan.md
│   │   └── 08_safety_compliance.md
│   ├── 06_tech_stack\               ← 기술스택 결정
│   │   ├── library_choices.md       ← 7개 영역 1순위/2순위
│   │   ├── nextjs_react19_notes.md  ← 호환성 이슈
│   │   └── ks_drawing_standards.md  ← KS A 0005/0106
│   └── 99_research\                 ← 원본 리서치 보고서
│       ├── collector_matrix_research.md
│       ├── compliance_research.md
│       ├── flowchart_research.md
│       ├── techstack_research.md
│       └── fan_condenser_research.md
│
├── app\                             ← Next.js 15 (참고방 패턴)
│   ├── (marketing)\
│   │   ├── page.tsx                 ← 홈
│   │   ├── compare\                 ← SEO: 카트리지 vs 백필터 등
│   │   └── industries\              ← SEO: 산업별 솔루션
│   ├── designer\                    ← 8단 위저드 (메인)
│   │   ├── stage-1-properties\
│   │   ├── stage-2-hood\
│   │   ├── stage-3-duct\
│   │   ├── stage-4-treatment\
│   │   ├── stage-5-collector\
│   │   ├── stage-6-condenser\
│   │   ├── stage-7-fan\
│   │   ├── stage-8-compliance\
│   │   └── result\
│   ├── compliance\                  ← 법규 자가진단 (단독 진입)
│   ├── tco\                         ← Lifecycle TCO
│   ├── 3d\                          ← 3D 뷰어 + AR
│   ├── tools\                       ← 단일 계산기 (SEO 자석)
│   │   ├── airflow\                 ← 풍량 계산기
│   │   ├── hood\                    ← 후드 계산기
│   │   ├── pressure-loss\           ← 정압손실 계산기
│   │   └── dewpoint\                ← 노점 계산기
│   ├── account\, login\, pricing\   ← 참고방 패턴
│   └── api\
│       ├── pdf\, paypal\, toss\, v1\calc\
│
├── components\
│   ├── designer\                    ← 8단 위저드 컴포넌트
│   ├── flowchart\                   ← P&ID 자동생성
│   ├── 3d\                          ← R3F + model-viewer
│   ├── compliance\                  ← 법규 리포트
│   └── ... (참고방 공유 컴포넌트)
│
├── lib\
│   ├── calc\dust\                   ← 8단 계산엔진
│   │   ├── 01-properties.ts
│   │   ├── 02-hood.ts
│   │   ├── 03-duct.ts
│   │   ├── 04-treatment.ts          ← 건/습/반건 분기
│   │   ├── 05-cyclone.ts            ← 사이클론 6종
│   │   ├── 05-bag.ts                ← 백필터
│   │   ├── 05-cartridge.ts
│   │   ├── 05-ep.ts                 ← EP/WESP
│   │   ├── 05-scrubber.ts
│   │   ├── 05-settling.ts
│   │   ├── 05-inertial.ts
│   │   ├── 06-condenser.ts          ← 5형식 + 노점
│   │   ├── 07-fan.ts                ← 1팬/2팬/N+1
│   │   ├── 08-safety.ts             ← 분진폭발
│   │   ├── 08-compliance.ts         ← 법규 룰엔진
│   │   ├── engine.ts                ← 8단 통합 파이프라인
│   │   └── validate.ts              ← 단계별 검증
│   ├── drawing\dust\                ← 도면자동생성
│   │   ├── pid-generator.ts         ← System JSON → React Flow nodes
│   │   ├── presets\                 ← 5종 표준 흐름도
│   │   ├── symbols\                 ← ISO/ISA SVG 심볼
│   │   ├── layout\                  ← elkjs/dagre
│   │   └── dxf-export.ts
│   ├── data\dust\
│   │   ├── dust-types.ts            ← 분진 80종 DB
│   │   ├── filter-media.ts          ← 여재 12종
│   │   ├── cyclone-standards.ts     ← Stairmand/Lapple/Swift 비율
│   │   ├── hood-types.ts            ← 후드 8종 풍량식
│   │   ├── duct-fittings.ts         ← 손실계수
│   │   ├── fan-curves.ts            ← 송풍기 5형식 성능
│   │   ├── kosha-controls.ts        ← W-1 별표13
│   │   ├── dust26-list.ts           ← 산안법 별표16
│   │   └── industries.ts            ← 17 산업별 표준조합
│   ├── compliance\                  ← 법규 룰엔진
│   │   ├── rules-loader.ts          ← YAML 로딩
│   │   ├── classifier.ts            ← 사업장 종별 분류
│   │   ├── obligations.ts           ← 의무 매핑
│   │   └── report-builder.ts        ← 12항목 PDF
│   ├── firebase\dust-designs.ts
│   └── store\dust-store.ts          ← Zustand 8단 상태
│
├── functions\src\                   ← PayPal/토스 webhook (벨트 공유)
├── public\
│   ├── 3d-models\                   ← glTF (필터/사이클론/EP/후드)
│   ├── catalogs\                    ← 참고 PDF
│   └── fonts\Pretendard\
└── scripts\
    ├── verify-cases.mjs             ← 실측 검증
    ├── seed-dust-types.mjs
    └── compile-rules.mjs            ← YAML→TS
```

---

## 7. 기술스택 (확정)

| # | 영역 | 1순위 | 2순위 백업 |
|---|---|---|---|
| 1 | 프레임워크 | Next.js 15 + React 19 + TypeScript | (참고방 동일) |
| 2 | 상태관리 | Zustand 5 | - |
| 3 | UI | Tailwind 3 + Radix/shadcn | - |
| 4 | 폼/검증 | React Hook Form + Zod | - |
| 5 | DB/Auth | Firebase Firestore + Auth + Functions | - |
| 6 | 3D 뷰어 | @react-three/fiber@9 + drei | Babylon.js |
| 7 | AR | @google/model-viewer | 8th Wall |
| 8 | P&ID | @xyflow/react | JointJS Core |
| 9 | 배치도/단면도 | konva + react-konva | D3 + 순정 SVG |
| 10 | DXF 출력 | @dxfjs/writer | MakerJS |
| 11 | PDF 보고서 | @react-pdf/renderer 4.x | pdfmake |
| 12 | 차트 | Recharts | Apache ECharts |
| 13 | 엑셀 | xlsx (SheetJS) | exceljs |
| 14 | 단위환산 | mathjs | convert-units |
| 15 | 레이아웃 | elkjs / dagre | - |
| 16 | 테스트 | Vitest | - |
| 17 | i18n | next-intl | - |

---

## 8. ROADMAP 요약 (v1.0 MVP — 12주)

| Phase | 주차 | 마일스톤 |
|---|---|---|
| **Phase 0 — 기반** | 1 | 작업방 폴더·심볼릭링크·Blueprint 확정·기술스택 확정·F전문 자료 인덱싱 |
| **Phase 1 — 계산엔진 1/2** | 2~3 | calc/dust 1~4단 (분진성상→후드→덕트→처리방식분기) + 단위테스트 50건 |
| **Phase 2 — 계산엔진 2/2** | 4~5 | calc/dust 5~8단 (집진방식·응축기·송풍기·안전·법규) + 60건 |
| **Phase 3 — 데이터 시드** | 6 | 분진80/여재12/사이클론6/후드8/송풍기5형식/산업17/법규YAML |
| **Phase 4 — 위저드 UI** | 7 | designer 8단 페이지 + Zustand + 결과카드 + 검증배너 |
| **Phase 5 — 도면·보고서** | 8~9 | React Flow P&ID 5프리셋 + Konva 배치도 + DXF + PDF 12페이지 + BOM |
| **Phase 6 — 차별화** | 10 | 3D 뷰어 + AR 버튼 + Compliance 리포트 + TCO 그래프 |
| **Phase 7 — 결제·SEO** | 11 | 6단계 요금제(간략) + SEO 페이지 5개 + 단일 계산기 4종 |
| **Phase 8 — QA·배포** | 12 | E2E·실측검증·성능·배포 |

상세 일정: `ROADMAP.md`

---

## 9. 다음 단계 (사용자 승인 필요)

1. ✅ 본 BLUEPRINT v2 검토 → OK or 수정 의견
2. 작업방에 ROADMAP/CHECKLIST/BACK-CHECKLIST/LOG/CHANGELOG/REPORT 골격 생성
3. `docs/` 하위 11개 디테일 문서 작성
4. `reference/전문/` 5개 심볼릭링크 (관리자 권한 필요 시 안내)
5. `reference/mywiki/` 8개 노트 심볼릭링크
6. `package.json` 초기화 (벨트작업방 의존성 베이스 + 추가 라이브러리)
7. Phase 0 → Phase 1 시작 (Next.js scaffold + calc/dust 1~4단)

**현재 상태: Phase 0 진행 중. 사용자 승인 후 Phase 1 진입.**
