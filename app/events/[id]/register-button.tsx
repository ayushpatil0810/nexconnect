"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Ticket } from "lucide-react";
import Script from "next/script";

interface RegisterButtonProps {
  eventId: string;
  price: number;
  isLoggedIn: boolean;
  userEmail: string;
  userName: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RegisterButton({ eventId, price, isLoggedIn, userEmail, userName }: RegisterButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!isLoggedIn) {
      router.push("/auth/sign-in");
      return;
    }

    setLoading(true);
    try {
      if (price === 0) {
        // Free event
        const res = await fetch("/api/events/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });
        
        if (!res.ok) throw new Error("Failed to register");
        toast.success("Successfully registered for event!");
        router.refresh();
        return;
      }

      // Paid event via Razorpay Escrow
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      
      if (!orderRes.ok) throw new Error("Failed to initialize payment");
      
      const orderData = await orderRes.json();

      const options = {
        key: orderData.keyId, 
        amount: orderData.amount,
        currency: orderData.currency,
        name: "NexConnect Events",
        description: "Secure Escrow Ticket Payment",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                eventId
              })
            });

            if (!verifyRes.ok) throw new Error("Payment verification failed");
            
            toast.success("Payment successful! Ticket secured.");
            router.refresh();
          } catch (err) {
            toast.error("Error verifying payment. Funds will be refunded if deducted.");
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: "#0f172a"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Button size="lg" className="w-full gap-2" onClick={handlePayment} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
        {price === 0 ? "Register for Free" : "Buy Ticket Securely"}
      </Button>
    </>
  );
}
