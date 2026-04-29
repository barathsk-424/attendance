import AnimatedNumber from './AnimatedNumber'
import './StatCard.css'

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = 'indigo', delay = 0 }) {
  // Detect if value is a number or string with number
  const numericValue = typeof value === 'number' ? value : parseFloat(value)
  const isNumeric = !isNaN(numericValue)
  const suffix = typeof value === 'string' && value.includes('%') ? '%' : ''

  return (
    <div className={`stat-card stat-${color}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <div className={`stat-icon-wrap bg-${color}`}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
      <div className="stat-value">
        {isNumeric ? <AnimatedNumber value={numericValue} suffix={suffix} /> : value}
      </div>
      {trend && (
        <div className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
          <span>{trendUp ? '↑' : '↓'} {trend}</span>
        </div>
      )}
    </div>
  )
}
