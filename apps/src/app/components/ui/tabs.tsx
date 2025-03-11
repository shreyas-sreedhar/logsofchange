'use client';

import * as React from 'react';

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, children, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  // Clone children and pass activeTab state
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        activeTab,
        setActiveTab,
      });
    }
    return child;
  });

  return (
    <div className={`tabs ${className}`}>
      {childrenWithProps}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}

export function TabsList({ children, className = '', activeTab, setActiveTab }: TabsListProps) {
  // Clone children and pass activeTab state
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        activeTab,
        setActiveTab,
      });
    }
    return child;
  });

  return (
    <div className={`flex space-x-1 rounded-lg bg-gray-100 p-1 ${className}`}>
      {childrenWithProps}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}

export function TabsTrigger({ value, children, activeTab, setActiveTab }: TabsTriggerProps) {
  const isActive = activeTab === value;

  return (
    <button
      className={`px-3 py-1.5 text-sm font-medium transition-all rounded-md ${
        isActive
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
      onClick={() => setActiveTab?.(value)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
  className?: string;
}

export function TabsContent({ value, children, activeTab, className = '' }: TabsContentProps) {
  if (activeTab !== value) {
    return null;
  }

  return <div className={`mt-2 ${className}`}>{children}</div>;
} 