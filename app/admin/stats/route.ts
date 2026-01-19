import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { DEPARTMENTS } from "@/app/lib/constants";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Fetch all responses from Supabase
    const allResponses = await prisma.response.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // 2. Calculate Total and Average
    const totalCount = allResponses.length;
    const totalScore = allResponses.reduce((acc, curr) => {
      const vals = Object.values(curr.scores as any) as number[];
      return acc + (vals.reduce((a, b) => a + b, 0) / vals.length);
    }, 0);
    const averageMood = totalCount > 0 ? parseFloat((totalScore / totalCount).toFixed(1)) : 0;

    // 3. Group by Department (Using our Shared Constant)
    const byDept = DEPARTMENTS.map(dept => {
      const deptData = allResponses.filter(r => r.department === dept);
      const avg = deptData.length > 0
        ? deptData.reduce((acc, curr) => {
            const vals = Object.values(curr.scores as any) as number[];
            return acc + (vals.reduce((a, b) => a + b, 0) / vals.length);
          }, 0) / deptData.length
        : 0;
      return { name: dept, score: parseFloat(avg.toFixed(1)) };
    });

    // 4. Format Recent Feed
    const recent = allResponses.slice(0, 10).map(r => {
      const vals = Object.values(r.scores as any) as number[];
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;

      let moodLabel = "Neutral";
      if (avg > 4) moodLabel = "Very Satisfied";
      else if (avg > 3) moodLabel = "Satisfied";
      else if (avg > 2) moodLabel = "Neutral";
      else moodLabel = "Dissatisfied";

      return {
        name: r.name,
        dept: r.department,
        mood: moodLabel,
        feedback: r.feedback || "",
        date: new Date(r.createdAt).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric' })
      };
    });

    return NextResponse.json({
      totalCount,
      averageMood,
      byDept,
      recent,
      weeklyTrend: [] // Note: You can add date-grouping logic here for the line chart
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}