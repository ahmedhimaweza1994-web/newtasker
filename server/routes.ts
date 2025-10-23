import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { createGoogleMeetEvent, isGoogleCalendarConnected } from "./google-calendar-integration";
import { insertSuggestionSchema } from "@shared/schema";
import multer from 'multer';
import path from 'path';

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: multerStorage });

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "المصادقة مطلوبة" });
  }
  next();
}

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "غير مصرح لك بالوصول" });
    }
    next();
  };
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Task routes
  app.get("/api/tasks", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب المهام" });
    }
  });

  app.get("/api/tasks/my", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getUserTasks(req.user!.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب المهام" });
    }
  });

  app.get("/api/tasks/assigned", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getAssignedTasks(req.user!.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب المهام المعينة" });
    }
  });

  app.get("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب المهمة" });
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      if (!req.body.createdFor) {
        return res.status(400).json({ message: "يجب تحديد الموظف الذي تم إنشاء المهمة له" });
      }

      const taskData = {
        ...req.body,
        createdBy: req.user!.id,
        createdFor: req.body.createdFor,
        companyName: req.body.companyName || null,
        assignedTo: req.body.assignedTo || null,
        // Convert ISO string dates to Date objects for Drizzle
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      };
      const task = await storage.createTask(taskData);
      
      // Send notification to the user the task was created for
      if (task.createdFor && task.createdFor !== req.user!.id) {
        await storage.createNotification({
          userId: task.createdFor,
          title: "مهمة جديدة تم إنشاؤها لك",
          message: `تم إنشاء مهمة "${task.title}" لك`,
          type: "info",
          category: "task",
          metadata: {
            resourceId: task.id,
            taskId: task.id,
            userId: req.user!.id,
            userName: req.user!.fullName,
            userAvatar: req.user!.profilePicture || undefined
          }
        });
      }
      
      // Send notification if assigned to a reviewer (مراجع)
      if (task.assignedTo && task.assignedTo !== req.user!.id && task.assignedTo !== task.createdFor) {
        await storage.createNotification({
          userId: task.assignedTo,
          title: "مهمة جديدة معينة لك كمراجع",
          message: `تم تعيينك كمراجع لمهمة "${task.title}"`,
          type: "info",
          category: "task",
          metadata: {
            resourceId: task.id,
            taskId: task.id,
            userId: req.user!.id,
            userName: req.user!.fullName,
            userAvatar: req.user!.profilePicture || undefined
          }
        });
      }
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error instanceof Error ? error.message : error, error instanceof Error ? error.stack : "");
      res.status(500).json({ message: "حدث خطأ في إنشاء المهمة", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      // Get the existing task first
      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }
      // Prepare update data with date conversions
      const updateData = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      };


      // Check if trying to update status to 'completed'
      if (req.body.status === 'completed') {
        const isCreator = existingTask.createdBy === req.user!.id;
        const isAdminOrSubAdmin = req.user!.role === 'admin' || req.user!.role === 'sub-admin';

        if (isCreator || isAdminOrSubAdmin) {
          // Allow direct completion and set completedAt
          const task = await storage.updateTask(req.params.id, {
            ...updateData,
            completedAt: new Date()
          });
          res.json(task);
        } else {
          // Change status to 'under_review' instead
          const task = await storage.updateTask(req.params.id, {
            ...updateData,
            status: 'under_review'
          });

          // Notify the task creator
          if (existingTask.createdBy) {
            await storage.createNotification({
              userId: existingTask.createdBy,
              title: "مهمة جاهزة للمراجعة",
              message: `المهمة "${existingTask.title}" جاهزة للمراجعة`,
              type: "info",
              category: "task",
              metadata: {
                resourceId: req.params.id,
                taskId: req.params.id,
                userId: req.user!.id,
                userName: req.user!.fullName,
                userAvatar: req.user!.profilePicture || undefined
              }
            });
          }

          res.json(task);
        }
      } else {
        // Normal update for other status changes
        const task = await storage.updateTask(req.params.id, updateData);
        res.json(task);
      }
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في تحديث المهمة" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }
      // Check authorization
      if (task.createdBy !== req.user!.id && req.user!.role !== 'admin' && req.user!.role !== 'sub-admin') {
        return res.status(403).json({ message: "غير مصرح لك بحذف هذه المهمة" });
      }
      const success = await storage.deleteTask(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }
      res.json({ message: "تم حذف المهمة بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في حذف المهمة" });
    }
  });

  // Task comments/notes routes
  app.get("/api/tasks/:id/comments", requireAuth, async (req, res) => {
    try {
      const comments = await storage.getTaskNotes(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching task comments:", error);
      res.status(500).json({ message: "حدث خطأ في جلب التعليقات" });
    }
  });

  app.post("/api/tasks/:id/comments", requireAuth, async (req, res) => {
    try {
      const comment = await storage.createTaskNote(
        req.params.id,
        req.user!.id,
        req.body.content
      );
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating task comment:", error);
      res.status(500).json({ message: "حدث خطأ في إضافة التعليق" });
    }
  });


  // Task review and rating routes
  app.put("/api/tasks/:id/submit-review", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }
      
      if (task.assignedTo !== req.user!.id && task.createdBy !== req.user!.id) {
        return res.status(403).json({ message: "غير مصرح لك بتقديم هذه المهمة للمراجعة" });
      }
      
      const updatedTask = await storage.updateTask(req.params.id, { status: 'under_review' });
      
      if (task.createdBy && task.createdBy !== req.user!.id) {
        await storage.createNotification({
          userId: task.createdBy,
          title: "مهمة جاهزة للمراجعة",
          message: `المهمة "${task.title}" جاهزة للمراجعة`,
          type: "info",
          category: "task",
          metadata: {
            resourceId: req.params.id,
            taskId: req.params.id,
            userId: req.user!.id,
            userName: req.user!.fullName,
            userAvatar: req.user!.profilePicture || undefined
          }
        });
      }
      
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في تقديم المهمة للمراجعة" });
    }
  });

  app.put("/api/tasks/:id/approve-review", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const task = await storage.approveTaskReview(req.params.id, req.user!.id);
      if (!task) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }
      
      if (task.assignedTo) {
        await storage.createNotification({
          userId: task.assignedTo,
          title: "تمت الموافقة على المهمة",
          message: `تمت الموافقة على مهمتك "${task.title}" وتم إكمالها بنجاح`,
          type: "success",
          category: "task",
          metadata: {
            resourceId: req.params.id,
            taskId: req.params.id,
            userId: req.user!.id,
            userName: req.user!.fullName,
            userAvatar: req.user!.profilePicture || undefined
          }
        });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في الموافقة على المهمة" });
    }
  });

  app.put("/api/tasks/:id/rate", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const { rating } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "يجب أن يكون التقييم بين 1 و 5" });
      }
      
      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }
      
      if (existingTask.performanceRating) {
        return res.status(400).json({ message: "تم تقييم هذه المهمة مسبقاً" });
      }
      
      const task = await storage.rateTask(req.params.id, rating, req.user!.id);
      
      if (task.assignedTo) {
        await storage.createNotification({
          userId: task.assignedTo,
          title: "تم تقييم مهمتك",
          message: `تم تقييم مهمتك "${task.title}" بـ ${rating} نقاط`,
          type: "info",
          category: "task",
          metadata: {
            resourceId: req.params.id,
            taskId: req.params.id,
            userId: req.user!.id,
            userName: req.user!.fullName,
            userAvatar: req.user!.profilePicture || undefined
          }
        });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في تقييم المهمة" });
    }
  });

  app.put("/api/tasks/:id/assign-points", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const { rewardPoints } = req.body;
      
      if (rewardPoints === undefined || rewardPoints === null || typeof rewardPoints !== 'number' || rewardPoints < 0) {
        return res.status(400).json({ message: "يجب تحديد نقاط مكافأة صحيحة" });
      }

      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }

      const task = await storage.updateTask(req.params.id, { rewardPoints });

      if (task.assignedTo) {
        const assignedUser = await storage.getUser(task.assignedTo);
        if (assignedUser) {
          const newTotalPoints = (assignedUser.totalPoints || 0) + rewardPoints;
          await storage.updateUser(task.assignedTo, { totalPoints: newTotalPoints });

          await storage.createNotification({
            userId: task.assignedTo,
            title: "نقاط مكافأة جديدة",
            message: `تم منحك ${rewardPoints} نقطة مكافأة للمهمة "${task.title}"`,
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
      res.status(500).json({ message: "حدث خطأ في تعيين نقاط المكافأة" });
    }
  });

  // AUX Session routes
  app.post("/api/aux/start", requireAuth, async (req, res) => {
    try {
      const session = await storage.startAuxSession({
        userId: req.user!.id,
        status: req.body.status,
        notes: req.body.notes,
      });
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في بدء الجلسة" });
    }
  });

  app.post("/api/aux/end/:id", requireAuth, async (req, res) => {
    try {
      const session = await storage.endAuxSession(req.params.id, req.body.notes);
      if (!session) {
        return res.status(404).json({ message: "الجلسة غير موجودة" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في إنهاء الجلسة" });
    }
  });

  app.get("/api/aux/current", requireAuth, async (req, res) => {
    try {
      const session = await storage.getCurrentAuxSession(req.user!.id);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب الجلسة الحالية" });
    }
  });

  app.get("/api/aux/sessions", requireAuth, async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const sessions = await storage.getUserAuxSessions(req.user!.id, startDate, endDate);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب الجلسات" });
    }
  });

  // Admin routes
  app.get("/api/admin/employees", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const employees = await storage.getAllActiveAuxSessions();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب بيانات الموظفين" });
    }
  });

  app.get("/api/admin/stats", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب الإحصائيات" });
    }
  });

  // Users routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
        jobTitle: user.jobTitle,
        role: user.role,
        isActive: user.isActive,
        profilePicture: user.profilePicture,
        totalPoints: user.totalPoints, // إضافة totalPoints
      })));
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب المستخدمين" });
    }
  });

  app.post("/api/admin/employees", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(req.body.password || 'Employee@123', { saltRounds: 10 });
      
      const newEmployee = await storage.createUser({
        email: req.body.email,
        password: hashedPassword,
        fullName: req.body.fullName,
        department: req.body.department,
        jobTitle: req.body.jobTitle,
        role: req.body.role || 'employee',
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        salary: req.body.salary || 0,
        hireDate: req.body.hireDate || new Date(),
        isActive: true,
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
      res.status(500).json({ message: "حدث خطأ في إضافة الموظف" });
    }
  });

  app.put("/api/admin/employees/:id", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const updates: any = {
        fullName: req.body.fullName,
        department: req.body.department,
        jobTitle: req.body.jobTitle,
        role: req.body.role, // إضافة role
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        salary: req.body.salary,
        isActive: req.body.isActive,
      };
      
      const updatedEmployee = await storage.updateUser(req.params.id, updates);
      if (!updatedEmployee) {
        return res.status(404).json({ message: "الموظف غير موجود" });
      }
      
      res.json(updatedEmployee);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في تحديث بيانات الموظف" });
    }
  });

  app.delete("/api/admin/employees/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      // Prevent deleting yourself
      if (req.params.id === req.user!.id) {
        return res.status(400).json({ message: "لا يمكنك حذف حسابك الخاص" });
      }

      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      res.json({ message: "تم حذف المستخدم بنجاح" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "حدث خطأ في حذف المستخدم" });
    }
  });

  // Profile routes
  app.get("/api/profile/:id", requireAuth, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const user = users.find(u => u.id === req.params.id);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
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
        totalPoints: user.totalPoints, // إضافة totalPoints
      });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب الملف الشخصي" });
    }
  });

  app.put("/api/profile", requireAuth, upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const updates: any = {
        fullName: req.body.fullName,
        department: req.body.department,
        jobTitle: req.body.jobTitle,
        bio: req.body.bio,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        dateOfBirth: req.body.dateOfBirth,
        hireDate: req.body.hireDate,
      };

      // Handle file uploads
      if (req.files && req.files['profilePicture']) {
        const file = req.files['profilePicture'][0];
        updates.profilePicture = `/uploads/${file.filename}`;
      }
      if (req.files && req.files['coverImage']) {
        const file = req.files['coverImage'][0];
        updates.coverImage = `/uploads/${file.filename}`;
      }

      const updatedUser = await storage.updateUser(req.user!.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "حدث خطأ في تحديث الملف الشخصي" });
    }
  });

  // Leave requests routes
  app.post("/api/leaves", requireAuth, async (req, res) => {
    try {
      // Parse dates from YYYY-MM-DD format
      const startDateStr = req.body.startDate;
      const endDateStr = req.body.endDate;
      
      if (!startDateStr || !endDateStr) {
        return res.status(400).json({ message: "يرجى تحديد تاريخ البداية والنهاية" });
      }
      
      // Create dates at midnight local time
      const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
      
      const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0);
      const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "تواريخ غير صالحة" });
      }
      
      if (startDate > endDate) {
        return res.status(400).json({ message: "تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية" });
      }
      
      // Calculate inclusive day count (at least 1)
      const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));



















      
      // Explicitly construct payload with whitelisted fields only
      const leaveRequest = await storage.createLeaveRequest({
        userId: req.user!.id,
        type: req.body.type,
        startDate: startDate,
        endDate: endDate,
        days,
        reason: req.body.reason || '',
      });
      
      // Notify admins
      const admins = await storage.getUsers();
      const adminUsers = admins.filter(u => u.role === 'admin' || u.role === 'sub-admin');
      
      for (const admin of adminUsers) {
        const notification = await storage.createNotification({
          userId: admin.id,
          title: "طلب إجازة جديد",
          message: `${req.user!.fullName} قدم طلب إجازة جديد`,
          type: "info",
          category: "system",
          metadata: {
            userId: req.user!.id,
            userName: req.user!.fullName
          }
        });
        
        // Send notification via WebSocket to specific user
        sendToUser(notification.userId, {
          type: 'new_notification',
          data: notification
        });
      }
      
      res.status(201).json(leaveRequest);
    } catch (error) {
      console.error('Error creating leave request:', error);
      res.status(500).json({ message: "حدث خطأ في تقديم طلب الإجازة" });
    }
  });

  app.get("/api/leaves/my", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getUserLeaveRequests(req.user!.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب طلبات الإجازات" });
    }
  });

  app.get("/api/leaves/pending", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const requests = await storage.getPendingLeaveRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب طلبات الإجازات" });
    }
  });

  app.put("/api/leaves/:id", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const updates = {
        ...req.body,
        approvedBy: req.user!.id,
        approvedAt: new Date(),
      };
      
      const leaveRequest = await storage.updateLeaveRequest(req.params.id, updates);
      if (!leaveRequest) {
        return res.status(404).json({ message: "طلب الإجازة غير موجود" });
      }
      
      // Notify employee
      const statusText = leaveRequest.status === 'approved' ? 'تمت الموافقة على' : 'تم رفض';
      const notification = await storage.createNotification({
        userId: leaveRequest.userId,
        title: "تحديث طلب الإجازة",
        message: `${statusText} طلب الإجازة الخاص بك`,
        type: leaveRequest.status === 'approved' ? 'success' : 'error',
        category: "system",
        metadata: {
          userId: req.user!.id,
          userName: req.user!.fullName
        }
      });
      
      // Send notification via WebSocket to specific user
        sendToUser(notification.userId, {
          type: 'new_notification',
          data: notification
        });
      
      res.json(leaveRequest);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في تحديث طلب الإجازة" });
    }
  });

  // Salary Advance Request routes
  app.post("/api/salary-advances", requireAuth, async (req, res) => {
    try {
      const advanceRequest = await storage.createSalaryAdvanceRequest({
        userId: req.user!.id,
        amount: req.body.amount,
        reason: req.body.reason,
        repaymentDate: req.body.repaymentDate ? new Date(req.body.repaymentDate) : null,
      });
      
      res.status(201).json(advanceRequest);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في إنشاء طلب السلفة" });
    }
  });

  app.get("/api/salary-advances/pending", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const requests = await storage.getPendingSalaryAdvanceRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب طلبات السلف" });
    }
  });

  app.get("/api/salary-advances/user", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getUserSalaryAdvanceRequests(req.user!.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب طلبات السلف" });
    }
  });

  app.put("/api/salary-advances/:id", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const updates = {
        ...req.body,
        approvedBy: req.user!.id,
        approvedAt: new Date(),
      };
      
      const advanceRequest = await storage.updateSalaryAdvanceRequest(req.params.id, updates);
      if (!advanceRequest) {
        return res.status(404).json({ message: "طلب السلفة غير موجود" });
      }
      
      // Notify employee
      const statusText = advanceRequest.status === 'approved' ? 'تمت الموافقة على' : 'تم رفض';
      await storage.createNotification({
        userId: advanceRequest.userId,
        title: "تحديث طلب السلفة",
        message: `${statusText} طلب السلفة الخاص بك`,
        type: advanceRequest.status === 'approved' ? 'success' : 'error',
        category: "system",
        metadata: {
          resourceId: req.params.id,
          userId: req.user!.id,
          userName: req.user!.fullName
        }
      });
      
      res.json(advanceRequest);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في تحديث طلب السلفة" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب الإشعارات" });
    }
  });

  app.put("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "تم تحديث الإشعار" });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في تحديث الإشعار" });
    }
  });

  app.put("/api/notifications/batch-read", requireAuth, async (req, res) => {
    try {
      const { notificationIds } = req.body;
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({ message: "معرفات الإشعارات غير صالحة" });
      }
      
      await Promise.all(
        notificationIds.map(id => storage.markNotificationAsRead(id))
      );
      res.json({ message: "تم تحديث الإشعارات" });
    } catch (error) {
      console.error("Error batch marking notifications as read:", error);
      res.status(500).json({ message: "حدث خطأ في تحديث الإشعارات" });
    }
  });

  app.put("/api/notifications/mark-by-resource", requireAuth, async (req, res) => {
    try {
      const { resourceId, category } = req.body;
      await storage.markNotificationsByResourceAsRead(req.user!.id, resourceId, category);
      res.json({ message: "تم تحديث الإشعارات" });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ message: "حدث خطأ في تحديث الإشعارات" });
    }
  });

  app.put("/api/chat/rooms/:roomId/last-read", requireAuth, async (req, res) => {
    try {
      const { messageId } = req.body;
      await storage.updateLastReadMessage(req.params.roomId, req.user!.id, messageId);
      await storage.markNotificationsByResourceAsRead(req.user!.id, req.params.roomId, 'message');
      res.json({ message: "تم تحديث آخر رسالة مقروءة" });
    } catch (error) {
      console.error("Error updating last read message:", error);
      res.status(500).json({ message: "حدث خطأ في تحديث آخر رسالة مقروءة" });
    }
  });

  app.get("/api/chat/rooms/:roomId/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadMessageCount(req.params.roomId, req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ message: "حدث خطأ في جلب عدد الرسائل غير المقروءة" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/productivity", requireAuth, async (req, res) => {
    try {
      const startDate = new Date(req.query.startDate as string || Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(req.query.endDate as string || Date.now());
      const stats = await storage.getUserProductivityStats(req.user!.id, startDate, endDate);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب إحصائيات الإنتاجية" });
    }
  });

  app.get("/api/analytics/departments", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const stats = await storage.getDepartmentStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب إحصائيات الأقسام" });
    }
  });

  // HR Routes
  app.get("/api/hr/stats", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const users = await storage.getUsers();
      const activeEmployees = await storage.getAllActiveAuxSessions();
      const pendingLeaves = await storage.getPendingLeaveRequests();
      const allLeaves = await storage.getAllLeaveRequests();
      
      const totalEmployees = users.filter(u => u.isActive).length;
      const presentToday = activeEmployees.filter(e => e.status === 'working_on_project' || e.status === 'ready').length;
      const onLeave = allLeaves.filter(l => 
        l.status === 'approved' && 
        new Date(l.startDate) <= new Date() && 
        new Date(l.endDate) >= new Date()
      ).length;
      const pendingRequests = pendingLeaves.length;
      
      res.json({
        totalEmployees,
        presentToday,
        onLeave,
        pendingRequests,
      });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب إحصائيات الموارد البشرية" });
    }
  });

  app.get("/api/hr/payroll", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const users = await storage.getUsers();
      const activeUsers = users.filter(u => u.isActive);
      
      const payrollData = activeUsers.map(user => ({
        id: user.id,
        employee: user.fullName,
        department: user.department || 'غير محدد',
        baseSalary: user.salary || 0,
        overtime: 0,
        deductions: 0,
        netSalary: user.salary || 0,
      }));
      
      res.json(payrollData);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب بيانات الرواتب" });
    }
  });

  app.get("/api/hr/reports", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      const users = await storage.getUsers();
      const activeUsers = users.filter(u => u.isActive);
      const allSessions = await storage.getAllAuxSessions();
      const allLeaves = await storage.getAllLeaveRequests();
      
      // Calculate attendance stats
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      const recentSessions = allSessions.filter(s => new Date(s.startTime) >= last30Days && s.endTime);
      
      const totalWorkMinutes = recentSessions.reduce((sum, session) => {
        if (session.duration) {
          return sum + session.duration;
        }
        return sum;
      }, 0);
      
      const avgWorkHoursPerDay = totalWorkMinutes / (30 * 60);
      const attendanceRate = recentSessions.length > 0 ? 
        ((recentSessions.filter(s => s.status === 'working_on_project').length / recentSessions.length) * 100) : 0;
      
      const usedLeaveDays = allLeaves.filter(l => l.status === 'approved').reduce((sum, leave) => sum + leave.days, 0);
      
      // Department distribution
      const deptCounts: Record<string, number> = {};
      activeUsers.forEach(user => {
        const dept = user.department || 'غير محدد';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      
      const departmentDistribution = Object.entries(deptCounts).map(([dept, count]) => ({
        dept,
        count,
        percentage: (count / activeUsers.length) * 100,
      }));
      
      res.json({
        attendanceRate: Math.round(attendanceRate),
        avgWorkHoursPerDay: avgWorkHoursPerDay.toFixed(1),
        usedLeaveDays,
        departmentDistribution,
      });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب تقارير الموارد البشرية" });
    }
  });

  const httpServer = createServer(app);

  // Socket.IO server for real-time updates
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: '/socket.io/'
  });

  // Map to track userId -> Set of WebSocket clients
  const userConnections = new Map<string, Set<any>>();

  // Helper function to send message to specific user
  function sendToUser(userId: string, message: any) {
    const connections = userConnections.get(userId);
    if (connections) {
      connections.forEach((socket) => {
        socket.emit('message', message);
      });
    }
  }

  // Helper function to send message to all members of a chat room
  async function sendToRoomMembers(roomId: string, message: any, excludeUserId?: string) {
    try {
      const members = await storage.getChatRoomMembers(roomId);
      members.forEach((member) => {
        if (!excludeUserId || member.id !== excludeUserId) {
          sendToUser(member.id, message);
        }
      });
    } catch (error) {
      console.error('Error sending to room members:', error);
    }
  }


  io.on('connection', (socket: any) => {
    console.log('Socket.IO client connected:', socket.id);

    socket.on('subscribe', (data: any) => {
      try {
        if (data.userId) {
          socket.userId = data.userId;
          if (!userConnections.has(data.userId)) {
            userConnections.set(data.userId, new Set());
          }
          userConnections.get(data.userId)!.add(socket);
          console.log(`User ${data.userId} subscribed, total connections: ${userConnections.get(data.userId)!.size}`);
        }
      } catch (error) {
        console.error('Subscribe error:', error);
      }
    });

    socket.on('aux_update', (data: any) => {
      try {
        io.emit('aux_status_update', data.payload);
      } catch (error) {
        console.error('AUX update error:', error);
      }
    });

    socket.on('call_offer', (data: any) => {
      try {
        const recipientId = data.to || data.receiverId;
        if (recipientId) {
          sendToUser(recipientId, { type: 'call_offer', ...data });
        } else {
          console.warn('Call offer missing recipient information');
        }
      } catch (error) {
        console.error('Call offer error:', error);
      }
    });

    socket.on('call_answer', (data: any) => {
      try {
        const recipientId = data.to || data.receiverId;
        if (recipientId) {
          sendToUser(recipientId, { type: 'call_answer', ...data });
        } else {
          console.warn('Call answer missing recipient information');
        }
      } catch (error) {
        console.error('Call answer error:', error);
      }
    });

    socket.on('ice_candidate', (data: any) => {
      try {
        const recipientId = data.to || data.receiverId;
        if (recipientId) {
          sendToUser(recipientId, { type: 'ice_candidate', ...data });
        } else {
          console.warn('ICE candidate missing recipient information');
        }
      } catch (error) {
        console.error('ICE candidate error:', error);
      }
    });

    socket.on('call_end', (data: any) => {
      try {
        const recipientId = data.to || data.receiverId;
        if (recipientId) {
          sendToUser(recipientId, { type: 'call_end', ...data });
        } else {
          console.warn('Call end missing recipient information');
        }
      } catch (error) {
        console.error('Call end error:', error);
      }
    });

    socket.on('call_decline', (data: any) => {
      try {
        const recipientId = data.to || data.receiverId;
        if (recipientId) {
          sendToUser(recipientId, { type: 'call_decline', ...data });
        } else {
          console.warn('Call decline missing recipient information');
        }
      } catch (error) {
        console.error('Call decline error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO client disconnected:', socket.id);
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


  // Call routes
  app.post("/api/calls/start", requireAuth, async (req, res) => {
    try {
      const { roomId, receiverId, callType } = req.body;
      
      const callLog = await storage.createCallLog({
        roomId,
        callerId: req.user!.id,
        receiverId,
        callType: callType || 'audio',
        status: 'initiated',
      });

      // Create notification for the receiver
      const notification = await storage.createNotification({
        userId: receiverId,
        title: `${callType === 'video' ? 'مكالمة فيديو' : 'مكالمة صوتية'} واردة`,
        message: `${req.user!.fullName} يتصل بك`,
        type: "info",
        category: "call",
        metadata: {
          resourceId: callLog.id,
          callId: callLog.id,
          callType: callType || 'audio',
          userId: req.user!.id,
          userName: req.user!.fullName,
          userAvatar: req.user!.profilePicture || undefined
        }
      });

      // Send notification via WebSocket to the receiver
      sendToUser(receiverId, {
        type: 'new_notification',
        data: notification
      });

      res.json(callLog);
    } catch (error) {
      console.error("Error starting call:", error);
      res.status(500).json({ message: "حدث خطأ في بدء المكالمة" });
    }
  });

  app.patch("/api/calls/:id/status", requireAuth, async (req, res) => {
    try {
      const { status, duration } = req.body;
      const updates: any = { status };
      
      if (status === 'ended' && duration !== undefined) {
        updates.duration = duration;
        updates.endedAt = new Date();
      }

      const callLog = await storage.updateCallLog(req.params.id, updates);
      if (!callLog) {
        return res.status(404).json({ message: "سجل المكالمة غير موجود" });
      }

      res.json(callLog);
    } catch (error) {
      console.error("Error updating call status:", error);
      res.status(500).json({ message: "حدث خطأ في تحديث حالة المكالمة" });
    }
  });

  app.get("/api/calls/history", requireAuth, async (req, res) => {
    try {
      const callLogs = await storage.getUserCallLogs(req.user!.id);
      res.json(callLogs);
    } catch (error) {
      console.error("Error fetching call history:", error);
      res.status(500).json({ message: "حدث خطأ في جلب سجل المكالمات" });
    }
  });

  app.get("/api/calls/room/:roomId", requireAuth, async (req, res) => {
    try {
      const callLogs = await storage.getRoomCallLogs(req.params.roomId);
      res.json(callLogs);
    } catch (error) {
      console.error("Error fetching room call logs:", error);
      res.status(500).json({ message: "حدث خطأ في جلب سجل مكالمات الغرفة" });
    }
  });
  // Chat Rooms Routes
  app.post("/api/chat/rooms", requireAuth, async (req, res) => {
    try {
      let imageUrl = undefined;
      
      // Handle base64 image upload
      if (req.body.image && req.body.image.startsWith('data:image/')) {
        try {
          const base64Data = req.body.image.split(',')[1];
          const imageBuffer = Buffer.from(base64Data, 'base64');
          const extension = req.body.image.split(';')[0].split('/')[1];
          const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + extension;
          const fs = await import('fs/promises');
          await fs.writeFile(`uploads/${filename}`, imageBuffer);
          imageUrl = `/uploads/${filename}`;
        } catch (imgError) {
          console.error("Error saving room image:", imgError);
        }
      }
      
      const room = await storage.createChatRoom({
        name: req.body.name,
        type: req.body.type || 'group',
        createdBy: req.user!.id,
        image: imageUrl,
      });
      
      if (req.body.memberIds && Array.isArray(req.body.memberIds)) {
        for (const memberId of req.body.memberIds) {
          await storage.addChatRoomMember(room.id, memberId);
        }
      }
      
      await storage.addChatRoomMember(room.id, req.user!.id);
      
      res.status(201).json(room);
    } catch (error) {
      console.error("Error creating chat room:", error);
      res.status(500).json({ message: "حدث خطأ في إنشاء غرفة الدردشة" });
    }
  });

  app.post("/api/chat/private", requireAuth, async (req, res) => {
    try {
      const { otherUserId } = req.body;
      const room = await storage.getOrCreatePrivateChat(req.user!.id, otherUserId);
      res.json(room);
    } catch (error) {
      console.error("Error creating private chat:", error);
      res.status(500).json({ message: "حدث خطأ في إنشاء الدردشة الخاصة" });
    }
  });

  app.get("/api/chat/rooms", requireAuth, async (req, res) => {
    try {
      await storage.ensureUserInCommonRoom(req.user!.id);
      const rooms = await storage.getUserChatRooms(req.user!.id);
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب غرف الدردشة" });
    }
  });

  app.get("/api/chat/rooms/:id", requireAuth, async (req, res) => {
    try {
      const room = await storage.getChatRoom(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "غرفة الدردشة غير موجودة" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب غرفة الدردشة" });
    }
  });

  app.get("/api/chat/unread-counts", requireAuth, async (req, res) => {
    try {
      const rooms = await storage.getUserChatRooms(req.user!.id);
      const unreadCounts: Record<string, number> = {};
      
      for (const room of rooms) {
        const count = await storage.getUnreadMessageCount(room.id, req.user!.id);
        unreadCounts[room.id] = count;
      }
      
      res.json(unreadCounts);
    } catch (error) {
      console.error("Error getting unread counts:", error);
      res.status(500).json({ message: "حدث خطأ في جلب عدد الرسائل غير المقروءة" });
    }
  });
  app.put("/api/chat/rooms/:id/image", requireAuth, async (req, res) => {
    try {
      const room = await storage.updateChatRoomImage(req.params.id, req.body.image);
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في تحديث صورة الغرفة" });
    }
  });


  // Chat Messages Routes
  app.post("/api/chat/messages", requireAuth, async (req, res) => {
    try {
      const message = await storage.createChatMessage({
        roomId: req.body.roomId,
        senderId: req.user!.id,
        content: req.body.content,
        messageType: req.body.messageType || 'text',
        attachments: req.body.attachments,
        replyTo: req.body.replyTo,
      });
      
      // Create notifications for room members
      const room = await storage.getChatRoom(req.body.roomId);
      const roomMembers = await storage.getChatRoomMembers(req.body.roomId);
      
      for (const member of roomMembers) {
        if (member.id !== req.user!.id) {
          const notification = await storage.createNotification({
            userId: member.id,
            title: room?.name || 'رسالة جديدة',
            message: `${req.user!.fullName}: ${req.body.content || 'أرسل رسالة'}`,
            type: 'info',
            category: 'message',
            metadata: {
              resourceId: req.body.roomId,
              roomId: req.body.roomId,
              messageId: message.id,
              userId: req.user!.id,
              userName: req.user!.fullName,
              userAvatar: req.user!.profilePicture || undefined
            }
          });
          
          // Send notification to specific user
          sendToUser(member.id, {
            type: 'new_notification',
            data: notification
          });
        }
      }
      
      // Send message to room members only
      sendToRoomMembers(message.roomId, {
        type: 'new_message',
        data: message
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "حدث خطأ في إرسال الرسالة" });
    }
  });

  app.get("/api/chat/messages/:roomId", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getChatMessages(req.params.roomId, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب الرسائل" });
    }
  });

  app.put("/api/chat/messages/:id", requireAuth, async (req, res) => {
    try {
      const message = await storage.updateChatMessage(req.params.id, req.body.content);
      if (!message) {
        return res.status(404).json({ message: "الرسالة غير موجودة" });
      }
      
      // Send update to room members
      const updatedMsgRoom = await storage.getChatRoom(message.roomId);
      if (updatedMsgRoom) {
        sendToRoomMembers(message.roomId, {
          type: 'message_updated',
          data: message
        });
      }
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في تحديث الرسالة" });
    }
  });

  app.delete("/api/chat/messages/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteChatMessage(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "الرسالة غير موجودة" });
      }
      
      io.emit('message_deleted', { messageId: req.params.id });
      
      res.json({ message: "تم حذف الرسالة بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في حذف الرسالة" });
    }
  });

  app.put("/api/chat/rooms/:roomId/mark-read", requireAuth, async (req, res) => {
    try {
      const { messageId } = req.body;
      await storage.updateLastReadMessage(req.params.roomId, req.user!.id, messageId);
      
      // Mark all message notifications for this room as read
      const userNotifications = await storage.getUserNotifications(req.user!.id);
      const roomNotificationsToMark = userNotifications
        .filter(n => {
          if (n.isRead || n.category !== 'message') {
            return false;
          }
          // Type guard: now we know n.category === 'message', so metadata has roomId
          const metadata = n.metadata as { roomId?: string; resourceId?: string; messageId?: string };
          return metadata && metadata.roomId === req.params.roomId;
        })
        .map(n => n.id);
      
      if (roomNotificationsToMark.length > 0) {
        await storage.markMultipleNotificationsAsRead(roomNotificationsToMark);
      }
      
      res.json({ message: "تم تحديث حالة القراءة" });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "حدث خطأ في تحديث حالة القراءة" });
    }
  });

  // Message Reactions Routes
  app.post("/api/chat/reactions", requireAuth, async (req, res) => {
    try {
      const reaction = await storage.addMessageReaction(
        req.body.messageId,
        req.user!.id,
        req.body.emoji
      );
      
      // Send reaction to room members
      const reactionMsg = await storage.getChatMessage(req.body.messageId);
      if (reactionMsg) {
        sendToRoomMembers(reactionMsg.roomId, {
          type: 'reaction_added',
          data: reaction
        });
      }
      
      res.status(201).json(reaction);
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ message: "حدث خطأ في إضافة التفاعل" });
    }
  });

  app.delete("/api/chat/reactions", requireAuth, async (req, res) => {
    try {
      await storage.removeMessageReaction(
        req.body.messageId,
        req.user!.id,
        req.body.emoji
      );
      
      io.emit('reaction_removed', { messageId: req.body.messageId, userId: req.user!.id, emoji: req.body.emoji });
      
      res.json({ message: "تم إزالة التفاعل بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في إزالة التفاعل" });
    }
  });

  // Google Calendar Routes (VPS-Compatible OAuth2)
  app.get("/api/google-calendar/auth-url", requireAuth, async (req, res) => {
    try {
      const { getGoogleAuthUrl } = await import("./google-calendar-integration");
      const authUrl = getGoogleAuthUrl();
      if (!authUrl) {
        return res.status(400).json({ 
          message: "يرجى تكوين بيانات اعتماد Google OAuth2 أولاً. راجع التعليمات في server/google-calendar-integration.ts" 
        });
      }
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ message: "فشل في إنشاء رابط التفويض" });
    }
  });

  app.get("/api/google-calendar/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== 'string') {
        return res.status(400).send('Missing authorization code');
      }
      
      const { handleGoogleCallback } = await import("./google-calendar-integration");
      await handleGoogleCallback(code);
      
      // Redirect to dashboard or settings page
      res.redirect('/dashboard?google-calendar=connected');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/dashboard?google-calendar=error');
    }
  });

  app.get("/api/google-calendar/status", requireAuth, async (req, res) => {
    try {
      const connected = await isGoogleCalendarConnected();
      res.json({ connected });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  app.post("/api/google-calendar/schedule-meeting", requireAuth, async (req, res) => {
    try {
      const { title, participantIds, startTime, endTime, meetingLink } = req.body;
      
      // Validation
      if (!title || !participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ message: "العنوان والمشاركين مطلوبان" });
      }
      
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "تواريخ غير صالحة" });
      }
      
      if (start >= end) {
        return res.status(400).json({ message: "وقت البدء يجب أن يكون قبل وقت النهاية" });
      }
      
      // Allow users to provide their own meeting link instead of relying on Google Calendar
      const finalMeetingLink = meetingLink || `https://meet.example.com/${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const meeting = await storage.createMeeting({
        title,
        description: `اجتماع مع ${participantIds.length} مشارك`,
        meetingLink: finalMeetingLink,
        scheduledBy: req.user!.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      });
      
      const allParticipantIds = [...participantIds, req.user!.id];
      
      for (const participantId of participantIds) {
        await storage.addMeetingParticipant(meeting.id, participantId);
      }
      await storage.addMeetingParticipant(meeting.id, req.user!.id);
      
      let chatRoom;
      if (participantIds.length === 1) {
        chatRoom = await storage.getOrCreatePrivateChat(req.user!.id, participantIds[0]);
      } else {
        chatRoom = await storage.createChatRoom({
          name: title,
          type: "group",
          createdBy: req.user!.id,
        });
        
        for (const participantId of allParticipantIds) {
          await storage.addChatRoomMember(chatRoom.id, participantId);
        }
      }
      
      const message = await storage.createChatMessage({
        roomId: chatRoom.id,
        senderId: req.user!.id,
        content: `🎥 ${title}\n\nانضم للاجتماع: ${finalMeetingLink}`,
        messageType: "meeting_link",
        attachments: [{
          name: title,
          url: finalMeetingLink,
          type: "meeting"
        }],
      });
      
      // Create notifications for room members
      const room = await storage.getChatRoom(req.body.roomId);
      const roomMembers = await storage.getChatRoomMembers(req.body.roomId);
      
      for (const member of roomMembers) {
        if (member.id !== req.user!.id) {
          const notification = await storage.createNotification({
            userId: member.id,
            title: room?.name || 'رسالة جديدة',
            message: `${req.user!.fullName}: ${req.body.content || 'أرسل رسالة'}`,
            type: 'info',
            category: 'message',
            metadata: {
              resourceId: req.body.roomId,
              roomId: req.body.roomId,
              messageId: message.id,
              userId: req.user!.id,
              userName: req.user!.fullName,
              userAvatar: req.user!.profilePicture || undefined
            }
          });
          
          // Send notification to specific user
          sendToUser(member.id, {
            type: 'new_notification',
            data: notification
          });
        }
      }
      
      for (const participantId of participantIds) {
        const notification = await storage.createNotification({
          userId: participantId,
          title: "اجتماع جديد",
          message: `${req.user!.fullName} قام بجدولة اجتماع: ${title}`,
          type: "info",
          category: "system",
          metadata: {
            userId: req.user!.id,
            userName: req.user!.fullName
          }
        });
        
        io.emit('new_notification', notification);
      }
      
      io.emit('new_message', message);
      io.emit('new_meeting', meeting);
      
      res.status(201).json({ ...meeting, chatRoomId: chatRoom.id });
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      res.status(500).json({ message: "حدث خطأ في جدولة الاجتماع" });
    }
  });

  // Meeting scheduling route (legacy endpoint for sidebar)
  app.post("/api/meetings/schedule", requireAuth, async (req, res) => {
    try {
      const { title, participantIds } = req.body;
      
      if (!title || !participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ message: "العنوان والمشاركين مطلوبان" });
      }
      
      const meetingLink = `https://meet.example.com/${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const meeting = await storage.createMeeting({
        title,
        description: `اجتماع مع ${participantIds.length} مشارك`,
        meetingLink,
        scheduledBy: req.user!.id,
        startTime: new Date(),
        endTime: null,
      });
      
      for (const participantId of participantIds) {
        await storage.addMeetingParticipant(meeting.id, participantId);
        const privateRoom = await storage.getOrCreatePrivateChat(req.user!.id, participantId);
        await storage.createChatMessage({
          roomId: privateRoom.id,
          senderId: req.user!.id,
          content: `🎥 ${title}\n\nانضم للاجتماع: ${meetingLink}`,
          messageType: "meeting_link",
          attachments: [{ name: title, url: meetingLink, type: "meeting" }],
        });
        await storage.createNotification(participantId, "اجتماع جديد", `${req.user!.fullName} قام بجدولة اجتماع: ${title}`, "info");
      }
      
      res.status(201).json({ ...meeting, meetingLink });
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      res.status(500).json({ message: "حدث خطأ في جدولة الاجتماع" });
    }
  });
  app.post("/api/meetings", requireAuth, async (req, res) => {
    try {
      const meeting = await storage.createMeeting({
        title: req.body.title,
        description: req.body.description,
        meetingLink: req.body.meetingLink,
        scheduledBy: req.user!.id,
        startTime: new Date(req.body.startTime),
        endTime: req.body.endTime ? new Date(req.body.endTime) : null,
      });
      
      if (req.body.participantIds && Array.isArray(req.body.participantIds)) {
        for (const participantId of req.body.participantIds) {
          await storage.addMeetingParticipant(meeting.id, participantId);
          
          const privateRoom = await storage.getOrCreatePrivateChat(req.user!.id, participantId);
          
          await storage.createChatMessage({
            roomId: privateRoom.id,
            senderId: req.user!.id,
            content: `تم جدولة اجتماع: ${meeting.title}`,
            messageType: 'meeting_link',
            attachments: [{
              name: meeting.title,
              url: meeting.meetingLink,
              type: 'meeting'
            }],
          });
          
          await storage.createNotification(
            participantId,
            "اجتماع جديد",
            `تم جدولة اجتماع: ${meeting.title}`,
            "info"
          );
        }
      }
      
      io.emit('new_meeting', meeting);
      
      res.status(201).json(meeting);
    } catch (error) {
      console.error("Error creating meeting:", error);
      res.status(500).json({ message: "حدث خطأ في إنشاء الاجتماع" });
    }
  });

  app.get("/api/meetings", requireAuth, async (req, res) => {
    try {
      const meetings = await storage.getUserMeetings(req.user!.id);
      res.json(meetings);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب الاجتماعات" });
    }
  });

  app.get("/api/meetings/:id", requireAuth, async (req, res) => {
    try {
      const meeting = await storage.getMeeting(req.params.id);
      if (!meeting) {
        return res.status(404).json({ message: "الاجتماع غير موجود" });
      }
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب الاجتماع" });
    }
  });

  // Rewards endpoint
  app.get("/api/user/rewards", requireAuth, async (req, res) => {
    try {
      const rewards = await storage.getUserRewards(req.user!.id);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب المكافآت" });
    }
  });

  // Suggestions routes
  app.get("/api/suggestions", requireAuth, async (req, res) => {
    try {
      const isAdmin = req.user!.role === 'admin' || req.user!.role === 'sub-admin';
      const suggestions = isAdmin 
        ? await storage.getAllSuggestions()
        : await storage.getUserSuggestions(req.user!.id);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في جلب المقترحات" });
    }
  });

  app.post("/api/suggestions", requireAuth, async (req, res) => {
    try {
      const validationResult = insertSuggestionSchema.safeParse({
        userId: req.user!.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category || 'other',
        status: 'pending',
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "بيانات غير صالحة", 
          errors: validationResult.error.errors 
        });
      }

      const suggestion = await storage.createSuggestion(validationResult.data);
      
      res.status(201).json(suggestion);
    } catch (error) {
      console.error("Error creating suggestion:", error);
      res.status(500).json({ message: "حدث خطأ في إضافة المقترح" });
    }
  });


  app.put("/api/suggestions/:id", requireAuth, async (req, res) => {
    try {
      // Get the existing suggestion
      const suggestions = await storage.getUserSuggestions(req.user!.id);
      const existingSuggestion = suggestions.find(s => s.id === req.params.id);
      
      if (!existingSuggestion) {
        return res.status(404).json({ message: "المقترح غير موجود أو غير مصرح لك بتعديله" });
      }
      
      const updates: any = {
        updatedAt: new Date(),
      };
      
      if (req.body.title) updates.title = req.body.title;
      if (req.body.description) updates.description = req.body.description;
      if (req.body.category) updates.category = req.body.category;
      
      const suggestion = await storage.updateSuggestion(req.params.id, updates);
      
      if (!suggestion) {
        return res.status(404).json({ message: "المقترح غير موجود" });
      }
      
      res.json(suggestion);
    } catch (error) {
      console.error("Error updating suggestion:", error);
      res.status(500).json({ message: "حدث خطأ في تحديث المقترح" });
    }
  });

  app.patch("/api/suggestions/:id", requireAuth, requireRole(['admin', 'sub-admin']), async (req, res) => {
    try {
      // Validate status if provided
      const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];
      if (req.body.status && !validStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: "حالة غير صالحة" });
      }

      // Validate adminResponse if provided
      if (req.body.adminResponse !== undefined && typeof req.body.adminResponse !== 'string') {
        return res.status(400).json({ message: "رد الإدارة يجب أن يكون نصاً" });
      }

      const updates: any = {
        updatedAt: new Date(),
      };
      
      if (req.body.status) {
        updates.status = req.body.status;
      }
      
      if (req.body.adminResponse) {
        updates.adminResponse = req.body.adminResponse;
        updates.respondedAt = new Date();
        updates.respondedBy = req.user!.id;
      }
      
      const suggestion = await storage.updateSuggestion(req.params.id, updates);
      
      if (!suggestion) {
        return res.status(404).json({ message: "المقترح غير موجود" });
      }
      
      res.json(suggestion);
    } catch (error) {
      console.error("Error updating suggestion:", error);
      res.status(500).json({ message: "حدث خطأ في تحديث المقترح" });
    }
  });

  return httpServer;
}
