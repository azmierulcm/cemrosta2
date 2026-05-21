import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

const SUPPORT_EMAIL = 'mainemirul@gmail.com';
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX      = 3;               // max 3 submissions per window per IP

/** Escape HTML special characters to prevent injection in email bodies. */
function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const windowStart = Timestamp.fromMillis(Date.now() - RATE_LIMIT_WINDOW_MS);
  const snap = await adminDb
    .collection('bug_reports')
    .where('ip', '==', ip)
    .where('createdAtTs', '>=', windowStart)
    .get();
  return snap.size < RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 });
    }

    const body = await req.json();
    const { userId, userEmail, category, description, rosterMonth, rosterYear } = body;

    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: 'Description too short.' }, { status: 400 });
    }

    // Sanitise all user-supplied strings that appear in HTML email
    const safeDescription  = escHtml(String(description).trim());
    const safeCategory     = escHtml(String(category ?? 'General'));
    const safeUserEmail    = escHtml(String(userEmail ?? ''));
    const safeUserId       = escHtml(String(userId ?? 'anonymous'));
    const safeRosterMonth  = rosterMonth ? escHtml(String(rosterMonth)) : null;
    const safeRosterYear   = rosterYear  ? escHtml(String(rosterYear))  : null;

    const timestamp = new Date().toISOString();
    const reportId  = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // ── 1. Always save to Firestore (never lost even if email fails) ──────────
    await adminDb.collection('bug_reports').doc(reportId).set({
      reportId,
      userId:      userId  ?? 'anonymous',
      userEmail:   userEmail ?? null,
      category:    category ?? 'General',
      description: description.trim(),
      rosterMonth: rosterMonth ?? null,
      rosterYear:  rosterYear  ?? null,
      createdAt:   timestamp,
      createdAtTs: Timestamp.now(),
      ip,
      status:      'open',
    });

    // ── 2. Send email via Resend ──────────────────────────────────────────────
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from:    'Otarosta Support <onboarding@resend.dev>',
        to:      SUPPORT_EMAIL,
        subject: `[Otarosta] Bug Report — ${safeCategory} (${reportId})`,
        html: `
          <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
            <h2 style="color: #e5484d; margin: 0 0 24px;">&#x1F6D1; Bug Report — Otarosta</h2>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd; font-weight: bold; width: 140px;">Report ID</td>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd;">${reportId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Category</td>
                <td style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd;">${safeCategory}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd; font-weight: bold;">User</td>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd;">${safeUserEmail || safeUserId}</td>
              </tr>
              ${safeRosterMonth ? `
              <tr>
                <td style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Roster Period</td>
                <td style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd;">${safeRosterMonth} ${safeRosterYear ?? ''}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd; font-weight: bold;">Submitted</td>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd;">${timestamp}</td>
              </tr>
            </table>

            <div style="margin-top: 24px; padding: 16px; background: #fff; border: 1px solid #ddd; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-weight: bold; font-size: 13px;">Description:</p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${safeDescription}</p>
            </div>

            <p style="margin-top: 24px; font-size: 11px; color: #999;">
              Logged in Firestore under bug_reports/${reportId}
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true, reportId });
  } catch (err) {
    console.error('[/api/support]', err);
    return NextResponse.json(
      { error: 'Failed to submit report.' },
      { status: 500 },
    );
  }
}
