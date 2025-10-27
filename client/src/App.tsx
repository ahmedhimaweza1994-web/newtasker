import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { Toaster } from "@/components/ui/toaster";
import { GlobalCallManager } from "@/components/call/GlobalCallManager";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import TaskManagement from "@/pages/task-management";
import UserProfile from "@/pages/user-profile";
import Reports from "@/pages/reports";
import HRManagement from "@/pages/hr-management";
import UserManagement from "@/pages/user-management";
import Chat from "@/pages/chat";
import CallHistory from "@/pages/call-history";
import MyRequests from "@/pages/my-requests";
import MyDeductions from "@/pages/my-deductions";
import AdminDeductions from "@/pages/admin-deductions";
import SuggestionsPage from "@/pages/suggestions";
import AICenter from "@/pages/ai-center";
import AIImageGenerator from "@/pages/ai-image-generator";
import AIVideoGenerator from "@/pages/ai-video-generator";
import AIMarketingSEO from "@/pages/ai-marketing-seo";
import AITextChat from "@/pages/ai-text-chat";
import AICodeAssistant from "@/pages/ai-code-assistant";
import AISettings from "@/pages/ai-settings";
import Companies from "@/pages/companies";
import CompanyProfile from "@/pages/company-profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin-dashboard" component={AdminDashboard} />
      <ProtectedRoute path="/tasks" component={TaskManagement} />
      <ProtectedRoute path="/profile/:id?" component={UserProfile} />
      <ProtectedRoute path="/user-profile/:id?" component={UserProfile} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/hr" component={HRManagement} />
      <ProtectedRoute path="/user-management" component={UserManagement} />
      <ProtectedRoute path="/chat" component={Chat} />
      <ProtectedRoute path="/call-history" component={CallHistory} />
      <ProtectedRoute path="/my-requests" component={MyRequests} />
      <ProtectedRoute path="/my-deductions" component={MyDeductions} />
      <ProtectedRoute path="/admin-deductions" component={AdminDeductions} />
      <ProtectedRoute path="/suggestions" component={SuggestionsPage} />
      <ProtectedRoute path="/ai-center" component={AICenter} />
      <ProtectedRoute path="/ai/image-generator" component={AIImageGenerator} />
      <ProtectedRoute path="/ai/video-generator" component={AIVideoGenerator} />
      <ProtectedRoute path="/ai/marketing-seo" component={AIMarketingSEO} />
      <ProtectedRoute path="/ai/text-chat" component={AITextChat} />
      <ProtectedRoute path="/ai/code-assistant" component={AICodeAssistant} />
      <ProtectedRoute path="/ai/settings" component={AISettings} />
      <ProtectedRoute path="/companies" component={Companies} />
      <ProtectedRoute path="/companies/:id" component={CompanyProfile} />
      <ProtectedRoute path="/settings" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <div className="min-h-screen bg-background rtl-grid">
            <Router />
            <Toaster />
            <GlobalCallManager />
          </div>
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
