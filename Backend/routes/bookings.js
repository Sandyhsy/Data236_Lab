import { Router } from "express";
import { db, getNextSequence } from "../db.js";
import { requireOwner } from "../middleware/requireOwner.js";
import { producer } from "../server.js";

const router = Router();

router.get("/", async (req, res) => {
  const { user_id } = req.session.user;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookings = await db.collection("bookings").aggregate([
    { $match: { traveler_id: user_id, status: "ACCEPTED" } },
    { $lookup: {
        from: "properties",
        localField: "property_id",
        foreignField: "property_id",
        as: "property"
      }
    },
    { $unwind: "$property" },
    { $lookup: {
        from: "property_images",
        localField: "property_id",
        foreignField: "property_id",
        as: "images"
      }
    },
    { $addFields: {
        first_image_url: { $arrayElemAt: [{ $sortArray: { input: "$images", sortBy: { image_id: 1 } } }, 0] }
      }
    },
    { $addFields: {
        property_name: "$property.name",
        first_image_url: "$first_image_url.url"
      }
    },
    { $match: { end_date: { $lt: today } } },
    { $sort: { created_at: -1 } },
    { $project: {
        booking_id: 1, traveler_id: 1, property_id: 1, start_date: 1, end_date: 1,
        guests: 1, status: 1, created_at: 1, property_name: 1, first_image_url: 1
      }
    }
  ]).toArray();
  res.json(bookings)
})

router.get("/status", async (req, res) => {
  const { user_id } = req.session.user;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const acceptedRequests = await db.collection("bookings").aggregate([
    { $match: { traveler_id: user_id, status: "ACCEPTED" } },
    { $lookup: {
        from: "properties",
        localField: "property_id",
        foreignField: "property_id",
        as: "property"
      }
    },
    { $unwind: "$property" },
    { $lookup: {
        from: "property_images",
        localField: "property_id",
        foreignField: "property_id",
        as: "images"
      }
    },
    { $addFields: {
        first_image: { $arrayElemAt: [{ $sortArray: { input: "$images", sortBy: { image_id: 1 } } }, 0] },
        nights: { $max: [1, { $ceil: { $divide: [{ $subtract: ["$end_date", "$start_date"] }, 86400000] } }] }
      }
    },
    { $addFields: {
        property_name: "$property.name",
        nightly_price: "$property.price_per_night",
        first_image_url: "$first_image.url",
        total_price: { $multiply: ["$nights", "$property.price_per_night"] }
      }
    },
    { $match: { start_date: { $gte: today } } },
    { $sort: { created_at: -1 } },
    { $project: {
        booking_id: 1, traveler_id: 1, property_id: 1, start_date: 1, end_date: 1,
        guests: 1, status: 1, created_at: 1, property_name: 1, nightly_price: 1,
        nights: 1, total_price: 1, first_image_url: 1
      }
    }
  ]).toArray();

  const canceledRequests = await db.collection("bookings").aggregate([
    { $match: { traveler_id: user_id, status: "CANCELLED" } },
    { $lookup: {
        from: "properties",
        localField: "property_id",
        foreignField: "property_id",
        as: "property"
      }
    },
    { $unwind: "$property" },
    { $lookup: {
        from: "property_images",
        localField: "property_id",
        foreignField: "property_id",
        as: "images"
      }
    },
    { $addFields: {
        first_image: { $arrayElemAt: [{ $sortArray: { input: "$images", sortBy: { image_id: 1 } } }, 0] },
        nights: { $max: [1, { $ceil: { $divide: [{ $subtract: ["$end_date", "$start_date"] }, 86400000] } }] }
      }
    },
    { $addFields: {
        property_name: "$property.name",
        nightly_price: "$property.price_per_night",
        first_image_url: "$first_image.url",
        total_price: { $multiply: ["$nights", "$property.price_per_night"] }
      }
    },
    { $sort: { created_at: -1 } },
    { $project: {
        booking_id: 1, traveler_id: 1, property_id: 1, start_date: 1, end_date: 1,
        guests: 1, status: 1, created_at: 1, property_name: 1, nightly_price: 1,
        nights: 1, total_price: 1, first_image_url: 1
      }
    }
  ]).toArray();

  // Pending requests: only show bookings with start_date >= today (including today)
  const pendingRequests = await db.collection("bookings").aggregate([
    { $match: { 
        traveler_id: user_id, 
        status: "PENDING",
        start_date: { $gte: today }
      }
    },
    { $lookup: {
        from: "properties",
        localField: "property_id",
        foreignField: "property_id",
        as: "property"
      }
    },
    { $unwind: "$property" },
    { $lookup: {
        from: "property_images",
        localField: "property_id",
        foreignField: "property_id",
        as: "images"
      }
    },
    { $addFields: {
        first_image: { $arrayElemAt: [{ $sortArray: { input: "$images", sortBy: { image_id: 1 } } }, 0] },
        nights: { $max: [1, { $ceil: { $divide: [{ $subtract: ["$end_date", "$start_date"] }, 86400000] } }] }
      }
    },
    { $addFields: {
        property_name: "$property.name",
        nightly_price: "$property.price_per_night",
        first_image_url: "$first_image.url",
        total_price: { $multiply: ["$nights", "$property.price_per_night"] }
      }
    },
    { $sort: { created_at: -1 } },
    { $project: {
        booking_id: 1, traveler_id: 1, property_id: 1, start_date: 1, end_date: 1,
        guests: 1, status: 1, created_at: 1, property_name: 1, nightly_price: 1,
        nights: 1, total_price: 1, first_image_url: 1
      }
    }
  ]).toArray();

  res.json({
    acceptedRequests: Array.isArray(acceptedRequests) ? acceptedRequests : [],
    canceledRequests: Array.isArray(canceledRequests) ? canceledRequests : [],
    pendingRequests: Array.isArray(pendingRequests) ? pendingRequests : []
  });
})




router.post("/", async (req, res) => {
  const { user_id } = req.session.user;
  const { property_id, start_date, end_date, guests } = req.body;

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  const booking_id = await getNextSequence("bookingid");
  await db.collection("bookings").insertOne({
    booking_id,
    traveler_id: user_id,
    property_id,
    start_date: startDate,
    end_date: endDate,
    guests: guests || null,
    status: "PENDING",
    created_at: new Date()
  });

      const bookingEvent = {
        booking_id: booking_id,
        status: "PENDING",
      };
        await producer.send({
        topic: "booking_req",
        messages: [{ key: String(booking_id), value: JSON.stringify(bookingEvent) }],
      });

  res.json({ insertId: booking_id })
})


// GET /api/bookings/incoming - bookings for properties owned by the owner
router.get("/incoming", requireOwner, async (req, res) => {
  const { user_id } = req.session.user;

  const rows = await db.collection("bookings").aggregate([
    { $lookup: {
        from: "properties",
        localField: "property_id",
        foreignField: "property_id",
        as: "property"
      }
    },
    { $unwind: "$property" },
    { $match: { "property.owner_id": user_id } },
    { $addFields: { property_name: "$property.name" } },
    { $sort: { created_at: -1 } },
    { $project: {
        booking_id: 1, traveler_id: 1, property_id: 1, start_date: 1, end_date: 1,
        guests: 1, status: 1, created_at: 1, property_name: 1
      }
    }
  ]).toArray();
  res.json(rows);
});

// Helper: ensure booking belongs to owner's property
async function getOwnedBooking(bookingId, ownerId) {

  const booking = await db.collection("bookings").findOne({ booking_id: parseInt(bookingId) });
  if (!booking) return null;
  const property = await db.collection("properties").findOne({ property_id: booking.property_id });
  if (!property || property.owner_id !== ownerId) return null;
  return { ...booking, owner_id: property.owner_id };
}

export function updateBookingKafka(subscribeKafka) {
  subscribeKafka("booking_stat", async (evt) => {
    await db.collection("bookings").updateOne(
      { booking_id: parseInt(evt.booking_id) },
      { $set: { status: evt.status } }
    );
  });
}

// PATCH /api/bookings/:id/accept - accept if dates are free
router.patch("/:id/accept", requireOwner, async (req, res) => {
  const { user_id } = req.session.user;
  const { id } = req.params;

  const booking = await getOwnedBooking(id, user_id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.status === "ACCEPTED") return res.json({ message: "Already accepted" });

  const conflicts = await db.collection("bookings").countDocuments({
    property_id: booking.property_id,
    status: "ACCEPTED",
    booking_id: { $ne: parseInt(id) },
    end_date: { $gt: booking.start_date },
    start_date: { $lt: booking.end_date }
  });
  if (conflicts > 0) {
    return res.status(409).json({ error: "Date conflict with an existing accepted booking" });
  }

  await producer.send({
    topic: "booking_stat",
    messages: 
    [{ 
    key: String(id), 
    value: JSON.stringify({ booking_id: id, status: "ACCEPTED", owner_id: user_id }) 
    }],
  });


  res.json({ message: "Booking accepted" });

});

// PATCH /api/bookings/:id/cancel
router.patch("/:id/cancel", requireOwner, async (req, res) => {
  const { user_id } = req.session.user;
  const { id } = req.params;

  const booking = await getOwnedBooking(id, user_id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  await producer.send({
    topic: "booking_stat",
    messages: 
    [{ 
    key: String(id), 
    value: JSON.stringify({ booking_id: id, status: "CANCELLED", owner_id: user_id }) 
    }],
  });

  res.json({ message: "Booking cancelled" });
});


router.get("/bookedDates/:id", async (req, res) => {
  const { id } = req.params;

  const rows = await db.collection("bookings").find(
    { property_id: parseInt(id) },
    { projection: { start_date: 1, end_date: 1 } }
  ).toArray();

  if (rows.length === 0) {
    return res.json([]);
  }
  const intervals = rows.map((d) => {
    return {
      start: d.start_date,
      end: `${d.end_date.toISOString().split('T')[0]}T23:59:59.999Z`
    }
  }
  )

  res.json(intervals);

});


export default router;
