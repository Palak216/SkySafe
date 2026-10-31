const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    } else {
      // In development/test without SMTP creds, log emails to console non-blockingly
      transporter = null;
    }
  }
  return transporter;
}

/**
 * Send Booking Confirmation Email (Non-blocking)
 * @param {Object} params
 * @param {Object} params.user
 * @param {Object} params.booking
 * @param {Object} params.flight
 */
const sendBookingConfirmation = async ({ user, booking, flight }) => {
  try {
    const to = user.email;
    const subject = `Booking Confirmed - PNR: ${booking.pnr} | SkySafe`;
    const depTime = flight?.departureTime
      ? new Date(flight.departureTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      : "N/A";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1d4ed8;">✈️ SkySafe - Booking Confirmed</h2>
        <p>Dear ${user.name || "Traveler"},</p>
        <p>Your flight has been successfully booked! Below are your booking details:</p>
        <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p><strong>PNR:</strong> <span style="font-size: 18px; color: #1d4ed8; font-weight: bold;">${booking.pnr}</span></p>
          <p><strong>Flight:</strong> ${flight.airline} (${flight.flightNumber})</p>
          <p><strong>Route:</strong> ${flight.origin} &rarr; ${flight.destination}</p>
          <p><strong>Departure:</strong> ${depTime} IST</p>
          <p><strong>Passengers:</strong> ${booking.passengers.map((p) => p.name).join(", ")}</p>
          <p><strong>Total Paid:</strong> ₹${booking.totalAmount}</p>
          <p><strong>Status:</strong> CONFIRMED</p>
        </div>
        <p>Thank you for choosing SkySafe! Have a safe and pleasant journey.</p>
      </div>
    `;

    const client = getTransporter();
    if (client) {
      await client.sendMail({
        from: env.SMTP_FROM || "SkySafe Flights <no-reply@skysafe.com>",
        to,
        subject,
        html,
      });
      console.log(`📧 [EMAIL SENT] Confirmation sent to ${to} (PNR: ${booking.pnr})`);
    } else {
      console.log(`📧 [EMAIL LOG] (No SMTP configured) Confirmation for PNR ${booking.pnr} to ${to}`);
    }
  } catch (err) {
    console.error("⚠️ Failed to send booking confirmation email (non-blocking):", err.message);
  }
};

/**
 * Send Cancellation / Refund Email (Non-blocking)
 * @param {Object} params
 * @param {Object} params.user
 * @param {Object} params.booking
 * @param {Object} params.flight
 * @param {Object} [params.refund]
 */
const sendCancellationNotification = async ({ user, booking, flight, refund }) => {
  try {
    const to = user.email;
    const subject = `Booking Cancelled - PNR: ${booking.pnr} | SkySafe`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #b91c1c;">✈️ SkySafe - Booking Cancellation Notice</h2>
        <p>Dear ${user.name || "Traveler"},</p>
        <p>Your booking with PNR <strong>${booking.pnr}</strong> has been cancelled.</p>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p><strong>Flight:</strong> ${flight?.airline || ""} (${flight?.flightNumber || ""})</p>
          <p><strong>Route:</strong> ${flight?.origin || ""} &rarr; ${flight?.destination || ""}</p>
          ${
            refund
              ? `<p><strong>Refund Amount:</strong> ₹${refund.amount}</p>
                 <p><strong>Refund Status:</strong> ${refund.status || "PROCESSED"}</p>
                 <p><strong>Refund ID:</strong> ${refund.id || "N/A"}</p>`
              : "<p>No payment had been charged for this reservation.</p>"
          }
        </div>
        <p>If you have questions, please reach out to our customer support.</p>
      </div>
    `;

    const client = getTransporter();
    if (client) {
      await client.sendMail({
        from: env.SMTP_FROM || "SkySafe Flights <no-reply@skysafe.com>",
        to,
        subject,
        html,
      });
      console.log(`📧 [EMAIL SENT] Cancellation sent to ${to} (PNR: ${booking.pnr})`);
    } else {
      console.log(`📧 [EMAIL LOG] (No SMTP configured) Cancellation for PNR ${booking.pnr} to ${to}`);
    }
  } catch (err) {
    console.error("⚠️ Failed to send cancellation email (non-blocking):", err.message);
  }
};

module.exports = {
  sendBookingConfirmation,
  sendCancellationNotification,
};
