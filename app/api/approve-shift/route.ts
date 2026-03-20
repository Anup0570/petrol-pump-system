import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing shift ID', { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new NextResponse('Server configuration error', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ✅ 1. Approve shift
    const { data, error } = await supabase
      .from('fuel_entries')
      .update({ status: 'Approved' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return new NextResponse('Failed: ' + error.message, { status: 500 });
    }

    // ✅ 2. WHATSAPP SEND (ADD THIS BLOCK 🔥)

    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;

    const message = `✅ Shift Approved
Staff: ${data.staff_name || 'N/A'}
Amount: ${data.total_amount || 'N/A'}`;

    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: 'whatsapp:+14155238886', // Twilio sandbox number
          To: 'whatsapp:+918072326551', // 👉 YOUR NUMBER
          Body: message,
        }),
      }
    );

    // ✅ 3. Response
    return new NextResponse(`
      <html>
        <body style="font-family:sans-serif;text-align:center;margin-top:100px;">
          <h2>✅ Shift Approved & WhatsApp Sent</h2>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (err: any) {
    return new NextResponse('Server Error', { status: 500 });
  }
}