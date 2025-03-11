import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
  icon?: React.ReactNode;
}

export default function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <div className="bg-white p-6 border border-gray-200 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        {icon && <div className="text-black">{icon}</div>}
      </div>
      <div className="text-3xl font-bold mb-1 text-black">{value}</div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
} 