import { transporter } from "../config";

type Params = {
  to: string;
  subject: string;
  text?: string;
  html: string;
};

export const sendMail = async ({ to, subject, text, html }: Params) => {
  try {
    const info = await transporter.sendMail({
      from: "HipCamp <noreply@hipcamp.vn>",
      to,
      subject,
      text,
      html,
    });

    // Giả lập giống Resend API
    return {
      data: { id: info.messageId },
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: { name: err.name, message: err.message },
    };
  }
};
