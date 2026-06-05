"use client";
import { useDustStore } from "@/lib/store/dust-store";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fmt } from "@/lib/utils";
import { useMemo } from "react";

interface TCOYear { year: number; capex: number; energy: number; filter: number; maintenance: number; total: number; cumulative: number }

export function TCOChart() {
  const o = useDustStore((s) => s.outputs);

  const data = useMemo(() => {
    // CAPEX 추정 (간이)
    let capex = 200_000_000; // base
    if (o.stage5?.bag) capex += o.stage5.bag.A_total_m2 * 250_000;
    if (o.stage5?.cyclone) capex += 150_000_000 * (o.stage5.cyclone.count ?? 1);
    if (o.stage5?.ep) capex += o.stage5.ep.A_total_m2 * 800_000;
    if (o.stage5?.scrubber) capex += 250_000_000;
    if (o.stage6?.type) {
      const map: Record<string, number> = {
        plate_PHE: 30_000_000, shell_tube_WHB: 80_000_000,
        finned_tube_APH: 50_000_000, air_cooled: 60_000_000,
        direct_quench: 20_000_000, GGH_regenerative: 200_000_000,
      };
      capex += map[o.stage6.type] ?? 50_000_000;
    }
    if (o.stage7) capex += o.stage7.total_kW * 1_500_000;

    // OPEX 연간
    const annual_energy = o.stage7?.annual_cost_won ?? 0;
    const annual_filter = o.stage5?.bag ? o.stage5.bag.bag_count * 50_000 : 0;  // 백 교체 (3년 1회 → 연간 1/3)
    const annual_maintenance = capex * 0.03;

    // 5년 누적
    const years: TCOYear[] = [];
    let cumulative = 0;
    for (let y = 0; y <= 5; y++) {
      const yearCapex = y === 0 ? capex : 0;
      const yearEnergy = y === 0 ? 0 : annual_energy;
      const yearFilter = y === 0 ? 0 : annual_filter / 3;
      const yearMaint = y === 0 ? 0 : annual_maintenance;
      const total = yearCapex + yearEnergy + yearFilter + yearMaint;
      cumulative += total;
      years.push({
        year: y,
        capex: yearCapex / 1e6,
        energy: yearEnergy / 1e6,
        filter: yearFilter / 1e6,
        maintenance: yearMaint / 1e6,
        total: total / 1e6,
        cumulative: cumulative / 1e6,
      });
    }
    return years;
  }, [o]);

  const totalTCO_5yr = data[data.length - 1].cumulative;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="초기 CAPEX" value={fmt(data[0].capex, 0)} unit="백만원" big color="brand" />
        <KpiCard label="연간 OPEX" value={fmt(data[1]?.total ?? 0, 0)} unit="백만원" />
        <KpiCard label="5년 TCO 누적" value={fmt(totalTCO_5yr, 0)} unit="백만원" big color="safety" />
        <KpiCard label="OPEX 비율" value={fmt(((totalTCO_5yr - data[0].capex) / totalTCO_5yr) * 100, 0)} unit="%" />
      </div>

      <Card>
        <CardTitle>5년 누적 TCO (백만원)</CardTitle>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: "년", position: "insideBottom", offset: -5 }} />
              <YAxis />
              <Tooltip formatter={(v: number) => `${v.toFixed(0)} 백만원`} />
              <Legend />
              <Line type="monotone" dataKey="cumulative" name="누적 TCO" stroke="#0e7c8c" strokeWidth={3} />
              <Line type="monotone" dataKey="total" name="연간 비용" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardTitle>연도별 비용 구성</CardTitle>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(1)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)} 백만원`} />
              <Legend />
              <Bar dataKey="energy" name="전력비" stackId="a" fill="#0ea5e9" />
              <Bar dataKey="filter" name="필터/소모품" stackId="a" fill="#10b981" />
              <Bar dataKey="maintenance" name="정비비" stackId="a" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardTitle>비용 절감 기회</CardTitle>
        <ul className="text-sm space-y-1">
          {o.stage7?.fans.some((f) => f.VFD) && (
            <li>✓ VFD 적용 — 부분부하 운전 시 30~50% 전력 절감 (회수 {o.stage7.VFD_payback_yr ? o.stage7.VFD_payback_yr.toFixed(1) : "—"}년)</li>
          )}
          {o.stage6?.waste_heat_kW && o.stage6.waste_heat_kW > 0 && (
            <li>✓ 폐열 회수 {fmt(o.stage6.waste_heat_kW, 0)} kW — 연간 {fmt(o.stage6.waste_heat_kW * 6000 * 100 / 1e6, 0)} 백만원 절감</li>
          )}
          <li>✓ 정부 보조금 {o.stage8?.subsidies.length}건 적용 시 CAPEX 최대 {(o.stage8?.subsidies[0]?.subsidy_rate ?? 0) * 100}% 절감</li>
        </ul>
      </Card>
    </div>
  );
}
