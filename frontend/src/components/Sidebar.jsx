import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Check, X, Cpu, LogOut, Shield, Settings } from 'lucide-react';

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
  models,
  selectedModel,
  onSelectModel,
  isOpen,
  onClose,
  onLogout,
  onOpenAdmin
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const startRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleConversationClick = (id) => {
    onSelect(id);
    if (onClose) onClose(); // Auto-close drawer on mobile on item selection
  };

  const handleNewChatClick = () => {
    onNewChat();
    if (onClose) onClose(); // Auto-close drawer on mobile on new chat
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gpt-border bg-gpt-sidebar transition-transform duration-300 ease-in-out md:static md:w-64 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Top action: New Chat & Mobile Close Button */}
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={handleNewChatClick}
          className="flex-1 flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-700 hover:bg-gpt-hover text-sm font-medium transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus size={18} />
            <span>New chat</span>
          </div>
        </button>

        {/* Close button visible only on mobile */}
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 hover:bg-gpt-hover text-gray-400 hover:text-white transition-colors md:hidden"
          title="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="text-[11px] font-semibold text-gray-500 uppercase px-3 py-2">
          Recent Chats
        </div>

        {conversations.length === 0 ? (
          <div className="text-xs text-gray-500 px-3 py-4 text-center">
            No past chats yet. Start a new conversation!
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => !isEditing && handleConversationClick(conv.id)}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-gpt-hover text-white font-medium'
                    : 'text-gray-300 hover:bg-gpt-hover/60 hover:text-white'
                }`}
              >
                <MessageSquare size={16} className="shrink-0 text-gray-400" />

                {isEditing ? (
                  <div className="flex-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(conv.id, e)}
                      autoFocus
                      className="w-full bg-[#1e1e1e] border border-gray-600 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                    />
                    <button onClick={(e) => saveRename(conv.id, e)} className="hover:text-green-400">
                      <Check size={14} />
                    </button>
                    <button onClick={cancelRename} className="hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 truncate">{conv.title}</span>

                    {/* Action buttons on hover / active */}
                    <div className={`flex items-center gap-1 shrink-0 ${
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <button
                        onClick={(e) => startRename(conv, e)}
                        title="Rename"
                        className="p-1 hover:text-white text-gray-400"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conv.id);
                        }}
                        title="Delete"
                        className="p-1 hover:text-red-400 text-gray-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Model Selector & Admin Tools in Footer */}
      <div className="p-3 border-t border-gpt-border bg-[#141414] space-y-2">
        <div className="text-[11px] font-semibold text-gray-500 uppercase flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Cpu size={12} /> Model Engine
          </span>
          <span className="text-green-400 font-normal">● Online</span>
        </div>
        <select
          value={selectedModel}
          onChange={(e) => onSelectModel(e.target.value)}
          className="w-full bg-[#202020] text-xs text-gray-200 border border-gray-700 rounded-lg p-2 focus:outline-none focus:border-gpt-green cursor-pointer"
        >
          {models.map(m => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Admin Portal Button */}
        {onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-gpt-hover transition-colors border border-gray-700/60"
          >
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-[#10a37f]" />
              <span>Admin & Devices</span>
            </div>
            <Settings size={13} className="text-gray-400" />
          </button>
        )}

        {/* Lock / Sign Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gpt-hover transition-colors"
          >
            <span>Lock / Sign Out</span>
            <LogOut size={13} />
          </button>
        )}
      </div>
    </aside>
  );
}
