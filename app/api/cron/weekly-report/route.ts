import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { DEPARTMENTS } from '@/app/lib/constants';

// We define the question IDs to ensure the CSV columns are consistent
const QUESTION_IDS = ["q1", "q2", "q3", "q4", "q5"];

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const data = await prisma.response.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'desc' }
    });

    if (data.length === 0) {
      return NextResponse.json({ message: "No responses this week. Email skipped." });
    }

    // 1. Calculate Global Stats
    const totalCount = data.length;
    const avgScore = data.reduce((acc, curr) => {
      const vals = Object.values(curr.scores as any) as number[];
      return acc + (vals.reduce((a, b) => a + b, 0) / vals.length);
    }, 0) / totalCount;

    // 2. Generate Enhanced CSV Content
    // Header includes individual questions and the final total for that row
    const csvHeader = `Date,Name,Department,${QUESTION_IDS.join(",")},Average Total,Feedback\n`;

    const csvRows = data.map(r => {
      const scores = r.scores as Record<string, number>;
      const vals = Object.values(scores) as number[];

      // Get individual answers in order, default to 0 if missing
      const individualAnswers = QUESTION_IDS.map(id => scores[id] || 0).join(",");

      const rowAvg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
      const cleanFeedback = r.feedback ? r.feedback.replace(/"/g, '""') : "";

      return `${new Date(r.createdAt).toLocaleDateString()},"${r.name}","${r.department}",${individualAnswers},${rowAvg},"${cleanFeedback}"`;
    }).join("\n");

    const fullCsv = csvHeader + csvRows;

    // 3. Setup Manila Date
    const manilaDate = new Date().toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'long', day: 'numeric', year: 'numeric'
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 4. Send the Email with Attachment
    await transporter.sendMail({
      from: `"Happy Meter AI" <${process.env.EMAIL_USER}>`,
      to: 'dumadagcyrone@outlook.ph',
      subject: `Weekly Team Pulse (Detailed): ${manilaDate}`,
      attachments: [
        {
          filename: `weekly_sentiment_detailed_${new Date().toISOString().split('T')[0]}.csv`,
          content: fullCsv
        }
      ],
      html: `
        <div style="font-family: sans-serif; max-width: 700px; color: #333; line-height: 1.6;">
          <h1 style="color: #1a202c; border-bottom: 2px solid #edf2f7; padding-bottom: 10px;">Weekly Executive Summary</h1>
          <p>Detailed sentiment breakdown from <strong>${sevenDaysAgo.toLocaleDateString()}</strong> to <strong>${manilaDate}</strong>.</p>

          <div style="display: flex; gap: 20px; margin: 25px 0;">
            <div style="background: #ebf8ff; padding: 20px; border-radius: 12px; flex: 1; border: 1px solid #bee3f8;">
              <p style="margin: 0; font-size: 11px; font-weight: bold; color: #2b6cb0; text-transform: uppercase;">Overall Mood Score</p>
              <h2 style="font-size: 32px; margin: 5px 0; color: #2c5282;">${avgScore.toFixed(1)} <span style="font-size: 16px; color: #4299e1;">/ 5.0</span></h2>
            </div>
            <div style="background: #f7fafc; padding: 20px; border-radius: 12px; flex: 1; border: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; font-weight: bold; color: #4a5568; text-transform: uppercase;">Total Participation</p>
              <h2 style="font-size: 32px; margin: 5px 0; color: #2d3748;">${totalCount}</h2>
            </div>
          </div>

          <h3 style="color: #2d3748;">Departmental Health</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 12px; font-size: 11px; color: #718096; text-transform: uppercase;">Dept</th>
                <th style="padding: 12px; font-size: 11px; color: #718096; text-transform: uppercase;">Count</th>
                <th style="padding: 12px; font-size: 11px; color: #718096; text-transform: uppercase;">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              ${DEPARTMENTS.map(dept => {
                const deptData = data.filter(r => r.department === dept);
                const count = deptData.length;
                const dAvg = count > 0
                  ? (deptData.reduce((acc, curr) => {
                      const v = Object.values(curr.scores as any) as number[];
                      return acc + (v.reduce((a, b) => a + b, 0) / v.length);
                    }, 0) / count).toFixed(1)
                  : "0.0";
                return `
                  <tr style="border-bottom: 1px solid #edf2f7;">
                    <td style="padding: 12px; font-weight: bold;">${dept}</td>
                    <td style="padding: 12px;">${count}</td>
                    <td style="padding: 12px; font-weight: bold; color: ${Number(dAvg) >= 4 ? '#38a169' : Number(dAvg) <= 2 ? '#e53e3e' : '#2d3748'};">
                      ${dAvg}
                    </td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>

          <div style="background: #fffaf0; border-left: 4px solid #ed8936; padding: 15px; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #7b341e;">
              <strong>Attachment Info:</strong> The attached CSV now contains the <strong>individual scores for Q1 through Q5</strong> for every participant, along with their calculated total.
            </p>
          </div>

          <p style="margin-top: 40px; font-size: 10px; color: #a0aec0; text-align: center;">
            Happy Meter V2 Dashboard • Generated for Cyrone Dumadag
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