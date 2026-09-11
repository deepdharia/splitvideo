import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const content: Record<string, { title: string; body: string }> = {
  about: {
    title: 'About SplitVideo',
    body: 'SplitVideo is a free online tool for splitting, trimming and cropping videos directly in your browser. All processing runs locally using WebAssembly. Your files never leave your device.',
  },
  contact: {
    title: 'Contact',
    body: 'For feedback or inquiries: hello@splitvideo.in',
  },
  privacy: {
    title: 'Privacy Policy',
    body: 'SplitVideo processes video files entirely in your web browser. We do not upload, store or transmit your video content to our servers. Last updated: September 2026.',
  },
  terms: {
    title: 'Terms of Service',
    body: 'By using SplitVideo you agree to use the service lawfully. The tool is provided as-is. You retain full ownership of any videos you process. Last updated: September 2026.',
  },
}

export default function StaticPage({ type }: { type: string }) {
  const c = content[type] || content.about
  useEffect(() => { document.title = `${c.title} | SplitVideo` }, [c])
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <nav className="text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-teal-700">Home</Link>
        <span className="mx-2">/</span>
        <span>{c.title}</span>
      </nav>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">{c.title}</h1>
      <p className="text-slate-600 leading-relaxed">{c.body}</p>
    </div>
  )
}
