import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { IndianRupee, TrendingUp, TrendingDown, Users, Calendar, Target } from "lucide-react"

// Sample budget data
const budgetByDepartment = [
  { name: "Engineering", allocated: 50000000, spent: 38000000, remaining: 12000000 },
  { name: "Product", allocated: 25000000, spent: 18000000, remaining: 7000000 },
  { name: "Design", allocated: 15000000, spent: 12000000, remaining: 3000000 },
  { name: "Analytics", allocated: 20000000, spent: 16000000, remaining: 4000000 },
  { name: "Marketing", allocated: 10000000, spent: 8500000, remaining: 1500000 }
]

const monthlySpending = [
  { month: "Jan", budget: 12000000, actual: 8500000 },
  { month: "Feb", budget: 12000000, actual: 11200000 },
  { month: "Mar", budget: 12000000, actual: 9800000 },
  { month: "Apr", budget: 12000000, actual: 10500000 },
  { month: "May", budget: 12000000, actual: 11800000 },
  { month: "Jun", budget: 12000000, actual: 9200000 }
]

const costPerHire = [
  { level: "Junior", avgCost: 80000, hires: 25 },
  { level: "Mid-Level", avgCost: 120000, hires: 18 },
  { level: "Senior", avgCost: 180000, hires: 12 },
  { level: "Lead", avgCost: 250000, hires: 8 },
  { level: "Manager", avgCost: 350000, hires: 5 }
]

const budgetUtilization = [
  { name: "Used", value: 92500000, color: "#8b5cf6" },
  { name: "Remaining", value: 27500000, color: "#e5e7eb" }
]

const formatCurrency = (value: number) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`
  }
  return `₹${value.toLocaleString()}`
}

export function BudgetOverview() {
  const totalBudget = budgetByDepartment.reduce((sum, dept) => sum + dept.allocated, 0)
  const totalSpent = budgetByDepartment.reduce((sum, dept) => sum + dept.spent, 0)
  const totalRemaining = budgetByDepartment.reduce((sum, dept) => sum + dept.remaining, 0)
  const utilizationPercentage = (totalSpent / totalBudget) * 100

  return (
    <div className="space-y-6">
      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">Annual allocation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Spent</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {utilizationPercentage.toFixed(1)}% utilized
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRemaining)}</div>
            <p className="text-xs text-muted-foreground">Available for Q3 & Q4</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost Per Hire</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹1.65L</div>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center">
                <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
                12% decrease from Q1
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Budget Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Budget by Department</CardTitle>
            <CardDescription>Allocation vs spending across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetByDepartment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="allocated" fill="#8b5cf6" name="Allocated" />
                <Bar dataKey="spent" fill="#06b6d4" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget Utilization Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Budget Utilization</CardTitle>
            <CardDescription>Current spending vs remaining budget</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={budgetUtilization}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {budgetUtilization.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                <span className="text-sm">Used ({utilizationPercentage.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                <span className="text-sm">Remaining ({(100 - utilizationPercentage).toFixed(1)}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Spending Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
          <CardDescription>Budget vs actual spending by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Line type="monotone" dataKey="budget" stroke="#8b5cf6" strokeWidth={2} name="Budget" />
              <Line type="monotone" dataKey="actual" stroke="#06b6d4" strokeWidth={2} name="Actual" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department Budget Details */}
      <Card>
        <CardHeader>
          <CardTitle>Department Budget Details</CardTitle>
          <CardDescription>Detailed breakdown of budget allocation and utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetByDepartment.map((dept) => {
              const utilization = (dept.spent / dept.allocated) * 100
              return (
                <div key={dept.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{dept.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(dept.spent)} / {formatCurrency(dept.allocated)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={utilization} className="flex-1" />
                    <Badge variant={utilization > 90 ? "destructive" : utilization > 75 ? "secondary" : "default"}>
                      {utilization.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cost Per Hire Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Per Hire by Level</CardTitle>
          <CardDescription>Average recruitment cost and number of hires by seniority level</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costPerHire}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value, name) => [
                  name === "avgCost" ? formatCurrency(value as number) : value,
                  name === "avgCost" ? "Avg Cost" : "Hires"
                ]} 
              />
              <Bar dataKey="avgCost" fill="#8b5cf6" name="Avg Cost" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}