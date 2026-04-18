import React from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function PlayerStatsCharts({ agg, posBreakdown }) {
  if (!agg) return null

  // Position breakdown data for pie chart
  const positionData = posBreakdown.map(({ pos, mins }) => ({
    name: pos,
    value: mins,
  }))

  // Performance metrics data
  const performanceData = [
    { metric: 'Matches', value: agg.matches },
    { metric: 'Goals', value: agg.goals },
    { metric: 'Assists', value: agg.assists },
    { metric: 'Awards', value: agg.starPlayerAwards },
  ]

  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#06b6d4']

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="bg-gradient-to-br from-hornets-primary/10 to-hornets-secondary/10 rounded-2xl border border-neutral-border shadow-sm p-6">
        <h3 className="text-base font-bold text-neutral-fg mb-4">Performance Metrics</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="metric" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#141413',
                border: '1px solid #6b6b63',
                borderRadius: '8px',
                color: '#faf9f5'
              }}
            />
            <Bar dataKey="value" fill="#4D755D" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Position Breakdown */}
      {positionData.length > 0 && (
        <div className="bg-gradient-to-br from-hornets-quaternary/10 to-hornets-quinary/10 rounded-2xl border border-neutral-border shadow-sm p-6">
          <h3 className="text-base font-bold text-neutral-fg mb-4">Playing Time by Position</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={positionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}'`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {positionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} mins`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-card border border-neutral-border rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-muted/80 font-semibold mb-1">Total Minutes</p>
          <p className="text-2xl font-bold text-hornets-secondary">{agg.totalMinutes}'</p>
          <p className="text-xs text-neutral-muted mt-1">{agg.matches > 0 ? Math.round(agg.totalMinutes / agg.matches) : 0}' per game</p>
        </div>
        <div className="bg-neutral-card border border-neutral-border rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-muted/80 font-semibold mb-1">Goals</p>
          <p className="text-2xl font-bold text-hornets-tertiary">{agg.goals}</p>
          <p className="text-xs text-neutral-muted mt-1">{agg.matches > 0 ? (agg.goals / agg.matches).toFixed(2) : 0} per game</p>
        </div>
        <div className="bg-neutral-card border border-neutral-border rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-muted/80 font-semibold mb-1">Assists</p>
          <p className="text-2xl font-bold text-hornets-quaternary">{agg.assists}</p>
          <p className="text-xs text-neutral-muted mt-1">{agg.matches > 0 ? (agg.assists / agg.matches).toFixed(2) : 0} per game</p>
        </div>
        <div className="bg-neutral-card border border-neutral-border rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-muted/80 font-semibold mb-1">Star Awards</p>
          <p className="text-2xl font-bold text-hornets-quinary">{agg.starPlayerAwards}</p>
          <p className="text-xs text-neutral-muted mt-1">{agg.matches > 0 ? (agg.starPlayerAwards / agg.matches).toFixed(2) : 0} per game</p>
        </div>
      </div>
    </div>
  )
}
