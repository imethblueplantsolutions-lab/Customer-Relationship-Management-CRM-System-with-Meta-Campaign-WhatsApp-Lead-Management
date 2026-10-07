/**
 * @file calendar-sync.ts
 * @description Utilities to sync and export CRM follow-up tasks to external calendars
 * (Google Calendar, Microsoft Outlook, Apple Calendar, etc.)
 */

import type { Followup } from "@/types";

/**
 * Formats a Date into UTC iCalendar format: YYYYMMDDTHHmmssZ
 */
export function formatToUtcCompact(date: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generates a direct Google Calendar "Add Event" template URL.
 */
export function generateGoogleCalendarUrl(followup: Followup): string {
  const leadName = followup.lead?.name || followup.lead?.phoneNumber || "Lead";
  const typeLabel = followup.type || "Follow-up";
  const title = `[CRM ${typeLabel}] - ${leadName}`;

  const startDate = followup.dueAt ? new Date(followup.dueAt) : new Date();
  // Default duration is 30 minutes
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  const startUtc = formatToUtcCompact(startDate);
  const endUtc = formatToUtcCompact(endDate);

  const notesText = [
    followup.note ? `Notes: ${followup.note}` : "",
    `Lead: ${leadName}`,
    followup.lead?.phoneNumber ? `Phone: ${followup.lead.phoneNumber}` : "",
    followup.leadId ? `CRM Link: ${typeof window !== "undefined" ? window.location.origin : ""}/leads/${followup.leadId}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details: notesText,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates and downloads a universal .ics (iCalendar RFC 5545) file
 * compatible with Google Calendar, Apple Calendar, and Outlook.
 */
export function downloadIcsFile(followup: Followup): void {
  const leadName = followup.lead?.name || followup.lead?.phoneNumber || "Lead";
  const typeLabel = followup.type || "Follow-up";
  const title = `[CRM ${typeLabel}] - ${leadName}`;

  const startDate = followup.dueAt ? new Date(followup.dueAt) : new Date();
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  const startUtc = formatToUtcCompact(startDate);
  const endUtc = formatToUtcCompact(endDate);
  const nowUtc = formatToUtcCompact(new Date());

  const notesText = [
    followup.note ? `Notes: ${followup.note}` : "",
    `Lead: ${leadName}`,
    followup.lead?.phoneNumber ? `Phone: ${followup.lead.phoneNumber}` : "",
    followup.leadId ? `CRM Link: ${typeof window !== "undefined" ? window.location.origin : ""}/leads/${followup.leadId}` : "",
  ]
    .filter(Boolean)
    .join("\\n");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meta CRM//Followup Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:crm-followup-${followup.id}@crm.blueplanet.lk`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${title.replace(/[,;]/g, "")}`,
    `DESCRIPTION:${notesText.replace(/[,;]/g, " ")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `followup-${leadName.toLowerCase().replace(/[^a-z0-9]/g, "_")}-${startUtc.slice(0, 8)}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
