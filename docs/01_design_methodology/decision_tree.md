# 통합 의사결정 트리 (의사코드)

본 문서는 8단 위저드 전체에서 수행되는 자동 의사결정의 최상위 의사코드를 정의한다. lib/calc/dust/engine.ts 의 reference implementation.

```python
def design_dust_collector(input):
    # ────────────────── Stage 1: Properties ──────────────────
    s1 = analyze_properties(input.dust, input.gas)
    # s1.ST_class, s1.resistivity_range, s1.dewpoint_acid, s1.treatment_candidates
    
    # ────────────────── Stage 2: Hood ──────────────────
    V_c = lookup_kosha_w1_table13(input.dust26_code, input.hood_type)
    Q_h = calc_hood_flowrate(input.hood_type, input.area, V_c, input.SF)
    dP_h = (1 + K_hood) * rho * V_h**2 / 2
    s2 = {V_c, Q_h, dP_h}
    
    # ────────────────── Stage 3: Duct ──────────────────
    V_t = recommend_transport_velocity(input.dust, s1)  # 18~23 분진, 8~10 흄
    D = round_up_standard(sqrt(4*Q_h/(pi*V_t)))
    Re = rho*V_t*D/mu
    f = colebrook(Re, roughness/D)
    dP_straight = f*(L/D)*rho*V_t**2/2
    dP_local = sum(K_i * rho * V_t**2 / 2 for K_i in fittings)
    s3 = {D, V_t, dP_duct: dP_straight + dP_local}
    
    # ────────────────── Stage 4: Treatment Branch ──────────────────
    if s1.dust.flammable and s1.dust.Kst > 0:
        if input.water_available and not s1.gas.water_sensitive:
            treatment = ["wet", "dry+explosion_protection"]
        else:
            treatment = ["dry+explosion_protection"]
    elif s1.dust.stickiness == "high" or s1.dust.tar:
        treatment = ["wet", "semi-dry"]
    elif s1.gas.HCl > 50 or s1.gas.SO2 > 100:
        treatment = ["semi-dry+SDA", "wet"]
    elif s1.gas.T_in > 400:
        treatment = ["dry+precool", "wet+quench"]
    else:
        treatment = ["dry"]
    s4 = {treatment_ranked: rank(treatment, by=score)}
    
    # ────────────────── Stage 5: Collector ──────────────────
    if s4.treatment[0] == "dry":
        if input.target_efficiency < 95:
            collector = "cyclone"
        elif s1.dust.d50 > 5 and input.conc_in > 50:
            collector = ["cyclone", "bag_filter"]  # 직렬
        elif s1.gas.T_in > 250:
            collector = "ep" if s1.dust.resistivity in (1e4, 1e10) else "bag_glassfiber"
        else:
            collector = "bag_filter" if input.conc_in > 1 else "cartridge"
    elif s4.treatment[0] == "semi-dry":
        collector = ["sda", "bag_filter", "activated_carbon"]
    elif s4.treatment[0] == "wet":
        if s1.dust.d50 < 1:
            collector = ["venturi", "cyclonic_separator", "mist_eliminator"]
        else:
            collector = ["packed_tower", "mist_eliminator"]
    
    s5 = design_collector(collector, s1, s3)
    # 사이클론: Stairmand HE 표준비율, V_i=18 m/s
    # 백필터: A/C ratio, 여재 선택, ΔP 모델
    # EP: SCA 계산 (Deutsch + 비저항 보정)
    
    # ────────────────── Stage 6: Condenser/HX ──────────────────
    T_filter_limit = filter_media[s5.media].T_max  # PTFE 260, P84 240, 노멕스 200
    T_required = T_filter_limit - 30
    T_dp_acid = verhoff_banchero(s1.gas.SO3, s1.gas.H2O)
    T_target = max(T_required, T_dp_acid + 20)
    
    if s1.gas.T_in <= T_target + 10:
        condenser = None
    elif s1.dust.stickiness == "high" or s1.dust.tar:
        condenser = "direct_quench"
    elif s1.gas.T_in > 800:
        condenser = "direct_quench"
    elif s1.gas.T_in > 350 and input.has_waste_heat_use:
        condenser = "shell_tube_WHB"
        ROI = calc_ROI(waste_heat_kW, op_hours, R_kWh, capex_HE)
    elif s4.treatment[0] == "wet" and "FGD" in s5.collectors:
        condenser = "GGH_regenerative"
    elif s1.gas.T_in < 200:
        condenser = "plate_PHE"
    else:
        condenser = "finned_tube_APH"
    
    m_cond = condensate_rate(s1.gas, T_target)
    s6 = {condenser, T_target, m_cond, ROI, material: select_material(T_dp_acid)}
    
    # ────────────────── Stage 7: Fan ──────────────────
    dP_total = s2.dP_h + s3.dP_duct + s5.dP + s6.dP + dP_stack + margin(0.20)
    Q_design = Q_h * (T_in_K)/(T_std_K) * 1.10  # 풍량 마진 10%
    
    # 1팬 vs 2팬 vs N+1
    if Q_design < 5000 and dP_total < 300 and s2.points <= 5:
        arrangement = "1_ID"
    elif Q_design < 50000 and dP_total < 600:
        arrangement = "FD+ID_balanced"
    else:
        arrangement = f"{ceil(Q_design/30000)}_parallel_plus1"
    
    # 형식
    if conc_in_fan > 10 or s1.gas.T_in > 300:
        fan_type = "Radial"
    elif gas_clean_after_collector and dP_total > 400:
        fan_type = "Airfoil"
    elif dP_total > 200:
        fan_type = "Turbo_BC"
    else:
        fan_type = "Sirocco" if Q_design < 500 else "Axial"
    
    BHP = Q_design * dP_total / (1000 * eta_fan * eta_motor)
    motor_kW = round_up_standard_motor(BHP * 1.20)
    
    # VFD
    if input.load_variation > 0.20 and op_hours > 4000 and motor_kW >= 30:
        use_VFD = True
        VFD_payback = C_VFD / (P_rated * LF * h * R_kWh * (1 - (N_avg/N_max)**3))
    
    s7 = {arrangement, fans: [...], total_kW, annual_kWh, VFD_payback}
    
    # ────────────────── Stage 8: Safety & Compliance ──────────────────
    # 사업장 종별
    classification = classify_business(input.annual_emission_t)
    
    # 배출허용기준
    standards = lookup_emission_standards(
        class_no=classification, facility_type, install_date)
    
    # 분진작업 26종
    if input.dust26_code is not None:
        dust26_obligations = lookup_dust26(input.dust26_code)
        # = LEV 의무, 안전검사, 유해위험방지계획서 등
    
    # 분진폭발 Zone
    if s1.dust.flammable:
        zone20 = ["baghouse_internal", "hopper", "duct_post_collector"]
        zone21 = ["doors", "inspection_ports", "vent_area"]
        zone22 = ["surrounding_room"]
        ST = classify_ST(s1.dust.Kst)
        vent_area = nfpa68_vent_area(V_vessel, P_red, P_stat, s1.dust.Kst)
    
    # 안전검사 도래일
    inspection_first = install_date + 3*365
    inspection_recurring = install_date + n*2*365
    
    # 유해위험방지계획서
    if s2.Q_h >= 60 or (s2.Q_h >= 150 and dust26_code in (5..25)):
        prevention_plan_required = True
        deadline = work_start_date - 15
    
    # 보조금 매칭
    subsidies = match_subsidies(classification, install_date, region)
    
    s8 = {classification, standards, obligations: [...], explosion, subsidies, disclaimer}
    
    return SystemDefinition(meta, s1, s2, s3, s4, s5, s6, s7, s8)
```
