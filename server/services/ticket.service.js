const PDFDocument = require("pdfkit");
const AppError = require("../utils/AppError");

/**
 * Generate a PDF E-Ticket document and stream it to the HTTP response
 * @param {Object} booking - Populated Booking object
 * @param {import("express").Response} res - Express response stream
 */
function generateETicketPDF(booking, res) {
  if (!booking) {
    throw new AppError("Booking details are required to generate ticket", 400);
  }

  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
  });

  const filename = `SkySafe-Ticket-${booking.pnr || "TICKET"}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  doc.pipe(res);

  // Brand Header
  doc
    .fillColor("#1e3a8a")
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("SkySafe ✈️", 40, 40)
    .fontSize(12)
    .font("Helvetica")
    .fillColor("#64748b")
    .text("Electronic Flight Ticket & Boarding Pass", 40, 70);

  // PNR Highlight Card (Right side)
  doc
    .roundedRect(380, 35, 175, 55, 6)
    .fillAndStroke("#eff6ff", "#93c5fd");

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#1e40af")
    .text("BOOKING REFERENCE (PNR)", 390, 45)
    .fontSize(20)
    .fillColor("#1d4ed8")
    .text(booking.pnr || "SKY123", 390, 60);

  // Divider Line
  doc
    .moveTo(40, 105)
    .lineTo(555, 105)
    .strokeColor("#cbd5e1")
    .stroke();

  // Status & Date info
  const formattedDate = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString();

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#475569")
    .text(`Booking Date: ${formattedDate}`, 40, 115)
    .text(`Status: ${booking.status || "CONFIRMED"}`, 450, 115);

  // Flight Route Box
  const flight = booking.flight || {};
  doc
    .roundedRect(40, 135, 515, 110, 8)
    .fillAndStroke("#f8fafc", "#e2e8f0");

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#0f172a")
    .text(`${flight.airline || "Airline"} - Flight ${flight.flightNumber || "FL101"}`, 55, 148);

  // Route & Timings
  const depTime = flight.departureTime
    ? new Date(flight.departureTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    : "N/A";
  const arrTime = flight.arrivalTime
    ? new Date(flight.arrivalTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    : "N/A";

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#1e3a8a")
    .text(flight.origin || "ORIGIN", 55, 175)
    .fontSize(16)
    .fillColor("#94a3b8")
    .text(" ➔ ", 120, 178)
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#1e3a8a")
    .text(flight.destination || "DEST", 160, 175);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#64748b")
    .text(`Departure: ${depTime} IST`, 55, 205)
    .text(`Arrival: ${arrTime} IST`, 55, 220)
    .text(`Duration: ${flight.duration || "N/A"}`, 350, 205)
    .text(`Aircraft: ${flight.aircraft || "Airbus A320"}`, 350, 220);

  // Passenger Manifest Table
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#0f172a")
    .text("Passenger Manifest", 40, 265);

  // Table header
  doc
    .rect(40, 285, 515, 24)
    .fillColor("#f1f5f9")
    .fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#334155")
    .text("No.", 50, 292)
    .text("Passenger Name", 90, 292)
    .text("Age", 270, 292)
    .text("Gender", 330, 292)
    .text("Seat", 410, 292)
    .text("Status", 480, 292);

  let y = 315;
  const passengers = booking.passengers || [];

  passengers.forEach((p, idx) => {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#1e293b")
      .text(`${idx + 1}`, 50, y)
      .text(p.name, 90, y)
      .text(`${p.age}`, 270, y)
      .text(p.gender === "M" ? "Male" : p.gender === "F" ? "Female" : "Other", 330, y)
      .text(p.seatNumber || `${12 + idx}${String.fromCharCode(65 + (idx % 6))}`, 410, y)
      .fillColor(booking.status === "CONFIRMED" ? "#16a34a" : "#dc2626")
      .text(booking.status, 480, y);

    doc
      .moveTo(40, y + 16)
      .lineTo(555, y + 16)
      .strokeColor("#f1f5f9")
      .stroke();

    y += 24;
  });

  // Payment Breakdown
  y += 20;
  doc
    .roundedRect(40, y, 515, 80, 6)
    .fillAndStroke("#fafafa", "#e5e7eb");

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0f172a")
    .text("Payment Summary", 55, y + 12);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#475569")
    .text(`Seats Reserved: ${booking.seatsBooked || passengers.length}`, 55, y + 32)
    .text(`Payment Status: ${booking.payment?.status || (booking.status === "CONFIRMED" ? "PAID" : "PENDING")}`, 55, y + 46)
    .text(`Payment ID: ${booking.payment?.razorpayPaymentId || "N/A"}`, 55, y + 60);

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#16a34a")
    .text(`Total: ₹${booking.totalAmount}`, 400, y + 35);

  // Footer / Important Information
  y += 105;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#64748b")
    .text("Important Notice & Security Guidelines", 40, y);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#94a3b8")
    .text(
      "1. Please report at the airport check-in counter at least 2 hours before scheduled departure.\n" +
      "2. Valid government-issued photo ID is required for verification at security check.\n" +
      "3. Cabin baggage allowance is subject to airline rules (standard 7kg) and check-in baggage is 15kg for domestic flights.\n" +
      "4. SkySafe guarantees transparent fares and 100% verified authentic bookings.",
      40,
      y + 16,
      { width: 515, lineGap: 3 }
    );

  doc.end();
}

module.exports = {
  generateETicketPDF,
};
