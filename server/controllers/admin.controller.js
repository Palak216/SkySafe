const Flight = require("../models/Flight");
const User = require("../models/User");
const Booking = require("../models/Booking");

const getDashboardStats = async (req, res) => {
    try {

        const totalFlights = await Flight.countDocuments();

        const totalUsers = await User.countDocuments();

        const totalBookings = await Booking.countDocuments();

        const revenue = await Booking.aggregate([
            {
                $match: {
                    status: "Confirmed",
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: "$totalPrice",
                    },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalFlights,
                totalUsers,
                totalBookings,
                revenue:
                    revenue.length > 0
                        ? revenue[0].totalRevenue
                        : 0,
            },
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

module.exports = {
    getDashboardStats,
};