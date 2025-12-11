interface WebhookData {
  email: string;
  phone?: string;
  user_id?: number;
  first_name?: string;
}

export const sendToWebhook = async (email: string, phone?: string, userId?: number, firstName?: string) => {

  const data: WebhookData = {
    email,
    phone: phone || "",
    user_id: userId || 0,
    first_name: firstName || "",
  };

  try {
    await fetch('https://events.sendpulse.com/events/id/7076448629204f65aafc3febf793cedf/9233381', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch(error) { 
    // Silent error handling
  }
}