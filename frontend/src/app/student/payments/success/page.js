"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PaymentSuccessRedirectContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get all query parameters
    const valId = searchParams.get("val_id");
    const status = searchParams.get("status");

    // Build redirect URL with parameters
    let redirectUrl = "/student/payments";

    if (valId || status) {
      const params = new URLSearchParams();
      if (valId) params.set("val_id", valId);
      if (status) params.set("status", status);
      redirectUrl += `?${params.toString()}`;
    }

    // Redirect to main payments page with query params
    window.location.replace(redirectUrl);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing payment...</p>
      </div>
    </div>
  );
}

export default function PaymentSuccessRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessRedirectContent />
    </Suspense>
  );
}
