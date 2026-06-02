import { EMAIL_PASS, EMAIL_PORT, EMAIL_SENDER } from "../constants/env";
import nodemailer from "nodemailer";

// Tạo transporter dùng Gmail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(EMAIL_PORT) || 465,
  secure: true, // Gmail cần SSL
  auth: {
    user: EMAIL_SENDER,
    pass: EMAIL_PASS,
  },
});

export default transporter;
