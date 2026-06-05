"use client";
import { useDustStore } from "@/lib/store/dust-store";
import { WizardNav } from "@/components/designer/WizardNav";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { Field, Select } from "@/components/ui/Input";
import { ValidationBanner } from "@/components/designer/ValidationBanner";
import { fmt, fmtPa_to_mmAq } from "@/lib/utils";
import Link from "next/link";

export default function Stage5Page() {
  const inputs = useDustStore((s) => s.inputs.stage5);
  const outputs = useDustStore((s) => s.outputs.stage5);
  const setInput = useDustStore((s) => s.setStage5Input);

  return (
    <>
      <WizardNav currentStage={5} />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Stage 5 — 집진방식</CardTitle>
          <div className="space-y-4">
            <Field label="1차 집진방식">
              <Select
                value={inputs?.primary ?? "bag_filter"}
                onChange={(e) => setInput({ primary: e.target.value as any })}
              >
                <option value="bag_filter">백필터 (펄스제트)</option>
                <option value="cartridge">카트리지 필터</option>
                <option value="cyclone">사이클론</option>
                <option value="ep">전기집진기 (EP)</option>
                <option value="scrubber">습식 스크러버</option>
              </Select>
            </Field>
            {inputs?.primary === "cyclone" && (
              <Field label="사이클론 표준">
                <Select
                  value={inputs.cyclone?.standard ?? "Stairmand_HE"}
                  onChange={(e) => setInput({ cyclone: { ...inputs.cyclone, standard: e.target.value as any } })}
                >
                  <option value="Stairmand_HE">Stairmand HE (정밀)</option>
                  <option value="Stairmand_HT">Stairmand HT (대용량)</option>
                  <option value="Lapple">Lapple GP</option>
                  <option value="Swift_HE">Swift HE</option>
                  <option value="Swift_GP">Swift GP</option>
                  <option value="Peterson">Peterson-Whitby</option>
                </Select>
              </Field>
            )}
            {inputs?.primary === "scrubber" && (
              <Field label="스크러버 형식">
                <Select
                  value={inputs.scrubber?.type ?? "venturi"}
                  onChange={(e) => setInput({ scrubber: { ...inputs.scrubber, type: e.target.value as any } })}
                >
                  <option value="venturi">벤추리 (가변throat)</option>
                  <option value="packed">패킹베드</option>
                  <option value="spray">스프레이</option>
                  <option value="cyclonic">사이클로닉</option>
                  <option value="sda">SDA (반건식)</option>
                </Select>
              </Field>
            )}
            {inputs?.primary === "ep" && (
              <Field label="EP 형식">
                <Select
                  value={inputs.ep?.ep_type ?? "dry"}
                  onChange={(e) => setInput({ ep: { ...inputs.ep, ep_type: e.target.value as any } })}
                >
                  <option value="dry">건식 EP</option>
                  <option value="wet">습식 WESP</option>
                </Select>
              </Field>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>집진기 사양</CardTitle>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard
                label="전체 효율"
                value={outputs ? `${(outputs.efficiency_overall * 100).toFixed(2)}%` : "—"}
                big color="brand"
              />
              <KpiCard
                label="ΔP_collector"
                value={fmtPa_to_mmAq(outputs?.dP_collector_Pa ?? 0)}
                big color="safety"
              />
            </div>

            {outputs?.bag && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                <div className="font-bold mb-1">백필터</div>
                <div>여재: <span className="font-mono">{outputs.bag.media.code}</span> ({outputs.bag.media.full_name})</div>
                <div>A/C: {fmt(outputs.bag.AC_ratio_m_min, 2)} m/min</div>
                <div>면적: {fmt(outputs.bag.A_total_m2, 0)} m² ({outputs.bag.bag_count}개 백)</div>
                <div>청소주기: {fmt(outputs.bag.cleaning_interval_min, 0)} 분</div>
              </div>
            )}
            {outputs?.cyclone && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                <div className="font-bold mb-1">사이클론</div>
                <div>본체 직경 D: {fmt(outputs.cyclone.D_m * 1000, 0)} mm</div>
                <div>입구속도 V_i: {fmt(outputs.cyclone.V_i_m_s, 1)} m/s</div>
                <div>컷오프 d50: {fmt(outputs.cyclone.d50_um, 1)} μm</div>
                <div>대수: {outputs.cyclone.count}대</div>
              </div>
            )}
            {outputs?.ep && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                <div className="font-bold mb-1">전기집진기</div>
                <div>SCA: {fmt(outputs.ep.SCA_s_per_m, 1)} s/m</div>
                <div>집진면적: {fmt(outputs.ep.A_total_m2, 0)} m²</div>
                <div>필드: {outputs.ep.field_count}개</div>
                <div>드리프트 속도: {fmt(outputs.ep.drift_velocity_m_s, 3)} m/s</div>
                <div>인가전압: {outputs.ep.voltage_kV} kV</div>
                {outputs.ep.conditioning && (
                  <div className="mt-1 text-amber-700">⚠ {outputs.ep.conditioning.recommendation}</div>
                )}
              </div>
            )}
            {outputs?.scrubber && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                <div className="font-bold mb-1">스크러버 ({outputs.scrubber.type})</div>
                {outputs.scrubber.V_throat_m_s && <div>Throat 속도: {outputs.scrubber.V_throat_m_s} m/s</div>}
                <div>L/G: {fmt(outputs.scrubber.L_G_L_per_m3, 2)} L/m³</div>
                <div>물 소비: {fmt(outputs.scrubber.water_consumption_m3h, 1)} m³/h</div>
                <div>폐수: {fmt(outputs.scrubber.wastewater_m3h, 1)} m³/h</div>
                {outputs.scrubber.reagent_consumption_kg_h != null && (
                  <div>반응물: {fmt(outputs.scrubber.reagent_consumption_kg_h, 1)} kg/h Ca(OH)₂</div>
                )}
                <div>재질: {outputs.scrubber.material_recommendation}</div>
              </div>
            )}
          </Card>

          <ValidationBanner warnings={outputs?.warnings ?? []} title="집진기 검증" />

          <div className="flex justify-between">
            <Link href="/designer/stage-4" className="px-4 py-2 text-brand-700 hover:underline">← Stage 4</Link>
            <Link href="/designer/stage-6" className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700">
              Stage 6 →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
