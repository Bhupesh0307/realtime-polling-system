import mongoose, { Document, Schema } from "mongoose";

export interface PollOption {
  text: string;
  votes: number;
}

export type PollStatus = "active" | "completed";

export interface PollDocument extends Document {
  question: string;
  options: PollOption[];
  startTime?: number;
  duration?: number;
  status?: PollStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PollOptionSchema = new Schema<PollOption>(
  {
    text: { type: String, required: true },
    votes: { type: Number, required: true, default: 0 }
  },
  { _id: false }
);

const PollSchema = new Schema<PollDocument>(
  {
    question: { type: String, required: true },
    options: { type: [PollOptionSchema], required: true },
    startTime: { type: Number },
    duration: { type: Number },
    status: {
      type: String,
      enum: ["active", "completed"]
    }
  },
  { timestamps: true }
);

export const Poll = mongoose.model<PollDocument>("Poll", PollSchema);

