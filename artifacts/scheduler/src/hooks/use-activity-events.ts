import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListTimeslotsQueryKey,
  getListUsersQueryKey,
  getListServicesQueryKey,
  getGetStatsOverviewQueryKey,
} from "@workspace/api-client-react";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export function useActivityEvents() {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      if (esRef.current) {
        esRef.current.close();
      }

      const es = new EventSource(`${API_BASE}/api/events`);
      esRef.current = es;

      const invalidateTimeslots = () => {
        queryClient.invalidateQueries({ queryKey: getListTimeslotsQueryKey() });
      };
      const invalidateUsers = () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      };
      const invalidateServices = () => {
        queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
      };
      const invalidateStats = () => {
        queryClient.invalidateQueries({ queryKey: getGetStatsOverviewQueryKey() });
      };

      es.addEventListener("timeslot", () => {
        invalidateTimeslots();
        invalidateStats();
      });

      es.addEventListener("user", () => {
        invalidateUsers();
        invalidateStats();
      });

      es.addEventListener("service", () => {
        invalidateServices();
        invalidateStats();
      });

      es.addEventListener("stats", invalidateStats);

      es.onerror = () => {
        es.close();
        esRef.current = null;
        retryTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [queryClient]);
}
