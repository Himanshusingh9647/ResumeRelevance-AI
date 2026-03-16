import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col justify-center bg-white px-6 sm:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto w-full">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-sm text-slate-500 mb-6 text-center"
        >
          👋, I’m ResumeRelevance — your AI-powered resume coach
        </motion.p>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-extrabold leading-none tracking-tight text-slate-900"
            style={{ fontSize: 'clamp(3.5rem, 12vw, 11rem)' }}
          >
            Resume
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="outline-heading font-extrabold leading-none tracking-tight"
            style={{ fontSize: 'clamp(3.5rem, 12vw, 11rem)' }}
          >
            Relevance
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          <p className="text-sm text-slate-500">powered by AI, built for job seekers.</p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#analyzer"
              className="px-7 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
            >
              You need a resume review
            </a>
            <a
              href="#analyzer"
              className="px-7 py-3 rounded-full border border-slate-300 text-slate-900 text-sm font-semibold hover:bg-slate-50 transition"
            >
              You need an ATS boost
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
