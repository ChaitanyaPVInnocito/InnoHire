import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"

const requisitionData = [
  { month: 'Jan', count: 12 },
  { month: 'Feb', count: 19 },
  { month: 'Mar', count: 15 },
  { month: 'Apr', count: 25 },
  { month: 'May', count: 22 },
  { month: 'Jun', count: 30 }
]

const statusData = [
  { name: 'Approved', value: 45, color: 'hsl(var(--success))' },
  { name: 'Pending', value: 30, color: 'hsl(var(--warning))' },
  { name: 'In Progress', value: 20, color: 'hsl(var(--info))' },
  { name: 'Rejected', value: 5, color: 'hsl(var(--danger))' }
]

const hiringTrendData = [
  { week: 'W1', joined: 8, scheduled: 12 },
  { week: 'W2', joined: 12, scheduled: 15 },
  { week: 'W3', joined: 10, scheduled: 18 },
  { week: 'W4', joined: 15, scheduled: 20 }
]

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Requisition Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={requisitionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={55}
                dataKey="value"
                label={({ name, percent, cx: pieCx, x, y }) => {
                  const anchor = x > pieCx ? 'start' : 'end'
                  const dx = x > pieCx ? 4 : -4
                  return (
                    <text x={x + dx} y={y} fill="hsl(var(--foreground))" textAnchor={anchor} dominantBaseline="central" fontSize={10}>
                      {`${name} ${(percent * 100).toFixed(0)}%`}
                    </text>
                  )
                }}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 col-span-1">
        <CardHeader>
          <CardTitle>Weekly Hiring Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={hiringTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Line 
                type="monotone" 
                dataKey="scheduled" 
                stroke="hsl(var(--info))" 
                strokeWidth={2}
                name="Scheduled"
              />
              <Line 
                type="monotone" 
                dataKey="joined" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                name="Joined"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}