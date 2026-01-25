import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clipboard, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobDescriptionInput({ value, onChange }: JobDescriptionInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasted, setIsPasted] = useState(false);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
      setIsPasted(true);
      setTimeout(() => setIsPasted(false), 2000);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  }, [onChange]);

  const characterCount = value.length;
  const maxCharacters = 10000;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          Job Description
        </label>
        <button
          onClick={handlePaste}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            isPasted
              ? "bg-teal-100 text-teal-700"
              : "bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700"
          )}
        >
          {isPasted ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Pasted!
            </>
          ) : (
            <>
              <Clipboard className="w-3.5 h-3.5" />
              Paste
            </>
          )}
        </button>
      </div>

      <div className="relative flex-1">
        <motion.div
          animate={{
            boxShadow: isFocused
              ? '0 0 0 3px rgba(99, 102, 241, 0.15), 0 4px 20px rgba(99, 102, 241, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
          className={cn(
            "h-[280px] rounded-xl border-2 transition-colors overflow-hidden",
            isFocused
              ? "border-indigo-400 bg-white"
              : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
          )}
        >
          {/* Code editor style header */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 bg-slate-50/80">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
            <span className="ml-2 text-xs text-slate-400 font-mono">job-description.txt</span>
          </div>

          {/* Textarea */}
          <div className="relative h-[calc(100%-36px)]">
            {/* Line numbers */}
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-slate-50/80 border-r border-slate-100 overflow-hidden">
              <div className="flex flex-col items-end pr-2 pt-3 text-xs text-slate-300 font-mono leading-6">
                {Array.from({ length: 15 }, (_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>
            </div>

            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Paste the job description here...

Include requirements like:
• Required skills and technologies
• Years of experience
• Education requirements
• Responsibilities"
              className={cn(
                "w-full h-full pl-12 pr-4 py-3 resize-none",
                "bg-transparent text-slate-700 text-sm leading-6",
                "placeholder:text-slate-400 placeholder:leading-6",
                "focus:outline-none font-mono"
              )}
              maxLength={maxCharacters}
            />

            {/* Floating label effect when empty */}
            {!value && !isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center"
              >
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Paste job description</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Character count */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className={cn(
            "text-xs font-mono px-2 py-0.5 rounded",
            characterCount > maxCharacters * 0.9
              ? "bg-red-100 text-red-600"
              : "bg-slate-100 text-slate-400"
          )}>
            {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
