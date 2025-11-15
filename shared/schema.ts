import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, uuid, pgEnum, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum('role', ['admin', 'sub-admin', 'employee']);
export const auxStatusEnum = pgEnum('aux_status', ['ready', 'working_on_project', 'personal', 'break', 'waiting']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'under_review', 'completed']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);
export const leaveTypeEnum = pgEnum('leave_type', ['annual', 'sick', 'maternity', 'emergency']);
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected']);
export const advanceStatusEnum = pgEnum('advance_status', ['pending', 'approved', 'rejected']);
export const chatRoomTypeEnum = pgEnum('chat_room_type', ['private', 'group']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'file', 'meeting_link']);
export const callTypeEnum = pgEnum('call_type', ['audio', 'video']);
export const callStatusEnum = pgEnum('call_status', ['initiated', 'ringing', 'connected', 'ended', 'missed', 'rejected', 'busy', 'failed']);
export const notificationCategoryEnum = pgEnum('notification_category', ['task', 'message', 'call', 'system', 'reward']);
export const suggestionStatusEnum = pgEnum('suggestion_status', ['pending', 'under_review', 'approved', 'rejected']);
export const suggestionCategoryEnum = pgEnum('suggestion_category', ['improvement', 'bug', 'feature', 'other']);
export const companyStatusEnum = pgEnum('company_status', ['active', 'pending', 'inactive']);
export const milestoneStatusEnum = pgEnum('milestone_status', ['pending', 'in_progress', 'completed']);
export const aiModelTypeEnum = pgEnum('ai_model_type', ['chat', 'code', 'marketing', 'image', 'video', 'summarizer']);

// Notification types
export type NotificationCategory = 'task' | 'message' | 'call' | 'system' | 'reward';

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  department: text("department").notNull(),
  role: roleEnum("role").notNull().default('employee'),
  profilePicture: text("profile_picture"),
  coverImage: text("cover_image"),
  bio: text("bio"),
  jobTitle: text("job_title"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  dateOfBirth: timestamp("date_of_birth"),
  hireDate: timestamp("hire_date").notNull().defaultNow(),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  totalPoints: integer("total_points").notNull().default(0), // إجمالي النقاط المكتسبة
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// AUX Status tracking
export const auxSessions = pgTable("aux_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: auxStatusEnum("status").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  notes: text("notes"),
  selectedTaskId: uuid("selected_task_id").references(() => tasks.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tasks
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  status: taskStatusEnum("status").notNull().default('pending'),
  priority: taskPriorityEnum("priority").notNull().default('medium'),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdFor: uuid("created_for").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  performanceRating: integer("performance_rating"), // نقاط الأداء من 1 إلى 5
  rewardPoints: integer("reward_points").default(0), // نقاط المكافأة للمهمة
  ratedBy: uuid("rated_by").references(() => users.id, { onDelete: "set null" }),
  ratedAt: timestamp("rated_at"),
  tags: text("tags").array(),
  attachments: jsonb("attachments").$type<{ name: string; url: string; type: string }[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Task collaborators
export const taskCollaborators = pgTable("task_collaborators", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Task comments/notes
export const taskNotes = pgTable("task_notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  attachments: jsonb("attachments").$type<{ name: string; url: string; type: string }[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Leave requests
export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: leaveTypeEnum("type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  days: integer("days").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").notNull().default('pending'),
  approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Salary advance requests
export const salaryAdvanceRequests = pgTable("salary_advance_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: advanceStatusEnum("status").notNull().default('pending'),
  approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  repaymentDate: timestamp("repayment_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Shifts
export const shifts = pgTable("shifts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  breakDuration: integer("break_duration"), // in minutes
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'info', 'warning', 'error', 'success'
  category: notificationCategoryEnum("category").notNull().default('system'), // new: notification category
  isRead: boolean("is_read").notNull().default(false),
  metadata: jsonb("metadata").$type<NotificationMetadata>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chat Rooms
export const chatRooms = pgTable("chat_rooms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  image: text("image"),
  type: chatRoomTypeEnum("type").notNull().default('group'),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Chat Room Members
export const chatRoomMembers = pgTable("chat_room_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastReadMessageId: uuid("last_read_message_id"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

// Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  messageType: messageTypeEnum("message_type").notNull().default('text'),
  attachments: jsonb("attachments").$type<{ name: string; url: string; type: string }[]>(),
  replyTo: uuid("reply_to"),
  isEdited: boolean("is_edited").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Message Reactions
export const messageReactions = pgTable("message_reactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: uuid("message_id").notNull().references(() => chatMessages.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserMessageReaction: unique().on(table.messageId, table.userId),
}));

// Meetings
export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  meetingLink: text("meeting_link").notNull(),
  scheduledBy: uuid("scheduled_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Meeting Participants
export const meetingParticipants = pgTable("meeting_participants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: uuid("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Google Calendar OAuth Tokens
export const googleCalendarTokens = pgTable("google_calendar_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Call Logs
export const callLogs = pgTable("call_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  callerId: uuid("caller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  callType: callTypeEnum("call_type").notNull().default('audio'),
  status: callStatusEnum("status").notNull().default('initiated'),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Suggestions
export const suggestions = pgTable("suggestions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: suggestionCategoryEnum("category").notNull().default('other'),
  status: suggestionStatusEnum("status").notNull().default('pending'),
  adminResponse: text("admin_response"),
  respondedBy: uuid("responded_by").references(() => users.id, { onDelete: "set null" }),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Salary Deductions
export const salaryDeductions = pgTable("salary_deductions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addedBy: uuid("added_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  daysDeducted: integer("days_deducted"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Companies
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  managerId: uuid("manager_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  industry: text("industry"),
  logo: text("logo"),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: companyStatusEnum("status").notNull().default('active'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Company Milestones
export const companyMilestones = pgTable("company_milestones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: milestoneStatusEnum("status").notNull().default('pending'),
  completionPercentage: integer("completion_percentage").default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Company Files
export const companyFiles = pgTable("company_files", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(),
  size: integer("size"),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  folder: text("folder"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Company Reports
export const companyReports = pgTable("company_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"),
  reportDate: timestamp("report_date").notNull(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Company Comments
export const companyComments = pgTable("company_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Company Team Members
export const companyTeamMembers = pgTable("company_team_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role"),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

// AI Model Settings
export const aiModelSettings = pgTable("ai_model_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  modelType: aiModelTypeEnum("model_type").notNull().unique(),
  modelId: text("model_id").notNull(),
  apiKey: text("api_key"),
  systemPrompt: text("system_prompt"),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.7"),
  topP: decimal("top_p", { precision: 3, scale: 2 }).default("1.0"),
  maxTokens: integer("max_tokens").default(2000),
  presencePenalty: decimal("presence_penalty", { precision: 3, scale: 2 }).default("0.0"),
  frequencyPenalty: decimal("frequency_penalty", { precision: 3, scale: 2 }).default("0.0"),
  customParams: jsonb("custom_params").$type<Record<string, any>>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// AI Conversations
export const aiConversations = pgTable("ai_conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  modelType: aiModelTypeEnum("model_type").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// AI Messages
export const aiMessages = pgTable("ai_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").notNull().references(() => aiConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  code: jsonb("code").$type<{ language: string; code: string }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// AI Usage Logs
export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  modelType: aiModelTypeEnum("model_type").notNull(),
  modelId: text("model_id").notNull(),
  promptTokens: integer("prompt_tokens").default(0),
  completionTokens: integer("completion_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  success: boolean("success").notNull().default(true),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  auxSessions: many(auxSessions),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  createdForTasks: many(tasks, { relationName: "createdForTasks" }),
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  taskCollaborators: many(taskCollaborators),
  taskNotes: many(taskNotes),
  leaveRequests: many(leaveRequests),
  salaryAdvanceRequests: many(salaryAdvanceRequests),
  shifts: many(shifts),
  notifications: many(notifications),
  createdChatRooms: many(chatRooms),
  chatRoomMemberships: many(chatRoomMembers),
  chatMessages: many(chatMessages),
  messageReactions: many(messageReactions),
  scheduledMeetings: many(meetings),
  meetingParticipations: many(meetingParticipants),
  googleCalendarToken: one(googleCalendarTokens),
  callerLogs: many(callLogs, { relationName: "callerLogs" }),
  receiverLogs: many(callLogs, { relationName: "receiverLogs" }),
  suggestions: many(suggestions),
  respondedSuggestions: many(suggestions, { relationName: "respondedSuggestions" }),
  salaryDeductions: many(salaryDeductions),
  addedDeductions: many(salaryDeductions, { relationName: "addedDeductions" }),
}));

export const auxSessionsRelations = relations(auxSessions, ({ one }) => ({
  user: one(users, { fields: [auxSessions.userId], references: [users.id] }),
  selectedTask: one(tasks, { fields: [auxSessions.selectedTaskId], references: [tasks.id] }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  createdBy: one(users, { fields: [tasks.createdBy], references: [users.id], relationName: "createdTasks" }),
  createdFor: one(users, { fields: [tasks.createdFor], references: [users.id], relationName: "createdForTasks" }),
  assignedTo: one(users, { fields: [tasks.assignedTo], references: [users.id], relationName: "assignedTasks" }),
  ratedBy: one(users, { fields: [tasks.ratedBy], references: [users.id] }),
  collaborators: many(taskCollaborators),
  notes: many(taskNotes),
}));

export const taskCollaboratorsRelations = relations(taskCollaborators, ({ one }) => ({
  task: one(tasks, { fields: [taskCollaborators.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskCollaborators.userId], references: [users.id] }),
}));

export const taskNotesRelations = relations(taskNotes, ({ one }) => ({
  task: one(tasks, { fields: [taskNotes.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskNotes.userId], references: [users.id] }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  user: one(users, { fields: [leaveRequests.userId], references: [users.id] }),
  approvedBy: one(users, { fields: [leaveRequests.approvedBy], references: [users.id] }),
}));

export const salaryAdvanceRequestsRelations = relations(salaryAdvanceRequests, ({ one }) => ({
  user: one(users, { fields: [salaryAdvanceRequests.userId], references: [users.id] }),
  approvedBy: one(users, { fields: [salaryAdvanceRequests.approvedBy], references: [users.id] }),
}));

export const shiftsRelations = relations(shifts, ({ one }) => ({
  user: one(users, { fields: [shifts.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  createdBy: one(users, { fields: [chatRooms.createdBy], references: [users.id] }),
  members: many(chatRoomMembers),
  messages: many(chatMessages),
}));

export const chatRoomMembersRelations = relations(chatRoomMembers, ({ one }) => ({
  room: one(chatRooms, { fields: [chatRoomMembers.roomId], references: [chatRooms.id] }),
  user: one(users, { fields: [chatRoomMembers.userId], references: [users.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  room: one(chatRooms, { fields: [chatMessages.roomId], references: [chatRooms.id] }),
  sender: one(users, { fields: [chatMessages.senderId], references: [users.id] }),
  reactions: many(messageReactions),
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(chatMessages, { fields: [messageReactions.messageId], references: [chatMessages.id] }),
  user: one(users, { fields: [messageReactions.userId], references: [users.id] }),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  scheduledBy: one(users, { fields: [meetings.scheduledBy], references: [users.id] }),
  participants: many(meetingParticipants),
}));

export const meetingParticipantsRelations = relations(meetingParticipants, ({ one }) => ({
  meeting: one(meetings, { fields: [meetingParticipants.meetingId], references: [meetings.id] }),
  user: one(users, { fields: [meetingParticipants.userId], references: [users.id] }),
}));

export const googleCalendarTokensRelations = relations(googleCalendarTokens, ({ one }) => ({
  user: one(users, { fields: [googleCalendarTokens.userId], references: [users.id] }),
}));


export const callLogsRelations = relations(callLogs, ({ one }) => ({
  room: one(chatRooms, { fields: [callLogs.roomId], references: [chatRooms.id] }),
  caller: one(users, { fields: [callLogs.callerId], references: [users.id], relationName: "callerLogs" }),
  receiver: one(users, { fields: [callLogs.receiverId], references: [users.id], relationName: "receiverLogs" }),
}));

export const suggestionsRelations = relations(suggestions, ({ one }) => ({
  user: one(users, { fields: [suggestions.userId], references: [users.id] }),
  respondedBy: one(users, { fields: [suggestions.respondedBy], references: [users.id], relationName: "respondedSuggestions" }),
}));

export const salaryDeductionsRelations = relations(salaryDeductions, ({ one }) => ({
  user: one(users, { fields: [salaryDeductions.userId], references: [users.id] }),
  addedBy: one(users, { fields: [salaryDeductions.addedBy], references: [users.id], relationName: "addedDeductions" }),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  manager: one(users, { fields: [companies.managerId], references: [users.id] }),
  tasks: many(tasks),
  milestones: many(companyMilestones),
  files: many(companyFiles),
  reports: many(companyReports),
  comments: many(companyComments),
  teamMembers: many(companyTeamMembers),
}));

export const companyMilestonesRelations = relations(companyMilestones, ({ one }) => ({
  company: one(companies, { fields: [companyMilestones.companyId], references: [companies.id] }),
}));

export const companyFilesRelations = relations(companyFiles, ({ one }) => ({
  company: one(companies, { fields: [companyFiles.companyId], references: [companies.id] }),
  uploadedBy: one(users, { fields: [companyFiles.uploadedBy], references: [users.id] }),
}));

export const companyReportsRelations = relations(companyReports, ({ one }) => ({
  company: one(companies, { fields: [companyReports.companyId], references: [companies.id] }),
  uploadedBy: one(users, { fields: [companyReports.uploadedBy], references: [users.id] }),
}));

export const companyCommentsRelations = relations(companyComments, ({ one }) => ({
  company: one(companies, { fields: [companyComments.companyId], references: [companies.id] }),
  user: one(users, { fields: [companyComments.userId], references: [users.id] }),
}));

export const companyTeamMembersRelations = relations(companyTeamMembers, ({ one }) => ({
  company: one(companies, { fields: [companyTeamMembers.companyId], references: [companies.id] }),
  user: one(users, { fields: [companyTeamMembers.userId], references: [users.id] }),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  user: one(users, { fields: [aiConversations.userId], references: [users.id] }),
  messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, { fields: [aiMessages.conversationId], references: [aiConversations.id] }),
}));

export const aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
  user: one(users, { fields: [aiUsageLogs.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertAuxSessionSchema = createInsertSchema(auxSessions).omit({
  id: true,
  createdAt: true,
  endTime: true,
  duration: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  approvedBy: true,
});

export const insertSalaryAdvanceRequestSchema = createInsertSchema(salaryAdvanceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  approvedBy: true,
});

export const insertSalaryDeductionSchema = createInsertSchema(salaryDeductions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSalaryDeductionSchema = z.object({
  reason: z.string().min(1),
  daysDeducted: z.number().int().min(0).nullable().optional(),
  amount: z.string().or(z.number()).transform(val => String(val)),
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Metadata schemas per category with discriminated union
const taskNotificationMetadataSchema = z.object({
  resourceId: z.string(),
  taskId: z.string(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  userAvatar: z.string().optional(),
});

const messageNotificationMetadataSchema = z.object({
  resourceId: z.string(),
  roomId: z.string(),
  messageId: z.string().optional(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  userAvatar: z.string().optional(),
});

const callNotificationMetadataSchema = z.object({
  resourceId: z.string(),
  callId: z.string(),
  callType: z.enum(['audio', 'video']).optional(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  userAvatar: z.string().optional(),
});

const systemNotificationMetadataSchema = z.object({
  resourceId: z.string().optional(),
  userId: z.string().optional(),
  userName: z.string().optional(),
});

const rewardNotificationMetadataSchema = z.object({
  resourceId: z.string().optional(),
  points: z.number().optional(),
  taskId: z.string().optional(),
});

// Discriminated union for all notification types
export const insertNotificationSchema = z.discriminatedUnion('category', [
  z.object({
    userId: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.string(),
    category: z.literal('task'),
    metadata: taskNotificationMetadataSchema,
  }),
  z.object({
    userId: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.string(),
    category: z.literal('message'),
    metadata: messageNotificationMetadataSchema,
  }),
  z.object({
    userId: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.string(),
    category: z.literal('call'),
    metadata: callNotificationMetadataSchema,
  }),
  z.object({
    userId: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.string(),
    category: z.literal('system'),
    metadata: systemNotificationMetadataSchema.optional(),
  }),
  z.object({
    userId: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.string(),
    category: z.literal('reward'),
    metadata: rewardNotificationMetadataSchema.optional(),
  }),
]);

// Export metadata types for use in code
export type TaskNotificationMetadata = z.infer<typeof taskNotificationMetadataSchema>;
export type MessageNotificationMetadata = z.infer<typeof messageNotificationMetadataSchema>;
export type CallNotificationMetadata = z.infer<typeof callNotificationMetadataSchema>;
export type SystemNotificationMetadata = z.infer<typeof systemNotificationMetadataSchema>;
export type RewardNotificationMetadata = z.infer<typeof rewardNotificationMetadataSchema>;

// Union type for all notification metadata
export type NotificationMetadata = 
  | TaskNotificationMetadata 
  | MessageNotificationMetadata 
  | CallNotificationMetadata 
  | SystemNotificationMetadata 
  | RewardNotificationMetadata;

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isEdited: true,
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
});

export const insertGoogleCalendarTokenSchema = createInsertSchema(googleCalendarTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,

});
export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSuggestionSchema = createInsertSchema(suggestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  respondedAt: true,
  respondedBy: true,
  adminResponse: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type AuxSession = typeof auxSessions.$inferSelect;
export type InsertAuxSession = z.infer<typeof insertAuxSessionSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type SalaryAdvanceRequest = typeof salaryAdvanceRequests.$inferSelect;
export type InsertSalaryAdvanceRequest = z.infer<typeof insertSalaryAdvanceRequestSchema>;
export type SalaryDeduction = typeof salaryDeductions.$inferSelect;
export type InsertSalaryDeduction = z.infer<typeof insertSalaryDeductionSchema>;
export type TaskNote = typeof taskNotes.$inferSelect;
export type TaskCollaborator = typeof taskCollaborators.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Shift = typeof shifts.$inferSelect;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type Suggestion = typeof suggestions.$inferSelect;
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type ChatRoomMember = typeof chatRoomMembers.$inferSelect;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type MeetingParticipant = typeof meetingParticipants.$inferSelect;
export type GoogleCalendarToken = typeof googleCalendarTokens.$inferSelect;
export type InsertGoogleCalendarToken = z.infer<typeof insertGoogleCalendarTokenSchema>;
export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;

// Company insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyMilestoneSchema = createInsertSchema(companyMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyFileSchema = createInsertSchema(companyFiles).omit({
  id: true,
  createdAt: true,
});

export const insertCompanyReportSchema = createInsertSchema(companyReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyCommentSchema = createInsertSchema(companyComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyTeamMemberSchema = createInsertSchema(companyTeamMembers).omit({
  id: true,
  assignedAt: true,
});

// Company types
export type SelectCompany = typeof companies.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type SelectCompanyMilestone = typeof companyMilestones.$inferSelect;
export type CompanyMilestone = typeof companyMilestones.$inferSelect;
export type InsertCompanyMilestone = z.infer<typeof insertCompanyMilestoneSchema>;
export type SelectCompanyFile = typeof companyFiles.$inferSelect;
export type CompanyFile = typeof companyFiles.$inferSelect;
export type InsertCompanyFile = z.infer<typeof insertCompanyFileSchema>;
export type SelectCompanyReport = typeof companyReports.$inferSelect;
export type CompanyReport = typeof companyReports.$inferSelect;
export type InsertCompanyReport = z.infer<typeof insertCompanyReportSchema>;
export type SelectCompanyComment = typeof companyComments.$inferSelect;
export type CompanyComment = typeof companyComments.$inferSelect;
export type InsertCompanyComment = z.infer<typeof insertCompanyCommentSchema>;
export type SelectCompanyTeamMember = typeof companyTeamMembers.$inferSelect;
export type CompanyTeamMember = typeof companyTeamMembers.$inferSelect;
export type InsertCompanyTeamMember = z.infer<typeof insertCompanyTeamMemberSchema>;

// AI Model insert schemas
export const insertAiModelSettingsSchema = createInsertSchema(aiModelSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiMessageSchema = createInsertSchema(aiMessages).omit({
  id: true,
  createdAt: true,
});

export const insertAiUsageLogSchema = createInsertSchema(aiUsageLogs).omit({
  id: true,
  createdAt: true,
});

// AI Model types
export type AiModelSettings = typeof aiModelSettings.$inferSelect;
export type InsertAiModelSettings = z.infer<typeof insertAiModelSettingsSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;
export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;

// AI Request Validation Schemas
export const aiChatRequestSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(10000),
  modelType: z.enum(['chat', 'code', 'marketing', 'image', 'video', 'summarizer']),
});

export const aiConversationCreateSchema = z.object({
  modelType: z.enum(['chat', 'code', 'marketing', 'image', 'video', 'summarizer']),
  title: z.string().min(1).max(200).optional(),
});

export const aiModelSettingsCreateSchema = insertAiModelSettingsSchema.extend({
  modelType: z.enum(['chat', 'code', 'marketing', 'image', 'video', 'summarizer']),
  modelId: z.string().min(1),
  apiKey: z.string().min(1).optional(),
  systemPrompt: z.string().optional(),
  temperature: z.string().or(z.number()).optional(),
  topP: z.string().or(z.number()).optional(),
  maxTokens: z.number().int().positive().optional(),
  presencePenalty: z.string().or(z.number()).optional(),
  frequencyPenalty: z.string().or(z.number()).optional(),
  isActive: z.boolean().optional(),
});

export const aiModelSettingsUpdateSchema = aiModelSettingsCreateSchema.partial();

export type AiChatRequest = z.infer<typeof aiChatRequestSchema>;
export type AiConversationCreate = z.infer<typeof aiConversationCreateSchema>;
export type AiModelSettingsCreate = z.infer<typeof aiModelSettingsCreateSchema>;
export type AiModelSettingsUpdate = z.infer<typeof aiModelSettingsUpdateSchema>;

// Shared constants for frontend/backend alignment
export const AUX_STATUS_VALUES = ['ready', 'working_on_project', 'personal', 'break', 'waiting'] as const;
export type AuxStatusValue = typeof AUX_STATUS_VALUES[number];
