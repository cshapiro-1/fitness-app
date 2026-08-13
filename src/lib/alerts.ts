export interface SystemAlert {
  level: "CRITICAL" | "ERROR" | "WARNING" | "INFO";
  title: string;
  message: string;
  context?: Record<string, any>;
  timestamp?: string;
}

export async function sendSystemAlert(alert: SystemAlert): Promise<void> {
  const timestamp = alert.timestamp || new Date().toISOString();
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;

  // Always log structured error to console
  console.error(
    `[SYSTEM_ALERT][${alert.level}] ${alert.title}: ${alert.message}`,
    alert.context ? JSON.stringify(alert.context) : ""
  );

  // If webhook is configured (Discord, Slack, BetterStack, Telegram), dispatch immediately
  if (webhookUrl) {
    try {
      // Discord/Slack compatible webhook payload
      const payload = {
        username: "FitCoach Sentinel",
        content: `🚨 **[${alert.level}] ${alert.title}**\n${alert.message}\n\`\`\`json\n${JSON.stringify(
          {
            timestamp,
            environment: process.env.NODE_ENV || "production",
            ...alert.context,
          },
          null,
          2
        )}\n\`\`\``,
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (webhookErr) {
      console.error("Failed to deliver alert webhook:", webhookErr);
    }
  }
}
