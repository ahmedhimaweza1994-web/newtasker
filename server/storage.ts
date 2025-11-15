import {
  users,
  tasks,
  auxSessions,
  leaveRequests,
  salaryAdvanceRequests,
  salaryDeductions,
  taskNotes,
  taskCollaborators,
  notifications,
  shifts,
  chatRooms,
  chatRoomMembers,
  chatMessages,
  messageReactions,
  meetings,
  meetingParticipants,
  googleCalendarTokens,
  callLogs,
  suggestions,
  companies,
  companyMilestones,
  companyFiles,
  companyReports,
  companyComments,
  companyTeamMembers,
  type User,
  type InsertUser,
  type Task,
  type InsertTask,
  type AuxSession,
  type InsertAuxSession,
  type LeaveRequest,
  type InsertLeaveRequest,
  type SalaryAdvanceRequest,
  type InsertSalaryAdvanceRequest,
  type SalaryDeduction,
  type InsertSalaryDeduction,
  type TaskNote,
  type Notification,
  type InsertNotification,
  insertNotificationSchema,
  type Shift,
  type ChatRoom,
  type InsertChatRoom,
  type ChatMessage,
  type InsertChatMessage,
  type ChatRoomMember,
  type MessageReaction,
  type Meeting,
  type InsertMeeting,
  type MeetingParticipant,
  type GoogleCalendarToken,
  type CallLog,
  type InsertCallLog,
  type InsertGoogleCalendarToken,
  type Suggestion,
  type InsertSuggestion,
  type Company,
  type InsertCompany,
  type CompanyMilestone,
  type InsertCompanyMilestone,
  type CompanyFile,
  type InsertCompanyFile,
  type CompanyReport,
  type InsertCompanyReport,
  type CompanyComment,
  type InsertCompanyComment,
  type CompanyTeamMember,
  type InsertCompanyTeamMember,
  advanceStatusEnum,
  aiModelSettings,
  aiConversations,
  aiMessages,
  aiUsageLogs,
  type AiModelSettings,
  type InsertAiModelSettings,
  type AiConversation,
  type InsertAiConversation,
  type AiMessage,
  type InsertAiMessage,
  type AiUsageLog,
  type InsertAiUsageLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, isNull, count, sql, gte, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

const userPublicFields = {
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
  updatedAt: users.updatedAt,
};

export interface IStorage {
  // Auth & Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserLastLogin(id: string): Promise<void>;
  getUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;
 
  // Tasks
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: string): Promise<Task | undefined>;
  getUserTasks(userId: string): Promise<Task[]>;
  getAssignedTasks(userId: string): Promise<Task[]>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  getAllTasks(): Promise<Task[]>;
  rateTask(taskId: string, rating: number, ratedBy: string): Promise<Task>;
  approveTaskReview(taskId: string, approverId: string): Promise<Task>;
 
  // Task Collaborators
  addTaskCollaborator(taskId: string, userId: string): Promise<void>;
  removeTaskCollaborator(taskId: string, userId: string): Promise<void>;
  getTaskCollaborators(taskId: string): Promise<User[]>;
 
  // Task Notes
  createTaskNote(taskId: string, userId: string, content: string): Promise<TaskNote>;
  getTaskNotes(taskId: string): Promise<(TaskNote & { user: Omit<User, 'password'> })[]>;
 
  // AUX Sessions
  createAuxSession(session: InsertAuxSession): Promise<AuxSession>;
  startAuxSession(data: { userId: string; status: string; notes?: string; selectedTaskId?: string }): Promise<AuxSession>;
  endAuxSession(sessionId: string, notes?: string, selectedTaskId?: string): Promise<AuxSession | undefined>;
  updateCurrentSessionTask(userId: string, selectedTaskId: string | null): Promise<AuxSession | undefined>;
  getUserAuxSessions(userId: string, startDate?: Date, endDate?: Date): Promise<AuxSession[]>;
  getAllAuxSessions(): Promise<AuxSession[]>;
  getActiveAuxSession(userId: string): Promise<AuxSession | undefined>;
  getCurrentAuxSession(userId: string): Promise<AuxSession | null>;
  getAllActiveAuxSessions(): Promise<any[]>;
 
  // Leave Requests
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  getLeaveRequest(id: string): Promise<LeaveRequest | undefined>;
  getUserLeaveRequests(userId: string): Promise<LeaveRequest[]>;
  getAllLeaveRequests(): Promise<LeaveRequest[]>;
  getPendingLeaveRequests(): Promise<LeaveRequest[]>;
  updateLeaveRequest(id: string, status: 'approved' | 'rejected', approvedBy: string, rejectionReason?: string): Promise<LeaveRequest | undefined>;
 
  // Salary Advance Requests
  createSalaryAdvanceRequest(request: InsertSalaryAdvanceRequest): Promise<SalaryAdvanceRequest>;
  getSalaryAdvanceRequest(id: string): Promise<SalaryAdvanceRequest | undefined>;
  getUserSalaryAdvanceRequests(userId: string): Promise<SalaryAdvanceRequest[]>;
  getAllSalaryAdvanceRequests(): Promise<SalaryAdvanceRequest[]>;
  updateSalaryAdvanceRequest(id: string, status: 'approved' | 'rejected', approvedBy: string, rejectionReason?: string, repaymentDate?: Date): Promise<SalaryAdvanceRequest | undefined>;
 
  // Shifts
  createShift(shift: { userId: string, startTime: Date, endTime: Date, breakDuration?: number }): Promise<Shift>;
  getUserShifts(userId: string): Promise<Shift[]>;
  getAllShifts(): Promise<Shift[]>;
  getActiveShift(userId: string): Promise<Shift | undefined>;
 
  // Notifications
  createNotification(notificationData: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markMultipleNotificationsAsRead(notificationIds: string[]): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  markNotificationsByResourceAsRead(userId: string, resourceId: string, category: string): Promise<void>;
  deleteNotification(id: string): Promise<boolean>;
 
  // Chat Rooms
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  getOrCreatePrivateChat(user1Id: string, user2Id: string): Promise<ChatRoom & { members: Omit<User, 'password'>[] }>;
  getOrCreateCommonRoom(): Promise<ChatRoom>;
  ensureUserInCommonRoom(userId: string): Promise<void>;
  getUserChatRooms(userId: string): Promise<(ChatRoom & { members: Omit<User, 'password'>[], lastMessage?: ChatMessage })[]>;
  getChatRoom(roomId: string): Promise<ChatRoom | undefined>;
  getChatRoomMembers(roomId: string): Promise<Omit<User, 'password'>[]>;
  addChatRoomMember(roomId: string, userId: string): Promise<void>;
  updateLastReadMessage(roomId: string, userId: string, messageId: string): Promise<void>;
  getUnreadMessageCount(roomId: string, userId: string): Promise<number>;
  updateChatRoomImage(roomId: string, image: string): Promise<ChatRoom>;
 
  // Chat Messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessage(messageId: string): Promise<ChatMessage | undefined>;
  getChatMessages(roomId: string, limit?: number): Promise<(ChatMessage & { sender: Omit<User, 'password'>, reactions: MessageReaction[] })[]>;
  updateChatMessage(messageId: string, content: string): Promise<ChatMessage | undefined>;
  deleteChatMessage(messageId: string): Promise<boolean>;
 
  // Message Reactions
  addMessageReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction & { action: 'added' | 'removed' | 'switched' }>;
  removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<boolean>;
 
  // Meetings
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  getMeeting(id: string): Promise<Meeting | undefined>;
  getAllMeetings(): Promise<Meeting[]>;
  getUserMeetings(userId: string): Promise<Meeting[]>;
  updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | undefined>;
  deleteMeeting(id: string): Promise<boolean>;
  addMeetingParticipant(meetingId: string, userId: string): Promise<void>;
  removeMeetingParticipant(meetingId: string, userId: string): Promise<void>;
  getMeetingParticipants(meetingId: string): Promise<User[]>;
 
  // Google Calendar OAuth
  saveGoogleCalendarToken(userId: string, accessToken: string, refreshToken: string, expiresAt: Date, scope: string): Promise<GoogleCalendarToken>;
  getGoogleCalendarToken(userId: string): Promise<GoogleCalendarToken | undefined>;
  deleteGoogleCalendarToken(userId: string): Promise<boolean>;
 
  // Call Logs
  createCallLog(callLog: InsertCallLog): Promise<CallLog>;
  getCallLog(id: string): Promise<CallLog | undefined>;
  getUserCallLogs(userId: string): Promise<any[]>;
  getRoomCallLogs(roomId: string): Promise<any[]>;
  updateCallLog(id: string, updates: Partial<CallLog>): Promise<CallLog | undefined>;

  // Suggestions
  createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion>;
  getAllSuggestions(): Promise<Suggestion[]>;
  getUserSuggestions(userId: string): Promise<Suggestion[]>;
  updateSuggestion(id: string, updates: Partial<Suggestion>): Promise<Suggestion | undefined>;
  deleteSuggestion(id: string): Promise<boolean>;

  // Salary Deductions
  createSalaryDeduction(deduction: InsertSalaryDeduction): Promise<SalaryDeduction>;
  getSalaryDeduction(id: string): Promise<SalaryDeduction | undefined>;
  getUserSalaryDeductions(userId: string): Promise<SalaryDeduction[]>;
  getAllSalaryDeductions(): Promise<SalaryDeduction[]>;
  updateSalaryDeduction(id: string, updates: Partial<SalaryDeduction>): Promise<SalaryDeduction | undefined>;
  deleteSalaryDeduction(id: string): Promise<boolean>;

  // Companies
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: string): Promise<(Company & { manager?: Omit<User, 'password'>, taskCount?: number }) | undefined>;
  getAllCompanies(): Promise<(Company & { manager?: Omit<User, 'password'>, taskCount?: number })[]>;
  updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;
  getCompanyTasks(companyId: string): Promise<Task[]>;

  // Company Milestones
  createCompanyMilestone(milestone: InsertCompanyMilestone): Promise<CompanyMilestone>;
  getCompanyMilestones(companyId: string): Promise<CompanyMilestone[]>;
  updateCompanyMilestone(id: string, updates: Partial<CompanyMilestone>): Promise<CompanyMilestone | undefined>;
  deleteCompanyMilestone(id: string): Promise<boolean>;

  // Company Files
  createCompanyFile(file: InsertCompanyFile): Promise<CompanyFile>;
  getCompanyFiles(companyId: string): Promise<(CompanyFile & { uploadedBy: Omit<User, 'password'> })[]>;
  deleteCompanyFile(id: string): Promise<boolean>;

  // Company Reports
  createCompanyReport(report: InsertCompanyReport): Promise<CompanyReport>;
  getCompanyReports(companyId: string): Promise<(CompanyReport & { uploadedBy: Omit<User, 'password'> })[]>;
  updateCompanyReport(id: string, updates: Partial<CompanyReport>): Promise<CompanyReport | undefined>;
  deleteCompanyReport(id: string): Promise<boolean>;

  // Company Comments
  createCompanyComment(comment: InsertCompanyComment): Promise<CompanyComment>;
  getCompanyComments(companyId: string): Promise<(CompanyComment & { user: Omit<User, 'password'> })[]>;
  updateCompanyComment(id: string, content: string): Promise<CompanyComment | undefined>;
  deleteCompanyComment(id: string): Promise<boolean>;

  // Company Team Members
  addCompanyTeamMember(companyId: string, userId: string, role?: string): Promise<CompanyTeamMember>;
  getCompanyTeamMembers(companyId: string): Promise<(CompanyTeamMember & { user: Omit<User, 'password'> })[]>;
  removeCompanyTeamMember(companyId: string, userId: string): Promise<boolean>;

  // Analytics & Rewards
  getUserRewards(userId: string): Promise<any[]>;
  getUserProductivityStats(userId: string, startDate: Date, endDate: Date): Promise<any>;
  getSystemStats(): Promise<any>;
  getDepartmentStats(): Promise<any[]>;

  // AI Model Settings
  getAiModelSettings(modelType: string): Promise<AiModelSettings | undefined>;
  getAllAiModelSettings(): Promise<AiModelSettings[]>;
  createAiModelSettings(settings: InsertAiModelSettings): Promise<AiModelSettings>;
  updateAiModelSettings(modelType: string, updates: Partial<AiModelSettings>): Promise<AiModelSettings | undefined>;
  deleteAiModelSettings(modelType: string): Promise<boolean>;

  // AI Conversations
  createAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  getAiConversation(id: string): Promise<AiConversation | undefined>;
  getUserAiConversations(userId: string, modelType?: string): Promise<AiConversation[]>;
  updateAiConversation(id: string, updates: Partial<AiConversation>): Promise<AiConversation | undefined>;
  deleteAiConversation(id: string): Promise<boolean>;

  // AI Messages
  createAiMessage(message: InsertAiMessage): Promise<AiMessage>;
  getAiMessages(conversationId: string): Promise<AiMessage[]>;
  deleteAiMessage(id: string): Promise<boolean>;

  // AI Usage Logs
  createAiUsageLog(log: InsertAiUsageLog): Promise<AiUsageLog>;
  getUserAiUsageLogs(userId: string, startDate?: Date, endDate?: Date): Promise<AiUsageLog[]>;
  getAiUsageStats(modelType?: string): Promise<any>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });

  // Auth & Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount! > 0;
  }

  // Tasks
  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) return undefined;
    
    // Get creator user
    let createdByUser = undefined;
    if (task.createdBy) {
      const [creator] = await db.select(userPublicFields).from(users).where(eq(users.id, task.createdBy));
      createdByUser = creator;
    }
    
    // Get createdFor user
    let createdForUser = undefined;
    if (task.createdFor) {
      const [createdFor] = await db.select(userPublicFields).from(users).where(eq(users.id, task.createdFor));
      createdForUser = createdFor;
    }
    
    // Get assigned user
    let assignedToUser = undefined;
    if (task.assignedTo) {
      const [assignee] = await db.select(userPublicFields).from(users).where(eq(users.id, task.assignedTo));
      assignedToUser = assignee;
    }
    
    // Get reviewer user (ratedBy)
    let ratedByUser = undefined;
    if (task.ratedBy) {
      const [reviewer] = await db.select(userPublicFields).from(users).where(eq(users.id, task.ratedBy));
      ratedByUser = reviewer;
    }
    
    return {
      ...task,
      createdByUser,
      createdForUser,
      assignedToUser,
      ratedByUser,
    } as any;
  }

  async getUserTasks(userId: string): Promise<Task[]> {
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
            role: true,
          },
        },
        createdFor: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true,
          },
        },
        assignedTo: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true,
          },
        },
        ratedBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true,
          },
        },
      },
      orderBy: [desc(tasks.createdAt)],
    });
    
    return tasksData.map(task => ({
      ...task,
      createdByUser: task.createdBy,
      createdForUser: task.createdFor,
      assignedToUser: task.assignedTo,
      ratedByUser: task.ratedBy,
    })) as any;
  }

  async getAssignedTasks(userId: string): Promise<Task[]> {
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
            role: true,
          },
        },
        createdFor: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true,
          },
        },
        assignedTo: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true,
          },
        },
        ratedBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true,
          },
        },
      },
      orderBy: [desc(tasks.createdAt)],
    });
    
    return tasksData.map(task => ({
      ...task,
      createdByUser: task.createdBy,
      createdForUser: task.createdFor,
      assignedToUser: task.assignedTo,
      ratedByUser: task.ratedBy,
    })) as any;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount! > 0;
  }

  async getAllTasks(): Promise<Task[]> {
    const tasksData = await db.query.tasks.findMany({
      with: {
        createdBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true,
          },
        },
        createdFor: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true,
          },
        },
        assignedTo: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true,
          },
        },
        ratedBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true,
          },
        },
      },
      orderBy: [desc(tasks.createdAt)],
    });
    
    return tasksData.map(task => ({
      ...task,
      createdByUser: task.createdBy,
      createdForUser: task.createdFor,
      assignedToUser: task.assignedTo,
      ratedByUser: task.ratedBy,
    })) as any;
  }

  async rateTask(taskId: string, rating: number, ratedBy: string): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    let rewardPoints = 0;
    if (rating === 5) rewardPoints = 10;
    else if (rating === 4) rewardPoints = 7;
    else if (rating === 3) rewardPoints = 5;

    const [updatedTask] = await db
      .update(tasks)
      .set({
        performanceRating: rating,
        rewardPoints,
        ratedBy,
        ratedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId))
      .returning();

    if (task.assignedTo && updatedTask.rewardPoints > 0) {
      const [user] = await db.select().from(users).where(eq(users.id, task.assignedTo));
      if (user) {
        await db
          .update(users)
          .set({ totalPoints: (user.totalPoints || 0) + updatedTask.rewardPoints })
          .where(eq(users.id, task.assignedTo));
      }
    }

    return updatedTask;
  }

  async approveTaskReview(taskId: string, approverId: string): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId))
      .returning();

    return task;
  }

  // Task Collaborators
  async addTaskCollaborator(taskId: string, userId: string): Promise<void> {
    await db.insert(taskCollaborators).values({ taskId, userId });
  }

  async removeTaskCollaborator(taskId: string, userId: string): Promise<void> {
    await db
      .delete(taskCollaborators)
      .where(
        and(
          eq(taskCollaborators.taskId, taskId),
          eq(taskCollaborators.userId, userId)
        )
      );
  }

  async getTaskCollaborators(taskId: string): Promise<User[]> {
    const collaborators = await db
      .select({ user: users })
      .from(taskCollaborators)
      .innerJoin(users, eq(taskCollaborators.userId, users.id))
      .where(eq(taskCollaborators.taskId, taskId));
    return collaborators.map(c => c.user);
  }

  // Task Notes
  async createTaskNote(taskId: string, userId: string, content: string): Promise<TaskNote> {
    const [note] = await db
      .insert(taskNotes)
      .values({ taskId, userId, content })
      .returning();
    return note;
  }

  async getTaskNotes(taskId: string): Promise<(TaskNote & { user: Omit<User, 'password'> })[]> {
    const notes = await db
      .select({
        note: taskNotes,
        user: userPublicFields,
      })
      .from(taskNotes)
      .innerJoin(users, eq(taskNotes.userId, users.id))
      .where(eq(taskNotes.taskId, taskId))
      .orderBy(desc(taskNotes.createdAt));
    
    return notes.map(({ note, user }) => ({
      ...note,
      user,
    }));
  }

  // AUX Sessions
  async createAuxSession(session: InsertAuxSession): Promise<AuxSession> {
    const [newSession] = await db.insert(auxSessions).values(session).returning();
    return newSession;
  }

  async startAuxSession(data: { userId: string; status: string; notes?: string; selectedTaskId?: string }): Promise<AuxSession> {
    const activeSession = await this.getActiveAuxSession(data.userId);
    if (activeSession) {
      await this.endAuxSession(activeSession.id);
    }
    
    return await this.createAuxSession({
      userId: data.userId,
      status: data.status as any,
      notes: data.notes,
      selectedTaskId: data.selectedTaskId || null,
    });
  }

  async endAuxSession(sessionId: string, notes?: string, selectedTaskId?: string): Promise<AuxSession | undefined> {
    const [session] = await db
      .select()
      .from(auxSessions)
      .where(eq(auxSessions.id, sessionId));
    
    if (!session) return undefined;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

    const [updatedSession] = await db
      .update(auxSessions)
      .set({ 
        endTime, 
        duration, 
        notes: notes !== undefined ? notes : session.notes,
        selectedTaskId: selectedTaskId !== undefined ? selectedTaskId : session.selectedTaskId
      })
      .where(eq(auxSessions.id, sessionId))
      .returning();

    return updatedSession || undefined;
  }

  async updateCurrentSessionTask(userId: string, selectedTaskId: string | null): Promise<AuxSession | undefined> {
    const activeSession = await this.getActiveAuxSession(userId);
    if (!activeSession) return undefined;

    const [updatedSession] = await db
      .update(auxSessions)
      .set({ selectedTaskId })
      .where(eq(auxSessions.id, activeSession.id))
      .returning();

    return updatedSession || undefined;
  }

  async getUserAuxSessions(userId: string, startDate?: Date, endDate?: Date): Promise<AuxSession[]> {
    let conditions = [eq(auxSessions.userId, userId)];
    
    if (startDate) {
      conditions.push(gte(auxSessions.startTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(auxSessions.startTime, endDate));
    }

    return await db
      .select()
      .from(auxSessions)
      .where(and(...conditions))
      .orderBy(desc(auxSessions.startTime));
  }

  async getCurrentAuxSession(userId: string): Promise<AuxSession | null> {
    return await this.getActiveAuxSession(userId) || null;
  }

  async getAllAuxSessions(): Promise<AuxSession[]> {
    return await db
      .select()
      .from(auxSessions)
      .orderBy(desc(auxSessions.startTime));
  }

  async getActiveAuxSession(userId: string): Promise<AuxSession | undefined> {
    const [session] = await db
      .select()
      .from(auxSessions)
      .where(
        and(
          eq(auxSessions.userId, userId),
          isNull(auxSessions.endTime)
        )
      )
      .orderBy(desc(auxSessions.startTime))
      .limit(1);

    return session || undefined;
  }

  async getAllActiveAuxSessions(): Promise<any[]> {
    const activeSessions = await db
      .select({
        session: auxSessions,
        user: userPublicFields,
        selectedTask: {
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
        }
      })
      .from(auxSessions)
      .innerJoin(users, eq(auxSessions.userId, users.id))
      .leftJoin(tasks, eq(auxSessions.selectedTaskId, tasks.id))
      .where(isNull(auxSessions.endTime))
      .orderBy(desc(auxSessions.startTime));

    return activeSessions.map(({ session, user, selectedTask }) => ({
      ...session,
      user,
      selectedTask,
    }));
  }

  // Leave Requests
  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const [newRequest] = await db.insert(leaveRequests).values(request).returning();
    return newRequest;
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    const [request] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id));
    return request || undefined;
  }

  async getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.userId, userId))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .orderBy(desc(leaveRequests.createdAt));
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.status, 'pending'))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async updateLeaveRequest(
    id: string,
    status: 'approved' | 'rejected',
    approvedBy: string,
    rejectionReason?: string
  ): Promise<LeaveRequest | undefined> {
    const [request] = await db
      .update(leaveRequests)
      .set({
        status,
        approvedBy,
        approvedAt: new Date(),
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    return request || undefined;
  }

  // Salary Advance Requests
  async createSalaryAdvanceRequest(request: InsertSalaryAdvanceRequest): Promise<SalaryAdvanceRequest> {
    const [newRequest] = await db.insert(salaryAdvanceRequests).values(request).returning();
    return newRequest;
  }

  async getSalaryAdvanceRequest(id: string): Promise<SalaryAdvanceRequest | undefined> {
    const [request] = await db
      .select()
      .from(salaryAdvanceRequests)
      .where(eq(salaryAdvanceRequests.id, id));
    return request || undefined;
  }

  async getUserSalaryAdvanceRequests(userId: string): Promise<SalaryAdvanceRequest[]> {
    return await db
      .select()
      .from(salaryAdvanceRequests)
      .where(eq(salaryAdvanceRequests.userId, userId))
      .orderBy(desc(salaryAdvanceRequests.createdAt));
  }

  async getAllSalaryAdvanceRequests(): Promise<SalaryAdvanceRequest[]> {
    return await db
      .select()
      .from(salaryAdvanceRequests)
      .orderBy(desc(salaryAdvanceRequests.createdAt));
  }

  async getPendingSalaryAdvanceRequests(): Promise<SalaryAdvanceRequest[]> {
    return await db
      .select()
      .from(salaryAdvanceRequests)
      .where(eq(salaryAdvanceRequests.status, 'pending'))
      .orderBy(desc(salaryAdvanceRequests.createdAt));
  }

  async updateSalaryAdvanceRequest(
    id: string,
    status: 'approved' | 'rejected',
    approvedBy: string,
    rejectionReason?: string,
    repaymentDate?: Date
  ): Promise<SalaryAdvanceRequest | undefined> {
    const [request] = await db
      .update(salaryAdvanceRequests)
      .set({
        status,
        approvedBy,
        approvedAt: new Date(),
        rejectionReason,
        repaymentDate,
        updatedAt: new Date(),
      })
      .where(eq(salaryAdvanceRequests.id, id))
      .returning();

    return request || undefined;
  }

  // Shifts
  async createShift(shift: { userId: string, startTime: Date, endTime: Date, breakDuration?: number }): Promise<Shift> {
    const [newShift] = await db.insert(shifts).values(shift).returning();
    return newShift;
  }

  async getUserShifts(userId: string): Promise<Shift[]> {
    return await db
      .select()
      .from(shifts)
      .where(eq(shifts.userId, userId))
      .orderBy(desc(shifts.startTime));
  }

  async getAllShifts(): Promise<Shift[]> {
    return await db
      .select()
      .from(shifts)
      .orderBy(desc(shifts.startTime));
  }

  async getActiveShift(userId: string): Promise<Shift | undefined> {
    const [shift] = await db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.userId, userId),
          eq(shifts.isActive, true)
        )
      )
      .orderBy(desc(shifts.startTime))
      .limit(1);

    return shift || undefined;
  }

  // Notifications
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    // Validate with the discriminated union schema
    const validatedData = insertNotificationSchema.parse(notificationData);
    
    const [notification] = await db
      .insert(notifications)
      .values(validatedData)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async markMultipleNotificationsAsRead(notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return;
    
    for (const id of notificationIds) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id));
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async markNotificationsByResourceAsRead(userId: string, resourceId: string, category: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.category, category as any),
        sql`metadata->>'resourceId' = ${resourceId}`
      ));
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return result.rowCount! > 0;
  }

  // Chat Rooms
  async createChatRoom(room: InsertChatRoom): Promise<ChatRoom> {
    const [newRoom] = await db.insert(chatRooms).values(room).returning();
    return newRoom;
  }

  async getOrCreatePrivateChat(user1Id: string, user2Id: string): Promise<ChatRoom & { members: Omit<User, 'password'>[] }> {
    const existingRooms = await db
      .select({ roomId: chatRoomMembers.roomId })
      .from(chatRoomMembers)
      .where(eq(chatRoomMembers.userId, user1Id))
      .innerJoin(chatRooms, eq(chatRoomMembers.roomId, chatRooms.id))
      .where(eq(chatRooms.type, 'private'));

    for (const { roomId } of existingRooms) {
      const members = await db
        .select({ userId: chatRoomMembers.userId })
        .from(chatRoomMembers)
        .where(eq(chatRoomMembers.roomId, roomId));

      const memberIds = members.map(m => m.userId);
      if (memberIds.length === 2 &&
          memberIds.includes(user1Id) &&
          memberIds.includes(user2Id)) {
        const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId));
        const roomMembers = await db
          .select(userPublicFields)
          .from(chatRoomMembers)
          .innerJoin(users, eq(chatRoomMembers.userId, users.id))
          .where(eq(chatRoomMembers.roomId, roomId));

        return {
          ...room,
          members: roomMembers,
        };
      }
    }

    const [firstUser] = await db.select().from(users).where(eq(users.id, user1Id));
    const [newRoom] = await db.insert(chatRooms).values({
      type: 'private',
      createdBy: user1Id,
    }).returning();

    const roomId = newRoom.id;
    if (roomId) {
      await db.insert(chatRoomMembers).values([
        { roomId: newRoom.id, userId: user1Id },
        { roomId: newRoom.id, userId: user2Id },
      ]);
    }

    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId));
    const members = await db
      .select(userPublicFields)
      .from(chatRoomMembers)
      .innerJoin(users, eq(chatRoomMembers.userId, users.id))
      .where(eq(chatRoomMembers.roomId, roomId));

    return {
      ...room,
      members,
    };
  }

  async getOrCreateCommonRoom(): Promise<ChatRoom> {
    const [existingRoom] = await db
      .select()
      .from(chatRooms)
      .where(and(
        eq(chatRooms.type, 'group'),
        eq(chatRooms.name, 'الغرفة العامة')
      ))
      .limit(1);

    if (existingRoom) {
      return existingRoom;
    }

    const [firstUser] = await db.select().from(users).limit(1);
    const [commonRoom] = await db.insert(chatRooms).values({
      name: 'الغرفة العامة',
      type: 'group',
      createdBy: firstUser?.id || sql`gen_random_uuid()`,
    }).returning();

    const allUsers = await db.select().from(users);
    const memberValues = allUsers.map(user => ({
      roomId: commonRoom.id,
      userId: user.id,
    }));

    if (memberValues.length > 0) {
      await db.insert(chatRoomMembers).values(memberValues);
    }

    return commonRoom;
  }

  async ensureUserInCommonRoom(userId: string): Promise<void> {
    const commonRoom = await this.getOrCreateCommonRoom();
    
    const [existing] = await db
      .select()
      .from(chatRoomMembers)
      .where(and(
        eq(chatRoomMembers.roomId, commonRoom.id),
        eq(chatRoomMembers.userId, userId)
      ))
      .limit(1);

    if (!existing) {
      await db.insert(chatRoomMembers).values({
        roomId: commonRoom.id,
        userId: userId,
      });
    }
  }

  async getUserChatRooms(userId: string): Promise<(ChatRoom & { members: Omit<User, 'password'>[], lastMessage?: ChatMessage })[]> {
    const rooms = await db
      .select({
        room: chatRooms,
      })
      .from(chatRoomMembers)
      .innerJoin(chatRooms, eq(chatRoomMembers.roomId, chatRooms.id))
      .where(eq(chatRoomMembers.userId, userId))
      .orderBy(desc(chatRooms.updatedAt));

    const result = [];
    for (const { room } of rooms) {
      const members = await db
        .select(userPublicFields)
        .from(chatRoomMembers)
        .innerJoin(users, eq(chatRoomMembers.userId, users.id))
        .where(eq(chatRoomMembers.roomId, room.id));

      const [lastMessage] = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.roomId, room.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(1);

      result.push({
        ...room,
        members,
        lastMessage,
      });
    }

    return result;
  }

  async getChatRoom(roomId: string): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId));
    return room || undefined;
  }

  async getChatRoomMembers(roomId: string): Promise<Omit<User, 'password'>[]> {
    const members = await db
      .select(userPublicFields)
      .from(chatRoomMembers)
      .innerJoin(users, eq(chatRoomMembers.userId, users.id))
      .where(eq(chatRoomMembers.roomId, roomId));
    return members;
  }

  async addChatRoomMember(roomId: string, userId: string): Promise<void> {
    await db.insert(chatRoomMembers).values({ roomId, userId });
  }
  
  async updateLastReadMessage(roomId: string, userId: string, messageId: string): Promise<void> {
    await db
      .update(chatRoomMembers)
      .set({ lastReadMessageId: messageId })
      .where(and(
        eq(chatRoomMembers.roomId, roomId),
        eq(chatRoomMembers.userId, userId)
      ));
  }

  async getUnreadMessageCount(roomId: string, userId: string): Promise<number> {
    const member = await db
      .select()
      .from(chatRoomMembers)
      .where(and(
        eq(chatRoomMembers.roomId, roomId),
        eq(chatRoomMembers.userId, userId)
      ))
      .limit(1);

    if (!member || member.length === 0) return 0;

    const lastReadId = member[0].lastReadMessageId;
    
    if (!lastReadId) {
      const [result] = await db
        .select({ count: count() })
        .from(chatMessages)
        .where(and(
          eq(chatMessages.roomId, roomId),
          sql`${chatMessages.senderId} != ${userId}`
        ));
      return result?.count || 0;
    }

    const lastReadMessage = await db
      .select({ createdAt: chatMessages.createdAt })
      .from(chatMessages)
      .where(eq(chatMessages.id, lastReadId))
      .limit(1);

    if (!lastReadMessage || lastReadMessage.length === 0) {
      const [result] = await db
        .select({ count: count() })
        .from(chatMessages)
        .where(and(
          eq(chatMessages.roomId, roomId),
          sql`${chatMessages.senderId} != ${userId}`
        ));
      return result?.count || 0;
    }

    const [result] = await db
      .select({ count: count() })
      .from(chatMessages)
      .where(and(
        eq(chatMessages.roomId, roomId),
        sql`${chatMessages.senderId} != ${userId}`,
        sql`${chatMessages.createdAt} > ${lastReadMessage[0].createdAt}`
      ));

    return result?.count || 0;
  }
  
  async updateChatRoomImage(roomId: string, image: string): Promise<ChatRoom> {
    const [room] = await db.update(chatRooms).set({ image }).where(eq(chatRooms.id, roomId)).returning();
    return room;
  }


  // Chat Messages
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const messageData = {
      roomId: message.roomId,
      senderId: message.senderId,
      content: message.content || null,
      messageType: message.messageType || 'text',
      attachments: message.attachments || null,
      replyTo: message.replyTo || null,
    } as typeof chatMessages.$inferInsert;
    const [chatMessage] = await db.insert(chatMessages).values(messageData).returning();
    
    await db
      .update(chatRooms)
      .set({ updatedAt: new Date() })
      .where(eq(chatRooms.id, message.roomId));

    return chatMessage;
  }

  async getChatMessage(messageId: string): Promise<ChatMessage | undefined> {
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, messageId));
    return message || undefined;
  }

  async getChatMessages(roomId: string, limit: number = 50): Promise<(ChatMessage & { sender: Omit<User, 'password'>, reactions: MessageReaction[] })[]> {
    const messages = await db
      .select({
        message: chatMessages,
        sender: userPublicFields,
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    const result = [];
    for (const { message, sender } of messages) {
      const reactions = await db
        .select()
        .from(messageReactions)
        .where(eq(messageReactions.messageId, message.id));

      result.push({
        ...message,
        sender,
        reactions,
      });
    }

    return result.reverse();
  }

  async updateChatMessage(messageId: string, content: string): Promise<ChatMessage | undefined> {
    const [message] = await db
      .update(chatMessages)
      .set({ content, isEdited: true, updatedAt: new Date() })
      .where(eq(chatMessages.id, messageId))
      .returning();
    return message || undefined;
  }

  async deleteChatMessage(messageId: string): Promise<boolean> {
    const result = await db.delete(chatMessages).where(eq(chatMessages.id, messageId));
    return result.rowCount! > 0;
  }

  // Message Reactions
  async addMessageReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction & { action: 'added' | 'removed' | 'switched' }> {
    const existing = await db
      .select()
      .from(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId)
      ))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].emoji === emoji) {
        await db
          .delete(messageReactions)
          .where(eq(messageReactions.id, existing[0].id));
        return { ...existing[0], action: 'removed' };
      }
      const [updated] = await db
        .update(messageReactions)
        .set({ emoji, createdAt: new Date() })
        .where(eq(messageReactions.id, existing[0].id))
        .returning();
      return { ...updated, action: 'switched' };
    }

    const [reaction] = await db
      .insert(messageReactions)
      .values({ messageId, userId, emoji })
      .returning();
    return { ...reaction, action: 'added' };
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
    const result = await db
      .delete(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      ));
    return result.rowCount! > 0;
  }

  // Meetings
  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();
    return newMeeting;
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting || undefined;
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return await db.select().from(meetings).orderBy(desc(meetings.startTime));
  }

  async getUserMeetings(userId: string): Promise<Meeting[]> {
    const participations = await db
      .select({ meeting: meetings })
      .from(meetingParticipants)
      .innerJoin(meetings, eq(meetingParticipants.meetingId, meetings.id))
      .where(eq(meetingParticipants.userId, userId))
      .orderBy(desc(meetings.startTime));

    return participations.map(p => p.meeting);
  }

  async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | undefined> {
    const [meeting] = await db
      .update(meetings)
      .set(updates)
      .where(eq(meetings.id, id))
      .returning();
    return meeting || undefined;
  }

  async deleteMeeting(id: string): Promise<boolean> {
    const result = await db.delete(meetings).where(eq(meetings.id, id));
    return result.rowCount! > 0;
  }

  async addMeetingParticipant(meetingId: string, userId: string): Promise<void> {
    await db.insert(meetingParticipants).values({ meetingId, userId });
  }

  async removeMeetingParticipant(meetingId: string, userId: string): Promise<void> {
    await db
      .delete(meetingParticipants)
      .where(
        and(
          eq(meetingParticipants.meetingId, meetingId),
          eq(meetingParticipants.userId, userId)
        )
      );
  }

  async getMeetingParticipants(meetingId: string): Promise<User[]> {
    const participants = await db
      .select({ user: users })
      .from(meetingParticipants)
      .innerJoin(users, eq(meetingParticipants.userId, users.id))
      .where(eq(meetingParticipants.meetingId, meetingId));
    return participants.map(p => p.user);
  }

  // Google Calendar OAuth
  async saveGoogleCalendarToken(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
    scope: string
  ): Promise<GoogleCalendarToken> {
    const existing = await this.getGoogleCalendarToken(userId);

    if (existing) {
      const [token] = await db
        .update(googleCalendarTokens)
        .set({ accessToken, refreshToken, expiresAt, scope, updatedAt: new Date() })
        .where(eq(googleCalendarTokens.userId, userId))
        .returning();
      return token;
    }

    const [token] = await db
      .insert(googleCalendarTokens)
      .values({ userId, accessToken, refreshToken, expiresAt, scope })
      .returning();
    return token;
  }

  async getGoogleCalendarToken(userId: string): Promise<GoogleCalendarToken | undefined> {
    const [token] = await db
      .select()
      .from(googleCalendarTokens)
      .where(eq(googleCalendarTokens.userId, userId));
    return token || undefined;
  }

  async deleteGoogleCalendarToken(userId: string): Promise<boolean> {
    const result = await db
      .delete(googleCalendarTokens)
      .where(eq(googleCalendarTokens.userId, userId));
    return result.rowCount! > 0;
  }

  // Call Logs
  async createCallLog(callLog: InsertCallLog): Promise<CallLog> {
    const [newCallLog] = await db.insert(callLogs).values(callLog).returning();
    return newCallLog;
  }

  async getCallLog(id: string): Promise<CallLog | undefined> {
    const [callLog] = await db.select().from(callLogs).where(eq(callLogs.id, id));
    return callLog || undefined;
  }

  async getUserCallLogs(userId: string): Promise<any[]> {
    const callerAlias = alias(users, 'caller');
    const receiverAlias = alias(users, 'receiver');

    const logs = await db
      .select({
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
        receiverProfilePicture: receiverAlias.profilePicture,
      })
      .from(callLogs)
      .leftJoin(callerAlias, eq(callLogs.callerId, callerAlias.id))
      .leftJoin(receiverAlias, eq(callLogs.receiverId, receiverAlias.id))
      .where(or(eq(callLogs.callerId, userId), eq(callLogs.receiverId, userId)))
      .orderBy(desc(callLogs.startedAt));

    return logs.map(log => ({
      id: log.id,
      roomId: log.roomId,
      callerId: log.callerId,
      receiverId: log.receiverId,
      callType: log.callType,
      status: log.status,
      startedAt: log.startedAt,
      endedAt: log.endedAt,
      duration: log.duration,
      createdAt: log.createdAt,
      caller: {
        id: log.callerId,
        fullName: log.callerFullName,
        profilePicture: log.callerProfilePicture,
      },
      receiver: {
        id: log.receiverId,
        fullName: log.receiverFullName,
        profilePicture: log.receiverProfilePicture,
      },
    }));
  }

  async getRoomCallLogs(roomId: string): Promise<any[]> {
    const callerAlias = alias(users, 'caller');
    const receiverAlias = alias(users, 'receiver');

    const logs = await db
      .select({
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
        receiverProfilePicture: receiverAlias.profilePicture,
      })
      .from(callLogs)
      .leftJoin(callerAlias, eq(callLogs.callerId, callerAlias.id))
      .leftJoin(receiverAlias, eq(callLogs.receiverId, receiverAlias.id))
      .where(eq(callLogs.roomId, roomId))
      .orderBy(desc(callLogs.startedAt));

    return logs.map(log => ({
      id: log.id,
      roomId: log.roomId,
      callerId: log.callerId,
      receiverId: log.receiverId,
      callType: log.callType,
      status: log.status,
      startedAt: log.startedAt,
      endedAt: log.endedAt,
      duration: log.duration,
      createdAt: log.createdAt,
      caller: {
        id: log.callerId,
        fullName: log.callerFullName,
        profilePicture: log.callerProfilePicture,
      },
      receiver: {
        id: log.receiverId,
        fullName: log.receiverFullName,
        profilePicture: log.receiverProfilePicture,
      },
    }));
  }

  async updateCallLog(id: string, updates: Partial<CallLog>): Promise<CallLog | undefined> {
    const [callLog] = await db
      .update(callLogs)
      .set(updates)
      .where(eq(callLogs.id, id))
      .returning();
    return callLog || undefined;
  }

  // Suggestions
  async createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion> {
    const [newSuggestion] = await db.insert(suggestions).values(suggestion).returning();
    return newSuggestion;
  }

  async getAllSuggestions(): Promise<Suggestion[]> {
    return await db.select().from(suggestions).orderBy(desc(suggestions.createdAt));
  }

  async getUserSuggestions(userId: string): Promise<Suggestion[]> {
    return await db
      .select()
      .from(suggestions)
      .where(eq(suggestions.userId, userId))
      .orderBy(desc(suggestions.createdAt));
  }

  async updateSuggestion(id: string, updates: Partial<Suggestion>): Promise<Suggestion | undefined> {
    const [suggestion] = await db
      .update(suggestions)
      .set(updates)
      .where(eq(suggestions.id, id))
      .returning();
    return suggestion || undefined;
  }

  async deleteSuggestion(id: string): Promise<boolean> {
    const result = await db
      .delete(suggestions)
      .where(eq(suggestions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Salary Deductions
  async createSalaryDeduction(deduction: InsertSalaryDeduction): Promise<SalaryDeduction> {
    const [newDeduction] = await db.insert(salaryDeductions).values(deduction).returning();
    return newDeduction;
  }

  async getSalaryDeduction(id: string): Promise<SalaryDeduction | undefined> {
    const [deduction] = await db.select().from(salaryDeductions).where(eq(salaryDeductions.id, id));
    return deduction || undefined;
  }

  async getUserSalaryDeductions(userId: string): Promise<any[]> {
    const results = await db
      .select({
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
          profilePicture: users.profilePicture,
        },
      })
      .from(salaryDeductions)
      .leftJoin(users, eq(salaryDeductions.userId, users.id))
      .where(eq(salaryDeductions.userId, userId))
      .orderBy(desc(salaryDeductions.createdAt));
    return results;
  }

  async getAllSalaryDeductions(): Promise<any[]> {
    const results = await db
      .select({
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
          profilePicture: users.profilePicture,
        },
        addedByUser: {
          id: sql`added_by_user.id`.as('added_by_user_id'),
          fullName: sql`added_by_user.full_name`.as('added_by_user_full_name'),
          email: sql`added_by_user.email`.as('added_by_user_email'),
        },
      })
      .from(salaryDeductions)
      .leftJoin(users, eq(salaryDeductions.userId, users.id))
      .leftJoin(sql`users AS added_by_user`, sql`${salaryDeductions.addedBy} = added_by_user.id`)
      .orderBy(desc(salaryDeductions.createdAt));
    
    return results.map((row: any) => ({
      ...row,
      addedByUser: row.added_by_user_id ? {
        id: row.added_by_user_id,
        fullName: row.added_by_user_full_name,
        email: row.added_by_user_email,
      } : null,
    }));
  }

  async updateSalaryDeduction(id: string, updates: Partial<SalaryDeduction>): Promise<SalaryDeduction | undefined> {
    const [deduction] = await db
      .update(salaryDeductions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(salaryDeductions.id, id))
      .returning();
    return deduction || undefined;
  }

  async deleteSalaryDeduction(id: string): Promise<boolean> {
    const result = await db.delete(salaryDeductions).where(eq(salaryDeductions.id, id)).returning();
    return result.length > 0;
  }

  // Analytics & Rewards
  async getUserRewards(userId: string): Promise<any[]> {
    const completedTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.assignedTo, userId),
          eq(tasks.status, 'completed')
        )
      )
      .orderBy(desc(tasks.completedAt));

    return completedTasks.map(task => ({
      id: task.id,
      title: task.title,
      points: task.rewardPoints || 0,
      rating: task.performanceRating || 0,
      completedAt: task.completedAt,
    }));
  }

  async getUserProductivityStats(userId: string, startDate: Date, endDate: Date): Promise<any> {
    const userTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.assignedTo, userId),
          gte(tasks.createdAt, startDate),
          lte(tasks.createdAt, endDate)
        )
      );

    const completedTasks = userTasks.filter(t => t.status === 'completed');
    const totalEstimatedHours = userTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActualHours = completedTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const avgRating = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => sum + (t.performanceRating || 0), 0) / completedTasks.length
      : 0;

    return {
      totalTasks: userTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: userTasks.filter(t => t.status === 'pending').length,
      inProgressTasks: userTasks.filter(t => t.status === 'in_progress').length,
      totalEstimatedHours,
      totalActualHours,
      efficiency: totalEstimatedHours > 0 ? (totalEstimatedHours / (totalActualHours || 1)) * 100 : 0,
      averageRating: avgRating,
    };
  }

  async getSystemStats(): Promise<any> {
    const allUsers = await db.select().from(users);
    const allTasks = await db.select().from(tasks);
    const activeUsers = allUsers.filter(u => u.isActive);
    const completedTasks = allTasks.filter(t => t.status === 'completed');

    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: allTasks.filter(t => t.status === 'pending').length,
      inProgressTasks: allTasks.filter(t => t.status === 'in_progress').length,
    };
  }

  async getDepartmentStats(): Promise<any[]> {
    const allUsers = await db.select().from(users);
    const allTasks = await db.select().from(tasks);

    const departments = new Map<string, any>();
    
    allUsers.forEach(user => {
      if (!departments.has(user.department)) {
        departments.set(user.department, {
          department: user.department,
          employees: 0,
          tasks: 0,
          completedTasks: 0,
        });
      }
      const dept = departments.get(user.department)!;
      dept.employees += 1;
    });

    allTasks.forEach(task => {
      const user = allUsers.find(u => u.id === task.assignedTo);
      if (user) {
        const dept = departments.get(user.department);
        if (dept) {
          dept.tasks += 1;
          if (task.status === 'completed') {
            dept.completedTasks += 1;
          }
        }
      }
    });

    return Array.from(departments.values());
  }

  // Companies
  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async getCompany(id: string): Promise<(Company & { manager?: Omit<User, 'password'>, taskCount?: number }) | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    if (!company) return undefined;

    let manager = undefined;
    if (company.managerId) {
      const [managerUser] = await db.select(userPublicFields).from(users).where(eq(users.id, company.managerId));
      manager = managerUser;
    }

    const taskCountResult = await db
      .select({ count: count() })
      .from(tasks)
      .where(eq(tasks.companyId, id));
    const taskCount = taskCountResult[0]?.count || 0;

    return { ...company, manager, taskCount: Number(taskCount) };
  }

  async getAllCompanies(): Promise<(Company & { manager?: Omit<User, 'password'>, taskCount?: number })[]> {
    const allCompanies = await db.select().from(companies).orderBy(desc(companies.createdAt));
    
    const companiesWithDetails = await Promise.all(
      allCompanies.map(async (company) => {
        let manager = undefined;
        if (company.managerId) {
          const [managerUser] = await db.select(userPublicFields).from(users).where(eq(users.id, company.managerId));
          manager = managerUser;
        }

        const taskCountResult = await db
          .select({ count: count() })
          .from(tasks)
          .where(eq(tasks.companyId, company.id));
        const taskCount = taskCountResult[0]?.count || 0;

        return { ...company, manager, taskCount: Number(taskCount) };
      })
    );

    return companiesWithDetails;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company || undefined;
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await db.delete(companies).where(eq(companies.id, id));
    return result.rowCount! > 0;
  }

  async getCompanyTasks(companyId: string): Promise<Task[]> {
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
            role: true,
          },
        },
        createdFor: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true,
          },
        },
        assignedTo: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
            department: true,
            role: true,
          },
        },
      },
      orderBy: [desc(tasks.createdAt)],
    });

    return tasksData.map(task => ({
      ...task,
      createdByUser: task.createdBy,
      createdForUser: task.createdFor,
      assignedToUser: task.assignedTo,
    })) as any;
  }

  // Company Milestones
  async createCompanyMilestone(milestone: InsertCompanyMilestone): Promise<CompanyMilestone> {
    const [newMilestone] = await db.insert(companyMilestones).values(milestone).returning();
    return newMilestone;
  }

  async getCompanyMilestones(companyId: string): Promise<CompanyMilestone[]> {
    return await db
      .select()
      .from(companyMilestones)
      .where(eq(companyMilestones.companyId, companyId))
      .orderBy(companyMilestones.dueDate);
  }

  async updateCompanyMilestone(id: string, updates: Partial<CompanyMilestone>): Promise<CompanyMilestone | undefined> {
    const [milestone] = await db
      .update(companyMilestones)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companyMilestones.id, id))
      .returning();
    return milestone || undefined;
  }

  async deleteCompanyMilestone(id: string): Promise<boolean> {
    const result = await db.delete(companyMilestones).where(eq(companyMilestones.id, id));
    return result.rowCount! > 0;
  }

  // Company Files
  async createCompanyFile(file: InsertCompanyFile): Promise<CompanyFile> {
    const [newFile] = await db.insert(companyFiles).values(file).returning();
    return newFile;
  }

  async getCompanyFiles(companyId: string): Promise<(CompanyFile & { uploadedBy: Omit<User, 'password'> })[]> {
    const files = await db
      .select({
        file: companyFiles,
        uploadedBy: userPublicFields,
      })
      .from(companyFiles)
      .innerJoin(users, eq(companyFiles.uploadedBy, users.id))
      .where(eq(companyFiles.companyId, companyId))
      .orderBy(desc(companyFiles.createdAt));

    return files.map(({ file, uploadedBy }) => ({
      ...file,
      uploadedBy,
    }));
  }

  async deleteCompanyFile(id: string): Promise<boolean> {
    const result = await db.delete(companyFiles).where(eq(companyFiles.id, id));
    return result.rowCount! > 0;
  }

  // Company Reports
  async createCompanyReport(report: InsertCompanyReport): Promise<CompanyReport> {
    const [newReport] = await db.insert(companyReports).values(report).returning();
    return newReport;
  }

  async getCompanyReports(companyId: string): Promise<(CompanyReport & { uploadedBy: Omit<User, 'password'> })[]> {
    const reports = await db
      .select({
        report: companyReports,
        uploadedBy: userPublicFields,
      })
      .from(companyReports)
      .innerJoin(users, eq(companyReports.uploadedBy, users.id))
      .where(eq(companyReports.companyId, companyId))
      .orderBy(desc(companyReports.reportDate));

    return reports.map(({ report, uploadedBy }) => ({
      ...report,
      uploadedBy,
    }));
  }

  async updateCompanyReport(id: string, updates: Partial<CompanyReport>): Promise<CompanyReport | undefined> {
    const [report] = await db
      .update(companyReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companyReports.id, id))
      .returning();
    return report || undefined;
  }

  async deleteCompanyReport(id: string): Promise<boolean> {
    const result = await db.delete(companyReports).where(eq(companyReports.id, id));
    return result.rowCount! > 0;
  }

  // Company Comments
  async createCompanyComment(comment: InsertCompanyComment): Promise<CompanyComment> {
    const [newComment] = await db.insert(companyComments).values(comment).returning();
    return newComment;
  }

  async getCompanyComments(companyId: string): Promise<(CompanyComment & { user: Omit<User, 'password'> })[]> {
    const comments = await db
      .select({
        comment: companyComments,
        user: userPublicFields,
      })
      .from(companyComments)
      .innerJoin(users, eq(companyComments.userId, users.id))
      .where(eq(companyComments.companyId, companyId))
      .orderBy(desc(companyComments.createdAt));

    return comments.map(({ comment, user }) => ({
      ...comment,
      user,
    }));
  }

  async updateCompanyComment(id: string, content: string): Promise<CompanyComment | undefined> {
    const [comment] = await db
      .update(companyComments)
      .set({ content, updatedAt: new Date() })
      .where(eq(companyComments.id, id))
      .returning();
    return comment || undefined;
  }

  async deleteCompanyComment(id: string): Promise<boolean> {
    const result = await db.delete(companyComments).where(eq(companyComments.id, id));
    return result.rowCount! > 0;
  }

  // Company Team Members
  async addCompanyTeamMember(companyId: string, userId: string, role?: string): Promise<CompanyTeamMember> {
    const [member] = await db
      .insert(companyTeamMembers)
      .values({ companyId, userId, role })
      .returning();
    return member;
  }

  async getCompanyTeamMembers(companyId: string): Promise<(CompanyTeamMember & { user: Omit<User, 'password'> })[]> {
    const members = await db
      .select({
        member: companyTeamMembers,
        user: userPublicFields,
      })
      .from(companyTeamMembers)
      .innerJoin(users, eq(companyTeamMembers.userId, users.id))
      .where(eq(companyTeamMembers.companyId, companyId))
      .orderBy(companyTeamMembers.assignedAt);

    return members.map(({ member, user }) => ({
      ...member,
      user,
    }));
  }

  async removeCompanyTeamMember(companyId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(companyTeamMembers)
      .where(
        and(
          eq(companyTeamMembers.companyId, companyId),
          eq(companyTeamMembers.userId, userId)
        )
      );
    return result.rowCount! > 0;
  }

  // AI Model Settings
  async getAiModelSettings(modelType: string): Promise<AiModelSettings | undefined> {
    const [settings] = await db
      .select()
      .from(aiModelSettings)
      .where(eq(aiModelSettings.modelType, modelType as any));
    return settings || undefined;
  }

  async getAllAiModelSettings(): Promise<AiModelSettings[]> {
    return await db.select().from(aiModelSettings);
  }

  async createAiModelSettings(settings: InsertAiModelSettings): Promise<AiModelSettings> {
    const [newSettings] = await db
      .insert(aiModelSettings)
      .values(settings)
      .returning();
    return newSettings;
  }

  async updateAiModelSettings(modelType: string, updates: Partial<AiModelSettings>): Promise<AiModelSettings | undefined> {
    const [settings] = await db
      .update(aiModelSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiModelSettings.modelType, modelType as any))
      .returning();
    return settings || undefined;
  }

  async deleteAiModelSettings(modelType: string): Promise<boolean> {
    const result = await db
      .delete(aiModelSettings)
      .where(eq(aiModelSettings.modelType, modelType as any));
    return result.rowCount! > 0;
  }

  // AI Conversations
  async createAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const [newConversation] = await db
      .insert(aiConversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getAiConversation(id: string): Promise<AiConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.id, id));
    return conversation || undefined;
  }

  async getUserAiConversations(userId: string, modelType?: string): Promise<AiConversation[]> {
    if (modelType) {
      return await db
        .select()
        .from(aiConversations)
        .where(
          and(
            eq(aiConversations.userId, userId),
            eq(aiConversations.modelType, modelType as any)
          )
        )
        .orderBy(desc(aiConversations.updatedAt));
    }
    return await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.updatedAt));
  }

  async updateAiConversation(id: string, updates: Partial<AiConversation>): Promise<AiConversation | undefined> {
    const [conversation] = await db
      .update(aiConversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiConversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async deleteAiConversation(id: string): Promise<boolean> {
    const result = await db
      .delete(aiConversations)
      .where(eq(aiConversations.id, id));
    return result.rowCount! > 0;
  }

  // AI Messages
  async createAiMessage(message: InsertAiMessage): Promise<AiMessage> {
    const [newMessage] = await db
      .insert(aiMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getAiMessages(conversationId: string): Promise<AiMessage[]> {
    return await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(aiMessages.createdAt);
  }

  async deleteAiMessage(id: string): Promise<boolean> {
    const result = await db
      .delete(aiMessages)
      .where(eq(aiMessages.id, id));
    return result.rowCount! > 0;
  }

  // AI Usage Logs
  async createAiUsageLog(log: InsertAiUsageLog): Promise<AiUsageLog> {
    const [newLog] = await db
      .insert(aiUsageLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getUserAiUsageLogs(userId: string, startDate?: Date, endDate?: Date): Promise<AiUsageLog[]> {
    if (startDate && endDate) {
      return await db
        .select()
        .from(aiUsageLogs)
        .where(
          and(
            eq(aiUsageLogs.userId, userId),
            gte(aiUsageLogs.createdAt, startDate),
            lte(aiUsageLogs.createdAt, endDate)
          )
        )
        .orderBy(desc(aiUsageLogs.createdAt));
    }
    return await db
      .select()
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.userId, userId))
      .orderBy(desc(aiUsageLogs.createdAt));
  }

  async getAiUsageStats(modelType?: string): Promise<any> {
    const query = modelType
      ? db
          .select({
            totalTokens: sql<number>`sum(${aiUsageLogs.totalTokens})`,
            totalRequests: sql<number>`count(*)`,
            successfulRequests: sql<number>`sum(case when ${aiUsageLogs.success} then 1 else 0 end)`,
          })
          .from(aiUsageLogs)
          .where(eq(aiUsageLogs.modelType, modelType as any))
      : db
          .select({
            totalTokens: sql<number>`sum(${aiUsageLogs.totalTokens})`,
            totalRequests: sql<number>`count(*)`,
            successfulRequests: sql<number>`sum(case when ${aiUsageLogs.success} then 1 else 0 end)`,
          })
          .from(aiUsageLogs);

    const [stats] = await query;
    return stats || { totalTokens: 0, totalRequests: 0, successfulRequests: 0 };
  }
}

export const storage = new MemStorage();
