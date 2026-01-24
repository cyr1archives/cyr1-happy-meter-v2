import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Use the shared singleton
import { DEPARTMENTS } from "@/app/lib/constants";

export const dynamic = 'force-dynamic'; // Prevent Vercel from caching old data

export async function GET() {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const nextReset = new Date(weekStart);
    nextReset.setDate(weekStart.getDate() + 7);

    const allResponses = await prisma.response.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const totalCount = allResponses.length;
    const weeklyResponses = allResponses.filter((response) => response.createdAt >= weekStart);
    const weeklyTotal = weeklyResponses.length;
    const totalScore = allResponses.reduce((acc, curr) => {
      const vals = Object.values(curr.scores as any) as number[];
      return acc + (vals.reduce((a, b) => a + b, 0) / (vals.length || 1));
    }, 0);
    const averageMood = totalCount > 0 ? parseFloat((totalScore / totalCount).toFixed(1)) : 0;
    const weeklyScoreTotal = weeklyResponses.reduce((acc, curr) => {
      const vals = Object.values(curr.scores as any) as number[];
      return acc + (vals.reduce((a, b) => a + b, 0) / (vals.length || 1));
    }, 0);
    const weeklyAverageMood = weeklyTotal > 0 ? parseFloat((weeklyScoreTotal / weeklyTotal).toFixed(1)) : 0;

    const byDept = DEPARTMENTS.map(dept => {
      const deptData = allResponses.filter(r => r.department === dept);
      const avg = deptData.length > 0
        ? deptData.reduce((acc, curr) => {
            const vals = Object.values(curr.scores as any) as number[];
            return acc + (vals.reduce((a, b) => a + b, 0) / (vals.length || 1));
          }, 0) / deptData.length
        : 0;
      return { name: dept, score: parseFloat(avg.toFixed(1)) };
    });

    const recent = allResponses.slice(0, 10).map(r => {
      const vals = Object.values(r.scores as any) as number[];
      const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);

      let moodLabel = "Neutral";
      if (avg >= 4.5) moodLabel = "Very Satisfied";
      else if (avg >= 3.5) moodLabel = "Satisfied";
      else if (avg < 2.5) moodLabel = "Dissatisfied";

      return {
        name: r.name,
        dept: r.department,
        mood: moodLabel,
        feedback: r.feedback || "",
        date: new Date(r.createdAt).toLocaleString()
      };
    });

    return NextResponse.json({
      totalCount,
      weeklyTotal,
      nextReset: nextReset.toISOString(),
      averageMood,
      weeklyAverageMood,
      byDept,
      recent,
      weeklyTrend: []
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
