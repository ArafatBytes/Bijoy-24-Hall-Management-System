import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const data = {
      tran_id: formData.get("tran_id"),
      val_id: formData.get("val_id"),
      status: formData.get("status"),
      amount: formData.get("amount"),
      card_type: formData.get("card_type"),
      store_amount: formData.get("store_amount"),
      bank_tran_id: formData.get("bank_tran_id"),
    };

    console.log("SSLCommerz callback received:", data);

    // Forward to backend IPN endpoint
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/payments/ipn`;

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(data).toString(),
    });

    const result = await backendResponse.text();
    console.log("Backend IPN response:", result);

    // Redirect user to payments page with query params
    const redirectUrl = `/student/payments?val_id=${data.val_id}&status=${data.status}`;

    // Return HTML redirect for browser
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${redirectUrl}">
        </head>
        <body>
          <p>Processing payment... Redirecting...</p>
          <script>window.location.href = "${redirectUrl}";</script>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    console.error("Error processing SSLCommerz callback:", error);

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="3;url=/student/payments">
        </head>
        <body>
          <p>Payment processing error. Redirecting...</p>
          <script>setTimeout(() => window.location.href = "/student/payments", 3000);</script>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }
}

// Handle GET requests too (browser redirect)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const valId = searchParams.get("val_id");
  const status = searchParams.get("status");

  // Redirect to payments page with params
  const redirectUrl = `/student/payments?val_id=${valId}&status=${status}`;

  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
