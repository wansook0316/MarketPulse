'use client';

import { Card, CardHeader, CardContent } from '@/components/ui';
import { FolderKanban, Users, FileText, MessageSquare } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      name: 'Total Buckets',
      value: '0',
      icon: FolderKanban,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      name: 'Total Accounts',
      value: '0',
      icon: Users,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      name: 'Summaries',
      value: '0',
      icon: FileText,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
    {
      name: 'Generated Tweets',
      value: '0',
      icon: MessageSquare,
      color: 'text-danger-600',
      bgColor: 'bg-danger-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome to MarketPulse admin dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} variant="elevated">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader
          title="Quick Actions"
          description="Get started with MarketPulse"
        />
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900">1. Create a Bucket</h3>
              <p className="mt-1 text-sm text-gray-600">
                Start by creating your first bucket to organize investment topics
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900">2. Add Twitter Accounts</h3>
              <p className="mt-1 text-sm text-gray-600">
                Add Twitter accounts to monitor for investment insights
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900">3. Configure Settings</h3>
              <p className="mt-1 text-sm text-gray-600">
                Set up your API keys and configure the system
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
