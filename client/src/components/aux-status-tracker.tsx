import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AuxStatusCard from "@/components/ui/aux-status-card";

interface AuxSession {
  id: string;
  status: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  selectedTaskId?: string | null;
}

export default function AuxStatusTracker() {
  const [currentStatus, setCurrentStatus] = useState("ready");
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  const { data: currentSession } = useQuery<AuxSession>({
    queryKey: ["/api/aux/current"],
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (currentSession && !currentSession.endTime) {
      setCurrentStatus(currentSession.status);
      setIsTimerRunning(true);
      const startTime = new Date(currentSession.startTime).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimer(elapsed);
      // Only update selectedTaskId from session if it has a value
      // This preserves user selection when switching status
      if (currentSession.selectedTaskId) {
        setSelectedTaskId(currentSession.selectedTaskId);
      }
    } else {
      setIsTimerRunning(false);
      setTimer(0);
      setCurrentStatus("ready");
      setSelectedTaskId("");
    }
  }, [currentSession]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const startSessionMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("POST", "/api/aux/start", { 
        status,
        selectedTaskId: selectedTaskId === "none" ? null : selectedTaskId || null
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/aux/current"] });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest("POST", `/api/aux/end/${sessionId}`, {
        selectedTaskId: selectedTaskId === "none" ? null : selectedTaskId || null
      });
      return res.json();
    },
    onSuccess: async () => {
      // Immediately update UI state
      setIsTimerRunning(false);
      setTimer(0);
      setCurrentStatus("ready");
      
      // Invalidate and refetch to sync with server
      await queryClient.invalidateQueries({ queryKey: ["/api/aux/current"] });
      await queryClient.refetchQueries({ queryKey: ["/api/aux/current"] });
    },
  });

  const handleStatusChange = async (status: string) => {
    if (currentSession && !currentSession.endTime) {
      await endSessionMutation.mutateAsync(currentSession.id);
    }
    startSessionMutation.mutate(status);
  };

  const handleEndShift = async () => {
    if (currentSession && !currentSession.endTime) {
      await endSessionMutation.mutateAsync(currentSession.id);
    }
  };

  return (
    <AuxStatusCard
      currentStatus={currentStatus}
      timer={timer}
      isTimerRunning={isTimerRunning}
      onStatusChange={handleStatusChange}
      onEndShift={handleEndShift}
      selectedTaskId={selectedTaskId}
      onTaskChange={setSelectedTaskId}
      hasActiveSession={!!(currentSession && !currentSession.endTime)}
    />
  );
}
