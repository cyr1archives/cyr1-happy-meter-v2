import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { DEPARTMENTS } from '@/app/lib/constants';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // 1. Security Check (Only Vercel can trigger this)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Fetch Data from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const data = await prisma.response.findMany({
      where: { createdAt: { gte: sevenDaysAgo } }
    });

    if (data.length === 0) {
      return NextResponse.json({ message: "No responses this week. Email skipped." });
    }

    // 3. Calculate Stats
    const totalCount = data.length;
    const avgScore = data.reduce((acc, curr) => {
      const vals = Object.values(curr.scores as any) as number[];
      return acc + (vals.reduce((a, b) => a + b, 0) / vals.length);
    }, 0) / totalCount;

    // 4. Setup Email Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use Gmail App Password here
      },
    });

    // 5. Generate Manila Date for Subject
    const manilaDate = new Date().toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    // 6. Send the Email
    await transporter.sendMail({
      from: `"Happy Meter AI" <${process.env.EMAIL_USER}>`,
      to: 'dumadagcyrone@outlook.ph', // Change this to your boss/client email
      subject: `Weekly Team Pulse: ${manilaDate}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #333;">
          <h1 style="color: #1a202c;">Weekly Sentiment Report</h1>
          <p style="font-size: 16px;">Here is the summary for the week ending on Saturday, 7:00 PM PHT.</p>

          <div style="background: #f7fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #4a5568;">AVERAGE MOOD</p>
            <h2 style="font-size: 48px; margin: 10px 0; color: #2d3748;">${avgScore.toFixed(1)} <span style="font-size: 20px; color: #a0aec0;">/ 5</span></h2>
            <p style="margin: 0; color: #718096;">Total Check-ins: <strong>${totalCount}</strong></p>
          </div>

          <h3>Department Breakdown:</h3>
          <ul>
            ${DEPARTMENTS.map(dept => {
              const count = data.filter(r => r.department === dept).length;
              return `<li><strong>${dept}:</strong> ${count} responses</li>`;
            }).join('')}
          </ul>

          <p style="margin-top: 30px; font-size: 12px; color: #a0aec0;">
            This is an automated report from the Happy Meter V2 Dashboard.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, count: totalCount });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}