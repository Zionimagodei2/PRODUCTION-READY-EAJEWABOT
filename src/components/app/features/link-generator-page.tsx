'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link2, ArrowLeft, Copy, CheckCircle2, ExternalLink, QrCode, MessageSquare } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

export function LinkGeneratorPage() {
  const { goBack } = useAppStore()
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [links, setLinks] = useState<{label: string; link: string; phone: string}[]>([])

  const generateLink = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const encodedMsg = encodeURIComponent(message)
    const link = `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`
    setGeneratedLink(link)
    if (phone) {
      setLinks(prev => [{ label: `Link ${prev.length + 1}`, link, phone }, ...prev])
    }
  }

  const copyLink = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={goBack} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white/90">Link Generator</h2>
          <p className="text-[10px] text-white/40">Create WhatsApp click-to-chat links</p>
        </div>
      </div>

      {/* Generator Form */}
      <div className="glass-card rounded-xl p-4 neon-glow-orange border border-orange-500/15">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500/10">
            <Link2 className="w-5 h-5 text-neon-orange" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">WhatsApp Link</h3>
            <p className="text-[10px] text-white/40">Generate wa.me click-to-chat links</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Phone Number (with country code)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-orange/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Pre-filled Message (optional)</label>
            <div className="relative">
              <MessageSquare className="w-3.5 h-3.5 text-white/20 absolute left-3 top-3" />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi, I'd like to know more about..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-orange/40 resize-none"
              />
            </div>
          </div>
          <button
            onClick={generateLink}
            disabled={!phone}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              phone
                ? 'bg-neon-orange/15 text-neon-orange border border-neon-orange/25 hover:bg-neon-orange/25'
                : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
            }`}
          >
            <Link2 className="w-4 h-4" /> Generate Link
          </button>
        </div>
      </div>

      {/* Generated Link */}
      {generatedLink && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 space-y-3"
        >
          <h4 className="text-xs font-semibold text-white/50">Generated Link</h4>
          <div className="bg-white/5 rounded-lg p-3 text-xs text-neon-cyan break-all font-mono border border-white/5">
            {generatedLink}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => copyLink(generatedLink)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-neon-blue/15 text-neon-blue border border-neon-blue/25 text-xs font-medium hover:bg-neon-blue/25 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <a
              href={generatedLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-neon-green/15 text-neon-green border border-neon-green/25 text-xs font-medium hover:bg-neon-green/25 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Test
            </a>
          </div>
        </motion.div>
      )}

      {/* Previous Links */}
      {links.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-white/50">Recent Links</h4>
          <div className="max-h-48 overflow-y-auto no-scrollbar space-y-2">
            {links.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/30">{item.phone}</p>
                  <p className="text-[9px] text-neon-cyan truncate font-mono">{item.link}</p>
                </div>
                <button
                  onClick={() => copyLink(item.link)}
                  className="ml-2 w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors shrink-0"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
