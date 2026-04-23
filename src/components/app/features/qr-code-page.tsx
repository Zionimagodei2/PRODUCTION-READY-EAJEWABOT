'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, QrCode, Phone, MessageSquare, Users,
  Download, Copy, Trash2, Check, Paintbrush, FileImage,
  FileCode2, Type, Hash
} from 'lucide-react'

type QrType = 'direct' | 'prefilled' | 'group'
type QrSize = 'small' | 'medium' | 'large'
type QrColor = 'black' | 'dark-blue' | 'dark-green' | 'custom'

interface PastQrCode {
  id: string
  type: QrType
  label: string
  date: string
  value: string
}

const qrTypeOptions: { id: QrType; label: string; icon: React.ReactNode }[] = [
  { id: 'direct', label: 'Direct Message', icon: <Phone className="w-3.5 h-3.5" /> },
  { id: 'prefilled', label: 'Pre-filled Message', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: 'group', label: 'Group Invite', icon: <Users className="w-3.5 h-3.5" /> },
]

const qrSizeOptions: { id: QrSize; label: string; pixels: number }[] = [
  { id: 'small', label: 'Small', pixels: 140 },
  { id: 'medium', label: 'Medium', pixels: 180 },
  { id: 'large', label: 'Large', pixels: 220 },
]

const qrColorOptions: { id: QrColor; label: string; color: string }[] = [
  { id: 'black', label: 'Black', color: '#000000' },
  { id: 'dark-blue', label: 'Dark Blue', color: '#1e3a5f' },
  { id: 'dark-green', label: 'Dark Green', color: '#1a4d2e' },
  { id: 'custom', label: 'Custom', color: '#06b6d4' },
]

const pastQrCodes: PastQrCode[] = [
  { id: '1', type: 'direct', label: '+1 (555) 123-4567', date: 'Mar 4, 2026', value: 'wa.me/15551234567' },
  { id: '2', type: 'prefilled', label: 'Welcome message', date: 'Mar 2, 2026', value: 'wa.me/15551234567?text=Hello!' },
  { id: '3', type: 'group', label: 'Marketing Team', date: 'Feb 28, 2026', value: 'chat.whatsapp.com/invite/abc123' },
]

function getTypeLabel(type: QrType): string {
  switch (type) {
    case 'direct': return 'Direct Message'
    case 'prefilled': return 'Pre-filled Message'
    case 'group': return 'Group Invite'
  }
}

// Generate a mock QR code grid pattern
function useQrGrid(size: number, seed: number) {
  return useMemo(() => {
    const gridSize = size === 140 ? 21 : size === 180 ? 25 : 29
    const cellSize = size / gridSize
    const grid: boolean[][] = []

    // Simple seeded pseudo-random for consistent patterns
    let s = seed
    const rand = () => {
      s = (s * 16807 + 0) % 2147483647
      return (s - 1) / 2147483646
    }

    for (let row = 0; row < gridSize; row++) {
      const rowArr: boolean[] = []
      for (let col = 0; col < gridSize; col++) {
        // Corner position markers (3 large squares in corners)
        const isTopLeft = row < 7 && col < 7
        const isTopRight = row < 7 && col >= gridSize - 7
        const isBottomLeft = row >= gridSize - 7 && col < 7

        if (isTopLeft || isTopRight || isBottomLeft) {
          const r = isTopLeft ? row : isBottomLeft ? row - (gridSize - 7) : row
          const c = isTopLeft ? col : isTopRight ? col - (gridSize - 7) : col
          // Outer border
          if (r === 0 || r === 6 || c === 0 || c === 6) {
            rowArr.push(true)
          }
          // Inner square
          else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
            rowArr.push(true)
          } else {
            rowArr.push(false)
          }
        } else {
          // Random data pattern with ~50% fill
          rowArr.push(rand() > 0.5)
        }
      }
      grid.push(rowArr)
    }
    return { grid, gridSize, cellSize }
  }, [size, seed])
}

export function QrCodePage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()
  const [qrType, setQrType] = useState<QrType>('direct')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [prefilledMessage, setPrefilledMessage] = useState('')
  const [groupLink, setGroupLink] = useState('')
  const [messageText, setMessageText] = useState('')
  const [qrSize, setQrSize] = useState<QrSize>('medium')
  const [qrColor, setQrColor] = useState<QrColor>('black')
  const [isGenerated, setIsGenerated] = useState(false)
  const [seed, setSeed] = useState(42)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const maxChars = 500
  const selectedSize = qrSizeOptions.find(s => s.id === qrSize)!
  const selectedColor = qrColorOptions.find(c => c.id === qrColor)!
  const { grid, gridSize, cellSize } = useQrGrid(selectedSize.pixels, seed)

  const handleGenerate = () => {
    setSeed(Date.now())
    setIsGenerated(true)
    addToast({
      type: 'success',
      title: 'QR Code Generated',
      message: 'Your WhatsApp QR code is ready',
      duration: 3000,
    })
  }

  const handleCopyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      if (id) {
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      }
      addToast({
        type: 'success',
        title: 'Copied!',
        message: 'Link copied to clipboard',
        duration: 2000,
      })
    })
  }

  const getWhatsAppLink = () => {
    switch (qrType) {
      case 'direct':
        return phoneNumber ? `wa.me/${phoneNumber.replace(/[^0-9]/g, '')}` : ''
      case 'prefilled':
        return phoneNumber ? `wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(messageText || prefilledMessage)}` : ''
      case 'group':
        return groupLink ? `chat.whatsapp.com/${groupLink.replace(/.*\//, '')}` : ''
    }
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={goBack}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </motion.button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.4))' }} />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">QR Code Generator</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Generate scannable WhatsApp QR codes</p>
        </div>
      </div>

      {/* QR Type Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Type className="w-4 h-4 text-cyan-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">QR Code Type</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {qrTypeOptions.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => setQrType(option.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[10px] font-semibold transition-all duration-200 ${
                qrType === option.id
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60'
              }`}
              style={
                qrType === option.id
                  ? { boxShadow: '0 0 15px rgba(6,182,212,0.15)' }
                  : undefined
              }
            >
              {option.icon}
              <span className="truncate">{option.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Input Fields based on type */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-4 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-cyan-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Configuration</span>
        </div>

        <AnimatePresence mode="wait">
          {qrType === 'direct' && (
            <motion.div
              key="direct"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <label className="text-[11px] text-white/50 font-medium mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </motion.div>
          )}

          {qrType === 'prefilled' && (
            <motion.div
              key="prefilled"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] text-white/50 font-medium mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-white/50 font-medium mb-1.5 block">Pre-filled Message</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-white/20" />
                  <textarea
                    value={prefilledMessage}
                    onChange={(e) => setPrefilledMessage(e.target.value)}
                    placeholder="Hi! I'm interested in your products..."
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {qrType === 'group' && (
            <motion.div
              key="group"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <label className="text-[11px] text-white/50 font-medium mb-1.5 block">Group Invite Link</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="url"
                  value={groupLink}
                  onChange={(e) => setGroupLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message text with character count */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] text-white/50 font-medium">WhatsApp Message</label>
            <span className={`text-[10px] font-mono ${messageText.length > maxChars ? 'text-red-400' : 'text-white/30'}`}>
              {messageText.length}/{maxChars}
            </span>
          </div>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value.slice(0, maxChars))}
            placeholder="Enter a message to encode in the QR code..."
            rows={3}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none"
          />
        </div>

        {/* Generate Button */}
        <motion.button
          onClick={handleGenerate}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 text-cyan-400 font-bold text-sm border border-cyan-500/30 hover:border-cyan-500/50 transition-all"
          style={{ boxShadow: '0 0 20px rgba(6,182,212,0.15), 0 0 40px rgba(6,182,212,0.08)' }}
        >
          <div className="flex items-center justify-center gap-2">
            <QrCode className="w-4 h-4" />
            Generate QR Code
          </div>
        </motion.button>
      </motion.div>

      {/* QR Code Display */}
      <AnimatePresence>
        {isGenerated && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-card rounded-2xl p-6"
            style={{ boxShadow: '0 0 30px rgba(6,182,212,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-4 h-4 text-cyan-400/70" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Generated QR Code</span>
            </div>

            {/* QR Code Visual */}
            <div className="flex justify-center mb-4">
              <div
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{ background: '#ffffff' }}
              >
                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400/30 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400/30 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400/30 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400/30 rounded-br-lg" />

                <svg
                  width={selectedSize.pixels}
                  height={selectedSize.pixels}
                  viewBox={`0 0 ${selectedSize.pixels} ${selectedSize.pixels}`}
                >
                  {grid.map((row, r) =>
                    row.map((cell, c) =>
                      cell ? (
                        <rect
                          key={`${r}-${c}`}
                          x={c * cellSize}
                          y={r * cellSize}
                          width={cellSize - 0.5}
                          height={cellSize - 0.5}
                          rx={0.5}
                          fill={selectedColor.color}
                        />
                      ) : null
                    )
                  )}
                  {/* Cyan accent dot in center */}
                  <circle
                    cx={selectedSize.pixels / 2}
                    cy={selectedSize.pixels / 2}
                    r={cellSize * 1.5}
                    fill="#06b6d4"
                    opacity={0.8}
                  />
                  <circle
                    cx={selectedSize.pixels / 2}
                    cy={selectedSize.pixels / 2}
                    r={cellSize * 0.8}
                    fill="#ffffff"
                  />
                </svg>
              </div>
            </div>

            {/* WhatsApp Link */}
            {getWhatsAppLink() && (
              <div className="bg-white/[0.03] rounded-xl p-3 mb-4 border border-white/[0.06]">
                <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">Encoded Link</p>
                <p className="text-[11px] text-cyan-400/80 font-mono break-all">{getWhatsAppLink()}</p>
              </div>
            )}

            {/* Size selector */}
            <div className="mb-4">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2 block">QR Size</span>
              <div className="grid grid-cols-3 gap-2">
                {qrSizeOptions.map((size) => (
                  <motion.button
                    key={size.id}
                    onClick={() => setQrSize(size.id)}
                    whileTap={{ scale: 0.95 }}
                    className={`py-2 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
                      qrSize === size.id
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    {size.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Download Options */}
            <div className="grid grid-cols-3 gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => addToast({ type: 'success', title: 'Downloaded', message: 'QR code saved as PNG', duration: 2000 })}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-all text-[10px] font-semibold"
              >
                <FileImage className="w-3.5 h-3.5" />
                PNG
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => addToast({ type: 'success', title: 'Downloaded', message: 'QR code saved as SVG', duration: 2000 })}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-all text-[10px] font-semibold"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                SVG
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCopyToClipboard(getWhatsAppLink())}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-all text-[10px] font-semibold"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color Customization */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Paintbrush className="w-4 h-4 text-cyan-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">QR Code Color</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {qrColorOptions.map((colorOption) => (
            <motion.button
              key={colorOption.id}
              onClick={() => setQrColor(colorOption.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl transition-all duration-200 ${
                qrColor === colorOption.id
                  ? 'bg-cyan-500/10 border border-cyan-500/25'
                  : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              <div
                className="w-6 h-6 rounded-md border border-white/10"
                style={{ backgroundColor: colorOption.color, boxShadow: qrColor === colorOption.id ? `0 0 10px ${colorOption.color}40` : 'none' }}
              />
              <span className={`text-[9px] font-semibold ${qrColor === colorOption.id ? 'text-cyan-400' : 'text-white/40'}`}>
                {colorOption.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Previously Generated */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-4 h-4 text-white/30" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Previously Generated</span>
        </div>
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
          {pastQrCodes.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}
              >
                <QrCode className="w-4 h-4 text-cyan-400/70" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] text-white/75 font-medium truncate">{item.label}</p>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400/60 border border-cyan-500/15">
                    {getTypeLabel(item.type)}
                  </span>
                </div>
                <p className="text-[10px] text-white/30 mt-0.5">{item.date}</p>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleCopyToClipboard(item.value, item.id)}
                  className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-white/40" />
                  )}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-red-500/10 hover:border-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-white/40 hover:text-red-400" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
