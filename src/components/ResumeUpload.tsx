import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, X, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ResumeUploadProps {
  onFileUpload: (file: File | null) => void;
  file: File | null;
}

export function ResumeUpload({ onFileUpload, file }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      onFileUpload(droppedFile);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  }, [onFileUpload]);

  const removeFile = useCallback(() => {
    onFileUpload(null);
  }, [onFileUpload]);

  return (
    <div className="h-full">
      <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-indigo-600" />
        Upload Resume
      </label>
      
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "relative h-[280px] rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer group",
              "flex flex-col items-center justify-center",
              isDragging
                ? "border-indigo-500 bg-indigo-50/80 shadow-lg shadow-indigo-500/20"
                : "border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <motion.div
              animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                isDragging
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-600 group-hover:from-indigo-200 group-hover:to-indigo-300"
              )}
            >
              <UploadCloud className="w-8 h-8" />
            </motion.div>
            
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              {isDragging ? "Drop it here!" : "Drop your PDF resume here"}
            </h3>
            <p className="text-sm text-slate-500 mb-4">or click to browse files</p>
            
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="px-2 py-1 rounded-md bg-slate-200/80">PDF</span>
              <span>Max 10MB</span>
            </div>

            {/* Animated border glow on drag */}
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.3), 0 0 30px rgba(99, 102, 241, 0.2)'
                }}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="h-[280px] rounded-xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-6 flex flex-col items-center justify-center relative overflow-hidden"
          >
            {/* Success background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 20px 20px, #14b8a6 2px, transparent 0)',
                backgroundSize: '40px 40px'
              }} />
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30"
            >
              <CheckCircle2 className="w-8 h-8 text-white" />
            </motion.div>

            <h3 className="text-lg font-semibold text-slate-700 mb-2">Resume Uploaded!</h3>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 border border-teal-200 mb-4 max-w-full">
              <FileText className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                {file.name}
              </span>
              <span className="text-xs text-slate-400 flex-shrink-0">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>

            <button
              onClick={removeFile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Remove file
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
