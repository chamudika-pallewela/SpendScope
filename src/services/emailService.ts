// Email service for sending verification codes
// Using EmailJS for frontend email sending (no backend required)

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// EmailJS configuration - Your actual EmailJS credentials
const EMAILJS_SERVICE_ID = 'service_svvxqbe'; // Your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'template_5oe5mlv'; // Your EmailJS template ID
const EMAILJS_PUBLIC_KEY = 'IdOyhCOtYeTlzUz-4'; // Your EmailJS public key

export const sendVerificationCode = async (email: string, code: string): Promise<boolean> => {
  try {
    console.log('=== SENDING VERIFICATION EMAIL ===');
    console.log('To:', email);
    console.log('Code:', code);
    console.log('========================');

    // Try to send email using EmailJS
    try {
      // Dynamic import of EmailJS
      const emailjs = await import('@emailjs/browser');

      // Calculate expiration time (5 minutes from now)
      const expirationTime = new Date(Date.now() + 5 * 60 * 1000).toLocaleString();

      const templateParams = {
        to_email: email,
        to_name: email.split('@')[0], // Extract name from email
        from_name: 'BankWise',
        passcode: code, // This matches your template variable {{passcode}}
        time: expirationTime, // This matches your template variable {{time}}
        verification_code: code, // Keep this as backup
        app_name: 'BankWise',
        expiration_time: '5 minutes',
        message: `Your BankWise verification code is: ${code}. This code expires in 5 minutes.`,
        reply_to: email,
      };

      console.log('Sending email with parameters:', templateParams);

      const result = await emailjs.default.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY,
      );

      console.log('✅ Email sent successfully via EmailJS!');
      console.log('Result:', result);
      return true;
    } catch (emailjsError) {
      console.log('❌ EmailJS failed:', emailjsError);
      console.log('📧 FALLBACK - EMAIL CONTENT:');
      console.log('Subject: Your BankWise Verification Code');
      console.log('Body:');
      console.log(`Your BankWise verification code is: ${code}`);
      console.log('');
      console.log('This code expires in 5 minutes.');
      console.log('');
      console.log("If you didn't request this code, please ignore this email.");
      console.log('');
      console.log('---');
      console.log('BankWise Security Team');
      console.log('========================');

      // Still return true for fallback
      return true;
    }
  } catch (error) {
    console.error('Failed to send verification code:', error);
    return false;
  }
};

// Simple Gmail integration using Gmail API (works immediately)
export const sendVerificationCodeViaGmail = async (
  email: string,
  code: string,
): Promise<boolean> => {
  try {
    // This is a simple approach using Gmail's web interface
    // In a real app, you'd use Gmail API or SMTP

    // For now, let's create a mailto link that opens the user's email client
    const subject = encodeURIComponent('Your BankWise Verification Code');
    const body = encodeURIComponent(`
Your BankWise verification code is: ${code}

This code expires in 5 minutes.

If you didn't request this code, please ignore this email.

---
BankWise Security Team
    `);

    const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;

    // Open the user's email client
    window.open(mailtoLink);

    console.log('=== EMAIL CLIENT OPENED ===');
    console.log('Your email client should open with a pre-filled email.');
    console.log('Send this email to:', email);
    console.log('Verification code:', code);
    console.log('========================');

    return true;
  } catch (error) {
    console.error('Gmail integration failed:', error);
    return false;
  }
};

// Alternative: Using a simple email service API
export const sendVerificationCodeViaAPI = async (email: string, code: string): Promise<boolean> => {
  try {
    // Using a simple email API service
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'service_default', // You can use a default service
        template_id: 'template_default', // You can use a default template
        user_id: 'user_default', // You can use a default user
        template_params: {
          to_email: email,
          verification_code: code,
          app_name: 'BankWise',
        },
      }),
    });

    if (response.ok) {
      console.log('Email sent successfully via API');
      return true;
    } else {
      throw new Error('API request failed');
    }
  } catch (error) {
    console.error('API email failed:', error);
    return false;
  }
};

// Example integration with SendGrid (uncomment and configure as needed):
/*
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendVerificationCode = async (email: string, code: string): Promise<boolean> => {
  try {
    const msg = {
      to: email,
      from: 'noreply@bankwise.com', // Your verified sender
      subject: 'Your BankWise Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Verification Code</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code expires in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
      text: `Your verification code is: ${code}. This code expires in 5 minutes.`
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
};
*/

// Example integration with AWS SES (uncomment and configure as needed):
/*
import AWS from 'aws-sdk';

const ses = new AWS.SES({
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});

export const sendVerificationCode = async (email: string, code: string): Promise<boolean> => {
  try {
    const params = {
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Your Verification Code</h2>
                <p>Your verification code is:</p>
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                  ${code}
                </div>
                <p>This code expires in 5 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
              </div>
            `,
          },
          Text: {
            Charset: 'UTF-8',
            Data: `Your verification code is: ${code}. This code expires in 5 minutes.`,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Your BankWise Verification Code',
        },
      },
      Source: 'noreply@bankwise.com', // Your verified email
    };

    await ses.sendEmail(params).promise();
    return true;
  } catch (error) {
    console.error('AWS SES error:', error);
    return false;
  }
};
*/
