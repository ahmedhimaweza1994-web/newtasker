import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { createGoogleMeetEvent, isGoogleCalendarConnected } from "./google-calendar-integration";
import multer from 'multer';
import { z } from 'zod';
import path from 'path';
import { startCallSchema, updateCallStatusSchema } from '@shared/call-schemas';

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
      const taskData = {
        ...req.body,
        createdBy: req.user!.id,
        companyName: req.body.companyName || null,
        assignedTo: req.body.assignedTo || null,
        // Convert ISO string dates to Date objects for Drizzle
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      };
      const task = await storage.createTask(taskData);
      
      // Send notification if assigned to someone
      if (task.assignedTo && task.assignedTo !== req.user!.id) {
        await storage.createNotification({
          userId: task.assignedTo,
          title: "مهمة جديدة معينة لك",
          message: `تم تعيين مهمة "${task.title}" لك`,
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
              resourceId: req.params.id,
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
            resourceId: leaveRequest.id,
            userId: req.user!.id,
            userName: req.user!.fullName
          }
        });
        
        // Broadcast notification via WebSocket
        wss.clients.forEach((client) => {
          if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({
              type: 'new_notification',
              data: notification
            }));
          }
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
          resourceId: req.params.id,
          userId: req.user!.id,
          userName: req.user!.fullName
        }
      });
      
      // Broadcast notification via WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'new_notification',
            data: notification
          }));
        }
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
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "تم تحديث الإشعار" });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في تحديث الإشعار" });
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

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });


  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  const wsClients = new Map<any, { userId?: string }>();

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    // Extract userId from authenticated session ONLY
    // Never trust client-provided userId for security
    let userId: string | undefined;
    
    // The session is attached to req by express-session middleware
    const session = (req as any).session;
    if (session?.passport?.user) {
      userId = session.passport.user;
      console.log(`WebSocket authenticated user: ${userId}`);
    } else {
      console.warn('WebSocket connection without authenticated session');
    }
    
    wsClients.set(ws, { userId });

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'subscribe':
            // Ignore client-provided userId for security - we only use session-derived userId
            // This prevents impersonation attacks
            console.log('Subscribe message received but userId is session-derived only');
            break;
          case 'aux_update':
            // Broadcast AUX status updates
            wss.clients.forEach((client) => {
              if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify({
                  type: 'aux_status_update',
                  data: data.payload
                }));
              }
            });
            break;
          case 'call_offer':
          case 'call_answer':
          case 'ice_candidate':
          case 'call_end':
          case 'call_decline':
          case 'call_busy':
          case 'call_timeout':
          case 'call_ringing':
          case 'call_connected':
            // Broadcast call signaling messages ONLY to participants in the room
            if (!data.roomId) {
              console.error('Call message missing roomId');
              break;
            }

            // Security: Verify sender is authenticated
            const senderData = wsClients.get(ws);
            if (!senderData?.userId) {
              console.error('Unauthenticated user attempted to send call message');
              break;
            }

            try {
              const roomMembers = await storage.getChatRoomMembers(data.roomId);
              const memberIds = new Set(roomMembers.map(m => m.id));

              // Security: Verify sender is a member of the room
              if (!memberIds.has(senderData.userId)) {
                console.error(`User ${senderData.userId} attempted to send call message to room ${data.roomId} without membership`);
                break;
              }

              wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === ws.OPEN) {
                  const clientData = wsClients.get(client);
                  if (clientData?.userId && memberIds.has(clientData.userId)) {
                    client.send(JSON.stringify(data));
                    console.log(`Sent ${data.type} to user ${clientData.userId} in room ${data.roomId}`);
                  }
                }
              });
            } catch (error) {
              console.error('Error filtering call message recipients:', error);
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      wsClients.delete(ws);
    });

  });

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
          
          // Broadcast notification
          wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
              client.send(JSON.stringify({
                type: 'new_notification',
                data: notification
              }));
            }
          });
        }
      }
      
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'new_message',
            data: message
          }));
        }
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
      
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'message_updated',
            data: message
          }));
        }
      });
      
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
      
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'message_deleted',
            data: { messageId: req.params.id }
          }));
        }
      });
      
      res.json({ message: "تم حذف الرسالة بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ في حذف الرسالة" });
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
      
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'reaction_added',
            data: reaction
          }));
        }
      });
      
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
      
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'reaction_removed',
            data: {
              messageId: req.body.messageId,
              userId: req.user!.id,
              emoji: req.body.emoji
            }
          }));
        }
      });
      
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
          
          // Broadcast notification
          wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
              client.send(JSON.stringify({
                type: 'new_notification',
                data: notification
              }));
            }
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
            resourceId: meeting.id,
            userId: req.user!.id,
            userName: req.user!.fullName
          }
        });
        
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
        await storage.createNotification({
          userId: participantId,
          title: "اجتماع جديد",
          message: `${req.user!.fullName} قام بجدولة اجتماع: ${title}`,
          type: "info",
          category: "system",
          metadata: {
            resourceId: meeting.id,
            userId: req.user!.id,
            userName: req.user!.fullName
          }
        });
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
          
          await storage.createNotification({
            userId: participantId,
            title: "اجتماع جديد",
            message: `تم جدولة اجتماع: ${meeting.title}`,
            type: "info",
            category: "system",
            metadata: {
              resourceId: meeting.id,
              userId: req.user!.id,
              userName: req.user!.fullName
            }
          });
        }
      }
      
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'new_meeting',
            data: meeting
          }));
        }
      });
      
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

  // Broadcast real-time updates periodically
  setInterval(async () => {
    try {
      const activeEmployees = await storage.getAllActiveAuxSessions();
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'employee_status_update',
            data: activeEmployees
          }));
        }
      });
    } catch (error) {
      console.error('Broadcast error:', error);
    }
  }, 5000); // Broadcast every 5 seconds

  // Call Logs API
  app.post("/api/calls/start", requireAuth, async (req, res) => {
    try {
      // Using imported startCallSchema
      const validated = startCallSchema.parse(req.body);
      
      const callLog = await storage.createCallLog({
        roomId: validated.roomId,
        callerId: req.user!.id,
        receiverId: validated.receiverId,
        callType: validated.callType,
        status: 'initiated',
      });
      res.status(201).json(callLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      console.error("Error creating call log:", error);
      res.status(500).json({ message: "حدث خطأ في بدء المكالمة" });
    }
  });

  app.patch("/api/calls/:id/status", requireAuth, async (req, res) => {
    try {
      // Using imported updateCallStatusSchema
      const validated = updateCallStatusSchema.parse(req.body);
      
      const updates: Partial<any> = { status: validated.status };
      
      if (validated.status === 'connected') {
        updates.startedAt = new Date();
      } else if (['ended', 'missed', 'rejected', 'failed'].includes(validated.status)) {
        updates.endedAt = new Date();
        if (validated.duration !== undefined) {
          updates.duration = validated.duration;
        }
      }
      
      const callLog = await storage.updateCallLog(req.params.id, updates);
      res.json(callLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      console.error("Error updating call log:", error);
      res.status(500).json({ message: "حدث خطأ في تحديث حالة المكالمة" });
    }
  });

  app.get("/api/calls/history", requireAuth, async (req, res) => {
    try {
      const callLogs = await storage.getUserCallLogs(req.user!.id);
      res.json(callLogs);
    } catch (error) {
      console.error("Error fetching call logs:", error);
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


  return httpServer;
}