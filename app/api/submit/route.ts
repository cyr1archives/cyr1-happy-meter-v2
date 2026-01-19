import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, department, scores, feedback } = body;

    // 1. Map the data to your "Response" model (NOT "submission")
    // 2. Pass the 'scores' object directly into the Json field
    const submission = await prisma.response.create({
      data: {
        name,
        department,
        scores: scores, // This saves as a single JSON object in Supabase
        feedback: feedback || ""
      },
    });

    return NextResponse.json({
      success: true,
      id: submission.id
    }, { status: 201 });

  } catch (error: any) {
    console.error("Prisma Error:", error);
    return NextResponse.json({
      success: false,
      message: 'Server Error',
      details: error.message
    }, { status: 500 });
  }
}