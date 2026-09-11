import { Link } from 'react-router-dom'
import { Scissors } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <Scissors className="w-4 h-4" />
              </div>
              SplitVideo
            </div>
            <p className="text-sm text-slate-400">
              Simple video tools for everyone. Split, trim and crop videos online — fast and private.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Tools</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/video-splitter" className="hover:text-teal-400">Video Splitter</Link></li>
              <li><Link to="/video-trimmer" className="hover:text-teal-400">Video Trimmer</Link></li>
              <li><Link to="/video-cropper" className="hover:text-teal-400">Video Cropper</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/blog" className="hover:text-teal-400">Blog</Link></li>
              <li><Link to="/faq" className="hover:text-teal-400">FAQ</Link></li>
              <li><Link to="/about" className="hover:text-teal-400">About</Link></li>
              <li><Link to="/contact" className="hover:text-teal-400">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="hover:text-teal-400">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-teal-400">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-10 pt-6 text-sm text-slate-500 text-center">
          © 2026 SplitVideo. All rights reserved. Processing happens in your browser.
        </div>
      </div>
    </footer>
  )
}
