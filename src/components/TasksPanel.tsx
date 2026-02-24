import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';

interface TasksPanelProps {
  onCreateTask: (name: string) => void;
  onSwitchTask: (taskId: string) => void;
  onCloseTask: (taskId: string) => void;
}

export function TasksPanel({
  onCreateTask,
  onSwitchTask,
  onCloseTask,
}: TasksPanelProps) {
  const tasks = useBrowserStore((s) => s.tasks);
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTaskId = useBrowserStore((s) => s.activeTaskId);
  const renameTask = useBrowserStore((s) => s.renameTask);

  const [newTaskName, setNewTaskName] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateTask = () => {
    const name = newTaskName.trim() || `Task ${tasks.length + 1}`;
    onCreateTask(name);
    setNewTaskName('');
  };

  const handleStartEdit = (taskId: string, currentName: string) => {
    setEditingTaskId(taskId);
    setEditingName(currentName);
  };

  const handleSaveEdit = () => {
    if (editingTaskId && editingName.trim()) {
      renameTask(editingTaskId, editingName.trim());
    }
    setEditingTaskId(null);
    setEditingName('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Task list */}
      {tasks.map((task) => {
        const taskTabs = tabs.filter((t) => t.taskId === task.id);
        const isActive = task.id === activeTaskId;

        return (
          <div
            key={task.id}
            onClick={() => onSwitchTask(task.id)}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: `2px solid ${isActive ? 'var(--browser-accent)' : 'var(--browser-border)'}`,
              background: isActive ? 'var(--browser-active)' : 'transparent',
              cursor: 'pointer',
              transition: 'border-color 0.1s, background-color 0.1s',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              {editingTaskId === task.id ? (
                <div style={{ display: 'flex', gap: 4, flex: 1 }} onClick={(e) => e.stopPropagation()}>
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') {
                        setEditingTaskId(null);
                      }
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      border: '1px solid var(--browser-accent)',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 12,
                      background: 'var(--browser-surface)',
                      color: 'var(--browser-text)',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSaveEdit}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#22c55e', padding: 2 }}
                  >
                    <Check size={13} />
                  </button>
                  <button
                    onClick={() => setEditingTaskId(null)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--browser-text-muted)', padding: 2 }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--browser-accent)' : 'var(--browser-text)',
                    flex: 1,
                  }}
                >
                  {task.name}
                </span>
              )}

              {editingTaskId !== task.id && (
                <div
                  style={{ display: 'flex', gap: 2 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleStartEdit(task.id, task.name)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--browser-text-muted)',
                      padding: 3,
                      borderRadius: 4,
                    }}
                    title="Rename task"
                  >
                    <Pencil size={11} />
                  </button>
                  {tasks.length > 1 && (
                    <button
                      onClick={() => onCloseTask(task.id)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: 'var(--browser-text-muted)',
                        padding: 3,
                        borderRadius: 4,
                      }}
                      title="Close task"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: 11,
                color: 'var(--browser-text-muted)',
                marginTop: 4,
              }}
            >
              {taskTabs.length} tab{taskTabs.length !== 1 ? 's' : ''}
              {taskTabs.length > 0 && (
                <span style={{ marginLeft: 6 }}>
                  · {taskTabs[taskTabs.length - 1]?.title || 'New Tab'}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Create new task */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <input
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreateTask();
          }}
          placeholder="New task name…"
          style={{
            flex: 1,
            padding: '7px 10px',
            borderRadius: 6,
            border: '1px solid var(--browser-border)',
            background: 'var(--browser-bg)',
            color: 'var(--browser-text)',
            fontSize: 12,
            outline: 'none',
          }}
        />
        <button
          onClick={handleCreateTask}
          style={{
            padding: '7px 12px',
            borderRadius: 6,
            border: 'none',
            background: 'var(--browser-accent)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}
