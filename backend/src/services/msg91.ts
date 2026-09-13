import axios from "axios";

export const sendOTPViaMSG91 = async (
  mobile: string,
  otp: string
) => {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    if (!authKey) {
      throw new Error("MSG91_AUTH_KEY is missing");
    }

    if (!templateId) {
      throw new Error("MSG91_TEMPLATE_ID is missing");
    }

    const response = await axios.post(
      "https://control.msg91.com/api/v5/otp",
      {
        template_id: templateId,
        mobile: mobile,
        otp: otp,
      },
      {
        headers: {
          authkey: authKey,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("MSG91 response:", response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      "MSG91 OTP sending failed:",
      error.response?.data || error.message
    );

    throw error;
  }
};