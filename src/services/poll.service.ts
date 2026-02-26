import { Poll, PollDocument } from "../models/Poll";
import { Vote, VoteDocument } from "../models/Vote";

interface ActivePollResult {
  poll: PollDocument;
  remainingTimeMs: number;
}

export class PollService {
  async createPoll(
    question: string,
    options: string[],
    duration: number
  ): Promise<PollDocument> {
    const now = Date.now();

    const poll = new Poll({
      question,
      options: options.map((text) => ({ text, votes: 0 })),
      startTime: now,
      duration,
      status: "active"
    });

    return poll.save();
  }

  async getActivePoll(): Promise<ActivePollResult | null> {
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
    
      return {
        poll,
        remainingTimeMs: 0
      };
    }
    return { poll, remainingTimeMs };
  }

  async submitVote(
    pollId: string,
    studentName: string,
    selectedOptionIndex: number
  ): Promise<{ poll: PollDocument; vote: VoteDocument }> {
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

    if (
      selectedOptionIndex < 0 ||
      selectedOptionIndex >= poll.options.length
    ) {
      throw new Error("Invalid option index");
    }

    const existingVote = await Vote.findOne({
      pollId: poll._id,
      studentName
    }).exec();

    if (existingVote) {
      throw new Error("Student has already voted in this poll");
    }

    const vote = new Vote({
      pollId: poll._id,
      studentName,
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
  }

  async getPollResults(pollId: string): Promise<PollDocument | null> {
    return Poll.findById(pollId).exec();
  }

  async closePollIfExpired(pollId: string): Promise<PollDocument | null> {
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
  }
}

