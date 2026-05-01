"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MarkDoneForm } from "./mark-done-form";
import type { MaintenanceTask } from "@prisma/client";

interface TaskCardProps {
  task: MaintenanceTask;
  currentOdometer: number;
}

function statusBadge(status: string) {
  if (status === "OVERDUE")
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
        Overdue
      </span>
    );
  if (status === "DUE_SOON")
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600">
        Due soon
      </span>
    );
  return (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-600">
      OK
    </span>
  );
}

function dueDetail(task: MaintenanceTask, currentOdometer: number) {
  const parts: string[] = [];
  if (task.nextDueKm !== null) {
    const diff = Math.round(task.nextDueKm - currentOdometer);
    parts.push(
      diff <= 0
        ? `${Math.abs(diff)} km overdue`
        : `in ${diff} km`
    );
  }
  if (task.nextDueDate) {
    const days = Math.round(
      (task.nextDueDate.getTime() - Date.now()) / 86400000
    );
    parts.push(
      days < 0
        ? `${Math.abs(days)} days overdue`
        : days === 0
        ? "today"
        : `in ${days}d`
    );
  }
  return parts.join(" · ") || "No schedule set";
}

export function TaskCard({ task, currentOdometer }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("rounded-2xl border bg-card p-4", expanded && "border-primary/30")}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{task.label}</p>
          {statusBadge(task.status)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {dueDetail(task, currentOdometer)}
        </p>
        {task.lastDoneDate && (
          <p className="text-xs text-muted-foreground">
            Last done:{" "}
            {new Date(task.lastDoneDate).toLocaleDateString("en-LK", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {task.lastDoneKm ? ` @ ${Math.round(task.lastDoneKm).toLocaleString()} km` : ""}
          </p>
        )}
      </button>

      {expanded && (
        <MarkDoneForm
          taskId={task.id}
          taskLabel={task.label}
          currentOdometer={currentOdometer}
          onDone={() => setExpanded(false)}
        />
      )}
    </div>
  );
}
