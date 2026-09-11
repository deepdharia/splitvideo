import { Link } from 'react-router-dom'
import { Scissors, Crop, Split, Smartphone, Shield, Zap, Film, CheckCircle } from 'lucide-react'
import VideoTool from '../components/VideoTool'

export default function Home() {
  return (
    <>
      <section className="bg-gradient-to-b from-teal-50 to-slate-50 pt-12 pb-8 sm:pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Split, Trim & Crop Videos Online
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Quickly split videos into clips, trim unwanted sections and crop videos to the perfect size — directly in your browser.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="#tool" className="btn-primary text-base px-6 py-3">Upload Video</a>
            <p className="text-sm text-slate-500 self-center">No account required.</p>
          </div>
        </div>
      </section>

      <section id="tool" className="py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <VideoTool />
        </div>
      </section>

      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            {['Free to start', 'No account needed', 'Browser processing', 'Simple interface', 'Privacy-first', 'Works on mobile'].map((t) => (
              <div key={t} className="flex flex-col items-center gap-2">
                <CheckCircle className="w-6 h-6 text-teal-600" />
                <span className="text-sm font-medium text-slate-700">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">How it works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Upload your video', desc: 'Drag & drop or select a file.' },
              { step: '2', title: 'Choose your edits', desc: 'Set start/end times or add split points.' },
              { step: '3', title: 'Process your video', desc: 'Everything runs in your browser.' },
              { step: '4', title: 'Download your clips', desc: 'Get individual clips ready to use.' },
            ].map((item) => (
              <div key={item.step} className="card p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center mx-auto mb-4">{item.step}</div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-teal-800 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to split your video?</h2>
          <p className="mt-3 text-teal-100">No signup. No installs. Just upload and cut.</p>
          <a href="#tool" className="inline-block mt-6 btn bg-white text-teal-800 hover:bg-teal-50">Start now</a>
        </div>
      </section>
    </>
  )
}
