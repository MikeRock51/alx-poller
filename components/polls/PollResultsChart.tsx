"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import type { PollOption } from "@/types";

interface PollResultsChartProps {
  options: PollOption[];
  totalVotes: number;
  className?: string;
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
];

export function PollResultsChart({ options, totalVotes, className = "" }: PollResultsChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  // Prepare data for charts
  const chartData = options.map((option, index) => ({
    name: option.optionText,
    votes: option.votes,
    percentage: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-blue-600">
            {data.votes} vote{data.votes !== 1 ? 's' : ''} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
          fontSize={12}
          stroke="#666"
        />
        <YAxis stroke="#666" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="votes" fill="#8884d8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name}: ${percentage}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="votes"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Poll Results</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Bar Chart
            </Button>
            <Button
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('pie')}
              className="flex items-center gap-2"
            >
              <PieChartIcon className="h-4 w-4" />
              Pie Chart
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Total votes: {totalVotes}
        </div>
      </CardHeader>
      <CardContent>
        {totalVotes === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No votes yet</p>
              <p className="text-sm">Be the first to vote on this poll!</p>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {chartType === 'bar' ? renderBarChart() : renderPieChart()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
