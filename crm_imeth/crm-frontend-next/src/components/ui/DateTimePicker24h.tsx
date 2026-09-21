"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";

interface DateTimePicker24hProps {
  value?: string; // ISO string or "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD HH:mm"
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function DateTimePicker24h({
  value,
  onChange,
  placeholder = "YYYY-MM-DD HH:mm",
  className = "",
  required = false,
}: DateTimePicker24hProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date/time from value
  const parseValue = (val?: string) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const selectedDate = parseValue(value);

  // View state for calendar (month/year)
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());
  const [selectedHour, setSelectedHour] = useState<number>(() =>
    selectedDate ? selectedDate.getHours() : new Date().getHours()
  );
  const [selectedMinute, setSelectedMinute] = useState<number>(() =>
    selectedDate ? selectedDate.getMinutes() : 0
  );

  // Synchronize when value changes externally
  useEffect(() => {
    if (value) {
      const d = parseValue(value);
      if (d) {
        setViewDate(d);
        setSelectedHour(d.getHours());
        setSelectedMinute(d.getMinutes());
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Format display string: "YYYY-MM-DD HH:mm"
  const formatDisplay = (val?: string) => {
    if (!val) return "";
    const d = parseValue(val);
    if (!d) return val;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const handleSelectDay = (day: number) => {
    const yyyy = viewDate.getFullYear();
    const mm = viewDate.getMonth();
    const newDate = new Date(yyyy, mm, day, selectedHour, selectedMinute);
    // Format to "YYYY-MM-DDTHH:mm"
    const monthStr = String(mm + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const hourStr = String(selectedHour).padStart(2, "0");
    const minStr = String(selectedMinute).padStart(2, "0");
    onChange(`${yyyy}-${monthStr}-${dayStr}T${hourStr}:${minStr}`);
  };

  const handleHourChange = (hour: number) => {
    setSelectedHour(hour);
    const base = selectedDate || new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const yyyy = base.getFullYear();
    const monthStr = String(base.getMonth() + 1).padStart(2, "0");
    const dayStr = String(base.getDate()).padStart(2, "0");
    const hourStr = String(hour).padStart(2, "0");
    const minStr = String(selectedMinute).padStart(2, "0");
    onChange(`${yyyy}-${monthStr}-${dayStr}T${hourStr}:${minStr}`);
  };

  const handleMinuteChange = (minute: number) => {
    setSelectedMinute(minute);
    const base = selectedDate || new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const yyyy = base.getFullYear();
    const monthStr = String(base.getMonth() + 1).padStart(2, "0");
    const dayStr = String(base.getDate()).padStart(2, "0");
    const hourStr = String(selectedHour).padStart(2, "0");
    const minStr = String(minute).padStart(2, "0");
    onChange(`${yyyy}-${monthStr}-${dayStr}T${hourStr}:${minStr}`);
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleNow = () => {
    const now = new Date();
    setViewDate(now);
    setSelectedHour(now.getHours());
    setSelectedMinute(now.getMinutes());
    const yyyy = now.getFullYear();
    const monthStr = String(now.getMonth() + 1).padStart(2, "0");
    const dayStr = String(now.getDate()).padStart(2, "0");
    const hourStr = String(now.getHours()).padStart(2, "0");
    const minStr = String(now.getMinutes()).padStart(2, "0");
    onChange(`${yyyy}-${monthStr}-${dayStr}T${hourStr}:${minStr}`);
  };

  const handleClear = () => {
    onChange("");
  };

  // Calendar math
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Hours: 0 to 23
  const hours = Array.from({ length: 24 }, (_, i) => i);
  // Minutes: 00, 05, 10, ... 55, plus all 00-59
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Display Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 cursor-pointer hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all ${className}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <CalendarIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className={value ? "font-semibold text-slate-800" : "text-slate-400"}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="text-slate-300 hover:text-slate-500 p-0.5 rounded-full"
            title="Clear date"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col sm:flex-row gap-4 w-[330px] sm:w-[480px]">
          {/* Left Column: Calendar */}
          <div className="flex-1">
            {/* Month/Year Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800">
                {monthNames[month]} {year}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {dayLabels.map((lbl) => (
                <span key={lbl} className="text-[10px] font-bold text-slate-400 py-1">
                  {lbl}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty offset spaces */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`offset-${i}`} className="h-7 w-7" />
              ))}

              {/* Days of Month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected =
                  selectedDate &&
                  selectedDate.getFullYear() === year &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getDate() === day;
                const isToday =
                  new Date().getFullYear() === year &&
                  new Date().getMonth() === month &&
                  new Date().getDate() === day;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-7 w-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white font-bold shadow-xs"
                        : isToday
                        ? "border border-blue-500 text-blue-600 hover:bg-blue-50"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions for Calendar */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-slate-600 font-medium text-[11px] cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleNow}
                className="text-blue-600 hover:text-blue-700 font-bold text-[11px] cursor-pointer"
              >
                Today / Now
              </button>
            </div>
          </div>

          {/* Right Column: 24-Hour Time Picker */}
          <div className="border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4 flex flex-col">
            <div className="flex items-center gap-1 text-slate-600 mb-2">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                24H Time
              </span>
            </div>

            <div className="flex gap-2 flex-1">
              {/* Hours (00 - 23) */}
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-400 text-center mb-1">
                  Hour
                </span>
                <div className="h-44 w-12 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-1 space-y-0.5 scrollbar-thin">
                  {hours.map((h) => {
                    const isSelected = selectedHour === h;
                    return (
                      <button
                        key={`h-${h}`}
                        type="button"
                        onClick={() => handleHourChange(h)}
                        className={`w-full py-1 text-center text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white font-bold"
                            : "text-slate-700 hover:bg-slate-200/60"
                        }`}
                      >
                        {String(h).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutes (00 - 59) */}
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-400 text-center mb-1">
                  Minute
                </span>
                <div className="h-44 w-12 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-1 space-y-0.5 scrollbar-thin">
                  {minutes.map((m) => {
                    const isSelected = selectedMinute === m;
                    return (
                      <button
                        key={`m-${m}`}
                        type="button"
                        onClick={() => handleMinuteChange(m)}
                        className={`w-full py-1 text-center text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white font-bold"
                            : "text-slate-700 hover:bg-slate-200/60"
                        }`}
                      >
                        {String(m).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 py-1.5 text-xs font-bold transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
