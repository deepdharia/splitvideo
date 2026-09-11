import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Scissors } from 'lucide-react'
import { cn } from '../lib/utils'

const nav = [
  { to: '/video-splitter', label: 'Video Splitter' },
  { to: '/video-trimmer', label: 'Video Trimmer' },
  { to: '/video-cropper', label: 'Video Cropper' },
  { to: '/blog', label: 'Blog' },
  { to: '/faq', label: 'FAQ' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-teal-800">
          <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center">
            <Scissors className="w-5 h-5" />
          </div>
          SplitVideo
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'text-teal-700 bg-teal-50' : 'text-slate-600 hover:text-teal-700'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/#tool" className="btn-primary ml-3 text-sm">
            Upload Video
          </Link>
        </nav>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/#tool" onClick={() => setOpen(false)} className="block btn-primary text-center mt-2">
            Upload Video
          </Link>
        </div>
      )}
    </header>
  )
}
