import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing shift ID', { status: 400 });
  }

  // Use the service key to bypass RLS for admin actions
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new NextResponse('Server configuration error (missing Supabase keys)', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { error } = await supabase
      .from('fuel_entries')
      .update({ status: 'Approved' })
      .eq('id', id);

    if (error) {
      console.error('Error approving shift:', error);
      return new NextResponse('Failed to approve shift: ' + error.message, { status: 500 });
    }

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shift Approved</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #ecfdf5; color: #065f46; text-align: center; padding: 20px; }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            h1 { margin-top: 0; font-size: 24px; }
            .icon { font-size: 48px; margin-bottom: 20px; }
            p { margin-bottom: 0; color: #047857; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✅</div>
            <h1>Shift Approved</h1>
            <p>The shift has been successfully marked as Approved.</p>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (err: any) {
    console.error('Unexpected error approving shift:', err);
    return new NextResponse('Server Error', { status: 500 });
  }
}
