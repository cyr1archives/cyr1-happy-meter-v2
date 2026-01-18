import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, department, scores, feedback } = body;
    const scoreValues = Object.values(scores) as number[];
    const total = scoreValues.reduce((acc, curr) => acc + curr, 0);
    const average = total / scoreValues.length;
    const roundedAvg = parseFloat(average.toFixed(1));
    let label = 'Neutral';
    if (roundedAvg >= 4.5) label = 'Very Satisfied';
    else if (roundedAvg >= 3.5) label = 'Satisfied';
    else if (roundedAvg >= 3.0) label = 'Neutral';
    else if (roundedAvg >= 2.0) label = 'Dissatisfied';
    else label = 'Very Dissatisfied';

    const submission = await prisma.submission.create({
      data: { name, department, averageScore: roundedAvg, moodLabel: label, feedback: feedback || "", q1Score: scores.q1, q2Score: scores.q2, q3Score: scores.q3, q4Score: scores.q4, q5Score: scores.q5 },
    });
    return NextResponse.json({ success: true, id: submission.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}