import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
  icon?: React.ReactNode;
}

export default function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        {icon && <div className="text-blue-500">{icon}</div>}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
} 