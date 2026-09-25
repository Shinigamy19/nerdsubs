"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  getSessions,
  addSession,
  updateSession,
  deleteSession,
  reorderSessions,
  type Session,
} from "@/lib/sessionStore";
import { getSessionSubtitles } from "@/lib/subtitleStore";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

interface SessionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionsChanged: () => void;
}

export function SessionManager({ isOpen, onClose, onSessionsChanged }: SessionManagerProps) {
  const { locale } = useLanguage();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  const newNameRef = useRef<HTMLInputElement>(null);
  const editNameRef = useRef<HTMLInputElement>(null);

  // Load sessions when opening
  useEffect(() => {
    if (isOpen) {
      setSessions(getSessions());
      setEditingId(null);
      setAddingNew(false);
      setConfirmDelete(null);
      setPendingSessionId(null);
    }
  }, [isOpen]);

  // Focus new name input when adding
  useEffect(() => {
    if (addingNew) {
      newNameRef.current?.focus();
    }
  }, [addingNew]);

  // Focus edit name input when editing
  useEffect(() => {
    if (editingId) {
      editNameRef.current?.focus();
    }
  }, [editingId]);

  const handleStartEdit = useCallback((session: Session) => {
    setEditingId(session.id);
    setEditName(session.name);
    setEditDescription(session.description);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingId || !editName.trim()) return;
    updateSession(editingId, {
      name: editName.trim(),
      description: editDescription.trim(),
    });
    setSessions(getSessions());
    setEditingId(null);
    onSessionsChanged();
  }, [editingId, editName, editDescription, onSessionsChanged]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleAddSession = useCallback(() => {
    if (!newName.trim()) return;
    addSession(newName.trim(), newDescription.trim());
    setSessions(getSessions());
    setAddingNew(false);
    setNewName("");
    setNewDescription("");
    onSessionsChanged();
  }, [newName, newDescription, onSessionsChanged]);

  const handleCancelAdd = useCallback(() => {
    setAddingNew(false);
    setNewName("");
    setNewDescription("");
  }, []);

  const handleDeleteRequest = useCallback(
    (id: string) => {
      const subStore = getSessionSubtitles(id);
      if (subStore && subStore.subtitles.length > 0) {
        setConfirmDelete(id);
      } else {
        deleteSession(id);
        setSessions(getSessions());
        onSessionsChanged();
      }
    },
    [onSessionsChanged]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDelete) return;
    deleteSession(confirmDelete);
    setSessions(getSessions());
    setConfirmDelete(null);
    onSessionsChanged();
  }, [confirmDelete, onSessionsChanged]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDelete(null);
  }, []);

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const sorted = [...sessions].sort((a, b) => a.order - b.order);
      const ids = sorted.map((s) => s.id);
      // Swap with previous
      [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
      reorderSessions(ids);
      setSessions(getSessions());
      onSessionsChanged();
    },
    [sessions, onSessionsChanged]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      const sorted = [...sessions].sort((a, b) => a.order - b.order);
      if (index >= sorted.length - 1) return;
      const ids = sorted.map((s) => s.id);
      // Swap with next
      [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
      reorderSessions(ids);
      setSessions(getSessions());
      onSessionsChanged();
    },
    [sessions, onSessionsChanged]
  );

  const handleSaveAll = useCallback(() => {
    onSessionsChanged();
    onClose();
  }, [onSessionsChanged, onClose]);

  if (!isOpen) return null;

  const sorted = [...sessions].sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-nerd-card border border-nerd-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg sm:mx-4 max-h-[92vh] sm:max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-nerd-border sticky top-0 bg-nerd-card/95 backdrop-blur-sm z-10">
          <h2 className="text-base sm:text-lg font-bold text-nerd-text">
            {t(locale, "session.manageSessions")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Session list */}
        <div className="p-4 sm:p-6 space-y-2">
          {sorted.map((session, index) => {
            const isEditing = editingId === session.id;
            const isDeleting = confirmDelete === session.id;

            return (
              <div
                key={session.id}
                className={`rounded-lg border transition-colors ${
                  isEditing
                    ? "border-nerd-accent bg-nerd-accent/5"
                    : isDeleting
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-nerd-border bg-nerd-bg"
                }`}
              >
                {isEditing ? (
                  /* Inline edit form */
                  <div className="p-3 space-y-3">
                    <input
                      ref={editNameRef}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      className="w-full bg-nerd-card border border-nerd-border rounded-lg px-3 py-2 text-sm text-nerd-text placeholder:text-nerd-muted/50 focus:outline-none focus:ring-2 focus:ring-nerd-accent focus:border-transparent"
                      placeholder={t(locale, "session.namePlaceholder")}
                    />
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      className="w-full bg-nerd-card border border-nerd-border rounded-lg px-3 py-2 text-sm text-nerd-text placeholder:text-nerd-muted/50 focus:outline-none focus:ring-2 focus:ring-nerd-accent focus:border-transparent"
                      placeholder={t(locale, "session.descriptionPlaceholder")}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all"
                      >
                        {t(locale, "settings.cancel")}
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editName.trim()}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-nerd-accent text-white shadow hover:bg-nerd-accent-light transition-all disabled:opacity-50"
                      >
                        {t(locale, "settings.save")}
                      </button>
                    </div>
                  </div>
                ) : isDeleting ? (
                  /* Delete confirmation */
                  <div className="p-3">
                    <p className="text-sm text-red-400 mb-3">
                      {t(locale, "session.deleteConfirm")}
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleCancelDelete}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all"
                      >
                        {t(locale, "settings.cancel")}
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white shadow hover:bg-red-600 transition-all"
                      >
                        {t(locale, "export.delete")}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal row */
                  <div className="flex items-center gap-2 p-3">
                    {/* Move buttons */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 rounded text-nerd-muted hover:text-nerd-text disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                        title="Move up"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === sorted.length - 1}
                        className="p-1 rounded text-nerd-muted hover:text-nerd-text disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                        title="Move down"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Session info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-nerd-text truncate">{session.name}</p>
                      {session.description && (
                        <p className="text-xs text-nerd-muted truncate">{session.description}</p>
                      )}
                      <p className="text-[10px] text-nerd-muted/50 font-mono mt-0.5">{session.id}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleStartEdit(session)}
                        className="p-2 rounded-lg text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(session.id)}
                        className="p-2 rounded-lg text-nerd-muted hover:text-red-400 hover:bg-red-500/10 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new session form */}
          {addingNew && (
            <div className="rounded-lg border border-nerd-accent bg-nerd-accent/5 p-3 space-y-3">
              <input
                ref={newNameRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSession();
                  if (e.key === "Escape") handleCancelAdd();
                }}
                className="w-full bg-nerd-card border border-nerd-border rounded-lg px-3 py-2 text-sm text-nerd-text placeholder:text-nerd-muted/50 focus:outline-none focus:ring-2 focus:ring-nerd-accent focus:border-transparent"
                placeholder={t(locale, "session.namePlaceholder")}
              />
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSession();
                  if (e.key === "Escape") handleCancelAdd();
                }}
                className="w-full bg-nerd-card border border-nerd-border rounded-lg px-3 py-2 text-sm text-nerd-text placeholder:text-nerd-muted/50 focus:outline-none focus:ring-2 focus:ring-nerd-accent focus:border-transparent"
                placeholder={t(locale, "session.descriptionPlaceholder")}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCancelAdd}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all"
                >
                  {t(locale, "settings.cancel")}
                </button>
                <button
                  onClick={handleAddSession}
                  disabled={!newName.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-nerd-accent text-white shadow hover:bg-nerd-accent-light transition-all disabled:opacity-50"
                >
                  {t(locale, "session.add")}
                </button>
              </div>
            </div>
          )}

          {/* Add button */}
          {!addingNew && (
            <button
              onClick={() => setAddingNew(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-nerd-border text-sm text-nerd-muted hover:text-nerd-accent hover:border-nerd-accent/50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t(locale, "session.addSession")}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-nerd-border sticky bottom-0 bg-nerd-card/95 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-nerd-muted hover:text-nerd-text hover:bg-nerd-border/50 transition-all min-h-[44px]"
          >
            {t(locale, "settings.cancel")}
          </button>
          <button
            onClick={handleSaveAll}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-nerd-accent text-white shadow-lg shadow-nerd-accent/25 hover:bg-nerd-accent-light hover:shadow-nerd-accent/40 transition-all min-h-[44px]"
          >
            {t(locale, "session.done")}
          </button>
        </div>
      </div>
    </div>
  );
}
