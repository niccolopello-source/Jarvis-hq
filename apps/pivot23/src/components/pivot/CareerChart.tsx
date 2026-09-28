
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function CareerChart({
  data,
}: {
  data: { age: number; overall?: number; curva: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" />
        <XAxis dataKey="age" stroke="var(--color-muted)" fontSize={11} />
        <YAxis domain={[48, 99]} stroke="var(--color-muted)" fontSize={11} width={28} />
        <Tooltip
          contentStyle={{
            background: "var(--color-panel)",
            border: "1px solid var(--color-line)",
            fontSize: 12,
            color: "var(--color-chalk)",
            borderRadius: 12,
          }}
          labelFormatter={(a) => `${a}`}
        />
        <Line type="monotone" dataKey="curva" stroke="var(--color-maroon)" strokeDasharray="4 4" dot={false} name="curva" isAnimationActive={false} />
        <Line type="monotone" dataKey="overall" stroke="var(--color-wood)" strokeWidth={2} connectNulls name="overall" dot={{ r: 3 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
