import { motion } from 'framer-motion'

const cards = [
  { title: 'AI Tutor', tone: 'from-indigo-500 to-blue-500' },
  { title: 'Courses', tone: 'from-cyan-500 to-teal-500' },
  { title: 'Certificates', tone: 'from-emerald-500 to-green-500' },
  { title: 'Analytics', tone: 'from-sky-500 to-indigo-500' },
  { title: 'Assignments', tone: 'from-amber-500 to-orange-500' },
  { title: 'Coding', tone: 'from-violet-500 to-fuchsia-500' },
  { title: 'Progress', tone: 'from-indigo-500 to-cyan-500' },
  { title: 'Live Classes', tone: 'from-blue-500 to-sky-500' },
]

const FloatingCards = () => {
  return (
    <div className="relative grid grid-cols-2 gap-3 pt-6 sm:grid-cols-4 lg:grid-cols-2">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.12 * index, duration: 0.45 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className={`rounded-3xl border border-white/10 bg-gradient-to-br ${card.tone} p-[1px] shadow-[0_20px_60px_rgba(15,23,42,0.22)]`}
        >
          <div className="rounded-[1.35rem] bg-slate-950/80 px-4 py-4 text-left backdrop-blur-xl">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Feature</div>
            <div className="mt-2 text-sm font-semibold text-white">{card.title}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default FloatingCards
