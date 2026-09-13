import nodemailer from "nodemailer";

// =========================================================
// CREATE EMAIL TRANSPORTER
// =========================================================

const createTransporter = () => {
  const emailUser =
    process.env.EMAIL_USER;

  const emailPassword =
    process.env.EMAIL_APP_PASSWORD;

  if (!emailUser || !emailPassword) {
    throw new Error(
      "EMAIL_USER or EMAIL_APP_PASSWORD is not configured in .env"
    );
  }

  return nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });
};

// =========================================================
// SEND OTP EMAIL
// =========================================================

export const sendOTPViaEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  try {
    if (!email || !email.trim()) {
      throw new Error(
        "OTP recipient email is missing."
      );
    }

    const transporter =
      createTransporter();

    const normalizedEmail =
      email.trim().toLowerCase();

    await transporter.sendMail({
      from: `"EventFlow" <${process.env.EMAIL_USER}>`,

      to: normalizedEmail,

      subject:
        "Your EventFlow Verification OTP",

      text: `Your EventFlow verification OTP is: ${otp}

This OTP is valid for 5 minutes.

Do not share this OTP with anyone.

If you did not request this OTP, you can safely ignore this email.`,

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 30px;
          color: #333;
        ">

          <h2 style="
            color: #1A1A2E;
            margin-bottom: 20px;
          ">
            EventFlow
          </h2>

          <p>
            Your verification OTP is:
          </p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            padding: 20px;
            background: #EEF2FF;
            color: #5B6FD4;
            text-align: center;
            border-radius: 12px;
            margin: 20px 0;
          ">
            ${otp}
          </div>

          <p>
            This OTP is valid for
            <strong>5 minutes</strong>.
          </p>

          <p>
            Do not share this OTP with anyone.
          </p>

          <p style="
            color: #777;
            margin-top: 25px;
          ">
            If you did not request this OTP,
            you can safely ignore this email.
          </p>

          <p style="
            margin-top: 30px;
          ">
            Best regards,<br />
            <strong>EventFlow Team</strong>
          </p>

        </div>
      `,
    });

    console.log(
      `📧 OTP email sent to ${normalizedEmail}`
    );

  } catch (error) {

    console.error(
      "OTP email sending failed:",
      error
    );

    throw new Error(
      "Failed to send OTP email."
    );
  }
};

// =========================================================
// SEND INVITATION EMAIL
// =========================================================

export const sendInvitationEmail = async ({
  to,
  name,
  eventName,
  invitationLink,
}: {
  to: string;
  name: string;
  eventName: string;
  invitationLink: string;
}): Promise<void> => {
  try {

    if (!to || !to.trim()) {
      throw new Error(
        "Invitation recipient email is missing."
      );
    }

    const transporter =
      createTransporter();

    const normalizedEmail =
      to.trim().toLowerCase();

    console.log(
      "📧 Sending invitation email:",
      {
        to: normalizedEmail,
        name,
        eventName,
      }
    );

    await transporter.sendMail({

      from:
        `"EventFlow" <${process.env.EMAIL_USER}>`,

      to: normalizedEmail,

      subject:
        `You're invited to ${eventName}`,

      text: `Hello ${name},

You have been invited to ${eventName} through EventFlow.

Please use the following link to access your invitation:

${invitationLink}

You will be able to verify your email using a one-time password.

Best regards,
EventFlow Team`,

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 30px;
          color: #333;
        ">

          <h2 style="
            color: #1A1A2E;
            margin-bottom: 20px;
          ">
            EventFlow
          </h2>

          <p>
            Hello <strong>${name}</strong>,
          </p>

          <p>
            You have been invited to
            <strong>${eventName}</strong>
            through EventFlow.
          </p>

          <p>
            Please click the button below
            to access your invitation.
          </p>

          <div style="
            margin: 30px 0;
          ">

            <a
              href="${invitationLink}"
              style="
                display: inline-block;
                padding: 13px 26px;
                background: #5B6FD4;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              "
            >
              View Invitation
            </a>

          </div>

          <p>
            When accessing the participant portal,
            you will verify your email using
            a one-time password.
          </p>

          <p style="
            color: #777;
            margin-top: 25px;
          ">
            If you were not expecting this invitation,
            you can safely ignore this email.
          </p>

          <p style="
            margin-top: 30px;
          ">
            Best regards,<br />
            <strong>EventFlow Team</strong>
          </p>

        </div>
      `,
    });

    console.log(
      `📧 Invitation email sent to ${normalizedEmail}`
    );

  } catch (error) {

    console.error(
      "Invitation email sending failed:",
      error
    );

    throw new Error(
      "Failed to send invitation email."
    );
  }
}; 