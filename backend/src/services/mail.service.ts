import {Resend} from 'resend';
import {config} from '../config/env';

const resend = new Resend(config.resendApiKey);

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendMail({ to, subject, html }: SendMailInput): Promise<void> {
    if(!resend) {
        console.warn('Resend API key not configured. Skipping email send.');
        return;
    }
    await resend.emails.send({
        from: config.mailFrom,
        to,
        subject,
        html
    });
}

export async function sendWelcomeMail(to: string, name?: string): Promise<void> {
    await sendMail({
        to,
        subject: 'Welcome to EcoRoute Engine!',
        html: `
            <p>Hi ${name || ''},</p>
            <p>Welcome to EcoRoute Engine! We're excited to have you on board.</p>
            <p>Get started by logging into your account and exploring the features we offer to help you find the most eco-friendly routes.</p>
            <p>Best regards,<br/>The EcoRoute Team</p>
        `,
    });
}

export async function sendPasswordResetMail(to: string, otp: string): Promise<void> {
    await sendMail({
        to,
        subject: 'Your Password Reset OTP for EcoRoute Engine',
        html: `
            <p>Hi,</p>
            <p>You requested a password reset for your EcoRoute Engine account. Use the OTP below to reset your password:</p>
            <h2>${otp}</h2>
            <p>This OTP is valid for ${config.resetOtpExpiryMinutes} minutes. If you did not request a password reset, please ignore this email.</p>
            <p>Best regards,<br/>The EcoRoute Team</p>
        `,
    });
}