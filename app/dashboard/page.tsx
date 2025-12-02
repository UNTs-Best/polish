"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Edit,
  Download,
  Clock,
  TrendingUp,
  Sparkles,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  Award,
  Target,
  Zap,
  BarChart3,
  Calendar,
  Star,
  Trophy,
  TrendingDown,
  Users,
  Settings,
} from 'lucide-react';
import { getTimeSavedStats, formatTimeSaved, type TimeSavedStats } from '@/lib/time-tracking';

export default function Dashboard() {
  const [timeStats, setTimeStats] = useState<TimeSavedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState('demo-user');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');

  useEffect(() => {
    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const stats = await getTimeSavedStats(userId);
      setTimeStats(stats);
    } catch (error) {
      console.error('Failed to load time stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate productivity score (0-100)
  const productivityScore = timeStats
    ? Math.min(100, Math.round((timeStats.totalTimeSaved / 3600) * 10 + (timeStats.totalEdits * 2)))
    : 0;

  // Calculate achievements
  const achievements = [
    {
      id: 1,
      name: 'First Steps',
      description: 'Accepted your first AI suggestion',
      unlocked: (timeStats?.totalEdits || 0) >= 1,
      icon: Star,
      color: 'text-yellow-500',
    },
    {
      id: 2,
      name: 'Time Saver',
      description: 'Saved 1 hour of editing time',
      unlocked: (timeStats?.totalTimeSaved || 0) >= 3600,
      icon: Clock,
      color: 'text-green-500',
    },
    {
      id: 3,
      name: 'Power User',
      description: 'Accepted 10+ AI suggestions',
      unlocked: (timeStats?.totalEdits || 0) >= 10,
      icon: Zap,
      color: 'text-purple-500',
    },
    {
      id: 4,
      name: 'Efficiency Master',
      description: 'Saved 10+ hours total',
      unlocked: (timeStats?.totalTimeSaved || 0) >= 36000,
      icon: Trophy,
      color: 'text-orange-500',
    },
  ];

  const unlockedAchievements = achievements.filter(a => a.unlocked).length;

  // Stats cards
  const stats = [
    {
      title: 'Total Documents',
      value: '24',
      change: '+12%',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Documents Edited',
      value: timeStats ? timeStats.totalSessions.toString() : '18',
      change: '+8%',
      icon: Edit,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'AI Suggestions',
      value: timeStats ? timeStats.totalEdits.toString() : '142',
      change: '+23%',
      icon: Sparkles,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Time Saved',
      value: timeStats ? formatTimeSaved(timeStats.totalTimeSaved) : '0h',
      change: timeStats && timeStats.totalEdits > 0 
        ? `~${Math.round(timeStats.averageTimePerEdit / 60)}m/edit`
        : '+15%',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  // Additional insights
  const insights = [
    {
      title: 'Productivity Score',
      value: `${productivityScore}/100`,
      description: 'Based on time saved and edits made',
      icon: Target,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Achievements',
      value: `${unlockedAchievements}/${achievements.length}`,
      description: 'Unlocked badges',
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Avg Session Time',
      value: timeStats && timeStats.averageTimePerSession > 0
        ? `${Math.round(timeStats.averageTimePerSession / 60)}m`
        : 'N/A',
      description: 'Average editing session',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Efficiency Rate',
      value: timeStats && timeStats.totalEdits > 0
        ? `${Math.round((timeStats.totalTimeSaved / timeStats.totalEdits / 60) * 10) / 10}m/edit`
        : 'N/A',
      description: 'Time saved per edit',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  const recentDocuments = [
    {
      id: 1,
      name: 'Software Engineer Resume',
      type: 'Resume',
      lastEdited: '2 hours ago',
      status: 'completed',
      aiSuggestions: 5,
      timeSaved: '15m',
    },
    {
      id: 2,
      name: 'Cover Letter - Tech Corp',
      type: 'Cover Letter',
      lastEdited: '5 hours ago',
      status: 'pending',
      aiSuggestions: 3,
      timeSaved: '8m',
    },
    {
      id: 3,
      name: 'Research Paper - AI Ethics',
      type: 'Research Paper',
      lastEdited: '1 day ago',
      status: 'completed',
      aiSuggestions: 8,
      timeSaved: '25m',
    },
    {
      id: 4,
      name: 'Project Proposal',
      type: 'Document',
      lastEdited: '2 days ago',
      status: 'in-progress',
      aiSuggestions: 2,
      timeSaved: '5m',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Document edited',
      document: 'Software Engineer Resume',
      time: '2 hours ago',
      icon: Edit,
      color: 'text-blue-600',
    },
    {
      id: 2,
      action: 'AI suggestions applied',
      document: 'Cover Letter - Tech Corp',
      time: '5 hours ago',
      icon: Sparkles,
      color: 'text-purple-600',
    },
    {
      id: 3,
      action: 'Document exported',
      document: 'Research Paper - AI Ethics',
      time: '1 day ago',
      icon: Download,
      color: 'text-green-600',
    },
    {
      id: 4,
      action: 'New document created',
      document: 'Project Proposal',
      time: '2 days ago',
      icon: Plus,
      color: 'text-pink-600',
    },
  ];

  // Time saved breakdown by type
  const timeBreakdown = timeStats?.breakdown.byType || {};

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-700 border-blue-200">
            <Activity className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-slate-600 mt-1">
                Welcome back! Here's what's happening with your documents.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="border-slate-300">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Link href="/editor">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  New Document
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                    <div className="flex items-center text-sm text-green-600 font-medium">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {stat.change}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <Card key={index} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">{insight.title}</CardTitle>
                  <div className={`${insight.bgColor} p-2 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${insight.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 mb-1">{insight.value}</div>
                  <p className="text-xs text-slate-500">{insight.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recent Documents */}
          <div className="lg:col-span-2">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold">Recent Documents</CardTitle>
                    <CardDescription>Your latest document activity</CardDescription>
                  </div>
                  <Link href="/editor">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200">
                  {recentDocuments.map((doc) => (
                    <Link
                      key={doc.id}
                      href="/editor"
                      className="block p-6 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                              <FileText className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                                {doc.name}
                              </h3>
                              <p className="text-sm text-slate-500 mt-0.5">{doc.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            {getStatusBadge(doc.status)}
                            <span className="text-sm text-slate-500 flex items-center">
                              <Sparkles className="w-3 h-3 mr-1 text-purple-500" />
                              {doc.aiSuggestions} suggestions
                            </span>
                            <span className="text-sm text-slate-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1 text-green-500" />
                              {doc.timeSaved} saved
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">{doc.lastEdited}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-200">
                <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
                <CardDescription>Your latest actions</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 bg-slate-100 rounded-lg`}>
                            <Icon className={`w-4 h-4 ${activity.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                            <p className="text-sm text-slate-600 truncate">{activity.document}</p>
                            <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Time Saved Breakdown & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Time Saved Breakdown */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Time Saved Breakdown
              </CardTitle>
              <CardDescription>How you're saving time</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {Object.keys(timeBreakdown).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(timeBreakdown).map(([type, seconds]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 capitalize">
                          {type.replace('_', ' ')}
                        </span>
                        <span className="text-slate-600">{formatTimeSaved(seconds as number)}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, ((seconds as number) / (timeStats?.totalTimeSaved || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No time saved data yet</p>
                  <p className="text-sm mt-1">Start editing to see your time savings!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Award className="w-5 h-5" />
                Achievements
              </CardTitle>
              <CardDescription>{unlockedAchievements} of {achievements.length} unlocked</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        achievement.unlocked
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon
                          className={`w-6 h-6 ${
                            achievement.unlocked ? achievement.color : 'text-slate-400'
                          }`}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-slate-900">{achievement.name}</h4>
                          <p className="text-xs text-slate-600 mt-1">{achievement.description}</p>
                        </div>
                        {achievement.unlocked && (
                          <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/editor">
                <Button
                  variant="outline"
                  className="w-full h-auto p-6 flex flex-col items-start hover:bg-white hover:shadow-md transition-all border-slate-300"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Create Document</div>
                      <div className="text-sm text-slate-500">Start a new document</div>
                    </div>
                  </div>
                </Button>
              </Link>
              <Link href="/editor">
                <Button
                  variant="outline"
                  className="w-full h-auto p-6 flex flex-col items-start hover:bg-white hover:shadow-md transition-all border-slate-300"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Sparkles className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">AI Editor</div>
                      <div className="text-sm text-slate-500">Edit with AI assistance</div>
                    </div>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="w-full h-auto p-6 flex flex-col items-start hover:bg-white hover:shadow-md transition-all border-slate-300"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Download className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Export Documents</div>
                      <div className="text-sm text-slate-500">Download your files</div>
                    </div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
