const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      default: () => nanoid(8).toUpperCase(),
      unique: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    players: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: String,
        codeforcesHandle: String,
        rating: Number,
      },
    ],
    status: {
      type: String,
      enum: ["waiting", "ready", "ongoing", "finished", "abandoned"],
      default: "waiting",
    },
    currentProblem: {
      contestId: Number,
      index: String,
      name: String,
      rating: Number,
      url: String,
      tags: [String],
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    winnerUsername: String,
    winnerSubmissionTime: Date,
    ratingDelta: {
      type: Number,
      default: null,
    },
    winnerNewRating: {
      type: Number,
      default: null,
    },
    loserNewRating: {
      type: Number,
      default: null,
    },
    startedAt: Date,
    finishedAt: Date,
    abandonedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
