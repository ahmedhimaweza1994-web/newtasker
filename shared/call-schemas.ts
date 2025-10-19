import { z } from "zod";

export const startCallSchema = z.object({
  roomId: z.string().uuid(),
  receiverId: z.string().uuid(),
  callType: z.enum(['audio', 'video']).default('audio'),
});

export const updateCallStatusSchema = z.object({
  status: z.enum(['initiated', 'ringing', 'connected', 'ended', 'missed', 'rejected', 'busy', 'failed']),
  duration: z.number().int().min(0).optional(),
});

export type StartCallInput = z.infer<typeof startCallSchema>;
export type UpdateCallStatusInput = z.infer<typeof updateCallStatusSchema>;
