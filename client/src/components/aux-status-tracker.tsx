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
}

export default function AuxStatusTracker() {
  const [currentStatus, setCurrentStatus] = useState("ready");
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

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
    } else {
      setIsTimerRunning(false);
      setTimer(0);
      setCurrentStatus("ready");
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
      const res = await apiRequest("POST", "/api/aux/start", { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/aux/current"] });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/aux/end", {});
      return res.json();
    },
    onSuccess: () => {
      // Immediately update UI state before invalidating queries
      setIsTimerRunning(false);
      setTimer(0);
      setCurrentStatus("ready");
      queryClient.invalidateQueries({ queryKey: ["/api/aux/current"] });
    },
  });

  const handleStatusChange = async (status: string) => {
    if (currentSession && !currentSession.endTime) {
      await endSessionMutation.mutateAsync();
    }
    startSessionMutation.mutate(status);
  };

  return (
    <AuxStatusCard
      currentStatus={currentStatus}
      timer={timer}
      isTimerRunning={isTimerRunning}
      onStatusChange={handleStatusChange}
    />
  );
}
