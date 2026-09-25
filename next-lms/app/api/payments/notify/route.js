import { NextResponse } from 'next/server';

/**
 * ============================================================================
 * PAYHERE SERVER-SIDE WEBHOOK / IPN (INSTANT PAYMENT NOTIFICATION) HANDLER
 * ============================================================================
 *
 * This endpoint will receive server-to-server POST notifications from PayHere
 * whenever a student completes a course fee payment.
 *
 * TODO: Integration Steps for Real Gateway Deployment:
 * 1. Verify MD5 signature sent by PayHere:
 *    md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + strtoupper(md5(merchant_secret)))
 * 2. If valid and status_code == 2:
 *    - Locate student record and course ID from custom_1 / custom_2 params
 *    - Update MongoDB or PostgreSQL database (e.g. mark course as enrolled, payment completed)
 *    - Generate PDF receipt and send email notification
 * 3. Return 200 OK to PayHere to acknowledge receipt
 *
 * PayHere IPN Documentation:
 * https://support.payhere.lk/api-&-mobile-sdk/payhere-ipn
 * ============================================================================
 */

export async function POST(request) {
  try {
    const body = await request.formData();
    const merchant_id = body.get('merchant_id');
    const order_id = body.get('order_id');
    const payment_id = body.get('payment_id');
    const payhere_amount = body.get('payhere_amount');
    const payhere_currency = body.get('payhere_currency');
    const status_code = body.get('status_code');
    const md5sig = body.get('md5sig');
    const custom_1 = body.get('custom_1'); // courseId
    const custom_2 = body.get('custom_2'); // studentId

    console.log('[PayHere IPN Received]', {
      order_id,
      payment_id,
      amount: payhere_amount,
      status_code,
      courseId: custom_1,
      studentId: custom_2,
    });

    // TODO: Verify checksum using process.env.PAYHERE_MERCHANT_SECRET
    // const localMd5 = crypto.createHash('md5').update(...).digest('hex').toUpperCase();
    // if (localMd5 !== md5sig) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

    if (status_code === '2') {
      // Payment Successful
      // TODO: Save payment to database & enroll student
      return NextResponse.json({
        success: true,
        message: 'Payment verified and processed successfully',
        orderId: order_id,
      });
    }

    return NextResponse.json({
      success: false,
      message: `Payment status received: ${status_code}`,
    });
  } catch (error) {
    console.error('[PayHere IPN Error]', error);
    return NextResponse.json(
      { error: 'Internal server error processing payment IPN' },
      { status: 500 }
    );
  }
}
