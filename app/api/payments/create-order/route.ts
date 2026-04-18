import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Razorpay from "razorpay";
import { getEventById, createEscrowPayment } from "@/lib/db/events";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "secret_placeholder",
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await request.json();
    const event = await getEventById(eventId);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Amount in paisa/cents
    const amount = event.price;

    if (amount <= 0) {
      // Free event, skip payment order
      return NextResponse.json({ free: true, eventId });
    }

    const options = {
      amount,
      currency: "INR",
      receipt: `rcpt_${eventId.substring(16)}_${Date.now().toString().substring(5)}`,
      notes: {
        eventId,
        userId: session.user.id,
      }
    };

    const order = await razorpay.orders.create(options);

    // Create escrow payment record
    await createEscrowPayment(session.user.id, eventId, amount, order.id);

    return NextResponse.json({ 
      orderId: order.id, 
      amount: order.amount, 
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder"
    });

  } catch (error) {
    console.error("Order creation failed", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
