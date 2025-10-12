var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/google-calendar.ts
var google_calendar_exports = {};
__export(google_calendar_exports, {
  createGoogleMeetEvent: () => createGoogleMeetEvent,
  exchangeCodeForTokens: () => exchangeCodeForTokens,
  getAuthorizationUrl: () => getAuthorizationUrl,
  getCalendarClient: () => getCalendarClient,
  getOAuth2Client: () => getOAuth2Client,
  refreshAccessToken: () => refreshAccessToken
});
import { google } from "googleapis";
function getOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}
function getAuthorizationUrl(state) {
  const oauth2Client = getOAuth2Client();
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events"
  ];
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    // Important: get refresh token
    scope: scopes,
    prompt: "consent",
    // Force consent screen to get refresh token every time
    state
    // CSRF protection
  });
}
async function exchangeCodeForTokens(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Failed to get access token or refresh token");
  }
  const expiresAt = /* @__PURE__ */ new Date();
  if (tokens.expiry_date) {
    expiresAt.setTime(tokens.expiry_date);
  } else {
    expiresAt.setHours(expiresAt.getHours() + 1);
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
    scope: tokens.scope || "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"
  };
}
async function refreshAccessToken(refreshToken) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  if (!credentials.access_token) {
    throw new Error("Failed to refresh access token");
  }
  const expiresAt = /* @__PURE__ */ new Date();
  if (credentials.expiry_date) {
    expiresAt.setTime(credentials.expiry_date);
  } else {
    expiresAt.setHours(expiresAt.getHours() + 1);
  }
  return {
    accessToken: credentials.access_token,
    expiresAt
  };
}
async function getCalendarClient(tokenData) {
  const oauth2Client = getOAuth2Client();
  const now = /* @__PURE__ */ new Date();
  if (tokenData.expiresAt <= now) {
    const { accessToken, expiresAt } = await refreshAccessToken(tokenData.refreshToken);
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: tokenData.refreshToken
    });
    return {
      calendar: google.calendar({ version: "v3", auth: oauth2Client }),
      updatedTokens: { accessToken, expiresAt }
    };
  }
  oauth2Client.setCredentials({
    access_token: tokenData.accessToken,
    refresh_token: tokenData.refreshToken
  });
  return {
    calendar: google.calendar({ version: "v3", auth: oauth2Client }),
    updatedTokens: null
  };
}
async function createGoogleMeetEvent(tokenData, title, description, startTime, endTime) {
  const { calendar, updatedTokens } = await getCalendarClient(tokenData);
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
    eventLink: response.data.htmlLink,
    updatedTokens
    // Return updated tokens if they were refreshed
  };
}
var GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI;
var init_google_calendar = __esm({
  "server/google-calendar.ts"() {
    "use strict";
    GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
    GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
    REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/google-calendar/callback";
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer } from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  advanceStatusEnum: () => advanceStatusEnum,
  auxSessions: () => auxSessions,
  auxSessionsRelations: () => auxSessionsRelations,
  auxStatusEnum: () => auxStatusEnum,
  chatMessages: () => chatMessages,
  chatMessagesRelations: () => chatMessagesRelations,
  chatRoomMembers: () => chatRoomMembers,
  chatRoomMembersRelations: () => chatRoomMembersRelations,
  chatRoomTypeEnum: () => chatRoomTypeEnum,
  chatRooms: () => chatRooms,
  chatRoomsRelations: () => chatRoomsRelations,
  googleCalendarTokens: () => googleCalendarTokens,
  googleCalendarTokensRelations: () => googleCalendarTokensRelations,
  insertAuxSessionSchema: () => insertAuxSessionSchema,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertChatRoomSchema: () => insertChatRoomSchema,
  insertGoogleCalendarTokenSchema: () => insertGoogleCalendarTokenSchema,
  insertLeaveRequestSchema: () => insertLeaveRequestSchema,
  insertMeetingSchema: () => insertMeetingSchema,
  insertSalaryAdvanceRequestSchema: () => insertSalaryAdvanceRequestSchema,
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
  notifications: () => notifications,
  notificationsRelations: () => notificationsRelations,
  roleEnum: () => roleEnum,
  salaryAdvanceRequests: () => salaryAdvanceRequests,
  salaryAdvanceRequestsRelations: () => salaryAdvanceRequestsRelations,
  shifts: () => shifts,
  shiftsRelations: () => shiftsRelations,
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
var roleEnum = pgEnum("role", ["admin", "sub-admin", "employee"]);
var auxStatusEnum = pgEnum("aux_status", ["ready", "working_on_project", "personal", "break", "waiting"]);
var taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "under_review", "completed"]);
var taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);
var leaveTypeEnum = pgEnum("leave_type", ["annual", "sick", "maternity", "emergency"]);
var leaveStatusEnum = pgEnum("leave_status", ["pending", "approved", "rejected"]);
var advanceStatusEnum = pgEnum("advance_status", ["pending", "approved", "rejected"]);
var chatRoomTypeEnum = pgEnum("chat_room_type", ["private", "group"]);
var messageTypeEnum = pgEnum("message_type", ["text", "image", "file", "meeting_link"]);
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
  companyName: text("company_name"),
  // الحقل الجديد: اسم الشركة
  status: taskStatusEnum("status").notNull().default("pending"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  isRead: boolean("is_read").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var chatRooms = pgTable("chat_rooms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  type: chatRoomTypeEnum("type").notNull().default("group"),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var chatRoomMembers = pgTable("chat_room_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
var usersRelations = relations(users, ({ many, one }) => ({
  auxSessions: many(auxSessions),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
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
  googleCalendarToken: one(googleCalendarTokens)
}));
var auxSessionsRelations = relations(auxSessions, ({ one }) => ({
  user: one(users, { fields: [auxSessions.userId], references: [users.id] })
}));
var tasksRelations = relations(tasks, ({ one, many }) => ({
  createdBy: one(users, { fields: [tasks.createdBy], references: [users.id], relationName: "createdTasks" }),
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
var insertChatRoomSchema = createInsertSchema(chatRooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
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
import session from "express-session";
import connectPg from "connect-pg-simple";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  // Auth & Users
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async updateUserLastLogin(id) {
    await db.update(users).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
  }
  async getUsers() {
    return await db.select().from(users).where(eq(users.isActive, true));
  }
  async deleteUser(id) {
    try {
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  // Tasks
  async createTask(task) {
    console.log("Raw task data:", task);
    const fixedTask = {
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      companyName: task.companyName || null
    };
    console.log("Fixed task data:", fixedTask);
    const [createdTask] = await db.insert(tasks).values(fixedTask).returning();
    return createdTask;
  }
  async getTask(id) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || void 0;
  }
  async getUserTasks(userId) {
    return await db.select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      companyName: tasks.companyName,
      status: tasks.status,
      priority: tasks.priority,
      createdBy: tasks.createdBy,
      assignedTo: tasks.assignedTo,
      dueDate: tasks.dueDate,
      completedAt: tasks.completedAt,
      estimatedHours: tasks.estimatedHours,
      actualHours: tasks.actualHours,
      performanceRating: tasks.performanceRating,
      rewardPoints: tasks.rewardPoints,
      ratedBy: tasks.ratedBy,
      ratedAt: tasks.ratedAt,
      tags: tasks.tags,
      attachments: tasks.attachments,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      createdByUser: users,
      assignedToUser: users
    }).from(tasks).leftJoin(users, eq(tasks.createdBy, users.id)).where(eq(tasks.createdBy, userId)).orderBy(desc(tasks.createdAt));
  }
  async getAssignedTasks(userId) {
    return await db.select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      companyName: tasks.companyName,
      status: tasks.status,
      priority: tasks.priority,
      createdBy: tasks.createdBy,
      assignedTo: tasks.assignedTo,
      dueDate: tasks.dueDate,
      completedAt: tasks.completedAt,
      estimatedHours: tasks.estimatedHours,
      actualHours: tasks.actualHours,
      performanceRating: tasks.performanceRating,
      rewardPoints: tasks.rewardPoints,
      ratedBy: tasks.ratedBy,
      ratedAt: tasks.ratedAt,
      tags: tasks.tags,
      attachments: tasks.attachments,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      createdByUser: users,
      assignedToUser: users
    }).from(tasks).leftJoin(users, eq(tasks.assignedTo, users.id)).where(eq(tasks.assignedTo, userId)).orderBy(desc(tasks.createdAt));
  }
  async updateTask(id, updates) {
    const now = /* @__PURE__ */ new Date();
    const fixedUpdates = {
      ...updates,
      updatedAt: updates.updatedAt ? new Date(updates.updatedAt) : now,
      dueDate: updates.dueDate ? new Date(updates.dueDate) : updates.dueDate,
      companyName: updates.companyName || null
    };
    const [task] = await db.update(tasks).set(fixedUpdates).where(eq(tasks.id, id)).returning();
    return task || void 0;
  }
  async deleteTask(id) {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount > 0;
  }
  async getAllTasks() {
    return await db.select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      companyName: tasks.companyName,
      status: tasks.status,
      priority: tasks.priority,
      createdBy: tasks.createdBy,
      assignedTo: tasks.assignedTo,
      dueDate: tasks.dueDate,
      completedAt: tasks.completedAt,
      estimatedHours: tasks.estimatedHours,
      actualHours: tasks.actualHours,
      performanceRating: tasks.performanceRating,
      rewardPoints: tasks.rewardPoints,
      ratedBy: tasks.ratedBy,
      ratedAt: tasks.ratedAt,
      tags: tasks.tags,
      attachments: tasks.attachments,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      createdByUser: users,
      assignedToUser: users
    }).from(tasks).leftJoin(users, or(eq(tasks.createdBy, users.id), eq(tasks.assignedTo, users.id))).orderBy(desc(tasks.createdAt));
  }
  async rateTask(taskId, rating, ratedBy) {
    const [task] = await db.update(tasks).set({
      performanceRating: rating,
      ratedBy,
      ratedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(tasks.id, taskId)).returning();
    if (!task) {
      throw new Error("Task not found");
    }
    if (task.assignedTo) {
      await db.update(users).set({
        totalPoints: sql2`total_points + ${rating}`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, task.assignedTo));
    }
    return task;
  }
  async approveTaskReview(taskId, approverId) {
    const [task] = await db.update(tasks).set({
      status: "completed",
      completedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(
      eq(tasks.id, taskId),
      eq(tasks.status, "under_review")
    )).returning();
    if (!task) {
      throw new Error("Task not found or not under review");
    }
    return task;
  }
  async getUserRewards(userId) {
    return await db.select({
      task: tasks,
      user: users
    }).from(tasks).innerJoin(users, eq(tasks.assignedTo, users.id)).where(and(
      eq(users.id, userId),
      notNull(tasks.rewardPoints),
      gt(tasks.rewardPoints, 0)
    )).orderBy(desc(tasks.createdAt));
  }
  // Task Collaborators
  async addTaskCollaborator(taskId, userId) {
    await db.insert(taskCollaborators).values({ taskId, userId });
  }
  async removeTaskCollaborator(taskId, userId) {
    await db.delete(taskCollaborators).where(and(
      eq(taskCollaborators.taskId, taskId),
      eq(taskCollaborators.userId, userId)
    ));
  }
  async getTaskCollaborators(taskId) {
    const result = await db.select({ user: users }).from(taskCollaborators).innerJoin(users, eq(taskCollaborators.userId, users.id)).where(eq(taskCollaborators.taskId, taskId));
    return result.map((r) => r.user);
  }
  // Task Notes
  async createTaskNote(taskId, userId, content) {
    const [note] = await db.insert(taskNotes).values({ taskId, userId, content }).returning();
    return note;
  }
  async getTaskNotes(taskId) {
    return await db.select().from(taskNotes).where(eq(taskNotes.taskId, taskId)).orderBy(desc(taskNotes.createdAt));
  }
  // AUX Sessions
  async startAuxSession(session3) {
    await db.update(auxSessions).set({
      endTime: /* @__PURE__ */ new Date(),
      duration: sql2`EXTRACT(epoch FROM (NOW() - start_time))::integer`
    }).where(and(
      eq(auxSessions.userId, session3.userId),
      isNull(auxSessions.endTime)
    ));
    const [newSession] = await db.insert(auxSessions).values(session3).returning();
    return newSession;
  }
  async endAuxSession(sessionId, notes) {
    const [session3] = await db.update(auxSessions).set({
      endTime: /* @__PURE__ */ new Date(),
      duration: sql2`EXTRACT(epoch FROM (NOW() - start_time))::integer`,
      notes: notes || null
    }).where(eq(auxSessions.id, sessionId)).returning();
    return session3 || void 0;
  }
  async getCurrentAuxSession(userId) {
    const [session3] = await db.select().from(auxSessions).where(and(
      eq(auxSessions.userId, userId),
      isNull(auxSessions.endTime)
    ));
    return session3 || void 0;
  }
  async getUserAuxSessions(userId, startDate, endDate) {
    const conditions = [eq(auxSessions.userId, userId)];
    if (startDate) {
      conditions.push(gte(auxSessions.startTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(auxSessions.startTime, endDate));
    }
    return await db.select().from(auxSessions).where(and(...conditions)).orderBy(desc(auxSessions.startTime));
  }
  async getAllActiveAuxSessions() {
    const result = await db.select({
      id: auxSessions.id,
      userId: auxSessions.userId,
      status: auxSessions.status,
      startTime: auxSessions.startTime,
      endTime: auxSessions.endTime,
      duration: auxSessions.duration,
      notes: auxSessions.notes,
      createdAt: auxSessions.createdAt,
      user: users
    }).from(auxSessions).innerJoin(users, eq(auxSessions.userId, users.id)).where(and(
      isNull(auxSessions.endTime),
      eq(users.isActive, true)
    )).orderBy(auxSessions.startTime);
    return result;
  }
  async getAllAuxSessions() {
    return await db.select().from(auxSessions).orderBy(desc(auxSessions.startTime));
  }
  // Leave Requests
  async createLeaveRequest(request) {
    const [leaveRequest] = await db.insert(leaveRequests).values(request).returning();
    return leaveRequest;
  }
  async getLeaveRequest(id) {
    const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return request || void 0;
  }
  async getUserLeaveRequests(userId) {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.userId, userId)).orderBy(desc(leaveRequests.createdAt));
  }
  async getPendingLeaveRequests() {
    const result = await db.select({
      id: leaveRequests.id,
      userId: leaveRequests.userId,
      type: leaveRequests.type,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      days: leaveRequests.days,
      reason: leaveRequests.reason,
      status: leaveRequests.status,
      approvedBy: leaveRequests.approvedBy,
      approvedAt: leaveRequests.approvedAt,
      rejectionReason: leaveRequests.rejectionReason,
      createdAt: leaveRequests.createdAt,
      updatedAt: leaveRequests.updatedAt,
      user: users
    }).from(leaveRequests).innerJoin(users, eq(leaveRequests.userId, users.id)).where(eq(leaveRequests.status, "pending")).orderBy(desc(leaveRequests.createdAt));
    return result;
  }
  async getAllLeaveRequests() {
    return await db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
  }
  async updateLeaveRequest(id, updates) {
    const now = /* @__PURE__ */ new Date();
    const fixedUpdates = {
      ...updates,
      updatedAt: updates.updatedAt ? new Date(updates.updatedAt) : now,
      startDate: updates.startDate ? new Date(updates.startDate) : updates.startDate,
      endDate: updates.endDate ? new Date(updates.endDate) : updates.endDate,
      approvedAt: updates.approvedAt ? new Date(updates.approvedAt) : updates.approvedAt
    };
    const [request] = await db.update(leaveRequests).set(fixedUpdates).where(eq(leaveRequests.id, id)).returning();
    return request || void 0;
  }
  // Salary Advance Requests
  async createSalaryAdvanceRequest(request) {
    const [advanceRequest] = await db.insert(salaryAdvanceRequests).values(request).returning();
    return advanceRequest;
  }
  async getUserSalaryAdvanceRequests(userId) {
    return await db.select().from(salaryAdvanceRequests).where(eq(salaryAdvanceRequests.userId, userId)).orderBy(desc(salaryAdvanceRequests.createdAt));
  }
  async getPendingSalaryAdvanceRequests() {
    const result = await db.select({
      id: salaryAdvanceRequests.id,
      userId: salaryAdvanceRequests.userId,
      amount: salaryAdvanceRequests.amount,
      reason: salaryAdvanceRequests.reason,
      status: salaryAdvanceRequests.status,
      approvedBy: salaryAdvanceRequests.approvedBy,
      approvedAt: salaryAdvanceRequests.approvedAt,
      rejectionReason: salaryAdvanceRequests.rejectionReason,
      repaymentDate: salaryAdvanceRequests.repaymentDate,
      createdAt: salaryAdvanceRequests.createdAt,
      updatedAt: salaryAdvanceRequests.updatedAt,
      user: users
    }).from(salaryAdvanceRequests).innerJoin(users, eq(salaryAdvanceRequests.userId, users.id)).where(eq(salaryAdvanceRequests.status, "pending")).orderBy(desc(salaryAdvanceRequests.createdAt));
    return result;
  }
  async updateSalaryAdvanceRequest(id, updates) {
    const now = /* @__PURE__ */ new Date();
    const fixedUpdates = {
      ...updates,
      updatedAt: updates.updatedAt ? new Date(updates.updatedAt) : now,
      approvedAt: updates.approvedAt ? new Date(updates.approvedAt) : updates.approvedAt,
      repaymentDate: updates.repaymentDate ? new Date(updates.repaymentDate) : updates.repaymentDate
    };
    const [request] = await db.update(salaryAdvanceRequests).set(fixedUpdates).where(eq(salaryAdvanceRequests.id, id)).returning();
    return request || void 0;
  }
  // Notifications
  async createNotification(userId, title, message, type) {
    const [notification] = await db.insert(notifications).values({ userId, title, message, type }).returning();
    return notification;
  }
  async getUserNotifications(userId, unreadOnly) {
    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }
    return await db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt));
  }
  async markNotificationRead(id) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }
  // Analytics
  async getUserProductivityStats(userId, startDate, endDate) {
    const result = await db.select({
      status: auxSessions.status,
      totalDuration: sql2`SUM(COALESCE(duration, EXTRACT(epoch FROM (NOW() - start_time))::integer))`,
      sessionCount: count()
    }).from(auxSessions).where(and(
      eq(auxSessions.userId, userId),
      gte(auxSessions.startTime, startDate),
      lte(auxSessions.startTime, endDate)
    )).groupBy(auxSessions.status);
    return result;
  }
  async getDepartmentStats() {
    const result = await db.select({
      department: users.department,
      employeeCount: count(),
      activeEmployees: sql2`COUNT(*) FILTER (WHERE is_active = true)`
    }).from(users).groupBy(users.department);
    return result;
  }
  async getSystemStats() {
    const [stats] = await db.select({
      totalUsers: count(users.id),
      activeUsers: sql2`COUNT(*) FILTER (WHERE is_active = true)`,
      totalTasks: sql2`(SELECT COUNT(*) FROM ${tasks})`,
      completedTasks: sql2`(SELECT COUNT(*) FROM ${tasks} WHERE status = 'completed')`,
      pendingLeaveRequests: sql2`(SELECT COUNT(*) FROM ${leaveRequests} WHERE status = 'pending')`
    }).from(users);
    return stats;
  }
  // Chat Rooms
  async createChatRoom(room) {
    const [chatRoom] = await db.insert(chatRooms).values(room).returning();
    return chatRoom;
  }
  async getOrCreatePrivateChat(user1Id, user2Id) {
    const existingRooms = await db.select({
      room: chatRooms
    }).from(chatRooms).innerJoin(chatRoomMembers, eq(chatRooms.id, chatRoomMembers.roomId)).where(
      and(
        eq(chatRooms.type, "private"),
        or(
          eq(chatRoomMembers.userId, user1Id),
          eq(chatRoomMembers.userId, user2Id)
        )
      )
    ).groupBy(chatRooms.id).having(sql2`COUNT(DISTINCT ${chatRoomMembers.userId}) = 2`);
    let roomId;
    if (existingRooms.length > 0) {
      roomId = existingRooms[0].room.id;
    } else {
      const [newRoom] = await db.insert(chatRooms).values({
        type: "private",
        createdBy: user1Id
      }).returning();
      roomId = newRoom.id;
      await db.insert(chatRoomMembers).values([
        { roomId: newRoom.id, userId: user1Id },
        { roomId: newRoom.id, userId: user2Id }
      ]);
    }
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId));
    const members = await db.select({ user: users }).from(chatRoomMembers).innerJoin(users, eq(chatRoomMembers.userId, users.id)).where(eq(chatRoomMembers.roomId, roomId));
    return {
      ...room,
      members: members.map((m) => m.user)
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
      const members = await db.select({ user: users }).from(chatRoomMembers).innerJoin(users, eq(chatRoomMembers.userId, users.id)).where(eq(chatRoomMembers.roomId, room.id));
      const [lastMessage] = await db.select().from(chatMessages).where(eq(chatMessages.roomId, room.id)).orderBy(desc(chatMessages.createdAt)).limit(1);
      result.push({
        ...room,
        members: members.map((m) => m.user),
        lastMessage
      });
    }
    return result;
  }
  async getChatRoom(roomId) {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId));
    return room || void 0;
  }
  async addChatRoomMember(roomId, userId) {
    await db.insert(chatRoomMembers).values({ roomId, userId });
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
  async getChatMessages(roomId, limit = 50) {
    const messages = await db.select({
      message: chatMessages,
      sender: users
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
    await db.delete(messageReactions).where(and(
      eq(messageReactions.messageId, messageId),
      eq(messageReactions.userId, userId),
      eq(messageReactions.emoji, emoji)
    ));
  }
  // Meetings
  async createMeeting(meeting) {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();
    return newMeeting;
  }
  async addMeetingParticipant(meetingId, userId) {
    await db.insert(meetingParticipants).values({ meetingId, userId });
  }
  async getUserMeetings(userId) {
    const result = await db.select({ meeting: meetings }).from(meetingParticipants).innerJoin(meetings, eq(meetingParticipants.meetingId, meetings.id)).where(eq(meetingParticipants.userId, userId)).orderBy(desc(meetings.startTime));
    return result.map((r) => r.meeting);
  }
  async getMeeting(meetingId) {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, meetingId));
    if (!meeting) return void 0;
    const participants = await db.select({ user: users }).from(meetingParticipants).innerJoin(users, eq(meetingParticipants.userId, users.id)).where(eq(meetingParticipants.meetingId, meetingId));
    return {
      ...meeting,
      participants: participants.map((p) => p.user)
    };
  }
  // Google Calendar Tokens
  async saveGoogleCalendarToken(userId, tokenData) {
    const [token] = await db.insert(googleCalendarTokens).values({ ...tokenData, userId }).onConflictDoUpdate({
      target: googleCalendarTokens.userId,
      set: {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
        scope: tokenData.scope,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return token;
  }
  async getGoogleCalendarToken(userId) {
    const [token] = await db.select().from(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));
    return token || void 0;
  }
  async updateGoogleCalendarToken(userId, accessToken, expiresAt) {
    await db.update(googleCalendarTokens).set({ accessToken, expiresAt, updatedAt: /* @__PURE__ */ new Date() }).where(eq(googleCalendarTokens.userId, userId));
  }
  async deleteGoogleCalendarToken(userId) {
    const result = await db.delete(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));
    return result.rowCount !== null && result.rowCount > 0;
  }
};
var storage = new DatabaseStorage();

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
import multer from "multer";
var upload = multer({ dest: "uploads/" });
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
      const taskData = {
        ...req.body,
        createdBy: req.user.id,
        companyName: req.body.companyName || null
      };
      const task = await storage.createTask(taskData);
      if (task.assignedTo && task.assignedTo !== req.user.id) {
        await storage.createNotification(
          task.assignedTo,
          "\u0645\u0647\u0645\u0629 \u062C\u062F\u064A\u062F\u0629 \u0645\u0639\u064A\u0646\u0629 \u0644\u0643",
          `\u062A\u0645 \u062A\u0639\u064A\u064A\u0646 \u0645\u0647\u0645\u0629 "${task.title}" \u0644\u0643`,
          "info"
        );
      }
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0647\u0645\u0629" });
    }
  });
  app2.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ message: "\u0627\u0644\u0645\u0647\u0645\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      if (req.body.status === "completed") {
        const isCreator = existingTask.createdBy === req.user.id;
        const isAdminOrSubAdmin = req.user.role === "admin" || req.user.role === "sub-admin";
        if (isCreator || isAdminOrSubAdmin) {
          const task = await storage.updateTask(req.params.id, {
            ...req.body,
            completedAt: /* @__PURE__ */ new Date()
          });
          res.json(task);
        } else {
          const task = await storage.updateTask(req.params.id, {
            ...req.body,
            status: "under_review"
          });
          if (existingTask.createdBy) {
            await storage.createNotification(
              existingTask.createdBy,
              "\u0645\u0647\u0645\u0629 \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629",
              `\u0627\u0644\u0645\u0647\u0645\u0629 "${existingTask.title}" \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629`,
              "info"
            );
          }
          res.json(task);
        }
      } else {
        const task = await storage.updateTask(req.params.id, req.body);
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
      if (task.createdBy && task.createdBy !== req.user.id) {
        await storage.createNotification(
          task.createdBy,
          "\u0645\u0647\u0645\u0629 \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629",
          `\u0627\u0644\u0645\u0647\u0645\u0629 "${task.title}" \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629`,
          "info"
        );
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
      if (task.assignedTo) {
        await storage.createNotification(
          task.assignedTo,
          "\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0647\u0645\u0629",
          `\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0645\u0647\u0645\u062A\u0643 "${task.title}" \u0648\u062A\u0645 \u0625\u0643\u0645\u0627\u0644\u0647\u0627 \u0628\u0646\u062C\u0627\u062D`,
          "success"
        );
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
      if (task.assignedTo) {
        await storage.createNotification(
          task.assignedTo,
          "\u062A\u0645 \u062A\u0642\u064A\u064A\u0645 \u0645\u0647\u0645\u062A\u0643",
          `\u062A\u0645 \u062A\u0642\u064A\u064A\u0645 \u0645\u0647\u0645\u062A\u0643 "${task.title}" \u0628\u0640 ${rating} \u0646\u0642\u0627\u0637`,
          "info"
        );
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
      if (task.assignedTo) {
        const assignedUser = await storage.getUser(task.assignedTo);
        if (assignedUser) {
          const newTotalPoints = (assignedUser.totalPoints || 0) + rewardPoints;
          await storage.updateUser(task.assignedTo, { totalPoints: newTotalPoints });
          await storage.createNotification(
            task.assignedTo,
            "\u0646\u0642\u0627\u0637 \u0645\u0643\u0627\u0641\u0623\u0629 \u062C\u062F\u064A\u062F\u0629",
            `\u062A\u0645 \u0645\u0646\u062D\u0643 ${rewardPoints} \u0646\u0642\u0637\u0629 \u0645\u0643\u0627\u0641\u0623\u0629 \u0644\u0644\u0645\u0647\u0645\u0629 "${task.title}"`,
            "success"
          );
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
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "\u062A\u0648\u0627\u0631\u064A\u062E \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
      }
      if (startDate > endDate) {
        return res.status(400).json({ message: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0642\u0628\u0644 \u0623\u0648 \u064A\u0633\u0627\u0648\u064A \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0646\u0647\u0627\u064A\u0629" });
      }
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      const days = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24)) + 1);
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
        const notification = await storage.createNotification(
          admin.id,
          "\u0637\u0644\u0628 \u0625\u062C\u0627\u0632\u0629 \u062C\u062F\u064A\u062F",
          `${req.user.fullName} \u0642\u062F\u0645 \u0637\u0644\u0628 \u0625\u062C\u0627\u0632\u0629 \u062C\u062F\u064A\u062F`,
          "info"
        );
        wss.clients.forEach((client) => {
          if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({
              type: "new_notification",
              data: notification
            }));
          }
        });
      }
      res.status(201).json(leaveRequest);
    } catch (error) {
      console.error("Error creating leave request:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u0642\u062F\u064A\u0645 \u0637\u0644\u0628 \u0627\u0644\u0625\u062C\u0627\u0632\u0629" });
    }
  });
  app2.get("/api/leaves/my", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getUserLeaveRequests(req.user.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0625\u062C\u0627\u0632\u0627\u062A" });
    }
  });
  app2.get("/api/leaves/pending", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const requests = await storage.getPendingLeaveRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0625\u062C\u0627\u0632\u0627\u062A" });
    }
  });
  app2.put("/api/leaves/:id", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const updates = {
        ...req.body,
        approvedBy: req.user.id,
        approvedAt: /* @__PURE__ */ new Date()
      };
      const leaveRequest = await storage.updateLeaveRequest(req.params.id, updates);
      if (!leaveRequest) {
        return res.status(404).json({ message: "\u0637\u0644\u0628 \u0627\u0644\u0625\u062C\u0627\u0632\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const statusText = leaveRequest.status === "approved" ? "\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649" : "\u062A\u0645 \u0631\u0641\u0636";
      const notification = await storage.createNotification(
        leaveRequest.userId,
        "\u062A\u062D\u062F\u064A\u062B \u0637\u0644\u0628 \u0627\u0644\u0625\u062C\u0627\u0632\u0629",
        `${statusText} \u0637\u0644\u0628 \u0627\u0644\u0625\u062C\u0627\u0632\u0629 \u0627\u0644\u062E\u0627\u0635 \u0628\u0643`,
        leaveRequest.status === "approved" ? "success" : "error"
      );
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: "new_notification",
            data: notification
          }));
        }
      });
      res.json(leaveRequest);
    } catch (error) {
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
      res.status(201).json(advanceRequest);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628 \u0627\u0644\u0633\u0644\u0641\u0629" });
    }
  });
  app2.get("/api/salary-advances/pending", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const requests = await storage.getPendingSalaryAdvanceRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0633\u0644\u0641" });
    }
  });
  app2.get("/api/salary-advances/user", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getUserSalaryAdvanceRequests(req.user.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0633\u0644\u0641" });
    }
  });
  app2.put("/api/salary-advances/:id", requireAuth, requireRole(["admin", "sub-admin"]), async (req, res) => {
    try {
      const updates = {
        ...req.body,
        approvedBy: req.user.id,
        approvedAt: /* @__PURE__ */ new Date()
      };
      const advanceRequest = await storage.updateSalaryAdvanceRequest(req.params.id, updates);
      if (!advanceRequest) {
        return res.status(404).json({ message: "\u0637\u0644\u0628 \u0627\u0644\u0633\u0644\u0641\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const statusText = advanceRequest.status === "approved" ? "\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649" : "\u062A\u0645 \u0631\u0641\u0636";
      await storage.createNotification(
        advanceRequest.userId,
        "\u062A\u062D\u062F\u064A\u062B \u0637\u0644\u0628 \u0627\u0644\u0633\u0644\u0641\u0629",
        `${statusText} \u0637\u0644\u0628 \u0627\u0644\u0633\u0644\u0641\u0629 \u0627\u0644\u062E\u0627\u0635 \u0628\u0643`,
        advanceRequest.status === "approved" ? "success" : "error"
      );
      res.json(advanceRequest);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0637\u0644\u0628 \u0627\u0644\u0633\u0644\u0641\u0629" });
    }
  });
  app2.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications2 = await storage.getUserNotifications(req.user.id);
      res.json(notifications2);
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" });
    }
  });
  app2.put("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0634\u0639\u0627\u0631" });
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0634\u0639\u0627\u0631" });
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
        id: user.id,
        employee: user.fullName,
        department: user.department || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
        baseSalary: user.salary || 0,
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
      res.json({
        attendanceRate: Math.round(attendanceRate),
        avgWorkHoursPerDay: avgWorkHoursPerDay.toFixed(1),
        usedLeaveDays,
        departmentDistribution
      });
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0628\u0634\u0631\u064A\u0629" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        switch (data.type) {
          case "subscribe":
            break;
          case "aux_update":
            wss.clients.forEach((client) => {
              if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify({
                  type: "aux_status_update",
                  data: data.payload
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
    wss.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });
  });
  app2.post("/api/chat/rooms", requireAuth, async (req, res) => {
    try {
      const room = await storage.createChatRoom({
        name: req.body.name,
        type: req.body.type || "group",
        createdBy: req.user.id
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
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: "new_message",
            data: message
          }));
        }
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
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: "message_updated",
            data: message
          }));
        }
      });
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
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: "message_deleted",
            data: { messageId: req.params.id }
          }));
        }
      });
      res.json({ message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0631\u0633\u0627\u0644\u0629" });
    }
  });
  app2.post("/api/chat/reactions", requireAuth, async (req, res) => {
    try {
      const reaction = await storage.addMessageReaction(
        req.body.messageId,
        req.user.id,
        req.body.emoji
      );
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: "reaction_added",
            data: reaction
          }));
        }
      });
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
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: "reaction_removed",
            data: {
              messageId: req.body.messageId,
              userId: req.user.id,
              emoji: req.body.emoji
            }
          }));
        }
      });
      res.json({ message: "\u062A\u0645 \u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u062A\u0641\u0627\u0639\u0644 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u062A\u0641\u0627\u0639\u0644" });
    }
  });
  app2.get("/api/google-calendar/status", requireAuth, async (req, res) => {
    try {
      const token = await storage.getGoogleCalendarToken(req.user.id);
      res.json({ connected: !!token });
    } catch (error) {
      res.json({ connected: false });
    }
  });
  app2.get("/api/google-calendar/auth", requireAuth, async (req, res) => {
    try {
      const { getAuthorizationUrl: getAuthorizationUrl2 } = await Promise.resolve().then(() => (init_google_calendar(), google_calendar_exports));
      const crypto = await import("crypto");
      const state = crypto.randomBytes(32).toString("hex");
      req.session.googleAuthState = state;
      req.session.googleAuthUserId = req.user.id;
      const authUrl = getAuthorizationUrl2(state);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error initiating Google OAuth:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0628\u062F\u0621 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0631\u0628\u0637" });
    }
  });
  app2.get("/api/google-calendar/callback", async (req, res) => {
    try {
      const code = req.query.code;
      const state = req.query.state;
      const userId = req.session.googleAuthUserId;
      const sessionState = req.session.googleAuthState;
      if (!state || !sessionState || state !== sessionState) {
        console.error("OAuth state mismatch - possible CSRF attack");
        delete req.session.googleAuthState;
        delete req.session.googleAuthUserId;
        return res.redirect("/?error=auth_failed");
      }
      if (!code || !userId) {
        return res.redirect("/?error=auth_failed");
      }
      const user = await storage.getUser(userId);
      if (!user || !user.isActive) {
        console.error("Invalid or inactive user in OAuth callback");
        delete req.session.googleAuthState;
        delete req.session.googleAuthUserId;
        return res.redirect("/?error=auth_failed");
      }
      const { exchangeCodeForTokens: exchangeCodeForTokens2 } = await Promise.resolve().then(() => (init_google_calendar(), google_calendar_exports));
      const tokens = await exchangeCodeForTokens2(code);
      await storage.saveGoogleCalendarToken(userId, tokens);
      delete req.session.googleAuthUserId;
      delete req.session.googleAuthState;
      res.redirect("/?google_calendar_connected=true");
    } catch (error) {
      console.error("Error in Google OAuth callback:", error);
      res.redirect("/?error=auth_failed");
    }
  });
  app2.delete("/api/google-calendar/disconnect", requireAuth, async (req, res) => {
    try {
      await storage.deleteGoogleCalendarToken(req.user.id);
      res.json({ message: "\u062A\u0645 \u0641\u0635\u0644 Google Calendar \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Error disconnecting Google Calendar:", error);
      res.status(500).json({ message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0641\u0635\u0644 Google Calendar" });
    }
  });
  app2.post("/api/meetings/schedule", requireAuth, async (req, res) => {
    try {
      const { title, participantIds } = req.body;
      const tokenData = await storage.getGoogleCalendarToken(req.user.id);
      if (!tokenData) {
        return res.status(400).json({
          message: "\u064A\u0631\u062C\u0649 \u0631\u0628\u0637 \u062D\u0633\u0627\u0628 Google Calendar \u0627\u0644\u062E\u0627\u0635 \u0628\u0643 \u0644\u0625\u0646\u0634\u0627\u0621 \u0631\u0627\u0628\u0637 Google Meet \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B"
        });
      }
      const startTime = /* @__PURE__ */ new Date();
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1e3);
      let meetingLink;
      try {
        const { createGoogleMeetEvent: createGoogleMeetEvent2 } = await Promise.resolve().then(() => (init_google_calendar(), google_calendar_exports));
        const meetData = await createGoogleMeetEvent2(
          tokenData,
          title,
          `\u0627\u062C\u062A\u0645\u0627\u0639 \u0645\u0639 ${participantIds.length} \u0645\u0634\u0627\u0631\u0643`,
          startTime,
          endTime
        );
        meetingLink = meetData.meetingLink;
        if (meetData.updatedTokens) {
          await storage.updateGoogleCalendarToken(
            req.user.id,
            meetData.updatedTokens.accessToken,
            meetData.updatedTokens.expiresAt
          );
        }
      } catch (error) {
        console.error("Failed to create Google Meet link:", error);
        return res.status(400).json({
          message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0625\u0646\u0634\u0627\u0621 \u0631\u0627\u0628\u0637 Google Meet. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649"
        });
      }
      const meeting = await storage.createMeeting({
        title,
        description: `\u0627\u062C\u062A\u0645\u0627\u0639 \u0645\u0639 ${participantIds.length} \u0645\u0634\u0627\u0631\u0643`,
        meetingLink,
        scheduledBy: req.user.id,
        startTime,
        endTime
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

\u0627\u0646\u0636\u0645 \u0644\u0644\u0627\u062C\u062A\u0645\u0627\u0639: ${meetingLink}`,
        messageType: "meeting_link",
        attachments: [{
          name: title,
          url: meetingLink,
          type: "meeting"
        }]
      });
      for (const participantId of participantIds) {
        const notification = await storage.createNotification(
          participantId,
          "\u0627\u062C\u062A\u0645\u0627\u0639 \u062C\u062F\u064A\u062F",
          `${req.user.fullName} \u0642\u0627\u0645 \u0628\u062C\u062F\u0648\u0644\u0629 \u0627\u062C\u062A\u0645\u0627\u0639: ${title}`,
          "info"
        );
        wss.clients.forEach((client) => {
          if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({
              type: "new_notification",
              data: notification
            }));
          }
        });
      }
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: "new_message",
            data: message
          }));
          client.send(JSON.stringify({
            type: "new_meeting",
            data: meeting
          }));
        }
      });
      res.status(201).json({ ...meeting, chatRoomId: chatRoom.id });
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
          await storage.createNotification(
            participantId,
            "\u0627\u062C\u062A\u0645\u0627\u0639 \u062C\u062F\u064A\u062F",
            `\u062A\u0645 \u062C\u062F\u0648\u0644\u0629 \u0627\u062C\u062A\u0645\u0627\u0639: ${meeting.title}`,
            "info"
          );
        }
      }
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: "new_meeting",
            data: meeting
          }));
        }
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
  setInterval(async () => {
    try {
      const activeEmployees = await storage.getAllActiveAuxSessions();
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: "employee_status_update",
            data: activeEmployees
          }));
        }
      });
    } catch (error) {
      console.error("Broadcast error:", error);
    }
  }, 5e3);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
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
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
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
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        // غيرنا import.meta.dirname إلى __dirname
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
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import dotenv from "dotenv";
dotenv.config();
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
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
