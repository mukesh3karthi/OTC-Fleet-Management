const mongoose = require("mongoose");
const TripOrder = require("../models/Triporder");
const schema = new mongoose.Schema({
  _id: String,
  value: { type: Number, default: 0 },
});
const Counter = mongoose.models.TripSequence || mongoose.model("TripSequence", schema);

async function allocateTripId() {
  const year = Number(new Intl.DateTimeFormat("en", {
    year: "numeric", timeZone: "Asia/Kolkata",
  }).format(new Date()));
  const prefix = `${year}-`;
  const result = await TripOrder.aggregate([
    { $match: { tripId: { $regex: `^${year}-[0-9]+$` } } },
    { $project: { sequence: { $convert: {
      input: { $arrayElemAt: [{ $split: ["$tripId", "-"] }, 1] },
      to: "long", onError: 0, onNull: 0,
    } } } },
    { $group: { _id: null, highest: { $max: "$sequence" } } },
  ]);
  const highest = Number(result[0]?.highest || 0);
  // Initialize from historical IDs without lowering a concurrent counter.
  try {
    await Counter.updateOne({ _id: prefix }, { $max: { value: highest } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    await Counter.updateOne({ _id: prefix }, { $max: { value: highest } });
  }
  const counter = await Counter.findOneAndUpdate(
    { _id: prefix }, { $inc: { value: 1 } }, { new: true }
  );
  if (!counter) throw new Error("Unable to allocate order number.");
  return `${year}-${counter.value}`;
}
module.exports = { allocateTripId };
