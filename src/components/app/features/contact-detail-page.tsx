'use client'

import { useAppStore } from '@/store/app-store'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Phone, MessageSquare, StickyNote,
  Mail, Building2, MapPin, Calendar, Tag, Clock,
  Send, Check, CheckCheck
} from 'lucide-react'

interface ContactDetail {
  id: string
  name: string
  phone: string
  email: string
  company: string
  location: string
  dateAdded: string
  status: 'active' | 'inactive'
  tags: string[]
  lastMessage: string
}

interface ChatMessage {
  id: string
  text: string
  time: string
  sent: boolean
  read: boolean
}

interface Activity {
  id: string
  text: string
  time: string
  icon: string
  color: string
}

const contactDetails: Record<string, ContactDetail> = {
  '1': { id: '1', name: 'John Smith', phone: '+1 234 567 8901', email: 'john.smith@email.com', company: 'Acme Corp', location: 'New York, US', dateAdded: '2024-01-15', status: 'active', tags: ['customer', 'vip'], lastMessage: 'Thanks for the update!' },
  '2': { id: '2', name: 'Sarah Johnson', phone: '+44 7911 123456', email: 'sarah.j@company.co.uk', company: 'TechStart Ltd', location: 'London, UK', dateAdded: '2024-01-14', status: 'active', tags: ['lead'], lastMessage: 'Interested in your product' },
  '3': { id: '3', name: 'Mike Chen', phone: '+86 138 0013 8000', email: 'mike.chen@shanghai.cn', company: 'Dragon Industries', location: 'Shanghai, CN', dateAdded: '2024-01-13', status: 'active', tags: ['customer'], lastMessage: 'Order confirmed' },
  '4': { id: '4', name: 'Emily Davis', phone: '+1 555 123 4567', email: 'emily.davis@mail.com', company: 'Freelance', location: 'Austin, US', dateAdded: '2024-01-12', status: 'inactive', tags: ['prospect'], lastMessage: '' },
  '5': { id: '5', name: 'Alex Rivera', phone: '+34 612 345 678', email: 'alex.r@negocio.es', company: 'Rivera Wholesale', location: 'Madrid, ES', dateAdded: '2024-01-11', status: 'active', tags: ['customer', 'wholesale'], lastMessage: 'Bulk order inquiry' },
  '6': { id: '6', name: 'Lisa Wong', phone: '+852 9123 4567', email: 'lisa.w@hkbiz.hk', company: 'Pacific Trading', location: 'Hong Kong', dateAdded: '2024-01-10', status: 'active', tags: ['lead', 'hot'], lastMessage: 'Price list request' },
  '7': { id: '7', name: 'David Brown', phone: '+61 4 1234 5678', email: 'david.b@ausretail.au', company: 'Outback Retail', location: 'Sydney, AU', dateAdded: '2024-01-09', status: 'active', tags: ['customer'], lastMessage: 'Delivery confirmed' },
  '8': { id: '8', name: 'Anna Mueller', phone: '+49 151 1234 5678', email: 'anna.m@berlin-tech.de', company: 'BerlinTech GmbH', location: 'Berlin, DE', dateAdded: '2024-01-08', status: 'inactive', tags: ['prospect'], lastMessage: '' },
}

const mockMessages: ChatMessage[] = [
  { id: 'm1', text: 'Hi! I wanted to ask about your latest product offerings.', time: '10:32 AM', sent: false, read: true },
  { id: 'm2', text: 'Of course! We just launched our new line. Let me send you the catalog.', time: '10:34 AM', sent: true, read: true },
  { id: 'm3', text: 'That would be great! Also, do you have any bulk pricing?', time: '10:36 AM', sent: false, read: true },
  { id: 'm4', text: 'Yes, we offer tiered pricing for orders over 100 units. I\'ll include those details too.', time: '10:38 AM', sent: true, read: true },
  { id: 'm5', text: 'Perfect, looking forward to it!', time: '10:40 AM', sent: false, read: true },
  { id: 'm6', text: 'Thanks for the update!', time: '10:42 AM', sent: false, read: true },
]

const mockActivities: Activity[] = [
  { id: 'a1', text: 'Replied to campaign "Product Launch Promo"', time: '2 min ago', icon: 'reply', color: '#3b82f6' },
  { id: 'a2', text: 'Received auto-reply from Chatbot', time: '1 hour ago', icon: 'bot', color: '#8b5cf6' },
  { id: 'a3', text: 'Opened message from "Weekly Newsletter"', time: '3 hours ago', icon: 'eye', color: '#22c55e' },
  { id: 'a4', text: 'Clicked link in "Flash Sale Alert"', time: 'Yesterday', icon: 'link', color: '#f97316' },
  { id: 'a5', text: 'Added to contact list via Lead Scraper', time: '2 days ago', icon: 'plus', color: '#06b6d4' },
]

const tagColors: Record<string, string> = {
  customer: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  vip: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  lead: 'bg-green-500/15 text-green-400 border-green-500/20',
  hot: 'bg-red-500/15 text-red-400 border-red-500/20',
  prospect: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  wholesale: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
}

const activityIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  reply: Send,
  bot: MessageSquare,
  eye: CheckCheck,
  link: Check,
  plus: StickyNote,
}

export function ContactDetailPage() {
  const { selectedContactId, setActiveFeature } = useAppStore()

  const contact = selectedContactId ? contactDetails[selectedContactId] : null

  if (!contact) {
    return (
      <div className="px-4 py-6 pb-24 max-w-lg mx-auto text-center">
        <p className="text-white/40 text-sm">Contact not found</p>
        <button
          onClick={() => setActiveFeature(null)}
          className="mt-4 text-neon-blue text-sm font-semibold"
        >
          Go back
        </button>
      </div>
    )
  }

  const initials = contact.name.split(' ').map(n => n[0]).join('')

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => setActiveFeature(null)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <h1 className="text-lg font-extrabold text-white/95">Contact Details</h1>
      </div>

      {/* Contact Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 flex flex-col items-center text-center space-y-3"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-blue/40 to-neon-purple/40 border-2 border-white/10 flex items-center justify-center">
          <span className="text-2xl font-extrabold text-white/80">{initials}</span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white/90">{contact.name}</h2>
          <p className="text-sm text-white/55 flex items-center justify-center gap-1.5 mt-1">
            <Phone className="w-3.5 h-3.5" />
            {contact.phone}
          </p>
        </div>
        <span className={`text-[10px] font-medium px-3 py-1 rounded-full border ${
          contact.status === 'active'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-white/5 text-white/30 border-white/10'
        }`}>
          {contact.status === 'active' ? '● Active' : '● Inactive'}
        </span>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2.5"
      >
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-sm hover:bg-green-500/15 transition-colors">
          <MessageSquare className="w-4 h-4" /> Message
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-sm hover:bg-blue-500/15 transition-colors">
          <Phone className="w-4 h-4" /> Call
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold text-sm hover:bg-purple-500/15 transition-colors">
          <StickyNote className="w-4 h-4" /> Note
        </button>
      </motion.div>

      {/* Contact Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-5 space-y-3.5"
      >
        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Contact Info</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-white/30">Email</p>
              <p className="text-sm text-white/55 truncate">{contact.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-white/30">Company</p>
              <p className="text-sm text-white/55 truncate">{contact.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-white/30">Location</p>
              <p className="text-sm text-white/55">{contact.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-white/30">Date Added</p>
              <p className="text-sm text-white/55">{contact.dateAdded}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-5 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-white/40" />
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Tags</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {contact.tags.map((tag) => (
            <span
              key={tag}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${tagColors[tag] || 'bg-white/10 text-white/50 border-white/10'}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Conversation History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl p-5 space-y-3"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-white/40" />
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Recent Conversation</h3>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                  msg.sent
                    ? 'bg-green-500/5 border border-green-500/10 rounded-br-md'
                    : 'bg-white/5 border border-white/10 rounded-bl-md'
                }`}
              >
                <p className="text-sm text-white/80 leading-relaxed">{msg.text}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sent ? 'text-green-400/50' : 'text-white/30'}`}>
                  <span className="text-[9px]">{msg.time}</span>
                  {msg.sent && (
                    msg.read
                      ? <CheckCheck className="w-3 h-3" />
                      : <Check className="w-3 h-3" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-5 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-white/40" />
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Activity Timeline</h3>
        </div>
        <div className="space-y-0">
          {mockActivities.map((activity, index) => {
            const IconComponent = activityIcons[activity.icon] || MessageSquare
            return (
              <div key={activity.id} className="flex gap-3">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${activity.color}15` }}
                  >
                    <IconComponent className="w-3.5 h-3.5" style={{ color: activity.color }} />
                  </div>
                  {index < mockActivities.length - 1 && (
                    <div className="w-px flex-1 bg-white/10 my-1" />
                  )}
                </div>
                {/* Content */}
                <div className={`flex-1 ${index < mockActivities.length - 1 ? 'pb-4' : ''}`}>
                  <p className="text-sm text-white/55 leading-snug">{activity.text}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
