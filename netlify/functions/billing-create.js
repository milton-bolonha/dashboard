import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const { priceId, successUrl, cancelUrl, customerId } = JSON.parse(
    event.body || "{}"
  );
  if (!priceId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing priceId" }),
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || "https://autoresapaixonados.com/success",
      cancel_url: cancelUrl || "https://autoresapaixonados.com/cancel",
      customer: customerId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Stripe error" }) };
  }
}
