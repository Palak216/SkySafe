const Flight = require("../models/Flight");
const User = require("../models/User");
const Booking = require("../models/Booking");

/**
 * Get Admin Dashboard Statistics & Recent Bookings
 * GET /api/admin/dashboard
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const totalFlights = await Flight.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();

    const revenueResult = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["CONFIRMED", "Confirmed"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $ifNull: ["$totalAmount", "$totalPrice"] },
          },
        },
      },
    ]);

    const revenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const recentBookings = await Booking.find()
      .populate("user", "name email")
      .populate("flight", "flightNumber airline origin destination departureTime")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      stats: {
        totalFlights,
        totalUsers,
        totalBookings,
        revenue,
      },
      data: {
        totalFlights,
        totalUsers,
        totalBookings,
        revenue,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
