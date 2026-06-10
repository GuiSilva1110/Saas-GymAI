import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const event = req.body;

    const email =
      event?.Customer?.email ||
      event?.customer?.email ||
      event?.buyer?.email ||
      event?.email;

    const status =
      event?.order_status ||
      event?.status ||
      event?.Order?.status;

    if (!email) {
      return res.status(400).json({ error: "Email não encontrado." });
    }

    if (status && !["paid", "approved", "completed"].includes(String(status).toLowerCase())) {
      return res.status(200).json({ message: "Evento ignorado." });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ plan: "founder" })
      .eq("email", email);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}