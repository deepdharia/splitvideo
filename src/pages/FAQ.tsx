import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const faqs = [
  { q: 'Is SplitVideo free?', a: 'Yes. The core tools are free. Processing happens in your browser.' },
  { q: 'Do I need an account?', a: 'No. You can process videos without signing up.' },
  { q: 'What formats are supported?', a: 'MP4, WebM, MOV, AVI and MKV. MP4 works best.' },
  { q: 'Is my video uploaded?', a: 'No. All processing is done locally in your browser. Files never leave your device.' },
  { q: 'How large can my video be?', a: 'Under ~200–500 MB usually works well depending on your device.' },
  { q: 'Can I split into multiple clips?', a: 'Yes. Use Split mode and add split points on the timeline.' },
  { q: 'Can I crop videos?', a: 'Yes. Common aspect ratios including 9:16, 1:1 and 16:9 are supported.' },
  { q: 'Can I use it on mobile?', a: 'Yes. The interface works on modern phones and tablets.' },
]

export default function FAQ() {
  useEffect(() => { document.title = 'FAQ — SplitVideo' }, [])
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Frequently asked questions</h1>
      <div className="space-y-6">
        {faqs.map((f) => (
          <div key={f.q} className="card p-5">
            <h2 className="font-semibold text-slate-900">{f.q}</h2>
            <p className="mt-2 text-slate-600 text-sm">{f.a}</p>
          </div>
        ))}
      </div>
      <p className="mt-10 text-sm text-slate-500">
        Still have questions? <Link to="/contact" className="text-teal-700 hover:underline">Contact us</Link>.
      </p>
    </div>
  )
}
