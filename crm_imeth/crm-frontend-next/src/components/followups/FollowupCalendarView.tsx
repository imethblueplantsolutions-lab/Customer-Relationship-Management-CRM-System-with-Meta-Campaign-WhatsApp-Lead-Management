"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Phone,
  Mail,
  Video,
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  User,
} from "lucide-react";
import type { Followup } from "@/types";

interface FollowupCalendarViewProps {
  followups: Followup[];
  onSelectFollowup: (followup: Followup) => void;
  onToggleComplete: (followup: Followup) => Promise<void>;
}

type CalendarMode = "MONTH" | "WEEK" | "DAY";

export default function FollowupCalendarView({
  followups,
  onSelectFollowup,
  onToggleComplete,
}: FollowupCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<CalendarMode>("MONTH");

  const now = new Date();

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (mode === "MONTH") {
        next.setMonth(next.getMonth() - 1);
      } else if (mode === "WEEK") {
        next.setDate(next.getDate() - 7);
      } else {
        next.setDate(next.getDate() - 1);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (mode === "MONTH") {
        next.setMonth(next.getMonth() + 1);
      } else if (mode === "WEEK") {
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + 1);
      }
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get icon by task type
  const getTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "CALL":
        return <Phone className="h-3 w-3 shrink-0" />;
      case "EMAIL":
        return <Mail className="h-3 w-3 shrink-0" />;
      case "MEETING":
        return <Video className="h-3 w-3 shrink-0" />;
      default:
        return <CheckSquare className="h-3 w-3 shrink-0" />;
    }
  };

  // Get style badges by type
  const getTypeStyle = (type: string, completed?: boolean, isOverdue?: boolean) => {
    if (completed) {
      return "bg-slate-100 text-slate-500 border-slate-200 line-through opacity-75";
    }
    if (isOverdue) {
      return "bg-red-50 text-red-700 border-red-200 shadow-2xs";
    }
    switch (type.toUpperCase()) {
      case "CALL":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      case "EMAIL":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
      case "MEETING":
        return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
    }
  };

  // Map follow-ups by date string "YYYY-MM-DD"
  const followupsByDate = useMemo(() => {
    const map = new Map<string, Followup[]>();
    for (const f of followups) {
      if (!f.dueAt) continue;
      const d = new Date(f.dueAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(f);
    }
    return map;
  }, [followups]);

  // Calendar month grid calculation
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    const totalDays = lastDayOfMonth.getDate();

    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevDays = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      prevDays.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Days in current month
    const currentMonthDays = [];
    for (let i = 1; i <= totalDays; i++) {
      currentMonthDays.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Days from next month to complete 35 or 42 grid cells
    const remainingCells = 42 - (prevDays.length + currentMonthDays.length);
    const nextDays = [];
    for (let i = 1; i <= remainingCells; i++) {
      nextDays.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return [...prevDays, ...currentMonthDays, ...nextDays];
  }, [currentDate]);

  // Week days calculation
  const weekData = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // Sunday

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Header Title
  const headerTitle = useMemo(() => {
    if (mode === "MONTH") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    if (mode === "WEEK") {
      const start = weekData[0];
      const end = weekData[6];
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }, [currentDate, mode, weekData]);

  const getDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  const isToday = (date: Date) =>
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Calendar Top Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            {headerTitle}
          </h3>
        </div>

        {/* Mode Selector: Month | Week | Day */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs self-start sm:self-auto">
          {(["MONTH", "WEEK", "DAY"] as CalendarMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === m
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {m.charAt(0) + m.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ─── MONTH VIEW ─────────────────────────────────────── */}
      {mode === "MONTH" && (
        <div className="p-4">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-px mb-2 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div
                key={dayName}
                className="py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* 7x6 Month Cells Grid */}
          <div className="grid grid-cols-7 gap-2">
            {monthData.map((cell, idx) => {
              const dateKey = getDateKey(cell.date);
              const dayFollowups = followupsByDate.get(dateKey) || [];
              const today = isToday(cell.date);

              return (
                <div
                  key={`month-cell-${idx}`}
                  className={`min-h-[110px] p-2 rounded-xl border flex flex-col transition-all ${
                    today
                      ? "border-blue-300 bg-blue-50/20 shadow-xs ring-1 ring-blue-200"
                      : cell.isCurrentMonth
                      ? "border-slate-100 bg-white hover:border-slate-300 hover:shadow-2xs"
                      : "border-slate-100/60 bg-slate-50/40 opacity-40"
                  }`}
                >
                  {/* Date Number Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold flex items-center justify-center h-6 w-6 rounded-full ${
                        today
                          ? "bg-blue-600 text-white"
                          : cell.isCurrentMonth
                          ? "text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {dayFollowups.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayFollowups.length} task{dayFollowups.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Task Pills */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayFollowups.slice(0, 3).map((f) => {
                      const isOverdue = Boolean(!f.completed && f.dueAt && new Date(f.dueAt) < now);
                      const leadName = f.lead?.name || f.lead?.phoneNumber || "Lead";
                      const timeStr = f.dueAt
                        ? new Date(f.dueAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : "";

                      return (
                        <div
                          key={f.id}
                          onClick={() => onSelectFollowup(f)}
                          className={`w-full px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer truncate transition-all ${getTypeStyle(
                            f.type,
                            f.completed,
                            isOverdue
                          )}`}
                          title={`${leadName} - ${f.type} at ${timeStr}: ${f.note || "No note"}`}
                        >
                          {getTypeIcon(f.type)}
                          <span className="truncate">{leadName}</span>
                          {timeStr && (
                            <span className="ml-auto text-[10px] opacity-75 shrink-0">
                              {timeStr}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {dayFollowups.length > 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentDate(cell.date);
                          setMode("DAY");
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline px-1 py-0.5 text-left cursor-pointer"
                      >
                        +{dayFollowups.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── WEEK VIEW ──────────────────────────────────────── */}
      {mode === "WEEK" && (
        <div className="p-4">
          <div className="grid grid-cols-7 gap-3">
            {weekData.map((d, idx) => {
              const dateKey = getDateKey(d);
              const dayFollowups = followupsByDate.get(dateKey) || [];
              const today = isToday(d);

              return (
                <div
                  key={`week-day-${idx}`}
                  className={`min-h-[380px] rounded-2xl border p-3 flex flex-col ${
                    today
                      ? "border-blue-300 bg-blue-50/20 ring-1 ring-blue-200"
                      : "border-slate-200/80 bg-white"
                  }`}
                >
                  <div className="pb-3 border-b border-slate-100 text-center mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p
                      className={`text-lg font-extrabold mx-auto mt-0.5 h-8 w-8 flex items-center justify-center rounded-full ${
                        today ? "bg-blue-600 text-white" : "text-slate-800"
                      }`}
                    >
                      {d.getDate()}
                    </p>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {dayFollowups.map((f) => {
                      const isOverdue = Boolean(!f.completed && f.dueAt && new Date(f.dueAt) < now);
                      const leadName = f.lead?.name || f.lead?.phoneNumber || "Lead";
                      const timeStr = f.dueAt
                        ? new Date(f.dueAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : "";

                      return (
                        <div
                          key={f.id}
                          onClick={() => onSelectFollowup(f)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer space-y-1.5 transition-all shadow-2xs ${getTypeStyle(
                            f.type,
                            f.completed,
                            isOverdue
                          )}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="flex items-center gap-1 font-bold truncate">
                              {getTypeIcon(f.type)}
                              {f.type}
                            </span>
                            <span className="text-[10px] font-semibold">{timeStr}</span>
                          </div>
                          <p className="font-bold text-slate-800 truncate">{leadName}</p>
                          {f.note && (
                            <p className="text-[11px] text-slate-600 line-clamp-2 font-normal">
                              {f.note}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {dayFollowups.length === 0 && (
                      <div className="h-full flex items-center justify-center text-center p-4">
                        <span className="text-[11px] text-slate-400 font-medium">
                          No tasks scheduled
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── DAY VIEW ───────────────────────────────────────── */}
      {mode === "DAY" && (
        <div className="p-6">
          {(() => {
            const dateKey = getDateKey(currentDate);
            const dayFollowups = followupsByDate.get(dateKey) || [];

            return (
              <div className="space-y-4 max-w-3xl mx-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                    Scheduled Tasks ({dayFollowups.length})
                  </h4>
                </div>

                {dayFollowups.length === 0 ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-12 text-center">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No follow-ups for this day</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Enjoy your clear schedule, or switch dates to view pending tasks.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayFollowups.map((f) => {
                      const isOverdue = Boolean(!f.completed && f.dueAt && new Date(f.dueAt) < now);
                      const leadName = f.lead?.name || f.lead?.phoneNumber || "Lead";
                      const timeStr = f.dueAt
                        ? new Date(f.dueAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : "Anytime";

                      return (
                        <div
                          key={f.id}
                          onClick={() => onSelectFollowup(f)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                            isOverdue
                              ? "border-red-200 bg-red-50/30"
                              : f.completed
                              ? "border-slate-200 bg-slate-50/60 opacity-80"
                              : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete(f);
                              }}
                              className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                f.completed
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-slate-300 bg-white text-transparent hover:border-emerald-500"
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="p-1 rounded-md bg-slate-100 text-slate-600">
                                  {getTypeIcon(f.type)}
                                </span>
                                <h5
                                  className={`text-sm font-bold text-slate-800 truncate ${
                                    f.completed ? "line-through text-slate-400" : ""
                                  }`}
                                >
                                  {leadName}
                                </h5>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                                  {f.type}
                                </span>
                              </div>

                              {f.note && (
                                <p className="text-xs text-slate-500 truncate max-w-md">
                                  {f.note}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[11px] border border-red-200">
                                <AlertTriangle className="h-3 w-3" />
                                Overdue
                              </span>
                            )}
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {timeStr}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
