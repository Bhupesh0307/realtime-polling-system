import mongoose, { Document, Schema, Types } from "mongoose";

export interface VoteDocument extends Document {
  pollId: Types.ObjectId;
  studentName: string;
  selectedOptionIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema<VoteDocument>(
  {
    pollId: {
      type: Schema.Types.ObjectId,
      ref: "Poll",
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    selectedOptionIndex: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

VoteSchema.index({ pollId: 1, studentName: 1 }, { unique: true });

export const Vote = mongoose.model<VoteDocument>("Vote", VoteSchema);

