// File: app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Uses your singleton instance

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch data
    const responses = await prisma.response.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2000,
    });

    if (responses.length === 0) {
      return NextResponse.json({
        totalCount: 0,
        averageMood: 0,
        weeklyTrend: [],
        byDept: [],
        recent: []
      });
    }

    // 2. Calculate Aggregates
    let totalScoreSum = 0;
    let count = 0;
    const deptMap: Record<string, { total: number; count: number }> = {};
    const weeklyMap: Record<string, { total: number; count: number; date: Date }> = {};

    responses.forEach(r => {
      // Calculate individual average score
      const scores = r.scores as Record<string, number>;
      const values = Object.values(scores);
      if (values.length === 0) return;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      // Global Stats
      totalScoreSum += avg;
      count++;

      // Department Stats
      const dept = r.department || 'Other';
      if (!deptMap[dept]) deptMap[dept] = { total: 0, count: 0 };
      deptMap[dept].total += avg;
      deptMap[dept].count++;

      // Weekly Stats (Simple grouping by date string)
      const date = new Date(r.createdAt);
      const weekKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g., "Oct 24"

      if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { total: 0, count: 0, date };
      weeklyMap[weekKey].total += avg;
      weeklyMap[weekKey].count++;
    });

    // 3. Format Data
    const averageMood = count > 0 ? parseFloat((totalScoreSum / count).toFixed(1)) : 0;

    const byDept = Object.entries(deptMap).map(([name, data]) => ({
      name,
      score: parseFloat((data.total / data.count).toFixed(1))
    })).sort((a, b) => b.score - a.score);

    // Sort weeks chronologically and take last 7 days
    const weeklyTrend = Object.entries(weeklyMap)
      .map(([week, data]) => ({
        week,
        score: parseFloat((data.total / data.count).toFixed(1)),
        rawDate: data.date
      }))
      .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
      .slice(-7)
      .map(({ week, score }) => ({ week, score }));

    const recent = responses.slice(0, 10).map(r => {
      const scores = r.scores as Record<string, number>;
      const values = Object.values(scores);
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

      let mood = "Neutral";
      if (avg >= 4.5) mood = "Very Satisfied";
      else if (avg >= 3.5) mood = "Satisfied";
      else if (avg < 2.5) mood = "Dissatisfied";

      return {
        name: r.name,
        dept: r.department,
        mood,
        feedback: r.feedback || "",
        date: new Date(r.createdAt).toLocaleDateString()
      };
    });

    return NextResponse.json({
      totalCount: count,
      averageMood,
      weeklyTrend,
      byDept,
      recent
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}