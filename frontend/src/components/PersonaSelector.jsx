import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Code2, 
  Crosshair, 
  PenTool, 
  Brain, 
  Wrench, 
  ChevronDown, 
  Check, 
  X,
  UserCheck
} from 'lucide-react';
import { PERSONAS, saveStoredPersona } from '../utils/personas';

const ICON_MAP = {
  Sparkles,
  Code2,
  Crosshair,
  PenTool,
  Brain,
  Wrench
};

export default function PersonaSelector({ currentPersona, onSelectPersona }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(
    currentPersona.id === 'custom' ? currentPersona.prompt : ''
  );
  const [isEditingCustom, setIsEditingCustom] = useState(currentPersona.id === 'custom');

  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (persona) => {
    if (persona.id === 'custom') {
      setIsEditingCustom(true);
      return;
    }
    setIsEditingCustom(false);
    saveStoredPersona(persona.id);
    onSelectPersona(persona);
    setIsOpen(false);
  };

  const handleSaveCustom = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    const customPersona = {
      ...PERSONAS.find(p => p.id === 'custom'),
      prompt: customPrompt.trim()
    };
    saveStoredPersona('custom', customPrompt.trim());
    onSelectPersona(customPersona);
    setIsEditingCustom(false);
    setIsOpen(false);
  };

  const ActiveIcon = ICON_MAP[currentPersona.icon] || Sparkles;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-700 bg-black/40 hover:bg-gpt-hover text-[11px] text-gray-200 hover:text-white transition-all shrink-0 cursor-pointer"
        title="Change AI Persona & Role"
      >
        <span className="text-amber-400">
          <ActiveIcon size={12} />
        </span>
        <span className="font-medium truncate max-w-[85px] sm:max-w-[120px]">
          {currentPersona.badge || currentPersona.name}
        </span>
        <ChevronDown size={11} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-72 sm:w-80 rounded-2xl border border-gray-700 bg-[#1c1c1f] p-2.5 shadow-2xl z-50 backdrop-blur-md">
          <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-gray-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-200">
              <UserCheck size={14} className="text-amber-400" />
              <span>Select AI Persona</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-md"
            >
              <X size={14} />
            </button>
          </div>

          {!isEditingCustom ? (
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {PERSONAS.map((p) => {
                const Icon = ICON_MAP[p.icon] || Sparkles;
                const isSelected = currentPersona.id === p.id;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className={`flex items-start gap-2.5 w-full p-2 rounded-xl text-left transition-colors group ${
                      isSelected
                        ? 'bg-gpt-green/15 border border-gpt-green/40 text-white'
                        : 'hover:bg-gray-800/60 text-gray-300'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isSelected ? 'bg-gpt-green/20 text-gpt-green' : 'bg-gray-800 text-gray-400 group-hover:text-amber-400'
                    }`}>
                      <Icon size={14} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-200 truncate">{p.name}</span>
                        {isSelected && <Check size={13} className="text-gpt-green shrink-0 ml-1" />}
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-1 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
                <span>Custom Persona Prompt:</span>
                <button
                  type="button"
                  onClick={() => setIsEditingCustom(false)}
                  className="text-[11px] text-gray-400 hover:text-white"
                >
                  ← Back
                </button>
              </div>

              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. You are an expert Python data scientist specializing in PyTorch and financial modeling..."
                className="w-full h-28 bg-[#141416] border border-gray-700 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gpt-green resize-none"
                autoFocus
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingCustom(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-3 py-1.5 rounded-lg text-xs bg-gpt-green hover:bg-gpt-green/90 text-white font-medium shadow"
                >
                  Save & Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
