'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChartDataPoint {
  coste: string
  Aliado: number
  Arma: number
  Totem: number
  Talismán: number
}

interface DeckCostChartProps {
  data: ChartDataPoint[]
}

export default function DeckCostChart({ data }: DeckCostChartProps) {
  return (
    <div className="w-full overflow-visible" style={{ minHeight: '250px' }}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 40
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2D9B96" opacity={0.3} />
          <XAxis
            dataKey="coste"
            stroke="#4ECDC4"
            tick={{ fill: '#4ECDC4', fontSize: 12 }}
            label={{
              value: 'Coste',
              position: 'insideBottom',
              offset: 0,
              fill: '#4ECDC4',
              style: { fontSize: '12px' }
            }}
          />
          <YAxis
            stroke="#4ECDC4"
            tick={{ fill: '#4ECDC4', fontSize: 12 }}
            label={{
              value: 'Cantidad',
              angle: -90,
              position: 'insideLeft',
              fill: '#4ECDC4',
              style: { fontSize: '12px' }
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F1419',
              border: '1px solid #2D9B96',
              borderRadius: '8px',
              color: '#F4C430',
              fontSize: '12px'
            }}
            itemStyle={{ color: '#4ECDC4', fontSize: '12px' }}
            labelStyle={{ color: '#F4C430', fontWeight: 'bold', fontSize: '12px' }}
            position={{ x: 0, y: 200 }}
            allowEscapeViewBox={{ x: true, y: true }}
            offset={10}
          />
          <Legend
            wrapperStyle={{ color: '#4ECDC4', fontSize: '12px', paddingTop: '10px' }}
            iconSize={12}
            verticalAlign="top"
            align="center"
          />
          <Bar dataKey="Aliado" stackId="a" fill="#2D9B96" />
          <Bar dataKey="Arma" stackId="a" fill="#B8384E" />
          <Bar dataKey="Totem" stackId="a" fill="#1A7F5A" />
          <Bar dataKey="Talismán" stackId="a" fill="#8B4789" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
