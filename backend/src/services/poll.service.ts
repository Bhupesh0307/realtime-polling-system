import { Poll, PollDocument } from "../models/Poll";
import { Vote, VoteDocument } from "../models/Vote";

export interface ActivePollResult {
  poll: PollDocument;
  remainingTimeMs: number;
}

function isDbFailure(err: unknown): boolean {
  if (err && typeof err === "object" && "name" in err) {
    const name = (err as { name?: string }).name;
    return name === "MongoNetworkError" || name === "MongoServerSelectionError" || name === "MongoTimeoutError";
  }
  return false;
}

function wrapDbError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(String(err));
}

export class PollService {
  async createPoll(
    question: string,
    options: string[],
    duration: number,
    activeStudentCount: number
  ): Promise<PollDocument> {
    if (typeof question !== "string" || !question.trim()) {
      throw new Error("Question is required");
    }
    if (!Array.isArray(options) || options.length === 0) {
      throw new Error("At least one option is required");
    }
    if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
      throw new Error("Duration must be a positive number");
    }
    if (duration > 60000) {
      throw new Error("Maximum poll duration is 60 seconds");
    }

    try {
      const existingActivePoll = await Poll.findOne({ status: "active" })
        .sort({ createdAt: -1 })
        .exec();

      if (existingActivePoll) {
        await this.closePollIfExpired(existingActivePoll._id.toString());
      }

      const activePollAfterClose = await Poll.findOne({ status: "active" }).exec();
      if (activePollAfterClose) {
        throw new Error(
          "An active poll already exists. Close or complete it before creating a new one."
        );
      }

      const now = Date.now();
      const poll = new Poll({
        question: question.trim(),
        options: options.map((text) => ({ text: String(text).trim(), votes: 0 })),
        startTime: now,
        duration,
        status: "active"
      });

      return await poll.save();
    } catch (err) {
      if (isDbFailure(err)) {
        console.error("Database error in createPoll:", err);
        throw new Error("Service temporarily unavailable. Please try again.");
      }
      throw wrapDbError(err);
    }
  }

  async getActivePoll(): Promise<ActivePollResult | null> {
    try {
      const latestActivePoll = await Poll.findOne({ status: "active" })
        .sort({ createdAt: -1 })
        .exec();

      if (latestActivePoll) {
        await this.closePollIfExpired(latestActivePoll._id.toString());
      }

      const poll = await Poll.findOne({ status: "active" })
        .sort({ createdAt: -1 })
        .exec();

      if (!poll) {
        return null;
      }

      if (poll.startTime == null || poll.duration == null) {
        return { poll, remainingTimeMs: 0 };
      }

      const now = Date.now();
      const endTime = poll.startTime + poll.duration;
      const remainingTimeMs = Math.max(endTime - now, 0);

      if (remainingTimeMs <= 0) {
        if (poll.status !== "completed") {
          poll.status = "completed";
          await poll.save();
        }
        return { poll, remainingTimeMs: 0 };
      }
      return { poll, remainingTimeMs };
    } catch (err) {
      if (isDbFailure(err)) {
        console.error("Database error in getActivePoll:", err);
        throw new Error("Service temporarily unavailable. Please try again.");
      }
      throw wrapDbError(err);
    }
  }

  async submitVote(
    pollId: string,
    studentName: string,
    selectedOptionIndex: number
  ): Promise<{ poll: PollDocument; vote: VoteDocument }> {
    if (typeof pollId !== "string" || !pollId.trim()) {
      throw new Error("Poll ID is required");
    }
    if (typeof studentName !== "string" || !studentName.trim()) {
      throw new Error("Student name is required");
    }
    if (typeof selectedOptionIndex !== "number" || !Number.isInteger(selectedOptionIndex) || selectedOptionIndex < 0) {
      throw new Error("Valid option index is required");
    }

    try {
      const poll = await Poll.findById(pollId).exec();

      if (!poll) {
        throw new Error("Poll not found");
      }

      if (poll.status !== "active" || poll.startTime == null || poll.duration == null) {
        throw new Error("Poll is not active");
      }

      const now = Date.now();
      const endTime = poll.startTime + poll.duration;

      if (now >= endTime) {
        poll.status = "completed";
        await poll.save();
        throw new Error("Poll has expired");
      }

      if (selectedOptionIndex >= poll.options.length) {
        throw new Error("Invalid option index");
      }

      const existingVote = await Vote.findOne({
        pollId: poll._id,
        studentName: studentName.trim()
      }).exec();

      if (existingVote) {
        throw new Error("Student has already voted in this poll");
      }

      const vote = new Vote({
        pollId: poll._id,
        studentName: studentName.trim(),
        selectedOptionIndex
      });
      await vote.save();

      const updatedPoll = await Poll.findByIdAndUpdate(
        pollId,
        { $inc: { [`options.${selectedOptionIndex}.votes`]: 1 } },
        { new: true }
      ).exec();

      if (!updatedPoll) {
        throw new Error("Poll not found");
      }

      return { poll: updatedPoll, vote };
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== "Poll not found" && err.message !== "Poll is not active" && err.message !== "Poll has expired" && err.message !== "Invalid option index" && err.message !== "Student has already voted in this poll") {
        if (isDbFailure(err)) {
          console.error("Database error in submitVote:", err);
          throw new Error("Service temporarily unavailable. Please try again.");
        }
        const mongooseErr = err as { code?: number };
        if (mongooseErr.code === 11000) {
          throw new Error("Student has already voted in this poll");
        }
      }
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  async getPollResults(pollId: string): Promise<PollDocument | null> {
    try {
      return await Poll.findById(pollId).exec();
    } catch (err) {
      if (isDbFailure(err)) {
        console.error("Database error in getPollResults:", err);
        throw new Error("Service temporarily unavailable. Please try again.");
      }
      throw wrapDbError(err);
    }
  }

  async closePollIfExpired(pollId: string): Promise<PollDocument | null> {
    try {
      const poll = await Poll.findById(pollId).exec();

      if (!poll) {
        return null;
      }

      if (poll.status === "completed" || poll.startTime == null || poll.duration == null) {
        return poll;
      }

      const now = Date.now();
      const endTime = poll.startTime + poll.duration;

      if (now >= endTime) {
        poll.status = "completed";
        await poll.save();
      }

      return poll;
    } catch (err) {
      if (isDbFailure(err)) {
        console.error("Database error in closePollIfExpired:", err);
        throw new Error("Service temporarily unavailable. Please try again.");
      }
      throw wrapDbError(err);
    }
  }

  async getPollHistory(): Promise<PollDocument[]> {
    try {
      return await Poll.find({ status: "completed" })
        .sort({ createdAt: -1 })
        .exec();
    } catch (err) {
      if (isDbFailure(err)) {
        console.error("Database error in getPollHistory:", err);
        throw new Error("Service temporarily unavailable. Please try again.");
      }
      throw wrapDbError(err);
    }
  }
}
