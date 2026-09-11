import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import ToolPage from './pages/ToolPage'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import StaticPage from './pages/StaticPage'
import NotFound from './pages/NotFound'
import FAQ from './pages/FAQ'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/video-splitter" element={<ToolPage mode="split" />} />
            <Route path="/video-trimmer" element={<ToolPage mode="trim" />} />
            <Route path="/video-cropper" element={<ToolPage mode="crop" />} />
            <Route path="/split-video-online" element={<ToolPage mode="split" />} />
            <Route path="/trim-video-online" element={<ToolPage mode="trim" />} />
            <Route path="/crop-video-online" element={<ToolPage mode="crop" />} />
            <Route path="/video-tools" element={<ToolPage mode="trim" />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<StaticPage type="about" />} />
            <Route path="/contact" element={<StaticPage type="contact" />} />
            <Route path="/privacy-policy" element={<StaticPage type="privacy" />} />
            <Route path="/terms" element={<StaticPage type="terms" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
