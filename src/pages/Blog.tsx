import { Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function Blog() {
  useEffect(() => { document.title = 'Blog — SplitVideo' }, [])
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Blog</h1>
      <p className="text-slate-600 mb-10">Guides on splitting, trimming and cropping videos.</p>
      <div className="card p-6">
        <p className="text-slate-600">More articles coming soon. Try the tools on the homepage in the meantime.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">Go to tools</Link>
      </div>
    </div>
  )
}
