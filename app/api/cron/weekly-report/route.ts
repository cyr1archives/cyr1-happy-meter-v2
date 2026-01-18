import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as xlsx from 'xlsx';
import nodemailer from 'nodemailer';

export async function GET(req: Request) {
  try {
    // 1. Calculate Date Range (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 2. Fetch Data
    const submissions = await prisma.submission.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (submissions.length === 0) {
      return NextResponse.json({ message: 'No data to report' });
    }

    // 3. Generate Excel
    const excelRows = submissions.map((sub) => ({
      Date: sub.createdAt.toISOString().split('T')[0],
      Name: sub.name,
      Department: sub.department,
      "Overall Mood": sub.moodLabel,
      "Score": sub.averageScore,
      Feedback: sub.feedback
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelRows);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Weekly Moods");

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 4. Send Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Happy Meter Bot" <noreply@cyr1.studio>',
      to: 'dumadag.cyrone@pabecorp.com',
      subject: ` Happy Meter Weekly Report - ${new Date().toLocaleDateString()}`,
      text: `Happy Saturday! Attached is the sentiment report for the past week. Total submissions: ${submissions.length}`,
      attachments: [{ filename: 'Mood_Report.xlsx', content: buffer }],
    });

    return NextResponse.json({ success: true, count: submissions.length });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}