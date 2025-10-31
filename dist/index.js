var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/google-calendar-integration.ts
var google_calendar_integration_exports = {};
__export(google_calendar_integration_exports, {
  createGoogleMeetEvent: () => createGoogleMeetEvent,
  getGoogleAuthUrl: () => getGoogleAuthUrl,
  getUncachableGoogleCalendarClient: () => getUncachableGoogleCalendarClient,
  handleGoogleCallback: () => handleGoogleCallback,
  isGoogleCalendarConnected: () => isGoogleCalendarConnected
});
import { google } from "googleapis";
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/google-calendar/callback";
  if (!clientId || !clientSecret) {
    console.log("Google Calendar credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.");
    return null;
  }
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }
  return oauth2Client;
}
async function getAccessToken() {
  const client = getOAuth2Client();
  if (client && client.credentials?.access_token) {
    if (client.credentials.expiry_date && client.credentials.expiry_date > Date.now()) {
      return client.credentials.access_token;
    }
    if (client.credentials.refresh_token) {
      try {
        const { credentials } = await client.refreshAccessToken();
        client.setCredentials(credentials);
        return credentials.access_token;
      } catch (error) {
        console.error("Error refreshing token:", error);
      }
    }
  }
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (xReplitToken && hostname) {
    try {
      connectionSettings = await fetch(
        "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=google-calendar",
        {
          headers: {
            "Accept": "application/json",
            "X_REPLIT_TOKEN": xReplitToken
          }
        }
      ).then((res) => res.json()).then((data) => data.items?.[0]);
      const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
      if (accessToken) {
        return accessToken;
      }
    } catch (error) {
      console.error("Replit connector error:", error);
    }
  }
  throw new Error("Google Calendar not connected. Please configure OAuth2 credentials or connect via Replit.");
}
function getGoogleAuthUrl() {
  const client = getOAuth2Client();
  if (!client) return null;
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events"
  ];
  return client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent"
  });
}
async function handleGoogleCallback(code) {
  const client = getOAuth2Client();
  if (!client) {
    throw new Error("OAuth2 client not configured");
  }
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return tokens;
}
async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();
  const client = new google.auth.OAuth2();
  client.setCredentials({
    access_token: accessToken
  });
  return google.calendar({ version: "v3", auth: client });
}
async function isGoogleCalendarConnected() {
  try {
    await getAccessToken();
    return true;
  } catch (error) {
    return false;
  }
}
async function createGoogleMeetEvent(title, description, startTime, endTime) {
  const calendar = await getUncachableGoogleCalendarClient();
  const event = {
    summary: title,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: "Asia/Riyadh"
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: "Asia/Riyadh"
    },
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" }
      }
    }
  };
  const response = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: event
  });
  return {
    meetingLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri,
    eventId: response.data.id,
    eventLink: response.data.htmlLink
  };
}
var connectionSettings, oauth2Client;
var init_google_calendar_integration = __esm({
  "server/google-calendar-integration.ts"() {
    "use strict";
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  advanceStatusEnum: () => advanceStatusEnum,
  aiChatRequestSchema: () => aiChatRequestSchema,
  aiConversationCreateSchema: () => aiConversationCreateSchema,
  aiConversations: () => aiConversations,
  aiConversationsRelations: () => aiConversationsRelations,
  aiMessages: () => aiMessages,
  aiMessagesRelations: () => aiMessagesRelations,
  aiModelSettings: () => aiModelSettings,
  aiModelSettingsCreateSchema: () => aiModelSettingsCreateSchema,
  aiModelSettingsUpdateSchema: () => aiModelSettingsUpdateSchema,
  aiModelTypeEnum: () => aiModelTypeEnum,
  aiUsageLogs: () => aiUsageLogs,
  aiUsageLogsRelations: () => aiUsageLogsRelations,
  auxSessions: () => auxSessions,
  auxSessionsRelations: () => auxSessionsRelations,
  auxStatusEnum: () => auxStatusEnum,
  callLogs: () => callLogs,
  callLogsRelations: () => callLogsRelations,
  callStatusEnum: () => callStatusEnum,
  callTypeEnum: () => callTypeEnum,
  chatMessages: () => chatMessages,
  chatMessagesRelations: () => chatMessagesRelations,
  chatRoomMembers: () => chatRoomMembers,
  chatRoomMembersRelations: () => chatRoomMembersRelations,
  chatRoomTypeEnum: () => chatRoomTypeEnum,
  chatRooms: () => chatRooms,
  chatRoomsRelations: () => chatRoomsRelations,
  companies: () => companies,
  companiesRelations: () => companiesRelations,
  companyComments: () => companyComments,
  companyCommentsRelations: () => companyCommentsRelations,
  companyFiles: () => companyFiles,
  companyFilesRelations: () => companyFilesRelations,
  companyMilestones: () => companyMilestones,
  companyMilestonesRelations: () => companyMilestonesRelations,
  companyReports: () => companyReports,
  companyReportsRelations: () => companyReportsRelations,
  companyStatusEnum: () => companyStatusEnum,
  companyTeamMembers: () => companyTeamMembers,
  companyTeamMembersRelations: () => companyTeamMembersRelations,
  googleCalendarTokens: () => googleCalendarTokens,
  googleCalendarTokensRelations: () => googleCalendarTokensRelations,
  insertAiConversationSchema: () => insertAiConversationSchema,
  insertAiMessageSchema: () => insertAiMessageSchema,
  insertAiModelSettingsSchema: () => insertAiModelSettingsSchema,
  insertAiUsageLogSchema: () => insertAiUsageLogSchema,
  insertAuxSessionSchema: () => insertAuxSessionSchema,
  insertCallLogSchema: () => insertCallLogSchema,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertChatRoomSchema: () => insertChatRoomSchema,
  insertCompanyCommentSchema: () => insertCompanyCommentSchema,
  insertCompanyFileSchema: () => insertCompanyFileSchema,
  insertCompanyMilestoneSchema: () => insertCompanyMilestoneSchema,
  insertCompanyReportSchema: () => insertCompanyReportSchema,
  insertCompanySchema: () => insertCompanySchema,
  insertCompanyTeamMemberSchema: () => insertCompanyTeamMemberSchema,
  insertGoogleCalendarTokenSchema: () => insertGoogleCalendarTokenSchema,
  insertLeaveRequestSchema: () => insertLeaveRequestSchema,
  insertMeetingSchema: () => insertMeetingSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertSalaryAdvanceRequestSchema: () => insertSalaryAdvanceRequestSchema,
  insertSalaryDeductionSchema: () => insertSalaryDeductionSchema,
  insertSuggestionSchema: () => insertSuggestionSchema,
  insertTaskSchema: () => insertTaskSchema,
  insertUserSchema: () => insertUserSchema,
  leaveRequests: () => leaveRequests,
  leaveRequestsRelations: () => leaveRequestsRelations,
  leaveStatusEnum: () => leaveStatusEnum,
  leaveTypeEnum: () => leaveTypeEnum,
  meetingParticipants: () => meetingParticipants,
  meetingParticipantsRelations: () => meetingParticipantsRelations,
  meetings: () => meetings,
  meetingsRelations: () => meetingsRelations,
  messageReactions: () => messageReactions,
  messageReactionsRelations: () => messageReactionsRelations,
  messageTypeEnum: () => messageTypeEnum,
  milestoneStatusEnum: () => milestoneStatusEnum,
  notificationCategoryEnum: () => notificationCategoryEnum,
  notifications: () => notifications,
  notificationsRelations: () => notificationsRelations,
  roleEnum: () => roleEnum,
  salaryAdvanceRequests: () => salaryAdvanceRequests,
  salaryAdvanceRequestsRelations: () => salaryAdvanceRequestsRelations,
  salaryDeductions: () => salaryDeductions,
  salaryDeductionsRelations: () => salaryDeductionsRelations,
  shifts: () => shifts,
  shiftsRelations: () => shiftsRelations,
  suggestionCategoryEnum: () => suggestionCategoryEnum,
  suggestionStatusEnum: () => suggestionStatusEnum,
  suggestions: () => suggestions,
  suggestionsRelations: () => suggestionsRelations,
  taskCollaborators: () => taskCollaborators,
  taskCollaboratorsRelations: () => taskCollaboratorsRelations,
  taskNotes: () => taskNotes,
  taskNotesRelations: () => taskNotesRelations,
  taskPriorityEnum: () => taskPriorityEnum,
  taskStatusEnum: () => taskStatusEnum,
  tasks: () => tasks,
  tasksRelations: () => tasksRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, integer, boolean, decimal, uuid, pgEnum, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var roleEnum = pgEnum("role", ["admin", "sub-admin", "employee"]);
var auxStatusEnum = pgEnum("aux_status", ["ready", "working_on_project", "personal", "break", "waiting"]);
var taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "under_review", "completed"]);
var taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);
var leaveTypeEnum = pgEnum("leave_type", ["annual", "sick", "maternity", "emergency"]);
var leaveStatusEnum = pgEnum("leave_status", ["pending", "approved", "rejected"]);
var advanceStatusEnum = pgEnum("advance_status", ["pending", "approved", "rejected"]);
var chatRoomTypeEnum = pgEnum("chat_room_type", ["private", "group"]);
var messageTypeEnum = pgEnum("message_type", ["text", "image", "file", "meeting_link"]);
var callTypeEnum = pgEnum("call_type", ["audio", "video"]);
var callStatusEnum = pgEnum("call_status", ["initiated", "ringing", "connected", "ended", "missed", "rejected", "busy", "failed"]);
var notificationCategoryEnum = pgEnum("notification_category", ["task", "message", "call", "system", "reward"]);
var suggestionStatusEnum = pgEnum("suggestion_status", ["pending", "under_review", "approved", "rejected"]);
var suggestionCategoryEnum = pgEnum("suggestion_category", ["improvement", "bug", "feature", "other"]);
var companyStatusEnum = pgEnum("company_status", ["active", "pending", "inactive"]);
var milestoneStatusEnum = pgEnum("milestone_status", ["pending", "in_progress", "completed"]);
var aiModelTypeEnum = pgEnum("ai_model_type", ["chat", "code", "marketing", "image", "video", "summarizer"]);
var users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  department: text("department").notNull(),
  role: roleEnum("role").notNull().default("employee"),
  profilePicture: text("profile_picture"),
  coverImage: text("cover_image"),
  bio: text("bio"),
  jobTitle: text("job_title"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  dateOfBirth: timestamp("date_of_birth"),
  hireDate: timestamp("hire_date").notNull().defaultNow(),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  totalPoints: integer("total_points").notNull().default(0),
  // إجمالي النقاط المكتسبة
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var auxSessions = pgTable("aux_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: auxStatusEnum("status").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  // in seconds
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  status: taskStatusEnum("status").notNull().default("pending"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdFor: uuid("created_for").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  performanceRating: integer("performance_rating"),
  // نقاط الأداء من 1 إلى 5
  rewardPoints: integer("reward_points").default(0),
  // نقاط المكافأة للمهمة
  ratedBy: uuid("rated_by").references(() => users.id, { onDelete: "set null" }),
  ratedAt: timestamp("rated_at"),
  tags: text("tags").array(),
  attachments: jsonb("attachments").$type(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var taskCollaborators = pgTable("task_collaborators", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var taskNotes = pgTable("task_notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  attachments: jsonb("attachments").$type(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: leaveTypeEnum("type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  days: integer("days").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").notNull().default("pending"),
  approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var salaryAdvanceRequests = pgTable("salary_advance_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: advanceStatusEnum("status").notNull().default("pending"),
  approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  repaymentDate: timestamp("repayment_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var shifts = pgTable("shifts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  breakDuration: integer("break_duration"),
  // in minutes
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  // 'info', 'warning', 'error', 'success'
  category: notificationCategoryEnum("category").notNull().default("system"),
  // new: notification category
  isRead: boolean("is_read").notNull().default(false),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var chatRooms = pgTable("chat_rooms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  image: text("image"),
  type: chatRoomTypeEnum("type").notNull().default("group"),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var chatRoomMembers = pgTable("chat_room_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastReadMessageId: uuid("last_read_message_id"),
  joinedAt: timestamp("joined_at").notNull().defaultNow()
});
var chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  messageType: messageTypeEnum("message_type").notNull().default("text"),
  attachments: jsonb("attachments").$type(),
  replyTo: uuid("reply_to"),
  isEdited: boolean("is_edited").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var messageReactions = pgTable("message_reactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: uuid("message_id").notNull().references(() => chatMessages.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  uniqueUserMessageReaction: unique().on(table.messageId, table.userId)
}));
var meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  meetingLink: text("meeting_link").notNull(),
  scheduledBy: uuid("scheduled_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var meetingParticipants = pgTable("meeting_participants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: uuid("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var googleCalendarTokens = pgTable("google_calendar_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var callLogs = pgTable("call_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  callerId: uuid("caller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  callType: callTypeEnum("call_type").notNull().default("audio"),
  status: callStatusEnum("status").notNull().default("initiated"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var suggestions = pgTable("suggestions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: suggestionCategoryEnum("category").notNull().default("other"),
  status: suggestionStatusEnum("status").notNull().default("pending"),
  adminResponse: text("admin_response"),
  respondedBy: uuid("responded_by").references(() => users.id, { onDelete: "set null" }),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var salaryDeductions = pgTable("salary_deductions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addedBy: uuid("added_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  daysDeducted: integer("days_deducted"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var companies = pgTable("companies", {
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
  status: companyStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var companyMilestones = pgTable("company_milestones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: milestoneStatusEnum("status").notNull().default("pending"),
  completionPercentage: integer("completion_percentage").default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var companyFiles = pgTable("company_files", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(),
  size: integer("size"),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  folder: text("folder"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var companyReports = pgTable("company_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"),
  reportDate: timestamp("report_date").notNull(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var companyComments = pgTable("company_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var companyTeamMembers = pgTable("company_team_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role"),
  assignedAt: timestamp("assigned_at").notNull().defaultNow()
});
var aiModelSettings = pgTable("ai_model_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  modelType: aiModelTypeEnum("model_type").notNull().unique(),
  modelId: text("model_id").notNull(),
  apiKey: text("api_key"),
  systemPrompt: text("system_prompt"),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.7"),
  topP: decimal("top_p", { precision: 3, scale: 2 }).default("1.0"),
  maxTokens: integer("max_tokens").default(2e3),
  presencePenalty: decimal("presence_penalty", { precision: 3, scale: 2 }).default("0.0"),
  frequencyPenalty: decimal("frequency_penalty", { precision: 3, scale: 2 }).default("0.0"),
  customParams: jsonb("custom_params").$type(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var aiConversations = pgTable("ai_conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  modelType: aiModelTypeEnum("model_type").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var aiMessages = pgTable("ai_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").notNull().references(() => aiConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  code: jsonb("code").$type(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var aiUsageLogs = pgTable("ai_usage_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  modelType: aiModelTypeEnum("model_type").notNull(),
  modelId: text("model_id").notNull(),
  promptTokens: integer("prompt_tokens").default(0),
  completionTokens: integer("completion_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  success: boolean("success").notNull().default(true),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var usersRelations = relations(users, ({ many, one }) => ({
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
  addedDeductions: many(salaryDeductions, { relationName: "addedDeductions" })
}));
var auxSessionsRelations = relations(auxSessions, ({ one }) => ({
  user: one(users, { fields: [auxSessions.userId], references: [users.id] })
}));
var tasksRelations = relations(tasks, ({ one, many }) => ({
  createdBy: one(users, { fields: [tasks.createdBy], references: [users.id], relationName: "createdTasks" }),
  createdFor: one(users, { fields: [tasks.createdFor], references: [users.id], relationName: "createdForTasks" }),
  assignedTo: one(users, { fields: [tasks.assignedTo], references: [users.id], relationName: "assignedTasks" }),
  ratedBy: one(users, { fields: [tasks.ratedBy], references: [users.id] }),
  collaborators: many(taskCollaborators),
  notes: many(taskNotes)
}));
var taskCollaboratorsRelations = relations(taskCollaborators, ({ one }) => ({
  task: one(tasks, { fields: [taskCollaborators.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskCollaborators.userId], references: [users.id] })
}));
var taskNotesRelations = relations(taskNotes, ({ one }) => ({
  task: one(tasks, { fields: [taskNotes.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskNotes.userId], references: [users.id] })
}));
var leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  user: one(users, { fields: [leaveRequests.userId], references: [users.id] }),
  approvedBy: one(users, { fields: [leaveRequests.approvedBy], references: [users.id] })
}));
var salaryAdvanceRequestsRelations = relations(salaryAdvanceRequests, ({ one }) => ({
  user: one(users, { fields: [salaryAdvanceRequests.userId], references: [users.id] }),
  approvedBy: one(users, { fields: [salaryAdvanceRequests.approvedBy], references: [users.id] })
}));
var shiftsRelations = relations(shifts, ({ one }) => ({
  user: one(users, { fields: [shifts.userId], references: [users.id] })
}));
var notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] })
}));
var chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  createdBy: one(users, { fields: [chatRooms.createdBy], references: [users.id] }),
  members: many(chatRoomMembers),
  messages: many(chatMessages)
}));
var chatRoomMembersRelations = relations(chatRoomMembers, ({ one }) => ({
  room: one(chatRooms, { fields: [chatRoomMembers.roomId], references: [chatRooms.id] }),
  user: one(users, { fields: [chatRoomMembers.userId], references: [users.id] })
}));
var chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  room: one(chatRooms, { fields: [chatMessages.roomId], references: [chatRooms.id] }),
  sender: one(users, { fields: [chatMessages.senderId], references: [users.id] }),
  reactions: many(messageReactions)
}));
var messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(chatMessages, { fields: [messageReactions.messageId], references: [chatMessages.id] }),
  user: one(users, { fields: [messageReactions.userId], references: [users.id] })
}));
var meetingsRelations = relations(meetings, ({ one, many }) => ({
  scheduledBy: one(users, { fields: [meetings.scheduledBy], references: [users.id] }),
  participants: many(meetingParticipants)
}));
var meetingParticipantsRelations = relations(meetingParticipants, ({ one }) => ({
  meeting: one(meetings, { fields: [meetingParticipants.meetingId], references: [meetings.id] }),
  user: one(users, { fields: [meetingParticipants.userId], references: [users.id] })
}));
var googleCalendarTokensRelations = relations(googleCalendarTokens, ({ one }) => ({
  user: one(users, { fields: [googleCalendarTokens.userId], references: [users.id] })
}));
var callLogsRelations = relations(callLogs, ({ one }) => ({
  room: one(chatRooms, { fields: [callLogs.roomId], references: [chatRooms.id] }),
  caller: one(users, { fields: [callLogs.callerId], references: [users.id], relationName: "callerLogs" }),
  receiver: one(users, { fields: [callLogs.receiverId], references: [users.id], relationName: "receiverLogs" })
}));
var suggestionsRelations = relations(suggestions, ({ one }) => ({
  user: one(users, { fields: [suggestions.userId], references: [users.id] }),
  respondedBy: one(users, { fields: [suggestions.respondedBy], references: [users.id], relationName: "respondedSuggestions" })
}));
var salaryDeductionsRelations = relations(salaryDeductions, ({ one }) => ({
  user: one(users, { fields: [salaryDeductions.userId], references: [users.id] }),
  addedBy: one(users, { fields: [salaryDeductions.addedBy], references: [users.id], relationName: "addedDeductions" })
}));
var companiesRelations = relations(companies, ({ one, many }) => ({
  manager: one(users, { fields: [companies.managerId], references: [users.id] }),
  tasks: many(tasks),
  milestones: many(companyMilestones),
  files: many(companyFiles),
  reports: many(companyReports),
  comments: many(companyComments),
  teamMembers: many(companyTeamMembers)
}));
var companyMilestonesRelations = relations(companyMilestones, ({ one }) => ({
  company: one(companies, { fields: [companyMilestones.companyId], references: [companies.id] })
}));
var companyFilesRelations = relations(companyFiles, ({ one }) => ({
  company: one(companies, { fields: [companyFiles.companyId], references: [companies.id] }),
  uploadedBy: one(users, { fields: [companyFiles.uploadedBy], references: [users.id] })
}));
var companyReportsRelations = relations(companyReports, ({ one }) => ({
  company: one(companies, { fields: [companyReports.companyId], references: [companies.id] }),
  uploadedBy: one(users, { fields: [companyReports.uploadedBy], references: [users.id] })
}));
var companyCommentsRelations = relations(companyComments, ({ one }) => ({
  company: one(companies, { fields: [companyComments.companyId], references: [companies.id] }),
  user: one(users, { fields: [companyComments.userId], references: [users.id] })
}));
var companyTeamMembersRelations = relations(companyTeamMembers, ({ one }) => ({
  company: one(companies, { fields: [companyTeamMembers.companyId], references: [companies.id] }),
  user: one(users, { fields: [companyTeamMembers.userId], references: [users.id] })
}));
var aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  user: one(users, { fields: [aiConversations.userId], references: [users.id] }),
  messages: many(aiMessages)
}));
var aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, { fields: [aiMessages.conversationId], references: [aiConversations.id] })
}));
var aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
  user: one(users, { fields: [aiUsageLogs.userId], references: [users.id] })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true
});
var insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true
});
var insertAuxSessionSchema = createInsertSchema(auxSessions).omit({
  id: true,
  createdAt: true,
  endTime: true,
  duration: true
});
var insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  approvedBy: true
});
var insertSalaryAdvanceRequestSchema = createInsertSchema(salaryAdvanceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  approvedBy: true
});
var insertSalaryDeductionSchema = createInsertSchema(salaryDeductions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertChatRoomSchema = createInsertSchema(chatRooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var taskNotificationMetadataSchema = z.object({
  resourceId: z.string(),
  taskId: z.string(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  userAvatar: z.string().optional()
});
var messageNotificationMetadataSchema = z.object({
  resourceId: z.string(),
  roomId: z.string(),
  messageId: z.string().optional(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  userAvatar: z.string().optional()
});
var callNotificationMetadataSchema = z.object({
  resourceId: z.string(),
  callId: z.string(),
  callType: z.enum(["audio", "video"]).optional(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  userAvatar: z.string().optional()
});
var systemNotificationMetadataSchema = z.object({
  resourceId: z.string().optional(),
  userId: z.string().optional(),
  userName: z.string().optional()
});
var rewardNotificationMetadataSchema = z.object({
  resourceId: z.string().optional(),
  points: z.number().optional(),
  taskId: z.string().optional()
});
var insertNotificationSchema = z.discriminatedUnion("category", [
  z.object({
    userId: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.string(),
    category: z.literal("task"),
    metadata: taskNotificationMetadataSchema
  }),
  z.object({
    userId: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.string(),
    category: z.literal("message"),
    metadata: messageNotificationMetadataSchema
  }),
  z.object({
    userId: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.string(),
    category: z.literal("call"),
    metadata: callNotificationMetadataSchema
  }),
  z.object({
    userId: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.string(),
    category: z.literal("system"),
    metadata: systemNotificationMetadataSchema.optional()
  }),
  z.object({
    userId: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.string(),
    category: z.literal("reward"),
    metadata: rewardNotificationMetadataSchema.optional()
  })
]);
var insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isEdited: true
});
var insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true
});
var insertGoogleCalendarTokenSchema = createInsertSchema(googleCalendarTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true
});
var insertSuggestionSchema = createInsertSchema(suggestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  respondedAt: true,
  respondedBy: true,
  adminResponse: true
});
var insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCompanyMilestoneSchema = createInsertSchema(companyMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCompanyFileSchema = createInsertSchema(companyFiles).omit({
  id: true,
  createdAt: true
});
var insertCompanyReportSchema = createInsertSchema(companyReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCompanyCommentSchema = createInsertSchema(companyComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCompanyTeamMemberSchema = createInsertSchema(companyTeamMembers).omit({
  id: true,
  assignedAt: true
});
var insertAiModelSettingsSchema = createInsertSchema(aiModelSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertAiMessageSchema = createInsertSchema(aiMessages).omit({
  id: true,
  createdAt: true
});
var insertAiUsageLogSchema = createInsertSchema(aiUsageLogs).omit({
  id: true,
  createdAt: true
});
var aiChatRequestSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(1e4),
  modelType: z.enum(["chat", "code", "marketing", "image", "video", "summarizer"])
});
var aiConversationCreateSchema = z.object({
  modelType: z.enum(["chat", "code", "marketing", "image", "video", "summarizer"]),
  title: z.string().min(1).max(200).optional()
});
var aiModelSettingsCreateSchema = insertAiModelSettingsSchema.extend({
  modelType: z.enum(["chat", "code", "marketing", "image", "video", "summarizer"]),
  modelId: z.string().min(1),
  apiKey: z.string().min(1).optional(),
  systemPrompt: z.string().optional(),
  temperature: z.string().or(z.number()).optional(),
  topP: z.string().or(z.number()).optional(),
  maxTokens: z.number().int().positive().optional(),
  presencePenalty: z.string().or(z.number()).optional(),
  frequencyPenalty: z.string().or(z.number()).optional(),
  isActive: z.boolean().optional()
});
var aiModelSettingsUpdateSchema = aiModelSettingsCreateSchema.partial();

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
  // تعطيل SSL للـ local DB
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, desc, and, or, isNull, count, sql as sql2, gte, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import session from "express-session";
import connectPg from "connect-pg-simple";
var PostgresSessionStore = connectPg(session);
var userPublicFields = {
  id: users.id,
  fullName: users.fullName,
  email: users.email,
  profilePicture: users.profilePicture,
  coverImage: users.coverImage,
  department: users.department,
  jobTitle: users.jobTitle,
  role: users.role,
  bio: users.bio,
  phoneNumber: users.phoneNumber,
  address: users.address,
  dateOfBirth: users.dateOfBirth,
  hireDate: users.hireDate,
  salary: users.salary,
  totalPoints: users.totalPoints,
  isActive: users.isActive,
  lastLogin: users.lastLogin,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt
};
var MemStorage = class {
  sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  // Auth & Users
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(user) {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async updateUserLastLogin(id) {
    await db.update(users).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
  }
  async getUsers() {
    return await db.select().from(users);
  }
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }
  // Tasks
  async createTask(task) {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }
  async getTask(id) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) return void 0;
    let createdByUser = void 0;
    if (task.createdBy) {
      const [creator] = await db.select(userPublicFields).from(users).where(eq(users.id, task.createdBy));
      createdByUser = creator;
    }
    let createdForUser = void 0;
    if (task.createdFor) {
      const [createdFor] = await db.select(userPublicFields).from(users).where(eq(users.id, task.createdFor));
      createdForUser = createdFor;
    }
    let assignedToUser = void 0;
    if (task.assignedTo) {
      const [assignee] = await db.select(userPublicFields).from(users).where(eq(users.id, task.assignedTo));
      assignedToUser = assignee;
    }
    let ratedByUser = void 0;
    if (task.ratedBy) {
      const [reviewer] = await db.select(userPublicFields).from(users).where(eq(users.id, task.ratedBy));
      ratedByUser = reviewer;
    }
    return {
      ...task,
      createdByUser,
      createdForUser,
      assignedToUser,
      ratedByUser
    };
  }
  async getUserTasks(userId) {
    const tasksData = await db.query.tasks.findMany({
      where: or(
        eq(tasks.createdFor, userId),
        eq(tasks.assignedTo, userId)
      ),
      with: {
        createdBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        },
        createdFor: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        },
        assignedTo: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        },
        ratedBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        }
      },
      orderBy: [desc(tasks.createdAt)]
    });
    return tasksData.map((task) => ({
      ...task,
      createdByUser: task.createdBy,
      createdForUser: task.createdFor,
      assignedToUser: task.assignedTo,
      ratedByUser: task.ratedBy
    }));
  }
  async getAssignedTasks(userId) {
    const tasksData = await db.query.tasks.findMany({
      where: eq(tasks.assignedTo, userId),
      with: {
        createdBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        },
        createdFor: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        },
        assignedTo: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        },
        ratedBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        }
      },
      orderBy: [desc(tasks.createdAt)]
    });
    return tasksData.map((task) => ({
      ...task,
      createdByUser: task.createdBy,
      createdForUser: task.createdFor,
      assignedToUser: task.assignedTo,
      ratedByUser: task.ratedBy
    }));
  }
  async updateTask(id, updates) {
    const [task] = await db.update(tasks).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(tasks.id, id)).returning();
    return task || void 0;
  }
  async deleteTask(id) {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount > 0;
  }
  async getAllTasks() {
    const tasksData = await db.query.tasks.findMany({
      with: {
        createdBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        },
        createdFor: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        },
        assignedTo: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        },
        ratedBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        }
      },
      orderBy: [desc(tasks.createdAt)]
    });
    return tasksData.map((task) => ({
      ...task,
      createdByUser: task.createdBy,
      createdForUser: task.createdFor,
      assignedToUser: task.assignedTo,
      ratedByUser: task.ratedBy
    }));
  }
  async rateTask(taskId, rating, ratedBy) {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    let rewardPoints = 0;
    if (rating === 5) rewardPoints = 10;
    else if (rating === 4) rewardPoints = 7;
    else if (rating === 3) rewardPoints = 5;
    const [updatedTask] = await db.update(tasks).set({
      performanceRating: rating,
      rewardPoints,
      ratedBy,
      ratedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(tasks.id, taskId)).returning();
    if (task.assignedTo && updatedTask.rewardPoints > 0) {
      const [user] = await db.select().from(users).where(eq(users.id, task.assignedTo));
      if (user) {
        await db.update(users).set({ totalPoints: (user.totalPoints || 0) + updatedTask.rewardPoints }).where(eq(users.id, task.assignedTo));
      }
    }
    return updatedTask;
  }
  async approveTaskReview(taskId, approverId) {
    const [task] = await db.update(tasks).set({
      status: "completed",
      completedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(tasks.id, taskId)).returning();
    return task;
  }
  // Task Collaborators
  async addTaskCollaborator(taskId, userId) {
    await db.insert(taskCollaborators).values({ taskId, userId });
  }
  async removeTaskCollaborator(taskId, userId) {
    await db.delete(taskCollaborators).where(
      and(
        eq(taskCollaborators.taskId, taskId),
        eq(taskCollaborators.userId, userId)
      )
    );
  }
  async getTaskCollaborators(taskId) {
    const collaborators = await db.select({ user: users }).from(taskCollaborators).innerJoin(users, eq(taskCollaborators.userId, users.id)).where(eq(taskCollaborators.taskId, taskId));
    return collaborators.map((c) => c.user);
  }
  // Task Notes
  async createTaskNote(taskId, userId, content) {
    const [note] = await db.insert(taskNotes).values({ taskId, userId, content }).returning();
    return note;
  }
  async getTaskNotes(taskId) {
    const notes = await db.select({
      note: taskNotes,
      user: userPublicFields
    }).from(taskNotes).innerJoin(users, eq(taskNotes.userId, users.id)).where(eq(taskNotes.taskId, taskId)).orderBy(desc(taskNotes.createdAt));
    return notes.map(({ note, user }) => ({
      ...note,
      user
    }));
  }
  // AUX Sessions
  async createAuxSession(session3) {
    const [newSession] = await db.insert(auxSessions).values(session3).returning();
    return newSession;
  }
  async startAuxSession(data) {
    const activeSession = await this.getActiveAuxSession(data.userId);
    if (activeSession) {
      await this.endAuxSession(activeSession.id);
    }
    return await this.createAuxSession({
      userId: data.userId,
      status: data.status,
      notes: data.notes
    });
  }
  async endAuxSession(sessionId, notes) {
    const [session3] = await db.select().from(auxSessions).where(eq(auxSessions.id, sessionId));
    if (!session3) return void 0;
    const endTime = /* @__PURE__ */ new Date();
    const duration = Math.floor((endTime.getTime() - session3.startTime.getTime()) / 1e3);
    const [updatedSession] = await db.update(auxSessions).set({ endTime, duration, notes: notes || session3.notes }).where(eq(auxSessions.id, sessionId)).returning();
    return updatedSession || void 0;
  }
  async getUserAuxSessions(userId, startDate, endDate) {
    let conditions = [eq(auxSessions.userId, userId)];
    if (startDate) {
      conditions.push(gte(auxSessions.startTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(auxSessions.startTime, endDate));
    }
    return await db.select().from(auxSessions).where(and(...conditions)).orderBy(desc(auxSessions.startTime));
  }
  async getCurrentAuxSession(userId) {
    return await this.getActiveAuxSession(userId) || null;
  }
  async getAllAuxSessions() {
    return await db.select().from(auxSessions).orderBy(desc(auxSessions.startTime));
  }
  async getActiveAuxSession(userId) {
    const [session3] = await db.select().from(auxSessions).where(
      and(
        eq(auxSessions.userId, userId),
        isNull(auxSessions.endTime)
      )
    ).orderBy(desc(auxSessions.startTime)).limit(1);
    return session3 || void 0;
  }
  async getAllActiveAuxSessions() {
    const activeSessions = await db.select({
      session: auxSessions,
      user: userPublicFields
    }).from(auxSessions).innerJoin(users, eq(auxSessions.userId, users.id)).where(isNull(auxSessions.endTime)).orderBy(desc(auxSessions.startTime));
    return activeSessions.map(({ session: session3, user }) => ({
      ...session3,
      user
    }));
  }
  // Leave Requests
  async createLeaveRequest(request) {
    const [newRequest] = await db.insert(leaveRequests).values(request).returning();
    return newRequest;
  }
  async getLeaveRequest(id) {
    const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return request || void 0;
  }
  async getUserLeaveRequests(userId) {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.userId, userId)).orderBy(desc(leaveRequests.createdAt));
  }
  async getAllLeaveRequests() {
    return await db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
  }
  async getPendingLeaveRequests() {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.status, "pending")).orderBy(desc(leaveRequests.createdAt));
  }
  async updateLeaveRequest(id, status, approvedBy, rejectionReason) {
    const [request] = await db.update(leaveRequests).set({
      status,
      approvedBy,
      approvedAt: /* @__PURE__ */ new Date(),
      rejectionReason,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(leaveRequests.id, id)).returning();
    return request || void 0;
  }
  // Salary Advance Requests
  async createSalaryAdvanceRequest(request) {
    const [newRequest] = await db.insert(salaryAdvanceRequests).values(request).returning();
    return newRequest;
  }
  async getSalaryAdvanceRequest(id) {
    const [request] = await db.select().from(salaryAdvanceRequests).where(eq(salaryAdvanceRequests.id, id));
    return request || void 0;
  }
  async getUserSalaryAdvanceRequests(userId) {
    return await db.select().from(salaryAdvanceRequests).where(eq(salaryAdvanceRequests.userId, userId)).orderBy(desc(salaryAdvanceRequests.createdAt));
  }
  async getAllSalaryAdvanceRequests() {
    return await db.select().from(salaryAdvanceRequests).orderBy(desc(salaryAdvanceRequests.createdAt));
  }
  async getPendingSalaryAdvanceRequests() {
    return await db.select().from(salaryAdvanceRequests).where(eq(salaryAdvanceRequests.status, "pending")).orderBy(desc(salaryAdvanceRequests.createdAt));
  }
  async updateSalaryAdvanceRequest(id, status, approvedBy, rejectionReason, repaymentDate) {
    const [request] = await db.update(salaryAdvanceRequests).set({
      status,
      approvedBy,
      approvedAt: /* @__PURE__ */ new Date(),
      rejectionReason,
      repaymentDate,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(salaryAdvanceRequests.id, id)).returning();
    return request || void 0;
  }
  // Shifts
  async createShift(shift) {
    const [newShift] = await db.insert(shifts).values(shift).returning();
    return newShift;
  }
  async getUserShifts(userId) {
    return await db.select().from(shifts).where(eq(shifts.userId, userId)).orderBy(desc(shifts.startTime));
  }
  async getAllShifts() {
    return await db.select().from(shifts).orderBy(desc(shifts.startTime));
  }
  async getActiveShift(userId) {
    const [shift] = await db.select().from(shifts).where(
      and(
        eq(shifts.userId, userId),
        eq(shifts.isActive, true)
      )
    ).orderBy(desc(shifts.startTime)).limit(1);
    return shift || void 0;
  }
  // Notifications
  async createNotification(notificationData) {
    const validatedData = insertNotificationSchema.parse(notificationData);
    const [notification] = await db.insert(notifications).values(validatedData).returning();
    return notification;
  }
  async getUserNotifications(userId) {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }
  async markNotificationAsRead(id) {
    const [notification] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return notification || void 0;
  }
  async markMultipleNotificationsAsRead(notificationIds) {
    if (notificationIds.length === 0) return;
    for (const id of notificationIds) {
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    }
  }
  async markAllNotificationsAsRead(userId) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }
  async markNotificationsByResourceAsRead(userId, resourceId, category) {
    await db.update(notifications).set({ isRead: true }).where(and(
      eq(notifications.userId, userId),
      eq(notifications.category, category),
      sql2`metadata->>'resourceId' = ${resourceId}`
    ));
  }
  async deleteNotification(id) {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return result.rowCount > 0;
  }
  // Chat Rooms
  async createChatRoom(room) {
    const [newRoom] = await db.insert(chatRooms).values(room).returning();
    return newRoom;
  }
  async getOrCreatePrivateChat(user1Id, user2Id) {
    const existingRooms = await db.select({ roomId: chatRoomMembers.roomId }).from(chatRoomMembers).where(eq(chatRoomMembers.userId, user1Id)).innerJoin(chatRooms, eq(chatRoomMembers.roomId, chatRooms.id)).where(eq(chatRooms.type, "private"));
    for (const { roomId: roomId2 } of existingRooms) {
      const members2 = await db.select({ userId: chatRoomMembers.userId }).from(chatRoomMembers).where(eq(chatRoomMembers.roomId, roomId2));
      const memberIds = members2.map((m) => m.userId);
      if (memberIds.length === 2 && memberIds.includes(user1Id) && memberIds.includes(user2Id)) {
        const [room2] = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId2));
        const roomMembers = await db.select(userPublicFields).from(chatRoomMembers).innerJoin(users, eq(chatRoomMembers.userId, users.id)).where(eq(chatRoomMembers.roomId, roomId2));
        return {
          ...room2,
          members: roomMembers
        };
      }
    }
    const [firstUser] = await db.select().from(users).where(eq(users.id, user1Id));
    const [newRoom] = await db.insert(chatRooms).values({
      type: "private",
      createdBy: user1Id
    }).returning();
    const roomId = newRoom.id;
    if (roomId) {
      await db.insert(chatRoomMembers).values([
        { roomId: newRoom.id, userId: user1Id },
        { roomId: newRoom.id, userId: user2Id }
      ]);
    }
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId));
    const members = await db.select(userPublicFields).from(chatRoomMembers).innerJoin(users, eq(chatRoomMembers.userId, users.id)).where(eq(chatRoomMembers.roomId, roomId));
    return {
      ...room,
      members
    };
  }
  async getOrCreateCommonRoom() {
    const [existingRoom] = await db.select().from(chatRooms).where(and(
      eq(chatRooms.type, "group"),
      eq(chatRooms.name, "\u0627\u0644\u063A\u0631\u0641\u0629 \u0627\u0644\u0639\u0627\u0645\u0629")
    )).limit(1);
    if (existingRoom) {
      return existingRoom;
    }
    const [firstUser] = await db.select().from(users).limit(1);
    const [commonRoom] = await db.insert(chatRooms).values({
      name: "\u0627\u0644\u063A\u0631\u0641\u0629 \u0627\u0644\u0639\u0627\u0645\u0629",
      type: "group",
      createdBy: firstUser?.id || sql2`gen_random_uuid()`
    }).returning();
    const allUsers = await db.select().from(users);
    const memberValues = allUsers.map((user) => ({
      roomId: commonRoom.id,
      userId: user.id
    }));
    if (memberValues.length > 0) {
      await db.insert(chatRoomMembers).values(memberValues);
    }
    return commonRoom;
  }
  async ensureUserInCommonRoom(userId) {
    const commonRoom = await this.getOrCreateCommonRoom();
    const [existing] = await db.select().from(chatRoomMembers).where(and(
      eq(chatRoomMembers.roomId, commonRoom.id),
      eq(chatRoomMembers.userId, userId)
    )).limit(1);
    if (!existing) {
      await db.insert(chatRoomMembers).values({
        roomId: commonRoom.id,
        userId
      });
    }
  }
  async getUserChatRooms(userId) {
    const rooms = await db.select({
      room: chatRooms
    }).from(chatRoomMembers).innerJoin(chatRooms, eq(chatRoomMembers.roomId, chatRooms.id)).where(eq(chatRoomMembers.userId, userId)).orderBy(desc(chatRooms.updatedAt));
    const result = [];
    for (const { room } of rooms) {
      const members = await db.select(userPublicFields).from(chatRoomMembers).innerJoin(users, eq(chatRoomMembers.userId, users.id)).where(eq(chatRoomMembers.roomId, room.id));
      const [lastMessage] = await db.select().from(chatMessages).where(eq(chatMessages.roomId, room.id)).orderBy(desc(chatMessages.createdAt)).limit(1);
      result.push({
        ...room,
        members,
        lastMessage
      });
    }
    return result;
  }
  async getChatRoom(roomId) {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId));
    return room || void 0;
  }
  async getChatRoomMembers(roomId) {
    const members = await db.select(userPublicFields).from(chatRoomMembers).innerJoin(users, eq(chatRoomMembers.userId, users.id)).where(eq(chatRoomMembers.roomId, roomId));
    return members;
  }
  async addChatRoomMember(roomId, userId) {
    await db.insert(chatRoomMembers).values({ roomId, userId });
  }
  async updateLastReadMessage(roomId, userId, messageId) {
    await db.update(chatRoomMembers).set({ lastReadMessageId: messageId }).where(and(
      eq(chatRoomMembers.roomId, roomId),
      eq(chatRoomMembers.userId, userId)
    ));
  }
  async getUnreadMessageCount(roomId, userId) {
    const member = await db.select().from(chatRoomMembers).where(and(
      eq(chatRoomMembers.roomId, roomId),
      eq(chatRoomMembers.userId, userId)
    )).limit(1);
    if (!member || member.length === 0) return 0;
    const lastReadId = member[0].lastReadMessageId;
    if (!lastReadId) {
      const [result2] = await db.select({ count: count() }).from(chatMessages).where(and(
        eq(chatMessages.roomId, roomId),
        sql2`${chatMessages.senderId} != ${userId}`
      ));
      return result2?.count || 0;
    }
    const lastReadMessage = await db.select({ createdAt: chatMessages.createdAt }).from(chatMessages).where(eq(chatMessages.id, lastReadId)).limit(1);
    if (!lastReadMessage || lastReadMessage.length === 0) {
      const [result2] = await db.select({ count: count() }).from(chatMessages).where(and(
        eq(chatMessages.roomId, roomId),
        sql2`${chatMessages.senderId} != ${userId}`
      ));
      return result2?.count || 0;
    }
    const [result] = await db.select({ count: count() }).from(chatMessages).where(and(
      eq(chatMessages.roomId, roomId),
      sql2`${chatMessages.senderId} != ${userId}`,
      sql2`${chatMessages.createdAt} > ${lastReadMessage[0].createdAt}`
    ));
    return result?.count || 0;
  }
  async updateChatRoomImage(roomId, image) {
    const [room] = await db.update(chatRooms).set({ image }).where(eq(chatRooms.id, roomId)).returning();
    return room;
  }
  // Chat Messages
  async createChatMessage(message) {
    const messageData = {
      roomId: message.roomId,
      senderId: message.senderId,
      content: message.content || null,
      messageType: message.messageType || "text",
      attachments: message.attachments || null,
      replyTo: message.replyTo || null
    };
    const [chatMessage] = await db.insert(chatMessages).values(messageData).returning();
    await db.update(chatRooms).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(chatRooms.id, message.roomId));
    return chatMessage;
  }
  async getChatMessage(messageId) {
    const [message] = await db.select().from(chatMessages).where(eq(chatMessages.id, messageId));
    return message || void 0;
  }
  async getChatMessages(roomId, limit = 50) {
    const messages = await db.select({
      message: chatMessages,
      sender: userPublicFields
    }).from(chatMessages).innerJoin(users, eq(chatMessages.senderId, users.id)).where(eq(chatMessages.roomId, roomId)).orderBy(desc(chatMessages.createdAt)).limit(limit);
    const result = [];
    for (const { message, sender } of messages) {
      const reactions = await db.select().from(messageReactions).where(eq(messageReactions.messageId, message.id));
      result.push({
        ...message,
        sender,
        reactions
      });
    }
    return result.reverse();
  }
  async updateChatMessage(messageId, content) {
    const [message] = await db.update(chatMessages).set({ content, isEdited: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(chatMessages.id, messageId)).returning();
    return message || void 0;
  }
  async deleteChatMessage(messageId) {
    const result = await db.delete(chatMessages).where(eq(chatMessages.id, messageId));
    return result.rowCount > 0;
  }
  // Message Reactions
  async addMessageReaction(messageId, userId, emoji) {
    const existing = await db.select().from(messageReactions).where(and(
      eq(messageReactions.messageId, messageId),
      eq(messageReactions.userId, userId)
    )).limit(1);
    if (existing.length > 0) {
      if (existing[0].emoji === emoji) {
        await db.delete(messageReactions).where(eq(messageReactions.id, existing[0].id));
        return { ...existing[0], action: "removed" };
      }
      const [updated] = await db.update(messageReactions).set({ emoji, createdAt: /* @__PURE__ */ new Date() }).where(eq(messageReactions.id, existing[0].id)).returning();
      return { ...updated, action: "switched" };
    }
    const [reaction] = await db.insert(messageReactions).values({ messageId, userId, emoji }).returning();
    return { ...reaction, action: "added" };
  }
  async removeMessageReaction(messageId, userId, emoji) {
    const result = await db.delete(messageReactions).where(and(
      eq(messageReactions.messageId, messageId),
      eq(messageReactions.userId, userId),
      eq(messageReactions.emoji, emoji)
    ));
    return result.rowCount > 0;
  }
  // Meetings
  async createMeeting(meeting) {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();
    return newMeeting;
  }
  async getMeeting(id) {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting || void 0;
  }
  async getAllMeetings() {
    return await db.select().from(meetings).orderBy(desc(meetings.startTime));
  }
  async getUserMeetings(userId) {
    const participations = await db.select({ meeting: meetings }).from(meetingParticipants).innerJoin(meetings, eq(meetingParticipants.meetingId, meetings.id)).where(eq(meetingParticipants.userId, userId)).orderBy(desc(meetings.startTime));
    return participations.map((p) => p.meeting);
  }
  async updateMeeting(id, updates) {
    const [meeting] = await db.update(meetings).set(updates).where(eq(meetings.id, id)).returning();
    return meeting || void 0;
  }
  async deleteMeeting(id) {
    const result = await db.delete(meetings).where(eq(meetings.id, id));
    return result.rowCount > 0;
  }
  async addMeetingParticipant(meetingId, userId) {
    await db.insert(meetingParticipants).values({ meetingId, userId });
  }
  async removeMeetingParticipant(meetingId, userId) {
    await db.delete(meetingParticipants).where(
      and(
        eq(meetingParticipants.meetingId, meetingId),
        eq(meetingParticipants.userId, userId)
      )
    );
  }
  async getMeetingParticipants(meetingId) {
    const participants = await db.select({ user: users }).from(meetingParticipants).innerJoin(users, eq(meetingParticipants.userId, users.id)).where(eq(meetingParticipants.meetingId, meetingId));
    return participants.map((p) => p.user);
  }
  // Google Calendar OAuth
  async saveGoogleCalendarToken(userId, accessToken, refreshToken, expiresAt, scope) {
    const existing = await this.getGoogleCalendarToken(userId);
    if (existing) {
      const [token2] = await db.update(googleCalendarTokens).set({ accessToken, refreshToken, expiresAt, scope, updatedAt: /* @__PURE__ */ new Date() }).where(eq(googleCalendarTokens.userId, userId)).returning();
      return token2;
    }
    const [token] = await db.insert(googleCalendarTokens).values({ userId, accessToken, refreshToken, expiresAt, scope }).returning();
    return token;
  }
  async getGoogleCalendarToken(userId) {
    const [token] = await db.select().from(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));
    return token || void 0;
  }
  async deleteGoogleCalendarToken(userId) {
    const result = await db.delete(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));
    return result.rowCount > 0;
  }
  // Call Logs
  async createCallLog(callLog) {
    const [newCallLog] = await db.insert(callLogs).values(callLog).returning();
    return newCallLog;
  }
  async getCallLog(id) {
    const [callLog] = await db.select().from(callLogs).where(eq(callLogs.id, id));
    return callLog || void 0;
  }
  async getUserCallLogs(userId) {
    const callerAlias = alias(users, "caller");
    const receiverAlias = alias(users, "receiver");
    const logs = await db.select({
      id: callLogs.id,
      roomId: callLogs.roomId,
      callerId: callLogs.callerId,
      receiverId: callLogs.receiverId,
      callType: callLogs.callType,
      status: callLogs.status,
      startedAt: callLogs.startedAt,
      endedAt: callLogs.endedAt,
      duration: callLogs.duration,
      createdAt: callLogs.createdAt,
      callerFullName: callerAlias.fullName,
      callerProfilePicture: callerAlias.profilePicture,
      receiverFullName: receiverAlias.fullName,
      receiverProfilePicture: receiverAlias.profilePicture
    }).from(callLogs).leftJoin(callerAlias, eq(callLogs.callerId, callerAlias.id)).leftJoin(receiverAlias, eq(callLogs.receiverId, receiverAlias.id)).where(or(eq(callLogs.callerId, userId), eq(callLogs.receiverId, userId))).orderBy(desc(callLogs.startedAt));
    return logs.map((log2) => ({
      id: log2.id,
      roomId: log2.roomId,
      callerId: log2.callerId,
      receiverId: log2.receiverId,
      callType: log2.callType,
      status: log2.status,
      startedAt: log2.startedAt,
      endedAt: log2.endedAt,
      duration: log2.duration,
      createdAt: log2.createdAt,
      caller: {
        id: log2.callerId,
        fullName: log2.callerFullName,
        profilePicture: log2.callerProfilePicture
      },
      receiver: {
        id: log2.receiverId,
        fullName: log2.receiverFullName,
        profilePicture: log2.receiverProfilePicture
      }
    }));
  }
  async getRoomCallLogs(roomId) {
    const callerAlias = alias(users, "caller");
    const receiverAlias = alias(users, "receiver");
    const logs = await db.select({
      id: callLogs.id,
      roomId: callLogs.roomId,
      callerId: callLogs.callerId,
      receiverId: callLogs.receiverId,
      callType: callLogs.callType,
      status: callLogs.status,
      startedAt: callLogs.startedAt,
      endedAt: callLogs.endedAt,
      duration: callLogs.duration,
      createdAt: callLogs.createdAt,
      callerFullName: callerAlias.fullName,
      callerProfilePicture: callerAlias.profilePicture,
      receiverFullName: receiverAlias.fullName,
      receiverProfilePicture: receiverAlias.profilePicture
    }).from(callLogs).leftJoin(callerAlias, eq(callLogs.callerId, callerAlias.id)).leftJoin(receiverAlias, eq(callLogs.receiverId, receiverAlias.id)).where(eq(callLogs.roomId, roomId)).orderBy(desc(callLogs.startedAt));
    return logs.map((log2) => ({
      id: log2.id,
      roomId: log2.roomId,
      callerId: log2.callerId,
      receiverId: log2.receiverId,
      callType: log2.callType,
      status: log2.status,
      startedAt: log2.startedAt,
      endedAt: log2.endedAt,
      duration: log2.duration,
      createdAt: log2.createdAt,
      caller: {
        id: log2.callerId,
        fullName: log2.callerFullName,
        profilePicture: log2.callerProfilePicture
      },
      receiver: {
        id: log2.receiverId,
        fullName: log2.receiverFullName,
        profilePicture: log2.receiverProfilePicture
      }
    }));
  }
  async updateCallLog(id, updates) {
    const [callLog] = await db.update(callLogs).set(updates).where(eq(callLogs.id, id)).returning();
    return callLog || void 0;
  }
  // Suggestions
  async createSuggestion(suggestion) {
    const [newSuggestion] = await db.insert(suggestions).values(suggestion).returning();
    return newSuggestion;
  }
  async getAllSuggestions() {
    return await db.select().from(suggestions).orderBy(desc(suggestions.createdAt));
  }
  async getUserSuggestions(userId) {
    return await db.select().from(suggestions).where(eq(suggestions.userId, userId)).orderBy(desc(suggestions.createdAt));
  }
  async updateSuggestion(id, updates) {
    const [suggestion] = await db.update(suggestions).set(updates).where(eq(suggestions.id, id)).returning();
    return suggestion || void 0;
  }
  // Salary Deductions
  async createSalaryDeduction(deduction) {
    const [newDeduction] = await db.insert(salaryDeductions).values(deduction).returning();
    return newDeduction;
  }
  async getSalaryDeduction(id) {
    const [deduction] = await db.select().from(salaryDeductions).where(eq(salaryDeductions.id, id));
    return deduction || void 0;
  }
  async getUserSalaryDeductions(userId) {
    const results = await db.select({
      id: salaryDeductions.id,
      userId: salaryDeductions.userId,
      addedBy: salaryDeductions.addedBy,
      reason: salaryDeductions.reason,
      daysDeducted: salaryDeductions.daysDeducted,
      amount: salaryDeductions.amount,
      createdAt: salaryDeductions.createdAt,
      updatedAt: salaryDeductions.updatedAt,
      user: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        department: users.department,
        profilePicture: users.profilePicture
      }
    }).from(salaryDeductions).leftJoin(users, eq(salaryDeductions.userId, users.id)).where(eq(salaryDeductions.userId, userId)).orderBy(desc(salaryDeductions.createdAt));
    return results;
  }
  async getAllSalaryDeductions() {
    const results = await db.select({
      id: salaryDeductions.id,
      userId: salaryDeductions.userId,
      addedBy: salaryDeductions.addedBy,
      reason: salaryDeductions.reason,
      daysDeducted: salaryDeductions.daysDeducted,
      amount: salaryDeductions.amount,
      createdAt: salaryDeductions.createdAt,
      updatedAt: salaryDeductions.updatedAt,
      user: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        department: users.department,
        profilePicture: users.profilePicture
      },
      addedByUser: {
        id: sql2`added_by_user.id`.as("added_by_user_id"),
        fullName: sql2`added_by_user.full_name`.as("added_by_user_full_name"),
        email: sql2`added_by_user.email`.as("added_by_user_email")
      }
    }).from(salaryDeductions).leftJoin(users, eq(salaryDeductions.userId, users.id)).leftJoin(sql2`users AS added_by_user`, sql2`${salaryDeductions.addedBy} = added_by_user.id`).orderBy(desc(salaryDeductions.createdAt));
    return results.map((row) => ({
      ...row,
      addedByUser: row.added_by_user_id ? {
        id: row.added_by_user_id,
        fullName: row.added_by_user_full_name,
        email: row.added_by_user_email
      } : null
    }));
  }
  async updateSalaryDeduction(id, updates) {
    const [deduction] = await db.update(salaryDeductions).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(salaryDeductions.id, id)).returning();
    return deduction || void 0;
  }
  async deleteSalaryDeduction(id) {
    const result = await db.delete(salaryDeductions).where(eq(salaryDeductions.id, id)).returning();
    return result.length > 0;
  }
  // Analytics & Rewards
  async getUserRewards(userId) {
    const completedTasks = await db.select().from(tasks).where(
      and(
        eq(tasks.assignedTo, userId),
        eq(tasks.status, "completed")
      )
    ).orderBy(desc(tasks.completedAt));
    return completedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      points: task.rewardPoints || 0,
      rating: task.performanceRating || 0,
      completedAt: task.completedAt
    }));
  }
  async getUserProductivityStats(userId, startDate, endDate) {
    const userTasks = await db.select().from(tasks).where(
      and(
        eq(tasks.assignedTo, userId),
        gte(tasks.createdAt, startDate),
        lte(tasks.createdAt, endDate)
      )
    );
    const completedTasks = userTasks.filter((t) => t.status === "completed");
    const totalEstimatedHours = userTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActualHours = completedTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const avgRating = completedTasks.length > 0 ? completedTasks.reduce((sum, t) => sum + (t.performanceRating || 0), 0) / completedTasks.length : 0;
    return {
      totalTasks: userTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: userTasks.filter((t) => t.status === "pending").length,
      inProgressTasks: userTasks.filter((t) => t.status === "in_progress").length,
      totalEstimatedHours,
      totalActualHours,
      efficiency: totalEstimatedHours > 0 ? totalEstimatedHours / (totalActualHours || 1) * 100 : 0,
      averageRating: avgRating
    };
  }
  async getSystemStats() {
    const allUsers = await db.select().from(users);
    const allTasks = await db.select().from(tasks);
    const activeUsers = allUsers.filter((u) => u.isActive);
    const completedTasks = allTasks.filter((t) => t.status === "completed");
    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: allTasks.filter((t) => t.status === "pending").length,
      inProgressTasks: allTasks.filter((t) => t.status === "in_progress").length
    };
  }
  async getDepartmentStats() {
    const allUsers = await db.select().from(users);
    const allTasks = await db.select().from(tasks);
    const departments = /* @__PURE__ */ new Map();
    allUsers.forEach((user) => {
      if (!departments.has(user.department)) {
        departments.set(user.department, {
          department: user.department,
          employees: 0,
          tasks: 0,
          completedTasks: 0
        });
      }
      const dept = departments.get(user.department);
      dept.employees += 1;
    });
    allTasks.forEach((task) => {
      const user = allUsers.find((u) => u.id === task.assignedTo);
      if (user) {
        const dept = departments.get(user.department);
        if (dept) {
          dept.tasks += 1;
          if (task.status === "completed") {
            dept.completedTasks += 1;
          }
        }
      }
    });
    return Array.from(departments.values());
  }
  // Companies
  async createCompany(company) {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }
  async getCompany(id) {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    if (!company) return void 0;
    let manager = void 0;
    if (company.managerId) {
      const [managerUser] = await db.select(userPublicFields).from(users).where(eq(users.id, company.managerId));
      manager = managerUser;
    }
    const taskCountResult = await db.select({ count: count() }).from(tasks).where(eq(tasks.companyId, id));
    const taskCount = taskCountResult[0]?.count || 0;
    return { ...company, manager, taskCount: Number(taskCount) };
  }
  async getAllCompanies() {
    const allCompanies = await db.select().from(companies).orderBy(desc(companies.createdAt));
    const companiesWithDetails = await Promise.all(
      allCompanies.map(async (company) => {
        let manager = void 0;
        if (company.managerId) {
          const [managerUser] = await db.select(userPublicFields).from(users).where(eq(users.id, company.managerId));
          manager = managerUser;
        }
        const taskCountResult = await db.select({ count: count() }).from(tasks).where(eq(tasks.companyId, company.id));
        const taskCount = taskCountResult[0]?.count || 0;
        return { ...company, manager, taskCount: Number(taskCount) };
      })
    );
    return companiesWithDetails;
  }
  async updateCompany(id, updates) {
    const [company] = await db.update(companies).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(companies.id, id)).returning();
    return company || void 0;
  }
  async deleteCompany(id) {
    const result = await db.delete(companies).where(eq(companies.id, id));
    return result.rowCount > 0;
  }
  async getCompanyTasks(companyId) {
    const tasksData = await db.query.tasks.findMany({
      where: eq(tasks.companyId, companyId),
      with: {
        createdBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        },
        createdFor: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        },
        assignedTo: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true
          }
        }
      },
      orderBy: [desc(tasks.createdAt)]
    });
    return tasksData.map((task) => ({
      ...task,
      createdByUser: task.createdBy,
      createdForUser: task.createdFor,
      assignedToUser: task.assignedTo
    }));
  }
  // Company Milestones
  async createCompanyMilestone(milestone) {
    const [newMilestone] = await db.insert(companyMilestones).values(milestone).returning();
    return newMilestone;
  }
  async getCompanyMilestones(companyId) {
    return await db.select().from(companyMilestones).where(eq(companyMilestones.companyId, companyId)).orderBy(companyMilestones.dueDate);
  }
  async updateCompanyMilestone(id, updates) {
    const [milestone] = await db.update(companyMilestones).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(companyMilestones.id, id)).returning();
    return milestone || void 0;
  }
  async deleteCompanyMilestone(id) {
    const result = await db.delete(companyMilestones).where(eq(companyMilestones.id, id));
    return result.rowCount > 0;
  }
  // Company Files
  async createCompanyFile(file) {
    const [newFile] = await db.insert(companyFiles).values(file).returning();
    return newFile;
  }
  async getCompanyFiles(companyId) {
    const files = await db.select({
      file: companyFiles,
      uploadedBy: userPublicFields
    }).from(companyFiles).innerJoin(users, eq(companyFiles.uploadedBy, users.id)).where(eq(companyFiles.companyId, companyId)).orderBy(desc(companyFiles.createdAt));
    return files.map(({ file, uploadedBy }) => ({
      ...file,
      uploadedBy
    }));
  }
  async deleteCompanyFile(id) {
    const result = await db.delete(companyFiles).where(eq(companyFiles.id, id));
    return result.rowCount > 0;
  }
  // Company Reports
  async createCompanyReport(report) {
    const [newReport] = await db.insert(companyReports).values(report).returning();
    return newReport;
  }
  async getCompanyReports(companyId) {
    const reports = await db.select({
      report: companyReports,
      uploadedBy: userPublicFields
    }).from(companyReports).innerJoin(users, eq(companyReports.uploadedBy, users.id)).where(eq(companyReports.companyId, companyId)).orderBy(desc(companyReports.reportDate));
    return reports.map(({ report, uploadedBy }) => ({
      ...report,
      uploadedBy
    }));
  }
  async updateCompanyReport(id, updates) {
    const [report] = await db.update(companyReports).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(companyReports.id, id)).returning();
    return report || void 0;
  }
  async deleteCompanyReport(id) {
    const result = await db.delete(companyReports).where(eq(companyReports.id, id));
    return result.rowCount > 0;
  }
  // Company Comments
  async createCompanyComment(comment) {
    const [newComment] = await db.insert(companyComments).values(comment).returning();
    return newComment;
  }
  async getCompanyComments(companyId) {
    const comments = await db.select({
      comment: companyComments,
      user: userPublicFields
    }).from(companyComments).innerJoin(users, eq(companyComments.userId, users.id)).where(eq(companyComments.companyId, companyId)).orderBy(desc(companyComments.createdAt));
    return comments.map(({ comment, user }) => ({
      ...comment,
      user
    }));
  }
  async updateCompanyComment(id, content) {
    const [comment] = await db.update(companyComments).set({ content, updatedAt: /* @__PURE__ */ new Date() }).where(eq(companyComments.id, id)).returning();
    return comment || void 0;
  }
  async deleteCompanyComment(id) {
    const result = await db.delete(companyComments).where(eq(companyComments.id, id));
    return result.rowCount > 0;
  }
  // Company Team Members
  async addCompanyTeamMember(companyId, userId, role) {
    const [member] = await db.insert(companyTeamMembers).values({ companyId, userId, role }).returning();
    return member;
  }
  async getCompanyTeamMembers(companyId) {
    const members = await db.select({
      member: companyTeamMembers,
      user: userPublicFields
    }).from(companyTeamMembers).innerJoin(users, eq(companyTeamMembers.userId, users.id)).where(eq(companyTeamMembers.companyId, companyId)).orderBy(companyTeamMembers.assignedAt);
    return members.map(({ member, user }) => ({
      ...member,
      user
    }));
  }
  async removeCompanyTeamMember(companyId, userId) {
    const result = await db.delete(companyTeamMembers).where(
      and(
        eq(companyTeamMembers.companyId, companyId),
        eq(companyTeamMembers.userId, userId)
      )
    );
    return result.rowCount > 0;
  }
  // AI Model Settings
  async getAiModelSettings(modelType) {
    const [settings] = await db.select().from(aiModelSettings).where(eq(aiModelSettings.modelType, modelType));
    return settings || void 0;
  }
  async getAllAiModelSettings() {
    return await db.select().from(aiModelSettings);
  }
  async createAiModelSettings(settings) {
    const [newSettings] = await db.insert(aiModelSettings).values(settings).returning();
    return newSettings;
  }
  async updateAiModelSettings(modelType, updates) {
    const [settings] = await db.update(aiModelSettings).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(aiModelSettings.modelType, modelType)).returning();
    return settings || void 0;
  }
  async deleteAiModelSettings(modelType) {
    const result = await db.delete(aiModelSettings).where(eq(aiModelSettings.modelType, modelType));
    return result.rowCount > 0;
  }
  // AI Conversations
  async createAiConversation(conversation) {
    const [newConversation] = await db.insert(aiConversations).values(conversation).returning();
    return newConversation;
  }
  async getAiConversation(id) {
    const [conversation] = await db.select().from(aiConversations).where(eq(aiConversations.id, id));
    return conversation || void 0;
  }
  async getUserAiConversations(userId, modelType) {
    if (modelType) {
      return await db.select().from(aiConversations).where(
        and(
          eq(aiConversations.userId, userId),
          eq(aiConversations.modelType, modelType)
        )
      ).orderBy(desc(aiConversations.updatedAt));
    }
    return await db.select().from(aiConversations).where(eq(aiConversations.userId, userId)).orderBy(desc(aiConversations.updatedAt));
  }
  async updateAiConversation(id, updates) {
    const [conversation] = await db.update(aiConversations).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(aiConversations.id, id)).returning();
    return conversation || void 0;
  }
  async deleteAiConversation(id) {
    const result = await db.delete(aiConversations).where(eq(aiConversations.id, id));
    return result.rowCount > 0;
  }
  // AI Messages
  async createAiMessage(message) {
    const [newMessage] = await db.insert(aiMessages).values(message).returning();
    return newMessage;
  }
  async getAiMessages(conversationId) {
    return await db.select().from(aiMessages).where(eq(aiMessages.conversationId, conversationId)).orderBy(aiMessages.createdAt);
  }
  async deleteAiMessage(id) {
    const result = await db.delete(aiMessages).where(eq(aiMessages.id, id));
    return result.rowCount > 0;
  }
  // AI Usage Logs
  async createAiUsageLog(log2) {
    const [newLog] = await db.insert(aiUsageLogs).values(log2).returning();
    return newLog;
  }
  async getUserAiUsageLogs(userId, startDate, endDate) {
    if (startDate && endDate) {
      return await db.select().from(aiUsageLogs).where(
        and(
          eq(aiUsageLogs.userId, userId),
          gte(aiUsageLogs.createdAt, startDate),
          lte(aiUsageLogs.createdAt, endDate)
        )
      ).orderBy(desc(aiUsageLogs.createdAt));
    }
    return await db.select().from(aiUsageLogs).where(eq(aiUsageLogs.userId, userId)).orderBy(desc(aiUsageLogs.createdAt));
  }
  async getAiUsageStats(modelType) {
    const query = modelType ? db.select({
      totalTokens: sql2`sum(${aiUsageLogs.totalTokens})`,
      totalRequests: sql2`count(*)`,
      successfulRequests: sql2`sum(case when ${aiUsageLogs.success} then 1 else 0 end)`
    }).from(aiUsageLogs).where(eq(aiUsageLogs.modelType, modelType)) : db.select({
      totalTokens: sql2`sum(${aiUsageLogs.totalTokens})`,
      totalRequests: sql2`count(*)`,
      successfulRequests: sql2`sum(case when ${aiUsageLogs.success} then 1 else 0 end)`
    }).from(aiUsageLogs);
    const [stats] = await query;
    return stats || { totalTokens: 0, totalRequests: 0, successfulRequests: 0 };
  }
};
var storage = new MemStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg2 from "connect-pg-simple";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const PostgresSessionStore2 = connectPg2(session2);
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "gwt-task-management-secret-key-12345",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore2({
      pool,
      createTableIfMissing: true
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1e3,
      // 24 hours
      secure: process.env.NODE_ENV === "production",
      httpOnly: true
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false, { message: "\u0628\u064A\u0627\u0646\u0627\u062A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
        }
        await storage.updateUserLastLogin(user.id);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, fullName, department, jobTitle } = req.body;
      if (!email || !password || !fullName || !department) {
        return res.status(400).json({ message: "\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644 \u0645\u0637\u0644\u0648\u0628\u0629" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0633\u062C\u0644 \u0645\u0633\u0628\u0642\u0627\u064B" });
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        fullName,
        department,
        jobTitle: jobTitle || "\u0645\u0648\u0638\u0641",
        role: "employee"
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          jobTitle: user.jobTitle
        });
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({
          message: info?.message || "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644"
        });
      }
      req.login(user, (err2) => {
        if (err2) return next(err2);
        res.status(200).json({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          jobTitle: user.jobTitle
        });
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const user = req.user;
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      jobTitle: user.jobTitle,
      profilePicture: user.profilePicture,
      bio: user.bio
    });
  });
}

// server/routes.ts
init_google_calendar_integration();

// server/openrouter-service.ts
var OpenRouterService = class {
  apiKey;
  baseUrl = "https://openrouter.ai/api/v1";
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("OpenRouter API key is required");
    }
    this.apiKey = apiKey;
  }
  getHeaders() {
    const referer = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.app` : "http://localhost:5000";
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": referer,
      "X-Title": "GWT AI System"
    };
  }
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: this.getHeaders()
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error listing OpenRouter models:", error);
      throw error;
    }
  }
  async chat(request) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...request,
          stream: false
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error?.message || errorData.error || response.statusText);
      }
      return await response.json();
    } catch (error) {
      console.error("Error in OpenRouter chat:", error);
      throw error;
    }
  }
  async streamChat(request, res, onToken) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...request,
          stream: true
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error?.message || errorData.error || response.statusText);
      }
      if (!response.body) {
        throw new Error("Response body is null");
      }
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let promptTokens = 0;
      let completionTokens = 0;
      let totalTokens = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === "data: [DONE]") {
              continue;
            }
            if (trimmedLine.startsWith("data: ")) {
              try {
                const jsonData = JSON.parse(trimmedLine.slice(6));
                if (jsonData.usage) {
                  promptTokens = jsonData.usage.prompt_tokens || 0;
                  completionTokens = jsonData.usage.completion_tokens || 0;
                  totalTokens = jsonData.usage.total_tokens || 0;
                }
                if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                  const content = jsonData.choices[0].delta.content;
                  fullContent += content;
                  if (onToken) {
                    onToken(content);
                  }
                  res.write(`data: ${JSON.stringify({ content })}

`);
                }
              } catch (parseError) {
                console.error("Error parsing SSE data:", parseError);
              }
            }
          }
        }
        res.write("data: [DONE]\n\n");
        res.end();
        return { promptTokens, completionTokens, totalTokens };
      } catch (streamError) {
        console.error("Error during streaming:", streamError);
        throw streamError;
      }
    } catch (error) {
      console.error("Error in OpenRouter stream chat:", error);
      throw error;
    }
  }
  async validateApiKey() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: this.getHeaders()
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("API key validation failed:", response.status, errorText);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error validating API key:", error);
      return false;
    }
  }
};
function getOpenRouterService(apiKey) {
  const key = apiKey || process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }
  return new OpenRouterService(key);
}

// server/routes.ts
import { z as z2 } from "zod";
import multer from "multer";
import path from "path";
var multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
var upload = multer({ storage: multerStorage });
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "\u0627\u0644\u0645\u0635\u0627\u062F\u0642\u0629 \u0645\u0637\u0644\u0648\u0628\u0629" });
  }
  next();
}
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0627\u0644\u0648\u0635\u0648\u0644" });
    }
    next();
  };
}
function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/tasks", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const tasks2 = await storage.getAllTasks();
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0647\u0627\u0645" });
    }
  });
  app2.get("/api/tasks/my", requireAuth, async (req, res) => {
    try {
      const tasks2 = await storage.getUserTasks(req.user.id);
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0647\u0627\u0645" });
    }
  });
  app2.get("/api/tasks/assigned", requireAuth, async (req, res) => {
    try {
      const tasks2 = await storage.getAssignedTasks(req.user.id);
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0645\u0639\u064A\u0646\u0629" });
    }
  });
  app2.get("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0647\u0645\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0647\u0645\u0629" });
    }
  });
  app2.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      if (!req.body.createdFor) {
        return res.status(400).json({ message: "\u064A\u062C\u0628 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0648\u0638\u0641 \u0627\u0644\u0630\u064A \u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0647\u0645\u0629 \u0644\u0647" });
      }
      const taskData = {
        ...req.body,
        createdBy: req.user.id,
        createdFor: req.body.createdFor,
        companyId: req.body.companyId || null,
        assignedTo: req.body.assignedTo || null,
        // Convert ISO string dates to Date objects for Drizzle
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : void 0
      };
      const task = await storage.createTask(taskData);
      if (task.createdFor && task.createdFor !== req.user.id) {
        await storage.createNotification({
          userId: task.createdFor,
          title: "\u0645\u0647\u0645\u0629 \u062C\u062F\u064A\u062F\u0629 \u062A\u0645 \u0625\u0646\u0634\u0627\u0624\u0647\u0627 \u0644\u0643",
          message: `\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0645\u0647\u0645\u0629 "${task.title}" \u0644\u0643`,
          type: "info",
          category: "task",
          metadata: {
            resourceId: task.id,
            taskId: task.id,
            userId: req.user.id,
            userName: req.user.fullName,
            userAvatar: req.user.profilePicture || void 0
          }
        });
      }
      if (task.assignedTo && task.assignedTo !== req.user.id && task.assignedTo !== task.createdFor) {
        await storage.createNotification({
          userId: task.assignedTo,
          title: "\u0645\u0647\u0645\u0629 \u062C\u062F\u064A\u062F\u0629 \u0645\u0639\u064A\u0646\u0629 \u0644\u0643 \u0643\u0645\u0631\u0627\u062C\u0639",
          message: `\u062A\u0645 \u062A\u0639\u064A\u064A\u0646\u0643 \u0643\u0645\u0631\u0627\u062C\u0639 \u0644\u0645\u0647\u0645\u0629 "${task.title}"`,
          type: "info",
          category: "task",
          metadata: {
            resourceId: task.id,
            taskId: task.id,
            userId: req.user.id,
            userName: req.user.fullName,
            userAvatar: req.user.profilePicture || void 0
          }
        });
      }
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error instanceof Error ? error.message : error, error instanceof Error ? error.stack : "");
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0647\u0645\u0629", error: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0647\u0645\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      const updateData = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : void 0
      };
      if (req.body.status === "completed") {
        const isCreator = existingTask.createdBy === req.user.id;
        const isAdminOrSubAdmin = req.user.role === "admin" || req.user.role === "sub-admin";
        if (isCreator || isAdminOrSubAdmin) {
          const task = await storage.updateTask(req.params.id, {
            ...updateData,
            completedAt: /* @__PURE__ */ new Date()
          });
          res.json(task);
        } else {
          const task = await storage.updateTask(req.params.id, {
            ...updateData,
            status: "under_review"
          });
          if (existingTask.assignedTo && existingTask.assignedTo !== req.user.id) {
            await storage.createNotification({
              userId: existingTask.assignedTo,
              title: "\u0645\u0647\u0645\u0629 \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629",
              message: `\u0627\u0644\u0645\u0647\u0645\u0629 "${existingTask.title}" \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629`,
              type: "info",
              category: "task",
              metadata: {
                resourceId: req.params.id,
                taskId: req.params.id,
                userId: req.user.id,
                userName: req.user.fullName,
                userAvatar: req.user.profilePicture || void 0
              }
            });
          }
          res.json(task);
        }
      } else {
        const task = await storage.updateTask(req.params.id, updateData);
        res.json(task);
      }
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0647\u0645\u0629" });
    }
  });
  app2.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0647\u0645\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      if (task.createdBy !== req.user.id && req.user.role !== "admin" && req.user.role !== "sub-admin") {
        return res.status(403).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062D\u0630\u0641 \u0647\u0630\u0647 \u0627\u0644\u0645\u0647\u0645\u0629" });
      }
      const success = await storage.deleteTask(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0647\u0645\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      res.json({ message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0647\u0645\u0629 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0645\u0647\u0645\u0629" });
    }
  });
  app2.get("/api/tasks/:id/comments", requireAuth, async (req, res) => {
    try {
      const comments = await storage.getTaskNotes(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching task comments:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A" });
    }
  });
  app2.post("/api/tasks/:id/comments", requireAuth, async (req, res) => {
    try {
      const comment = await storage.createTaskNote(
        req.params.id,
        req.user.id,
        req.body.content
      );
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating task comment:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0642" });
    }
  });
  app2.put("/api/tasks/:id/submit-review", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0647\u0645\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      if (task.assignedTo !== req.user.id && task.createdBy !== req.user.id) {
        return res.status(403).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062A\u0642\u062F\u064A\u0645 \u0647\u0630\u0647 \u0627\u0644\u0645\u0647\u0645\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629" });
      }
      const updatedTask = await storage.updateTask(req.params.id, { status: "under_review" });
      if (task.assignedTo && task.assignedTo !== req.user.id) {
        await storage.createNotification({
          userId: task.assignedTo,
          title: "\u0645\u0647\u0645\u0629 \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629",
          message: `\u0627\u0644\u0645\u0647\u0645\u0629 "${task.title}" \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629`,
          type: "info",
          category: "task",
          metadata: {
            resourceId: req.params.id,
            taskId: req.params.id,
            userId: req.user.id,
            userName: req.user.fullName,
            userAvatar: req.user.profilePicture || void 0
          }
        });
      }
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0645\u0647\u0645\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629" });
    }
  });
  app2.put("/api/tasks/:id/approve-review", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const task = await storage.approveTaskReview(req.params.id, req.user.id);
      if (!task) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0647\u0645\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      if (task.createdFor && task.createdFor !== req.user.id) {
        await storage.createNotification({
          userId: task.createdFor,
          title: "\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0647\u0645\u0629",
          message: `\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0645\u0647\u0645\u062A\u0643 "${task.title}" \u0648\u062A\u0645 \u0625\u0643\u0645\u0627\u0644\u0647\u0627 \u0628\u0646\u062C\u0627\u062D`,
          type: "success",
          category: "task",
          metadata: {
            resourceId: req.params.id,
            taskId: req.params.id,
            userId: req.user.id,
            userName: req.user.fullName,
            userAvatar: req.user.profilePicture || void 0
          }
        });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0647\u0645\u0629" });
    }
  });
  app2.put("/api/tasks/:id/rate", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const { rating } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "\u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0628\u064A\u0646 1 \u0648 5" });
      }
      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0647\u0645\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      if (existingTask.performanceRating) {
        return res.status(400).json({ message: "\u062A\u0645 \u062A\u0642\u064A\u064A\u0645 \u0647\u0630\u0647 \u0627\u0644\u0645\u0647\u0645\u0629 \u0645\u0633\u0628\u0642\u0627\u064B" });
      }
      const task = await storage.rateTask(req.params.id, rating, req.user.id);
      if (task.createdFor && task.createdFor !== req.user.id) {
        await storage.createNotification({
          userId: task.createdFor,
          title: "\u062A\u0645 \u062A\u0642\u064A\u064A\u0645 \u0645\u0647\u0645\u062A\u0643",
          message: `\u062A\u0645 \u062A\u0642\u064A\u064A\u0645 \u0645\u0647\u0645\u062A\u0643 "${task.title}" \u0628\u0640 ${rating} \u0646\u0642\u0627\u0637`,
          type: "info",
          category: "task",
          metadata: {
            resourceId: req.params.id,
            taskId: req.params.id,
            userId: req.user.id,
            userName: req.user.fullName,
            userAvatar: req.user.profilePicture || void 0
          }
        });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u0647\u0645\u0629" });
    }
  });
  app2.put("/api/tasks/:id/assign-points", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const { rewardPoints } = req.body;
      if (rewardPoints === void 0 || rewardPoints === null || typeof rewardPoints !== "number" || rewardPoints < 0) {
        return res.status(400).json({ message: "\u064A\u062C\u0628 \u062A\u062D\u062F\u064A\u062F \u0646\u0642\u0627\u0637 \u0645\u0643\u0627\u0641\u0623\u0629 \u0635\u062D\u064A\u062D\u0629" });
      }
      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0647\u0645\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      const task = await storage.updateTask(req.params.id, { rewardPoints });
      if (task.createdFor) {
        const taskAssignee = await storage.getUser(task.createdFor);
        if (taskAssignee) {
          const newTotalPoints = (taskAssignee.totalPoints || 0) + rewardPoints;
          await storage.updateUser(task.createdFor, { totalPoints: newTotalPoints });
          await storage.createNotification({
            userId: task.createdFor,
            title: "\u0646\u0642\u0627\u0637 \u0645\u0643\u0627\u0641\u0623\u0629 \u062C\u062F\u064A\u062F\u0629",
            message: `\u062A\u0645 \u0645\u0646\u062D\u0643 ${rewardPoints} \u0646\u0642\u0637\u0629 \u0645\u0643\u0627\u0641\u0623\u0629 \u0644\u0644\u0645\u0647\u0645\u0629 "${task.title}"`,
            type: "success",
            category: "reward",
            metadata: {
              points: rewardPoints,
              taskId: req.params.id
            }
          });
        }
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u0639\u064A\u064A\u0646 \u0646\u0642\u0627\u0637 \u0627\u0644\u0645\u0643\u0627\u0641\u0623\u0629" });
    }
  });
  app2.post("/api/aux/start", requireAuth, async (req, res) => {
    try {
      const session3 = await storage.startAuxSession({
        userId: req.user.id,
        status: req.body.status,
        notes: req.body.notes
      });
      res.json(session3);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0628\u062F\u0621 \u0627\u0644\u062C\u0644\u0633\u0629" });
    }
  });
  app2.post("/api/aux/end/:id", requireAuth, async (req, res) => {
    try {
      const session3 = await storage.endAuxSession(req.params.id, req.body.notes);
      if (!session3) {
        return res.status(404).json({ message: "\u0627\u0644\u062C\u0644\u0633\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      res.json(session3);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u062C\u0644\u0633\u0629" });
    }
  });
  app2.get("/api/aux/current", requireAuth, async (req, res) => {
    try {
      const session3 = await storage.getCurrentAuxSession(req.user.id);
      res.json(session3);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629" });
    }
  });
  app2.get("/api/aux/sessions", requireAuth, async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate) : void 0;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : void 0;
      const sessions = await storage.getUserAuxSessions(req.user.id, startDate, endDate);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u062C\u0644\u0633\u0627\u062A" });
    }
  });
  app2.get("/api/admin/employees", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const employees = await storage.getAllActiveAuxSessions();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646" });
    }
  });
  app2.get("/api/admin/stats", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A" });
    }
  });
  app2.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users2 = await storage.getUsers();
      res.json(users2.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
        jobTitle: user.jobTitle,
        role: user.role,
        isActive: user.isActive,
        profilePicture: user.profilePicture,
        totalPoints: user.totalPoints
        // إضافة totalPoints
      })));
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646" });
    }
  });
  app2.post("/api/admin/employees", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(req.body.password || "Employee@123", { saltRounds: 10 });
      const newEmployee = await storage.createUser({
        email: req.body.email,
        password: hashedPassword,
        fullName: req.body.fullName,
        department: req.body.department,
        jobTitle: req.body.jobTitle,
        role: req.body.role || "employee",
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        salary: req.body.salary || 0,
        hireDate: req.body.hireDate || /* @__PURE__ */ new Date(),
        isActive: true
      });
      res.status(201).json({
        id: newEmployee.id,
        fullName: newEmployee.fullName,
        email: newEmployee.email,
        department: newEmployee.department,
        jobTitle: newEmployee.jobTitle,
        role: newEmployee.role
      });
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0648\u0638\u0641" });
    }
  });
  app2.put("/api/admin/employees/:id", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const updates = {
        fullName: req.body.fullName,
        department: req.body.department,
        jobTitle: req.body.jobTitle,
        role: req.body.role,
        // إضافة role
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        salary: req.body.salary,
        isActive: req.body.isActive
      };
      const updatedEmployee = await storage.updateUser(req.params.id, updates);
      if (!updatedEmployee) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0648\u0638\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json(updatedEmployee);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0648\u0638\u0641" });
    }
  });
  app2.delete("/api/admin/employees/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      if (req.params.id === req.user.id) {
        return res.status(400).json({ message: "\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062D\u0630\u0641 \u062D\u0633\u0627\u0628\u0643 \u0627\u0644\u062E\u0627\u0635" });
      }
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json({ message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" });
    }
  });
  app2.get("/api/profile/:id", requireAuth, async (req, res) => {
    try {
      const users2 = await storage.getUsers();
      const user = users2.find((u) => u.id === req.params.id);
      if (!user) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        department: user.department,
        jobTitle: user.jobTitle,
        role: user.role,
        profilePicture: user.profilePicture,
        coverImage: user.coverImage,
        bio: user.bio,
        phoneNumber: user.phoneNumber,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        hireDate: user.hireDate,
        isActive: user.isActive,
        totalPoints: user.totalPoints
        // إضافة totalPoints
      });
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A" });
    }
  });
  app2.put("/api/profile", requireAuth, upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const updates = {
        fullName: req.body.fullName,
        department: req.body.department,
        jobTitle: req.body.jobTitle,
        bio: req.body.bio,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        dateOfBirth: req.body.dateOfBirth,
        hireDate: req.body.hireDate
      };
      if (req.files && req.files["profilePicture"]) {
        const file = req.files["profilePicture"][0];
        updates.profilePicture = `/uploads/${file.filename}`;
      }
      if (req.files && req.files["coverImage"]) {
        const file = req.files["coverImage"][0];
        updates.coverImage = `/uploads/${file.filename}`;
      }
      const updatedUser = await storage.updateUser(req.user.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A" });
    }
  });
  app2.post("/api/leaves", requireAuth, async (req, res) => {
    try {
      const startDateStr = req.body.startDate;
      const endDateStr = req.body.endDate;
      if (!startDateStr || !endDateStr) {
        return res.status(400).json({ message: "\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u0648\u0627\u0644\u0646\u0647\u0627\u064A\u0629" });
      }
      const [startYear, startMonth, startDay] = startDateStr.split("-").map(Number);
      const [endYear, endMonth, endDay] = endDateStr.split("-").map(Number);
      const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0);
      const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "\u062A\u0648\u0627\u0631\u064A\u062E \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
      }
      if (startDate > endDate) {
        return res.status(400).json({ message: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0642\u0628\u0644 \u0623\u0648 \u064A\u0633\u0627\u0648\u064A \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0646\u0647\u0627\u064A\u0629" });
      }
      const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24)));
      const leaveRequest = await storage.createLeaveRequest({
        userId: req.user.id,
        type: req.body.type,
        startDate,
        endDate,
        days,
        reason: req.body.reason || ""
      });
      const admins = await storage.getUsers();
      const adminUsers = admins.filter((u) => u.role === "admin" || u.role === "sub-admin");
      for (const admin of adminUsers) {
        const notification = await storage.createNotification({
          userId: admin.id,
          title: "\u0637\u0644\u0628 \u0625\u062C\u0627\u0632\u0629 \u062C\u062F\u064A\u062F",
          message: `${req.user.fullName} \u0642\u062F\u0645 \u0637\u0644\u0628 \u0625\u062C\u0627\u0632\u0629 \u062C\u062F\u064A\u062F`,
          type: "info",
          category: "system",
          metadata: {
            userId: req.user.id,
            userName: req.user.fullName
          }
        });
        sendToUser(notification.userId, {
          type: "new_notification",
          data: notification
        });
      }
      res.status(201).json(leaveRequest);
    } catch (error) {
      console.error("Error creating leave request:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      res.status(500).json({
        message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u0642\u062F\u064A\u0645 \u0637\u0644\u0628 \u0627\u0644\u0625\u062C\u0627\u0632\u0629",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/leaves/my", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getUserLeaveRequests(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching user leave requests:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0625\u062C\u0627\u0632\u0627\u062A" });
    }
  });
  app2.get("/api/leaves/pending", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const requests = await storage.getPendingLeaveRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending leave requests:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0625\u062C\u0627\u0632\u0627\u062A" });
    }
  });
  app2.put("/api/leaves/:id", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const { status, rejectionReason } = req.body;
      if (!status || status !== "approved" && status !== "rejected") {
        return res.status(400).json({ message: "\u062D\u0627\u0644\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
      }
      const leaveRequest = await storage.updateLeaveRequest(
        req.params.id,
        status,
        req.user.id,
        rejectionReason
      );
      if (!leaveRequest) {
        return res.status(404).json({ message: "\u0637\u0644\u0628 \u0627\u0644\u0625\u062C\u0627\u0632\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const statusText = leaveRequest.status === "approved" ? "\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649" : "\u062A\u0645 \u0631\u0641\u0636";
      const notification = await storage.createNotification({
        userId: leaveRequest.userId,
        title: "\u062A\u062D\u062F\u064A\u062B \u0637\u0644\u0628 \u0627\u0644\u0625\u062C\u0627\u0632\u0629",
        message: `${statusText} \u0637\u0644\u0628 \u0627\u0644\u0625\u062C\u0627\u0632\u0629 \u0627\u0644\u062E\u0627\u0635 \u0628\u0643`,
        type: leaveRequest.status === "approved" ? "success" : "error",
        category: "system",
        metadata: {
          resourceId: req.params.id,
          userId: req.user.id,
          userName: req.user.fullName
        }
      });
      sendToUser(notification.userId, {
        type: "new_notification",
        data: notification
      });
      res.json(leaveRequest);
    } catch (error) {
      console.error("Error updating leave request:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0637\u0644\u0628 \u0627\u0644\u0625\u062C\u0627\u0632\u0629" });
    }
  });
  app2.post("/api/salary-advances", requireAuth, async (req, res) => {
    try {
      const advanceRequest = await storage.createSalaryAdvanceRequest({
        userId: req.user.id,
        amount: req.body.amount,
        reason: req.body.reason,
        repaymentDate: req.body.repaymentDate ? new Date(req.body.repaymentDate) : null
      });
      const admins = await storage.getUsers();
      const adminUsers = admins.filter((u) => u.role === "admin" || u.role === "sub-admin");
      for (const admin of adminUsers) {
        const notification = await storage.createNotification({
          userId: admin.id,
          title: "\u0637\u0644\u0628 \u0633\u0644\u0641\u0629 \u062C\u062F\u064A\u062F",
          message: `${req.user.fullName} \u0642\u062F\u0645 \u0637\u0644\u0628 \u0633\u0644\u0641\u0629 \u062C\u062F\u064A\u062F \u0628\u0645\u0628\u0644\u063A ${advanceRequest.amount}`,
          type: "info",
          category: "system",
          metadata: {
            resourceId: advanceRequest.id,
            userId: req.user.id,
            userName: req.user.fullName
          }
        });
        sendToUser(notification.userId, {
          type: "new_notification",
          data: notification
        });
      }
      res.status(201).json(advanceRequest);
    } catch (error) {
      console.error("Error creating salary advance request:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628 \u0627\u0644\u0633\u0644\u0641\u0629" });
    }
  });
  app2.get("/api/salary-advances/pending", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const requests = await storage.getPendingSalaryAdvanceRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending salary advance requests:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0633\u0644\u0641" });
    }
  });
  app2.get("/api/salary-advances/user", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getUserSalaryAdvanceRequests(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching user salary advance requests:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0633\u0644\u0641" });
    }
  });
  app2.put("/api/salary-advances/:id", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const { status, rejectionReason, repaymentDate } = req.body;
      if (!status || status !== "approved" && status !== "rejected") {
        return res.status(400).json({ message: "\u062D\u0627\u0644\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
      }
      const advanceRequest = await storage.updateSalaryAdvanceRequest(
        req.params.id,
        status,
        req.user.id,
        rejectionReason,
        repaymentDate ? new Date(repaymentDate) : void 0
      );
      if (!advanceRequest) {
        return res.status(404).json({ message: "\u0637\u0644\u0628 \u0627\u0644\u0633\u0644\u0641\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const statusText = advanceRequest.status === "approved" ? "\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649" : "\u062A\u0645 \u0631\u0641\u0636";
      const notification = await storage.createNotification({
        userId: advanceRequest.userId,
        title: "\u062A\u062D\u062F\u064A\u062B \u0637\u0644\u0628 \u0627\u0644\u0633\u0644\u0641\u0629",
        message: `${statusText} \u0637\u0644\u0628 \u0627\u0644\u0633\u0644\u0641\u0629 \u0627\u0644\u062E\u0627\u0635 \u0628\u0643`,
        type: advanceRequest.status === "approved" ? "success" : "error",
        category: "system",
        metadata: {
          resourceId: req.params.id,
          userId: req.user.id,
          userName: req.user.fullName
        }
      });
      sendToUser(notification.userId, {
        type: "new_notification",
        data: notification
      });
      res.json(advanceRequest);
    } catch (error) {
      console.error("Error updating salary advance request:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0637\u0644\u0628 \u0627\u0644\u0633\u0644\u0641\u0629" });
    }
  });
  const updateSalaryDeductionSchema = z2.object({
    reason: z2.string().min(1),
    daysDeducted: z2.number().int().min(0).nullable().optional(),
    amount: z2.string().or(z2.number()).transform((val) => String(val))
  });
  app2.post("/api/deductions", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const validationResult = insertSalaryDeductionSchema.safeParse({
        userId: req.body.userId,
        addedBy: req.user.id,
        reason: req.body.reason,
        daysDeducted: req.body.daysDeducted || null,
        amount: req.body.amount
      });
      if (!validationResult.success) {
        console.error("Validation error:", validationResult.error.errors);
        return res.status(400).json({
          message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629",
          errors: validationResult.error.errors
        });
      }
      const deduction = await storage.createSalaryDeduction(validationResult.data);
      const allDeductions = await storage.getAllSalaryDeductions();
      const deductionWithUser = allDeductions.find((d) => d.id === deduction.id);
      const notification = await storage.createNotification({
        userId: deduction.userId,
        title: "\u062E\u0635\u0645 \u0645\u0646 \u0627\u0644\u0631\u0627\u062A\u0628",
        message: `\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u062E\u0635\u0645 \u0639\u0644\u0649 \u0631\u0627\u062A\u0628\u0643: ${deduction.reason}`,
        type: "warning",
        category: "system",
        metadata: {
          resourceId: deduction.id,
          userId: req.user.id,
          userName: req.user.fullName
        }
      });
      sendToUser(notification.userId, {
        type: "new_notification",
        data: notification
      });
      broadcast({
        type: "deduction_created",
        data: deductionWithUser || deduction
      });
      res.status(201).json(deductionWithUser || deduction);
    } catch (error) {
      console.error("Error creating deduction:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      res.status(500).json({
        message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u062E\u0635\u0645",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/deductions", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const deductions = await storage.getAllSalaryDeductions();
      res.json(deductions);
    } catch (error) {
      console.error("Error fetching deductions:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u062E\u0635\u0648\u0645\u0627\u062A" });
    }
  });
  app2.get("/api/deductions/user", requireAuth, async (req, res) => {
    try {
      const deductions = await storage.getUserSalaryDeductions(req.user.id);
      res.json(deductions);
    } catch (error) {
      console.error("Error fetching user deductions:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u062E\u0635\u0648\u0645\u0627\u062A" });
    }
  });
  app2.put("/api/deductions/:id", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const validationResult = updateSalaryDeductionSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("Validation error:", validationResult.error.errors);
        return res.status(400).json({
          message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629",
          errors: validationResult.error.errors
        });
      }
      const deduction = await storage.updateSalaryDeduction(req.params.id, validationResult.data);
      if (!deduction) {
        return res.status(404).json({ message: "\u0627\u0644\u062E\u0635\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const notification = await storage.createNotification({
        userId: deduction.userId,
        title: "\u062A\u062D\u062F\u064A\u062B \u062E\u0635\u0645 \u0627\u0644\u0631\u0627\u062A\u0628",
        message: `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062E\u0635\u0645 \u0639\u0644\u0649 \u0631\u0627\u062A\u0628\u0643: ${deduction.reason}`,
        type: "info",
        category: "system",
        metadata: {
          resourceId: deduction.id,
          userId: req.user.id,
          userName: req.user.fullName
        }
      });
      sendToUser(notification.userId, {
        type: "new_notification",
        data: notification
      });
      broadcast({
        type: "deduction_updated",
        data: deduction
      });
      res.json(deduction);
    } catch (error) {
      console.error("Error updating deduction:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      res.status(500).json({
        message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062E\u0635\u0645",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.delete("/api/deductions/:id", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const deduction = await storage.getSalaryDeduction(req.params.id);
      if (!deduction) {
        return res.status(404).json({ message: "\u0627\u0644\u062E\u0635\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const deleted = await storage.deleteSalaryDeduction(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "\u0627\u0644\u062E\u0635\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const notification = await storage.createNotification({
        userId: deduction.userId,
        title: "\u062D\u0630\u0641 \u062E\u0635\u0645 \u0627\u0644\u0631\u0627\u062A\u0628",
        message: `\u062A\u0645 \u062D\u0630\u0641 \u062E\u0635\u0645 \u0645\u0646 \u0631\u0627\u062A\u0628\u0643: ${deduction.reason}`,
        type: "success",
        category: "system",
        metadata: {
          userId: req.user.id,
          userName: req.user.fullName
        }
      });
      sendToUser(notification.userId, {
        type: "new_notification",
        data: notification
      });
      broadcast({
        type: "deduction_deleted",
        data: { id: req.params.id }
      });
      res.json({ message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062E\u0635\u0645 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Error deleting deduction:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      res.status(500).json({
        message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u062E\u0635\u0645",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications2 = await storage.getUserNotifications(req.user.id);
      res.json(notifications2);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" });
    }
  });
  app2.put("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0634\u0639\u0627\u0631" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0634\u0639\u0627\u0631" });
    }
  });
  app2.put("/api/notifications/batch-read", requireAuth, async (req, res) => {
    try {
      const { notificationIds } = req.body;
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({ message: "\u0645\u0639\u0631\u0641\u0627\u062A \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
      }
      await Promise.all(
        notificationIds.map((id) => storage.markNotificationAsRead(id))
      );
      res.json({ message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" });
    } catch (error) {
      console.error("Error batch marking notifications as read:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" });
    }
  });
  app2.put("/api/notifications/mark-by-resource", requireAuth, async (req, res) => {
    try {
      const { resourceId, category } = req.body;
      await storage.markNotificationsByResourceAsRead(req.user.id, resourceId, category);
      res.json({ message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" });
    }
  });
  app2.put("/api/chat/rooms/:roomId/last-read", requireAuth, async (req, res) => {
    try {
      const { messageId } = req.body;
      await storage.updateLastReadMessage(req.params.roomId, req.user.id, messageId);
      await storage.markNotificationsByResourceAsRead(req.user.id, req.params.roomId, "message");
      res.json({ message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0622\u062E\u0631 \u0631\u0633\u0627\u0644\u0629 \u0645\u0642\u0631\u0648\u0621\u0629" });
    } catch (error) {
      console.error("Error updating last read message:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0622\u062E\u0631 \u0631\u0633\u0627\u0644\u0629 \u0645\u0642\u0631\u0648\u0621\u0629" });
    }
  });
  app2.get("/api/chat/rooms/:roomId/unread-count", requireAuth, async (req, res) => {
    try {
      const count2 = await storage.getUnreadMessageCount(req.params.roomId, req.user.id);
      res.json({ count: count2 });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0639\u062F\u062F \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u063A\u064A\u0631 \u0627\u0644\u0645\u0642\u0631\u0648\u0621\u0629" });
    }
  });
  app2.get("/api/analytics/productivity", requireAuth, async (req, res) => {
    try {
      const startDate = new Date(req.query.startDate || Date.now() - 7 * 24 * 60 * 60 * 1e3);
      const endDate = new Date(req.query.endDate || Date.now());
      const stats = await storage.getUserProductivityStats(req.user.id, startDate, endDate);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0625\u0646\u062A\u0627\u062C\u064A\u0629" });
    }
  });
  app2.get("/api/analytics/departments", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const stats = await storage.getDepartmentStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0623\u0642\u0633\u0627\u0645" });
    }
  });
  app2.get("/api/hr/stats", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const users2 = await storage.getUsers();
      const activeEmployees = await storage.getAllActiveAuxSessions();
      const pendingLeaves = await storage.getPendingLeaveRequests();
      const allLeaves = await storage.getAllLeaveRequests();
      const totalEmployees = users2.filter((u) => u.isActive).length;
      const presentToday = activeEmployees.filter((e) => e.status === "working_on_project" || e.status === "ready").length;
      const onLeave = allLeaves.filter(
        (l) => l.status === "approved" && new Date(l.startDate) <= /* @__PURE__ */ new Date() && new Date(l.endDate) >= /* @__PURE__ */ new Date()
      ).length;
      const pendingRequests = pendingLeaves.length;
      res.json({
        totalEmployees,
        presentToday,
        onLeave,
        pendingRequests
      });
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0628\u0634\u0631\u064A\u0629" });
    }
  });
  app2.get("/api/hr/payroll", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const users2 = await storage.getUsers();
      const activeUsers = users2.filter((u) => u.isActive);
      const payrollData = activeUsers.map((user) => ({
        userId: user.id,
        fullName: user.fullName,
        department: user.department || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
        salary: user.salary || 0,
        overtime: 0,
        deductions: 0,
        netSalary: user.salary || 0
      }));
      res.json(payrollData);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0631\u0648\u0627\u062A\u0628" });
    }
  });
  app2.get("/api/hr/reports", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const users2 = await storage.getUsers();
      const activeUsers = users2.filter((u) => u.isActive);
      const allSessions = await storage.getAllAuxSessions();
      const allLeaves = await storage.getAllLeaveRequests();
      const last30Days = /* @__PURE__ */ new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      const recentSessions = allSessions.filter((s) => new Date(s.startTime) >= last30Days && s.endTime);
      const totalWorkMinutes = recentSessions.reduce((sum, session3) => {
        if (session3.duration) {
          return sum + session3.duration;
        }
        return sum;
      }, 0);
      const avgWorkHoursPerDay = totalWorkMinutes / (30 * 60);
      const attendanceRate = recentSessions.length > 0 ? recentSessions.filter((s) => s.status === "working_on_project").length / recentSessions.length * 100 : 0;
      const usedLeaveDays = allLeaves.filter((l) => l.status === "approved").reduce((sum, leave) => sum + leave.days, 0);
      const deptCounts = {};
      activeUsers.forEach((user) => {
        const dept = user.department || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F";
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      const departmentDistribution = Object.entries(deptCounts).map(([dept, count2]) => ({
        dept,
        count: count2,
        percentage: count2 / activeUsers.length * 100
      }));
      const employeeReports = await Promise.all(activeUsers.map(async (user) => {
        const userTasks = await storage.getUserTasks(user.id);
        const completedTasks = userTasks.filter((t) => t.status === "completed");
        const userSessions = allSessions.filter((s) => s.userId === user.id && new Date(s.startTime) >= last30Days);
        const totalWorkMinutes2 = userSessions.reduce((sum, session3) => {
          if (session3.duration) {
            return sum + session3.duration;
          }
          return sum;
        }, 0);
        const avgRating = completedTasks.length > 0 ? completedTasks.reduce((sum, task) => sum + (task.performanceRating || 0), 0) / completedTasks.length : 0;
        const userLeaves = allLeaves.filter((l) => l.userId === user.id && l.status === "approved");
        const userLeaveDays = userLeaves.reduce((sum, leave) => sum + leave.days, 0);
        return {
          userId: user.id,
          fullName: user.fullName,
          department: user.department || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
          jobTitle: user.jobTitle || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
          profilePicture: user.profilePicture,
          completedTasks: completedTasks.length,
          totalTasks: userTasks.length,
          workHours: (totalWorkMinutes2 / 60).toFixed(1),
          avgRating: avgRating.toFixed(1),
          leaveDays: userLeaveDays,
          activeStatus: user.isActive
        };
      }));
      res.json({
        attendanceRate: Math.round(attendanceRate),
        avgWorkHoursPerDay: avgWorkHoursPerDay.toFixed(1),
        usedLeaveDays,
        departmentDistribution,
        employeeReports
      });
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0628\u0634\u0631\u064A\u0629" });
    }
  });
  const httpServer = createServer(app2);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? process.env.ALLOWED_ORIGINS?.split(",") || ["https://hub.greenweb-tech.com"] : "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    path: "/socket.io/",
    transports: ["websocket", "polling"],
    allowEIO3: true
  });
  const userConnections = /* @__PURE__ */ new Map();
  function sendToUser(userId, message) {
    const connections = userConnections.get(userId);
    if (connections) {
      connections.forEach((socket) => {
        socket.emit("message", message);
      });
    }
  }
  function broadcast(message) {
    io.emit("message", message);
  }
  async function sendToRoomMembers(roomId, message, excludeUserId) {
    try {
      const members = await storage.getChatRoomMembers(roomId);
      members.forEach((member) => {
        if (!excludeUserId || member.id !== excludeUserId) {
          sendToUser(member.id, message);
        }
      });
    } catch (error) {
      console.error("Error sending to room members:", error);
    }
  }
  io.on("connection", (socket) => {
    console.log("Socket.IO client connected:", socket.id);
    socket.on("subscribe", (data) => {
      try {
        if (data.userId) {
          socket.userId = data.userId;
          if (!userConnections.has(data.userId)) {
            userConnections.set(data.userId, /* @__PURE__ */ new Set());
          }
          userConnections.get(data.userId).add(socket);
          console.log(`User ${data.userId} subscribed, total connections: ${userConnections.get(data.userId).size}`);
        }
      } catch (error) {
        console.error("Subscribe error:", error);
      }
    });
    socket.on("aux_update", (data) => {
      try {
        io.emit("aux_status_update", data.payload);
      } catch (error) {
        console.error("AUX update error:", error);
      }
    });
    socket.on("call_offer", (data) => {
      try {
        const recipientId = data.to || data.receiverId;
        if (recipientId) {
          sendToUser(recipientId, { type: "call_offer", ...data });
        } else {
          console.warn("Call offer missing recipient information");
        }
      } catch (error) {
        console.error("Call offer error:", error);
      }
    });
    socket.on("call_answer", (data) => {
      try {
        const recipientId = data.to || data.receiverId;
        if (recipientId) {
          sendToUser(recipientId, { type: "call_answer", ...data });
        } else {
          console.warn("Call answer missing recipient information");
        }
      } catch (error) {
        console.error("Call answer error:", error);
      }
    });
    socket.on("ice_candidate", (data) => {
      try {
        const recipientId = data.to || data.receiverId;
        if (recipientId) {
          sendToUser(recipientId, { type: "ice_candidate", ...data });
        } else {
          console.warn("ICE candidate missing recipient information");
        }
      } catch (error) {
        console.error("ICE candidate error:", error);
      }
    });
    socket.on("call_end", (data) => {
      try {
        const recipientId = data.to || data.receiverId;
        if (recipientId) {
          sendToUser(recipientId, { type: "call_end", ...data });
        } else {
          console.warn("Call end missing recipient information");
        }
      } catch (error) {
        console.error("Call end error:", error);
      }
    });
    socket.on("call_decline", (data) => {
      try {
        const recipientId = data.to || data.receiverId;
        if (recipientId) {
          sendToUser(recipientId, { type: "call_decline", ...data });
        } else {
          console.warn("Call decline missing recipient information");
        }
      } catch (error) {
        console.error("Call decline error:", error);
      }
    });
    socket.on("disconnect", () => {
      console.log("Socket.IO client disconnected:", socket.id);
      if (socket.userId) {
        const connections = userConnections.get(socket.userId);
        if (connections) {
          connections.delete(socket);
          if (connections.size === 0) {
            userConnections.delete(socket.userId);
          }
          console.log(`User ${socket.userId} disconnected, remaining connections: ${connections.size}`);
        }
      }
    });
  });
  app2.post("/api/calls/start", requireAuth, async (req, res) => {
    try {
      const { roomId, receiverId, callType } = req.body;
      const callLog = await storage.createCallLog({
        roomId,
        callerId: req.user.id,
        receiverId,
        callType: callType || "audio",
        status: "initiated"
      });
      const notification = await storage.createNotification({
        userId: receiverId,
        title: `${callType === "video" ? "\u0645\u0643\u0627\u0644\u0645\u0629 \u0641\u064A\u062F\u064A\u0648" : "\u0645\u0643\u0627\u0644\u0645\u0629 \u0635\u0648\u062A\u064A\u0629"} \u0648\u0627\u0631\u062F\u0629`,
        message: `${req.user.fullName} \u064A\u062A\u0635\u0644 \u0628\u0643`,
        type: "info",
        category: "call",
        metadata: {
          resourceId: callLog.id,
          callId: callLog.id,
          callType: callType || "audio",
          userId: req.user.id,
          userName: req.user.fullName,
          userAvatar: req.user.profilePicture || void 0
        }
      });
      sendToUser(receiverId, {
        type: "new_notification",
        data: notification
      });
      res.json(callLog);
    } catch (error) {
      console.error("Error starting call:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0628\u062F\u0621 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629" });
    }
  });
  app2.patch("/api/calls/:id/status", requireAuth, async (req, res) => {
    try {
      const { status, duration } = req.body;
      const updates = { status };
      if (status === "ended" && duration !== void 0) {
        updates.duration = duration;
        updates.endedAt = /* @__PURE__ */ new Date();
      }
      const callLog = await storage.updateCallLog(req.params.id, updates);
      if (!callLog) {
        return res.status(404).json({ message: "\u0633\u062C\u0644 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json(callLog);
    } catch (error) {
      console.error("Error updating call status:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629" });
    }
  });
  app2.get("/api/calls/history", requireAuth, async (req, res) => {
    try {
      const callLogs2 = await storage.getUserCallLogs(req.user.id);
      res.json(callLogs2);
    } catch (error) {
      console.error("Error fetching call history:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0633\u062C\u0644 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A" });
    }
  });
  app2.get("/api/calls/room/:roomId", requireAuth, async (req, res) => {
    try {
      const callLogs2 = await storage.getRoomCallLogs(req.params.roomId);
      res.json(callLogs2);
    } catch (error) {
      console.error("Error fetching room call logs:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0633\u062C\u0644 \u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0627\u0644\u063A\u0631\u0641\u0629" });
    }
  });
  app2.post("/api/chat/rooms", requireAuth, async (req, res) => {
    try {
      let imageUrl = void 0;
      if (req.body.image && req.body.image.startsWith("data:image/")) {
        try {
          const base64Data = req.body.image.split(",")[1];
          const imageBuffer = Buffer.from(base64Data, "base64");
          const extension = req.body.image.split(";")[0].split("/")[1];
          const filename = Date.now() + "-" + Math.round(Math.random() * 1e9) + "." + extension;
          const fs2 = await import("fs/promises");
          await fs2.writeFile(`uploads/${filename}`, imageBuffer);
          imageUrl = `/uploads/${filename}`;
        } catch (imgError) {
          console.error("Error saving room image:", imgError);
        }
      }
      const room = await storage.createChatRoom({
        name: req.body.name,
        type: req.body.type || "group",
        createdBy: req.user.id,
        image: imageUrl
      });
      if (req.body.memberIds && Array.isArray(req.body.memberIds)) {
        for (const memberId of req.body.memberIds) {
          await storage.addChatRoomMember(room.id, memberId);
        }
      }
      await storage.addChatRoomMember(room.id, req.user.id);
      res.status(201).json(room);
    } catch (error) {
      console.error("Error creating chat room:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u063A\u0631\u0641\u0629 \u0627\u0644\u062F\u0631\u062F\u0634\u0629" });
    }
  });
  app2.post("/api/chat/private", requireAuth, async (req, res) => {
    try {
      const { otherUserId } = req.body;
      const room = await storage.getOrCreatePrivateChat(req.user.id, otherUserId);
      res.json(room);
    } catch (error) {
      console.error("Error creating private chat:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062F\u0631\u062F\u0634\u0629 \u0627\u0644\u062E\u0627\u0635\u0629" });
    }
  });
  app2.get("/api/chat/rooms", requireAuth, async (req, res) => {
    try {
      await storage.ensureUserInCommonRoom(req.user.id);
      const rooms = await storage.getUserChatRooms(req.user.id);
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u063A\u0631\u0641 \u0627\u0644\u062F\u0631\u062F\u0634\u0629" });
    }
  });
  app2.get("/api/chat/rooms/:id", requireAuth, async (req, res) => {
    try {
      const room = await storage.getChatRoom(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "\u063A\u0631\u0641\u0629 \u0627\u0644\u062F\u0631\u062F\u0634\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u063A\u0631\u0641\u0629 \u0627\u0644\u062F\u0631\u062F\u0634\u0629" });
    }
  });
  app2.get("/api/chat/unread-counts", requireAuth, async (req, res) => {
    try {
      const rooms = await storage.getUserChatRooms(req.user.id);
      const unreadCounts = {};
      for (const room of rooms) {
        const count2 = await storage.getUnreadMessageCount(room.id, req.user.id);
        unreadCounts[room.id] = count2;
      }
      res.json(unreadCounts);
    } catch (error) {
      console.error("Error getting unread counts:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0639\u062F\u062F \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u063A\u064A\u0631 \u0627\u0644\u0645\u0642\u0631\u0648\u0621\u0629" });
    }
  });
  app2.put("/api/chat/rooms/:id/image", requireAuth, async (req, res) => {
    try {
      const room = await storage.updateChatRoomImage(req.params.id, req.body.image);
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0635\u0648\u0631\u0629 \u0627\u0644\u063A\u0631\u0641\u0629" });
    }
  });
  app2.post("/api/chat/messages", requireAuth, async (req, res) => {
    try {
      const message = await storage.createChatMessage({
        roomId: req.body.roomId,
        senderId: req.user.id,
        content: req.body.content,
        messageType: req.body.messageType || "text",
        attachments: req.body.attachments,
        replyTo: req.body.replyTo
      });
      const room = await storage.getChatRoom(req.body.roomId);
      const roomMembers = await storage.getChatRoomMembers(req.body.roomId);
      for (const member of roomMembers) {
        if (member.id !== req.user.id) {
          const notification = await storage.createNotification({
            userId: member.id,
            title: room?.name || "\u0631\u0633\u0627\u0644\u0629 \u062C\u062F\u064A\u062F\u0629",
            message: `${req.user.fullName}: ${req.body.content || "\u0623\u0631\u0633\u0644 \u0631\u0633\u0627\u0644\u0629"}`,
            type: "info",
            category: "message",
            metadata: {
              resourceId: req.body.roomId,
              roomId: req.body.roomId,
              messageId: message.id,
              userId: req.user.id,
              userName: req.user.fullName,
              userAvatar: req.user.profilePicture || void 0
            }
          });
          sendToUser(member.id, {
            type: "new_notification",
            data: notification
          });
        }
      }
      sendToRoomMembers(message.roomId, {
        type: "new_message",
        data: message
      });
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629" });
    }
  });
  app2.get("/api/chat/messages/:roomId", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const messages = await storage.getChatMessages(req.params.roomId, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0631\u0633\u0627\u0626\u0644" });
    }
  });
  app2.put("/api/chat/messages/:id", requireAuth, async (req, res) => {
    try {
      const message = await storage.updateChatMessage(req.params.id, req.body.content);
      if (!message) {
        return res.status(404).json({ message: "\u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      const updatedMsgRoom = await storage.getChatRoom(message.roomId);
      if (updatedMsgRoom) {
        sendToRoomMembers(message.roomId, {
          type: "message_updated",
          data: message
        });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0631\u0633\u0627\u0644\u0629" });
    }
  });
  app2.delete("/api/chat/messages/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteChatMessage(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "\u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      io.emit("message_deleted", { messageId: req.params.id });
      res.json({ message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0631\u0633\u0627\u0644\u0629" });
    }
  });
  app2.put("/api/chat/rooms/:roomId/mark-read", requireAuth, async (req, res) => {
    try {
      const { messageId } = req.body;
      await storage.updateLastReadMessage(req.params.roomId, req.user.id, messageId);
      const userNotifications = await storage.getUserNotifications(req.user.id);
      const roomNotificationsToMark = userNotifications.filter((n) => {
        if (n.isRead || n.category !== "message") {
          return false;
        }
        const metadata = n.metadata;
        return metadata && metadata.roomId === req.params.roomId;
      }).map((n) => n.id);
      if (roomNotificationsToMark.length > 0) {
        await storage.markMultipleNotificationsAsRead(roomNotificationsToMark);
      }
      res.json({ message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u0642\u0631\u0627\u0621\u0629" });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u0642\u0631\u0627\u0621\u0629" });
    }
  });
  app2.post("/api/chat/reactions", requireAuth, async (req, res) => {
    try {
      const reaction = await storage.addMessageReaction(
        req.body.messageId,
        req.user.id,
        req.body.emoji
      );
      const reactionMsg = await storage.getChatMessage(req.body.messageId);
      if (reactionMsg) {
        sendToRoomMembers(reactionMsg.roomId, {
          type: "reaction_added",
          data: reaction
        });
      }
      res.status(201).json(reaction);
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u062A\u0641\u0627\u0639\u0644" });
    }
  });
  app2.delete("/api/chat/reactions", requireAuth, async (req, res) => {
    try {
      await storage.removeMessageReaction(
        req.body.messageId,
        req.user.id,
        req.body.emoji
      );
      io.emit("reaction_removed", { messageId: req.body.messageId, userId: req.user.id, emoji: req.body.emoji });
      res.json({ message: "\u062A\u0645 \u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u062A\u0641\u0627\u0639\u0644 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u062A\u0641\u0627\u0639\u0644" });
    }
  });
  app2.get("/api/google-calendar/auth-url", requireAuth, async (req, res) => {
    try {
      const { getGoogleAuthUrl: getGoogleAuthUrl2 } = await Promise.resolve().then(() => (init_google_calendar_integration(), google_calendar_integration_exports));
      const authUrl = getGoogleAuthUrl2();
      if (!authUrl) {
        return res.status(400).json({
          message: "\u064A\u0631\u062C\u0649 \u062A\u0643\u0648\u064A\u0646 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0639\u062A\u0645\u0627\u062F Google OAuth2 \u0623\u0648\u0644\u0627\u064B. \u0631\u0627\u062C\u0639 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0641\u064A server/google-calendar-integration.ts"
        });
      }
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ message: "\u0641\u0634\u0644 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0631\u0627\u0628\u0637 \u0627\u0644\u062A\u0641\u0648\u064A\u0636" });
    }
  });
  app2.get("/api/google-calendar/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== "string") {
        return res.status(400).send("Missing authorization code");
      }
      const { handleGoogleCallback: handleGoogleCallback2 } = await Promise.resolve().then(() => (init_google_calendar_integration(), google_calendar_integration_exports));
      await handleGoogleCallback2(code);
      res.redirect("/dashboard?google-calendar=connected");
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect("/dashboard?google-calendar=error");
    }
  });
  app2.get("/api/google-calendar/status", requireAuth, async (req, res) => {
    try {
      const connected = await isGoogleCalendarConnected();
      res.json({ connected });
    } catch (error) {
      res.json({ connected: false });
    }
  });
  app2.post("/api/google-calendar/schedule-meeting", requireAuth, async (req, res) => {
    try {
      const { title, participantIds, startTime, endTime, meetingLink } = req.body;
      if (!title || !participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ message: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0648\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u064A\u0646 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
      }
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "\u062A\u0648\u0627\u0631\u064A\u062E \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
      }
      if (start >= end) {
        return res.status(400).json({ message: "\u0648\u0642\u062A \u0627\u0644\u0628\u062F\u0621 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0642\u0628\u0644 \u0648\u0642\u062A \u0627\u0644\u0646\u0647\u0627\u064A\u0629" });
      }
      const finalMeetingLink = meetingLink || `https://meet.example.com/${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const meeting = await storage.createMeeting({
        title,
        description: `\u0627\u062C\u062A\u0645\u0627\u0639 \u0645\u0639 ${participantIds.length} \u0645\u0634\u0627\u0631\u0643`,
        meetingLink: finalMeetingLink,
        scheduledBy: req.user.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      });
      const allParticipantIds = [...participantIds, req.user.id];
      for (const participantId of participantIds) {
        await storage.addMeetingParticipant(meeting.id, participantId);
      }
      await storage.addMeetingParticipant(meeting.id, req.user.id);
      let chatRoom;
      if (participantIds.length === 1) {
        chatRoom = await storage.getOrCreatePrivateChat(req.user.id, participantIds[0]);
      } else {
        chatRoom = await storage.createChatRoom({
          name: title,
          type: "group",
          createdBy: req.user.id
        });
        for (const participantId of allParticipantIds) {
          await storage.addChatRoomMember(chatRoom.id, participantId);
        }
      }
      const message = await storage.createChatMessage({
        roomId: chatRoom.id,
        senderId: req.user.id,
        content: `\u{1F3A5} ${title}

\u0627\u0646\u0636\u0645 \u0644\u0644\u0627\u062C\u062A\u0645\u0627\u0639: ${finalMeetingLink}`,
        messageType: "meeting_link",
        attachments: [{
          name: title,
          url: finalMeetingLink,
          type: "meeting"
        }]
      });
      const room = await storage.getChatRoom(req.body.roomId);
      const roomMembers = await storage.getChatRoomMembers(req.body.roomId);
      for (const member of roomMembers) {
        if (member.id !== req.user.id) {
          const notification = await storage.createNotification({
            userId: member.id,
            title: room?.name || "\u0631\u0633\u0627\u0644\u0629 \u062C\u062F\u064A\u062F\u0629",
            message: `${req.user.fullName}: ${req.body.content || "\u0623\u0631\u0633\u0644 \u0631\u0633\u0627\u0644\u0629"}`,
            type: "info",
            category: "message",
            metadata: {
              resourceId: req.body.roomId,
              roomId: req.body.roomId,
              messageId: message.id,
              userId: req.user.id,
              userName: req.user.fullName,
              userAvatar: req.user.profilePicture || void 0
            }
          });
          sendToUser(member.id, {
            type: "new_notification",
            data: notification
          });
        }
      }
      for (const participantId of participantIds) {
        const notification = await storage.createNotification({
          userId: participantId,
          title: "\u0627\u062C\u062A\u0645\u0627\u0639 \u062C\u062F\u064A\u062F",
          message: `${req.user.fullName} \u0642\u0627\u0645 \u0628\u062C\u062F\u0648\u0644\u0629 \u0627\u062C\u062A\u0645\u0627\u0639: ${title}`,
          type: "info",
          category: "system",
          metadata: {
            userId: req.user.id,
            userName: req.user.fullName
          }
        });
        sendToUser(participantId, {
          type: "new_notification",
          data: notification
        });
      }
      io.emit("new_message", message);
      io.emit("new_meeting", meeting);
      res.status(201).json({ ...meeting, chatRoomId: chatRoom.id });
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u062F\u0648\u0644\u0629 \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639" });
    }
  });
  app2.post("/api/meetings/schedule", requireAuth, async (req, res) => {
    try {
      const { title, participantIds } = req.body;
      if (!title || !participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ message: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0648\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u064A\u0646 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
      }
      const meetingLink = `https://meet.example.com/${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const meeting = await storage.createMeeting({
        title,
        description: `\u0627\u062C\u062A\u0645\u0627\u0639 \u0645\u0639 ${participantIds.length} \u0645\u0634\u0627\u0631\u0643`,
        meetingLink,
        scheduledBy: req.user.id,
        startTime: /* @__PURE__ */ new Date(),
        endTime: null
      });
      for (const participantId of participantIds) {
        await storage.addMeetingParticipant(meeting.id, participantId);
        const privateRoom = await storage.getOrCreatePrivateChat(req.user.id, participantId);
        await storage.createChatMessage({
          roomId: privateRoom.id,
          senderId: req.user.id,
          content: `\u{1F3A5} ${title}

\u0627\u0646\u0636\u0645 \u0644\u0644\u0627\u062C\u062A\u0645\u0627\u0639: ${meetingLink}`,
          messageType: "meeting_link",
          attachments: [{ name: title, url: meetingLink, type: "meeting" }]
        });
        const notification = await storage.createNotification({
          userId: participantId,
          title: "\u0627\u062C\u062A\u0645\u0627\u0639 \u062C\u062F\u064A\u062F",
          message: `${req.user.fullName} \u0642\u0627\u0645 \u0628\u062C\u062F\u0648\u0644\u0629 \u0627\u062C\u062A\u0645\u0627\u0639: ${title}`,
          type: "info",
          category: "system",
          metadata: {
            userId: req.user.id,
            userName: req.user.fullName
          }
        });
        sendToUser(participantId, {
          type: "new_notification",
          data: notification
        });
      }
      res.status(201).json({ ...meeting, meetingLink });
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u062F\u0648\u0644\u0629 \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639" });
    }
  });
  app2.post("/api/meetings", requireAuth, async (req, res) => {
    try {
      const meeting = await storage.createMeeting({
        title: req.body.title,
        description: req.body.description,
        meetingLink: req.body.meetingLink,
        scheduledBy: req.user.id,
        startTime: new Date(req.body.startTime),
        endTime: req.body.endTime ? new Date(req.body.endTime) : null
      });
      if (req.body.participantIds && Array.isArray(req.body.participantIds)) {
        for (const participantId of req.body.participantIds) {
          await storage.addMeetingParticipant(meeting.id, participantId);
          const privateRoom = await storage.getOrCreatePrivateChat(req.user.id, participantId);
          await storage.createChatMessage({
            roomId: privateRoom.id,
            senderId: req.user.id,
            content: `\u062A\u0645 \u062C\u062F\u0648\u0644\u0629 \u0627\u062C\u062A\u0645\u0627\u0639: ${meeting.title}`,
            messageType: "meeting_link",
            attachments: [{
              name: meeting.title,
              url: meeting.meetingLink,
              type: "meeting"
            }]
          });
          const notification = await storage.createNotification({
            userId: participantId,
            title: "\u0627\u062C\u062A\u0645\u0627\u0639 \u062C\u062F\u064A\u062F",
            message: `\u062A\u0645 \u062C\u062F\u0648\u0644\u0629 \u0627\u062C\u062A\u0645\u0627\u0639: ${meeting.title}`,
            type: "info",
            category: "system",
            metadata: {
              userId: req.user.id,
              userName: req.user.fullName
            }
          });
          sendToUser(participantId, {
            type: "new_notification",
            data: notification
          });
        }
      }
      broadcast({
        type: "new_meeting",
        data: meeting
      });
      res.status(201).json(meeting);
    } catch (error) {
      console.error("Error creating meeting:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639" });
    }
  });
  app2.get("/api/meetings", requireAuth, async (req, res) => {
    try {
      const meetings2 = await storage.getUserMeetings(req.user.id);
      res.json(meetings2);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u0627\u062A" });
    }
  });
  app2.get("/api/meetings/:id", requireAuth, async (req, res) => {
    try {
      const meeting = await storage.getMeeting(req.params.id);
      if (!meeting) {
        return res.status(404).json({ message: "\u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639" });
    }
  });
  app2.get("/api/user/rewards", requireAuth, async (req, res) => {
    try {
      const rewards = await storage.getUserRewards(req.user.id);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0643\u0627\u0641\u0622\u062A" });
    }
  });
  app2.get("/api/suggestions", requireAuth, async (req, res) => {
    try {
      const isAdmin = req.user.role === "admin" || req.user.role === "sub-admin";
      const suggestions2 = isAdmin ? await storage.getAllSuggestions() : await storage.getUserSuggestions(req.user.id);
      res.json(suggestions2);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u0627\u062A" });
    }
  });
  app2.post("/api/suggestions", requireAuth, async (req, res) => {
    try {
      const validationResult = insertSuggestionSchema.safeParse({
        userId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category || "other",
        status: "pending"
      });
      if (!validationResult.success) {
        return res.status(400).json({
          message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629",
          errors: validationResult.error.errors
        });
      }
      const suggestion = await storage.createSuggestion(validationResult.data);
      res.status(201).json(suggestion);
    } catch (error) {
      console.error("Error creating suggestion:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0642\u062A\u0631\u062D" });
    }
  });
  app2.put("/api/suggestions/:id", requireAuth, async (req, res) => {
    try {
      const suggestions2 = await storage.getUserSuggestions(req.user.id);
      const existingSuggestion = suggestions2.find((s) => s.id === req.params.id);
      if (!existingSuggestion) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0642\u062A\u0631\u062D \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062A\u0639\u062F\u064A\u0644\u0647" });
      }
      const updates = {
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (req.body.title) updates.title = req.body.title;
      if (req.body.description) updates.description = req.body.description;
      if (req.body.category) updates.category = req.body.category;
      const suggestion = await storage.updateSuggestion(req.params.id, updates);
      if (!suggestion) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0642\u062A\u0631\u062D \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json(suggestion);
    } catch (error) {
      console.error("Error updating suggestion:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0642\u062A\u0631\u062D" });
    }
  });
  app2.patch("/api/suggestions/:id", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const validStatuses = ["pending", "under_review", "approved", "rejected"];
      if (req.body.status && !validStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: "\u062D\u0627\u0644\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
      }
      if (req.body.adminResponse !== void 0 && typeof req.body.adminResponse !== "string") {
        return res.status(400).json({ message: "\u0631\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0646\u0635\u0627\u064B" });
      }
      const updates = {
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (req.body.status) {
        updates.status = req.body.status;
      }
      if (req.body.adminResponse) {
        updates.adminResponse = req.body.adminResponse;
        updates.respondedAt = /* @__PURE__ */ new Date();
        updates.respondedBy = req.user.id;
      }
      const suggestion = await storage.updateSuggestion(req.params.id, updates);
      if (!suggestion) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0642\u062A\u0631\u062D \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json(suggestion);
    } catch (error) {
      console.error("Error updating suggestion:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0642\u062A\u0631\u062D" });
    }
  });
  app2.get("/api/companies", requireAuth, async (req, res) => {
    try {
      const companies2 = await storage.getAllCompanies();
      res.json(companies2);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0634\u0631\u0643\u0627\u062A" });
    }
  });
  app2.post("/api/companies", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const validationResult = insertCompanySchema.safeParse({
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : void 0
      });
      if (!validationResult.success) {
        console.error("Company validation error:", validationResult.error.errors);
        return res.status(400).json({
          message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629",
          errors: validationResult.error.errors
        });
      }
      const company = await storage.createCompany(validationResult.data);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      res.status(500).json({
        message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0634\u0631\u0643\u0629",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/companies/:id", requireAuth, async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "\u0627\u0644\u0634\u0631\u0643\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0634\u0631\u0643\u0629" });
    }
  });
  app2.put("/api/companies/:id", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const updateData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : void 0
      };
      const company = await storage.updateCompany(req.params.id, updateData);
      if (!company) {
        return res.status(404).json({ message: "\u0627\u0644\u0634\u0631\u0643\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0634\u0631\u0643\u0629" });
    }
  });
  app2.delete("/api/companies/:id", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const success = await storage.deleteCompany(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "\u0627\u0644\u0634\u0631\u0643\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      res.json({ message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0634\u0631\u0643\u0629 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0634\u0631\u0643\u0629" });
    }
  });
  app2.get("/api/companies/:id/tasks", requireAuth, async (req, res) => {
    try {
      const tasks2 = await storage.getCompanyTasks(req.params.id);
      res.json(tasks2);
    } catch (error) {
      console.error("Error fetching company tasks:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0645\u0647\u0627\u0645 \u0627\u0644\u0634\u0631\u0643\u0629" });
    }
  });
  app2.get("/api/companies/:id/milestones", requireAuth, async (req, res) => {
    try {
      const milestones = await storage.getCompanyMilestones(req.params.id);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching company milestones:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0639\u0627\u0644\u0645" });
    }
  });
  app2.post("/api/companies/:id/milestones", requireAuth, async (req, res) => {
    try {
      const validationResult = insertCompanyMilestoneSchema.safeParse({
        companyId: req.params.id,
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : void 0
      });
      if (!validationResult.success) {
        return res.status(400).json({
          message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629",
          errors: validationResult.error.errors
        });
      }
      const milestone = await storage.createCompanyMilestone(validationResult.data);
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0639\u0644\u0645" });
    }
  });
  app2.put("/api/companies/:id/milestones/:milestoneId", requireAuth, async (req, res) => {
    try {
      const updateData = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : void 0
      };
      const milestone = await storage.updateCompanyMilestone(req.params.milestoneId, updateData);
      if (!milestone) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0639\u0644\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json(milestone);
    } catch (error) {
      console.error("Error updating milestone:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0639\u0644\u0645" });
    }
  });
  app2.delete("/api/companies/:id/milestones/:milestoneId", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteCompanyMilestone(req.params.milestoneId);
      if (!success) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0639\u0644\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json({ message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0639\u0644\u0645 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Error deleting milestone:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0645\u0639\u0644\u0645" });
    }
  });
  app2.get("/api/companies/:id/files", requireAuth, async (req, res) => {
    try {
      const files = await storage.getCompanyFiles(req.params.id);
      res.json(files);
    } catch (error) {
      console.error("Error fetching company files:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0644\u0641\u0627\u062A" });
    }
  });
  app2.post("/api/companies/:id/files", requireAuth, async (req, res) => {
    try {
      const validationResult = insertCompanyFileSchema.safeParse({
        companyId: req.params.id,
        uploadedBy: req.user.id,
        ...req.body
      });
      if (!validationResult.success) {
        return res.status(400).json({
          message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629",
          errors: validationResult.error.errors
        });
      }
      const file = await storage.createCompanyFile(validationResult.data);
      res.status(201).json(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641" });
    }
  });
  app2.delete("/api/companies/:id/files/:fileId", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteCompanyFile(req.params.fileId);
      if (!success) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0644\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json({ message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0644\u0641 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0645\u0644\u0641" });
    }
  });
  app2.get("/api/companies/:id/reports", requireAuth, async (req, res) => {
    try {
      const reports = await storage.getCompanyReports(req.params.id);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching company reports:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631" });
    }
  });
  app2.post("/api/companies/:id/reports", requireAuth, async (req, res) => {
    try {
      const validationResult = insertCompanyReportSchema.safeParse({
        companyId: req.params.id,
        uploadedBy: req.user.id,
        ...req.body,
        reportDate: req.body.reportDate ? new Date(req.body.reportDate) : /* @__PURE__ */ new Date()
      });
      if (!validationResult.success) {
        return res.status(400).json({
          message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629",
          errors: validationResult.error.errors
        });
      }
      const report = await storage.createCompanyReport(validationResult.data);
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062A\u0642\u0631\u064A\u0631" });
    }
  });
  app2.put("/api/companies/:id/reports/:reportId", requireAuth, async (req, res) => {
    try {
      const updateData = {
        ...req.body,
        reportDate: req.body.reportDate ? new Date(req.body.reportDate) : void 0
      };
      const report = await storage.updateCompanyReport(req.params.reportId, updateData);
      if (!report) {
        return res.status(404).json({ message: "\u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062A\u0642\u0631\u064A\u0631" });
    }
  });
  app2.delete("/api/companies/:id/reports/:reportId", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteCompanyReport(req.params.reportId);
      if (!success) {
        return res.status(404).json({ message: "\u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json({ message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u062A\u0642\u0631\u064A\u0631" });
    }
  });
  app2.get("/api/companies/:id/comments", requireAuth, async (req, res) => {
    try {
      const comments = await storage.getCompanyComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching company comments:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A" });
    }
  });
  app2.post("/api/companies/:id/comments", requireAuth, async (req, res) => {
    try {
      const validationResult = insertCompanyCommentSchema.safeParse({
        companyId: req.params.id,
        userId: req.user.id,
        content: req.body.content
      });
      if (!validationResult.success) {
        return res.status(400).json({
          message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629",
          errors: validationResult.error.errors
        });
      }
      const comment = await storage.createCompanyComment(validationResult.data);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0642" });
    }
  });
  app2.put("/api/companies/:id/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const comment = await storage.updateCompanyComment(req.params.commentId, req.body.content);
      if (!comment) {
        return res.status(404).json({ message: "\u0627\u0644\u062A\u0639\u0644\u064A\u0642 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json(comment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062A\u0639\u0644\u064A\u0642" });
    }
  });
  app2.delete("/api/companies/:id/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteCompanyComment(req.params.commentId);
      if (!success) {
        return res.status(404).json({ message: "\u0627\u0644\u062A\u0639\u0644\u064A\u0642 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json({ message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062A\u0639\u0644\u064A\u0642 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u062A\u0639\u0644\u064A\u0642" });
    }
  });
  app2.get("/api/companies/:id/team", requireAuth, async (req, res) => {
    try {
      const team = await storage.getCompanyTeamMembers(req.params.id);
      res.json(team);
    } catch (error) {
      console.error("Error fetching company team:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0623\u0639\u0636\u0627\u0621 \u0627\u0644\u0641\u0631\u064A\u0642" });
    }
  });
  app2.post("/api/companies/:id/team", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const member = await storage.addCompanyTeamMember(
        req.params.id,
        req.body.userId,
        req.body.role
      );
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0636\u0627\u0641\u0629 \u0639\u0636\u0648 \u0627\u0644\u0641\u0631\u064A\u0642" });
    }
  });
  app2.delete("/api/companies/:id/team/:userId", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const success = await storage.removeCompanyTeamMember(req.params.id, req.params.userId);
      if (!success) {
        return res.status(404).json({ message: "\u0639\u0636\u0648 \u0627\u0644\u0641\u0631\u064A\u0642 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      res.json({ message: "\u062A\u0645 \u0625\u0632\u0627\u0644\u0629 \u0639\u0636\u0648 \u0627\u0644\u0641\u0631\u064A\u0642 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0632\u0627\u0644\u0629 \u0639\u0636\u0648 \u0627\u0644\u0641\u0631\u064A\u0642" });
    }
  });
  app2.get("/api/ai/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getAllAiModelSettings();
      if (req.user.role === "admin") {
        res.json(settings);
      } else {
        const publicSettings = settings.map(({ apiKey, ...rest }) => rest);
        res.json(publicSettings);
      }
    } catch (error) {
      console.error("Error fetching AI settings:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0625\u0639\u062F\u0627\u062F\u0627\u062A AI" });
    }
  });
  app2.get("/api/ai/settings/:modelType", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getAiModelSettings(req.params.modelType);
      if (!settings) {
        return res.status(404).json({ message: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      const { apiKey, ...publicSettings } = settings;
      res.json(req.user.role === "admin" ? settings : publicSettings);
    } catch (error) {
      console.error("Error fetching AI settings:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0625\u0639\u062F\u0627\u062F\u0627\u062A AI" });
    }
  });
  app2.post("/api/ai/settings", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const validatedData = aiModelSettingsCreateSchema.parse(req.body);
      if (validatedData.apiKey && validatedData.apiKey.trim()) {
        try {
          const service = getOpenRouterService(validatedData.apiKey);
          const isValid = await service.validateApiKey();
          if (!isValid) {
            return res.status(400).json({ message: "API key \u063A\u064A\u0631 \u0635\u0627\u0644\u062D - \u062A\u062D\u0642\u0642 \u0645\u0646 \u0635\u062D\u0629 \u0627\u0644\u0645\u0641\u062A\u0627\u062D" });
          }
        } catch (validationError) {
          console.error("API key validation error:", validationError);
          return res.status(400).json({
            message: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 API key - \u062A\u0623\u0643\u062F \u0645\u0646 \u0623\u0646 \u0627\u0644\u0645\u0641\u062A\u0627\u062D \u0635\u062D\u064A\u062D \u0648\u0623\u0646 \u0644\u062F\u064A\u0643 \u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A",
            error: validationError.message
          });
        }
      }
      const settings = await storage.createAiModelSettings(validatedData);
      res.status(201).json(settings);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629", errors: error.errors });
      }
      console.error("Error creating AI settings:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0625\u0639\u062F\u0627\u062F\u0627\u062A AI" });
    }
  });
  app2.put("/api/ai/settings/:modelType", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const validatedData = aiModelSettingsUpdateSchema.parse(req.body);
      if (validatedData.apiKey && validatedData.apiKey.trim()) {
        try {
          const service = getOpenRouterService(validatedData.apiKey);
          const isValid = await service.validateApiKey();
          if (!isValid) {
            return res.status(400).json({ message: "API key \u063A\u064A\u0631 \u0635\u0627\u0644\u062D - \u062A\u062D\u0642\u0642 \u0645\u0646 \u0635\u062D\u0629 \u0627\u0644\u0645\u0641\u062A\u0627\u062D" });
          }
        } catch (validationError) {
          console.error("API key validation error:", validationError);
          return res.status(400).json({
            message: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 API key - \u062A\u0623\u0643\u062F \u0645\u0646 \u0623\u0646 \u0627\u0644\u0645\u0641\u062A\u0627\u062D \u0635\u062D\u064A\u062D \u0648\u0623\u0646 \u0644\u062F\u064A\u0643 \u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A",
            error: validationError.message
          });
        }
      }
      const settings = await storage.updateAiModelSettings(req.params.modelType, validatedData);
      if (!settings) {
        return res.status(404).json({ message: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      res.json(settings);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629", errors: error.errors });
      }
      console.error("Error updating AI settings:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0625\u0639\u062F\u0627\u062F\u0627\u062A AI" });
    }
  });
  app2.post("/api/ai/models/list", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const apiKey = req.body.apiKey || process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ message: "API key \u0645\u0637\u0644\u0648\u0628" });
      }
      const service = getOpenRouterService(apiKey);
      const models = await service.listModels();
      res.json(models);
    } catch (error) {
      console.error("Error listing models:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0646\u0645\u0627\u0630\u062C" });
    }
  });
  app2.get("/api/ai/conversations", requireAuth, async (req, res) => {
    try {
      const modelType = req.query.modelType;
      const conversations = await storage.getUserAiConversations(req.user.id, modelType);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A" });
    }
  });
  app2.post("/api/ai/conversations", requireAuth, async (req, res) => {
    try {
      const validatedData = aiConversationCreateSchema.parse(req.body);
      const conversation = await storage.createAiConversation({
        userId: req.user.id,
        modelType: validatedData.modelType,
        title: validatedData.title || "\u0645\u062D\u0627\u062F\u062B\u0629 \u062C\u062F\u064A\u062F\u0629"
      });
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629", errors: error.errors });
      }
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629" });
    }
  });
  app2.get("/api/ai/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getAiMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0631\u0633\u0627\u0626\u0644" });
    }
  });
  app2.delete("/api/ai/conversations/:id", requireAuth, async (req, res) => {
    try {
      const conversation = await storage.getAiConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      if (conversation.userId !== req.user.id) {
        return res.status(403).json({ message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062D\u0630\u0641 \u0647\u0630\u0647 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629" });
      }
      await storage.deleteAiConversation(req.params.id);
      res.json({ message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629" });
    }
  });
  app2.post("/api/ai/chat", requireAuth, async (req, res) => {
    try {
      const validatedData = aiChatRequestSchema.parse(req.body);
      const { conversationId, message, modelType } = validatedData;
      const settings = await storage.getAiModelSettings(modelType);
      if (!settings || !settings.isActive) {
        return res.status(400).json({ message: "\u0627\u0644\u0646\u0645\u0648\u0630\u062C \u063A\u064A\u0631 \u0645\u062A\u0627\u062D" });
      }
      const apiKey = settings.apiKey || process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ message: "API key \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631" });
      }
      await storage.createAiMessage({
        conversationId,
        role: "user",
        content: message
      });
      const messages = await storage.getAiMessages(conversationId);
      const openRouterMessages = [
        { role: "system", content: settings.systemPrompt || "You are a helpful assistant." },
        ...messages.map((m) => ({ role: m.role, content: m.content }))
      ];
      const service = getOpenRouterService(apiKey);
      let fullContent = "";
      const usage = await service.streamChat(
        {
          model: settings.modelId,
          messages: openRouterMessages,
          temperature: parseFloat(settings.temperature || "0.7"),
          top_p: parseFloat(settings.topP || "1.0"),
          max_tokens: settings.maxTokens || 2e3,
          presence_penalty: parseFloat(settings.presencePenalty || "0.0"),
          frequency_penalty: parseFloat(settings.frequencyPenalty || "0.0")
        },
        res,
        (token) => {
          fullContent += token;
        }
      );
      await storage.createAiMessage({
        conversationId,
        role: "assistant",
        content: fullContent
      });
      await storage.createAiUsageLog({
        userId: req.user.id,
        modelType,
        modelId: settings.modelId,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        success: true
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629", errors: error.errors });
      }
      console.error("Error in AI chat:", error);
      if (req.body.modelType) {
        await storage.createAiUsageLog({
          userId: req.user.id,
          modelType: req.body.modelType,
          modelId: req.body.modelType,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      if (!res.headersSent) {
        res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062F\u0631\u062F\u0634\u0629" });
      }
    }
  });
  app2.get("/api/ai/usage-stats", requireAuth, async (req, res) => {
    try {
      const modelType = req.query.modelType;
      const stats = await storage.getAiUsageStats(modelType);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname, "client", "src"),
      "@shared": path2.resolve(__dirname, "shared"),
      "@assets": path2.resolve(__dirname, "attached_assets")
    }
  },
  root: path2.resolve(__dirname, "client"),
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    hmr: {
      protocol: "ws",
      host: "localhost"
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
import { dirname as dirname2 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.get("/service-worker.js", async (_req, res) => {
    const swPath = path3.resolve(__dirname2, "..", "public", "service-worker.js");
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(swPath);
  });
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import dotenv from "dotenv";
dotenv.config();
var app = express2();
app.use(express2.json({
  limit: "50mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use("/uploads", express2.static("uploads"));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
