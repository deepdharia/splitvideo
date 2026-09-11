import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import VideoTool from '../components/VideoTool'

const config = {
  trim: {
    title: 'Video Trimmer — Cut Videos Online Free',
    h1: 'Trim Videos Online',
    intro: 'Remove unwanted parts from the start or end of any video. Fast, private, and free.',
  },
  split: {
    title: 'Video Splitter — Split Videos into Clips Online',
    h1: 'Split Videos into Multiple Clips',
    intro: 'Cut one long video into several shorter clips. Perfect for Reels, Shorts and TikTok.',
  },
  crop: {
    title: 'Video Cropper — Crop Videos to 9:16, 1:1 & More',
    h1: 'Crop Videos Online',
    intro: 'Crop videos to popular aspect ratios like 9:16 for Reels, 1:1 for feeds, or custom sizes.',
  },
}

export default function ToolPage({ mode }: { mode: 'trim' | 'split' | 'crop' }) {
  const c = config[mode]
  useEffect(() => {
    document.title = `${c.title} | SplitVideo`
  }, [c])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <nav className="text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-teal-700">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{c.h1}</span>
      </nav>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">{c.h1}</h1>
      <p className="text-slate-600 max-w-2xl mb-8">{c.intro}</p>
      <VideoTool initialMode={mode} />
      <div className="mt-10 flex flex-wrap gap-4">
        <Link to="/video-splitter" className="btn-secondary text-sm">Video Splitter</Link>
        <Link to="/video-trimmer" className="btn-secondary text-sm">Video Trimmer</Link>
        <Link to="/video-cropper" className="btn-secondary text-sm">Video Cropper</Link>
      </div>
    </div>
  )
}
