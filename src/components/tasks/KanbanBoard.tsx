"use client";

/**
 * KanbanBoard
 *
 * Drag-and-drop kanban board using @hello-pangea/dnd.
 * Dropping a card into a different column auto-updates its status via PATCH.
 */

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useState } from "react";
import { TaskCard } from "./TaskCard";
import { Plus } from "lucide-react";

const COLUMNS = [
  { key: "TODO", label: "To Do", color: "hsl(var(--text-muted))" },
  { key: "IN_PROGRESS", label: "In Progress", color: "hsl(var(--accent))" },
  { key: "DONE", label: "Done", color: "hsl(var(--success))" },
  { key: "CANCELLED", label: "Cancelled", color: "hsl(var(--danger))" },
];

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedMins: number | null;
  project: { id: string; name: string; color: string } | null;
  tags: { tag: { id: string; name: string; color: string } }[];
  subtasks: { id: string; status: string }[];
  _count: { attachments: number; subtasks: number };
  description: string | null;
  markdownNotes: string | null;
};

export function KanbanBoard({
  initialTasks,
  onEdit,
  onDelete,
  onAddTask,
}: {
  initialTasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddTask: (status: string) => void;
}) {
  const [tasks, setTasks] = useState(initialTasks);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const newStatus = destination.droppableId;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    // Persist to server
    const res = await fetch(`/api/tasks/${draggableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    // Revert on failure
    if (!res.ok) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === draggableId ? { ...t, status: source.droppableId } : t
        )
      );
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="flex flex-col gap-3 min-w-0">
              {/* Column Header */}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl sticky top-0 z-10"
                style={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border-subtle))",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: col.color }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "hsl(var(--text-primary))" }}
                  >
                    {col.label}
                  </span>
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "hsl(var(--surface-elevated))",
                      color: "hsl(var(--text-muted))",
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>
                <button
                  id={`add-task-${col.key.toLowerCase()}`}
                  onClick={() => onAddTask(col.key)}
                  className="p-1 rounded-lg cursor-pointer transition-colors"
                  style={{ color: "hsl(var(--text-muted))" }}
                  title={`Add task to ${col.label}`}
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* Droppable column */}
              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-col gap-2 min-h-32 p-1 rounded-xl transition-colors"
                    style={{
                      background: snapshot.isDraggingOver
                        ? `${col.color}10`
                        : "transparent",
                      border: snapshot.isDraggingOver
                        ? `2px dashed ${col.color}50`
                        : "2px dashed transparent",
                    }}
                  >
                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div
                        className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed text-xs"
                        style={{
                          borderColor: "hsl(var(--border))",
                          color: "hsl(var(--text-muted))",
                        }}
                      >
                        Drop tasks here
                      </div>
                    )}

                    {colTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.85 : 1,
                              transform: snapshot.isDragging
                                ? `${provided.draggableProps.style?.transform} rotate(2deg)`
                                : provided.draggableProps.style?.transform,
                              boxShadow: snapshot.isDragging
                                ? "0 8px 32px rgba(0,0,0,0.5)"
                                : undefined,
                            }}
                          >
                            <TaskCard
                              task={task}
                              onStatusChange={handleStatusChange}
                              onDelete={onDelete}
                              onEdit={onEdit}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
