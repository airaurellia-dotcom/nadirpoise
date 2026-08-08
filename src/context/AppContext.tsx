import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";
import type { AppState, AppAction, Schedule, ArchiveEntry, StressTestResult, Persona, User, AppSettings } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { employees as mockEmployees } from "../data/employees";
import { DEMO_CREDENTIALS } from "../constants/config";

const defaultConstraints = {
  minHeadcount: 3,
  maxConsecutiveNights: 2,
  seniorStaffPerNight: 1,
};

const initialState: AppState = {
  employees: mockEmployees,
  schedule: null,
  constraints: defaultConstraints,
  archive: [],
  persona: "shift_manager",
  user: null,
  settings: DEFAULT_SETTINGS,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_EMPLOYEES":
      return { ...state, employees: action.payload };
    case "GENERATE_SCHEDULE":
      return { ...state, schedule: action.payload };
    case "UPDATE_CONSTRAINTS":
      return {
        ...state,
        constraints: { ...state.constraints, ...action.payload },
      };
    case "ADD_ARCHIVE_ENTRY":
      return {
        ...state,
        archive: [action.payload, ...state.archive],
      };
    case "ADD_STRESS_TEST_RESULT": {
      const entry: ArchiveEntry = {
        id: action.payload.result.id,
        timestamp: action.payload.result.timestamp,
        type: "stress_test",
        schedule: action.payload.schedule,
        stressTestResult: action.payload.result,
        label: `Stress Test — ${new Date(action.payload.result.timestamp).toLocaleDateString()}`,
      };
      return {
        ...state,
        schedule: action.payload.schedule,
        archive: [entry, ...state.archive],
      };
    }
    case "ADD_OVERRIDE_ENTRY": {
      const entry: ArchiveEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: "override",
        schedule: action.payload.schedule,
        overrideDetails: {
          managerNote: action.payload.managerNote,
          stressTestResult: action.payload.result,
          mitigations: action.payload.result.personaResults
            .filter((r) => r.verdict === "REJECT" || r.verdict === "CAUTION")
            .flatMap((r) => r.findings.slice(0, 2)),
          employeeIds: action.payload.employeeIds,
        },
        label: `Override — ${new Date().toLocaleDateString()}`,
      };
      return {
        ...state,
        archive: [entry, ...state.archive],
      };
    }
    case "CLEAR_ARCHIVE":
      return { ...state, archive: [] };
    case "SET_PERSONA":
      return { ...state, persona: action.payload };
    case "SET_USER":
      return { ...state, user: action.payload, persona: action.payload.persona };
    case "CLEAR_USER":
      return { ...state, user: null };
    case "UPDATE_SETTINGS": {
      const current = state.settings;
      const patch = action.payload;
      return {
        ...state,
        settings: {
          thresholds: { ...current.thresholds, ...patch.thresholds },
          station: { ...current.station, ...patch.station },
        },
      };
    }
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setSchedule: (schedule: Schedule) => void;
  setCurrentSchedule: (schedule: Schedule) => void;
  addArchiveEntry: (entry: ArchiveEntry) => void;
  addStressTestResult: (schedule: Schedule, result: StressTestResult) => void;
  addOverrideEntry: (schedule: Schedule, result: StressTestResult, managerNote: string, employeeIds: string[]) => void;
  setPersona: (persona: Persona) => void;
  login: (persona: Persona) => void;
  logout: () => void;
  updateSettings: (payload: Partial<AppSettings>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setSchedule = useCallback(
    (schedule: Schedule) => {
      dispatch({ type: "GENERATE_SCHEDULE", payload: schedule });
      const entry: ArchiveEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: "schedule",
        schedule,
        label: `Schedule — w/c ${new Date(schedule.weekStart).toLocaleDateString()}`,
      };
      dispatch({ type: "ADD_ARCHIVE_ENTRY", payload: entry });
    },
    [],
  );

  const setCurrentSchedule = useCallback(
    (schedule: Schedule) => dispatch({ type: "GENERATE_SCHEDULE", payload: schedule }),
    [],
  );

  const addArchiveEntry = useCallback(
    (entry: ArchiveEntry) => dispatch({ type: "ADD_ARCHIVE_ENTRY", payload: entry }),
    [],
  );

  const addStressTestResult = useCallback(
    (schedule: Schedule, result: StressTestResult) =>
      dispatch({ type: "ADD_STRESS_TEST_RESULT", payload: { schedule, result } }),
    [],
  );

  const addOverrideEntry = useCallback(
    (schedule: Schedule, result: StressTestResult, managerNote: string, employeeIds: string[]) =>
      dispatch({ type: "ADD_OVERRIDE_ENTRY", payload: { schedule, result, managerNote, employeeIds } }),
    [],
  );

  const setPersona = useCallback(
    (persona: Persona) => dispatch({ type: "SET_PERSONA", payload: persona }),
    [],
  );

  const login = useCallback(
    (persona: Persona) => {
      const cred = DEMO_CREDENTIALS[persona];
      const user: User = {
        persona,
        displayName: cred.displayName,
        role: cred.role,
        email: cred.email,
      };
      dispatch({ type: "SET_USER", payload: user });
    },
    [],
  );

  const logout = useCallback(() => {
    dispatch({ type: "CLEAR_USER" });
    dispatch({ type: "SET_PERSONA", payload: "shift_manager" });
  }, []);

  const updateSettings = useCallback(
    (payload: Partial<AppSettings>) => dispatch({ type: "UPDATE_SETTINGS", payload }),
    [],
  );

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        setSchedule,
        setCurrentSchedule,
        addArchiveEntry,
        addStressTestResult,
        addOverrideEntry,
        setPersona,
        login,
        logout,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return ctx;
}