'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Users, Shield, UserPlus, Crown, Eye, Settings,
  Search, Check, X, Mail, Clock, ChevronRight, Loader2,
  KeyRound, Activity, LogIn, Pencil
} from 'lucide-react'

type Role = 'admin' | 'manager' | 'agent' | 'viewer'

interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  avatarColor: string
  isOnline: boolean
  lastActive: string
  permissions: string[]
}

interface ActivityEntry {
  id: string
  type: 'member_added' | 'role_changed' | 'login' | 'permission_updated' | 'member_removed'
  memberName: string
  detail: string
  timestamp: string
  color: string
}

const roleConfig: Record<Role, {
  label: string
  color: string
  bgClass: string
  borderClass: string
  textClass: string
  description: string
  icon: React.ReactNode
}> = {
  admin: {
    label: 'Admin',
    color: '#8b5cf6',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/20',
    textClass: 'text-purple-400',
    description: 'Full access to all features and settings',
    icon: <Crown className="w-3.5 h-3.5" />,
  },
  manager: {
    label: 'Manager',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
    textClass: 'text-blue-400',
    description: 'Manage campaigns, contacts, and analytics',
    icon: <Shield className="w-3.5 h-3.5" />,
  },
  agent: {
    label: 'Agent',
    color: '#22c55e',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/20',
    textClass: 'text-green-400',
    description: 'Send messages and manage conversations',
    icon: <Users className="w-3.5 h-3.5" />,
  },
  viewer: {
    label: 'Viewer',
    color: '#64748b',
    bgClass: 'bg-gray-500/10',
    borderClass: 'border-gray-500/20',
    textClass: 'text-gray-400',
    description: 'Read-only access to dashboards and reports',
    icon: <Eye className="w-3.5 h-3.5" />,
  },
}

const allPermissions = [
  'Campaigns',
  'Contacts',
  'Templates',
  'Analytics',
  'Settings',
  'API Access',
]

const activityIcons: Record<ActivityEntry['type'], React.ReactNode> = {
  member_added: <UserPlus className="w-3.5 h-3.5" />,
  role_changed: <Crown className="w-3.5 h-3.5" />,
  login: <LogIn className="w-3.5 h-3.5" />,
  permission_updated: <KeyRound className="w-3.5 h-3.5" />,
  member_removed: <X className="w-3.5 h-3.5" />,
}

const avatarColors = ['#8b5cf6', '#3b82f6', '#22c55e', '#f97316', '#ec4899', '#06b6d4', '#f59e0b', '#ef4444']

export function TeamManagementPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()

  const [members, setMembers] = useState<TeamMember[]>([])
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('agent')
  const [invitePermissions, setInvitePermissions] = useState<string[]>(['Campaigns', 'Contacts'])
  const [isInviting, setIsInviting] = useState(false)

  const onlineCount = members.filter(m => m.isOnline).length
  const roleCounts: Record<string, number> = {}
  members.forEach(m => {
    roleCounts[m.role] = (roleCounts[m.role] || 0) + 1
  })

  const filteredMembers = useMemo(() => {
    let filtered = members
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'all') {
      filtered = filtered.filter(m => m.role === roleFilter)
    }
    return filtered
  }, [searchQuery, roleFilter, members])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2)
  }

  const togglePermission = useCallback((perm: string) => {
    setInvitePermissions(prev =>
      prev.includes(perm)
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    )
  }, [])

  const handleInvite = useCallback(() => {
    if (!inviteName.trim()) {
      addToast({ type: 'warning', title: 'Name Required', message: 'Please enter the team member\'s name' })
      return
    }
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      addToast({ type: 'warning', title: 'Invalid Email', message: 'Please enter a valid email address' })
      return
    }
    setIsInviting(true)
    setTimeout(() => {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        avatarColor: avatarColors[members.length % avatarColors.length],
        isOnline: true,
        lastActive: 'Now',
        permissions: [...invitePermissions],
      }
      setMembers(prev => [...prev, newMember])

      const newActivity: ActivityEntry = {
        id: Date.now().toString(),
        type: 'member_added',
        memberName: inviteName.trim(),
        detail: `Added as ${roleConfig[inviteRole].label}`,
        timestamp: 'Just now',
        color: '#22c55e',
      }
      setActivityLog(prev => [newActivity, ...prev])

      setIsInviting(false)
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteName('')
      setInvitePermissions(['Campaigns', 'Contacts'])
      addToast({
        type: 'success',
        title: 'Member Added!',
        message: `${inviteName} has been added as ${roleConfig[inviteRole].label}`,
        duration: 4000,
      })
    }, 1500)
  }, [inviteName, inviteEmail, inviteRole, invitePermissions, members.length, addToast])

  const handleRemoveMember = useCallback((member: TeamMember) => {
    setMembers(prev => prev.filter(m => m.id !== member.id))
    const newActivity: ActivityEntry = {
      id: Date.now().toString(),
      type: 'member_removed',
      memberName: member.name,
      detail: 'Removed from team',
      timestamp: 'Just now',
      color: '#ef4444',
    }
    setActivityLog(prev => [newActivity, ...prev])
    addToast({ type: 'info', title: 'Member Removed', message: `${member.name} has been removed from the team` })
  }, [addToast])

  const filterTabs: { key: Role | 'all'; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: members.length },
    { key: 'admin', label: 'Admin', count: roleCounts['admin'] || 0 },
    { key: 'manager', label: 'Manager', count: roleCounts['manager'] || 0 },
    { key: 'agent', label: 'Agent', count: roleCounts['agent'] || 0 },
    { key: 'viewer', label: 'Viewer', count: roleCounts['viewer'] || 0 },
  ]

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={goBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Users
              className="w-5 h-5 text-purple-400"
              style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.5))' }}
            />
            <h1 className="text-lg font-extrabold text-white/95">Team Management</h1>
          </div>
          <p className="text-[10px] text-white/40 mt-0.5">Manage team members & roles</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-3 text-center stat-card-purple">
          <div className="w-7 h-7 mx-auto rounded-lg bg-purple-500/10 flex items-center justify-center mb-1.5">
            <Users className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-xl font-extrabold text-white/95">{members.length}</p>
          <p className="text-[9px] text-white/50 font-semibold">Members</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center stat-card-green">
          <div className="w-7 h-7 mx-auto rounded-lg bg-green-500/10 flex items-center justify-center mb-1.5 relative">
            <Activity className="w-3.5 h-3.5 text-green-400" />
            {onlineCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-breathe bg-green-400" style={{ color: '#22c55e' }} />
            )}
          </div>
          <p className="text-xl font-extrabold text-white/95">{onlineCount}</p>
          <p className="text-[9px] text-white/50 font-semibold">Online</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center stat-card-blue">
          <div className="w-7 h-7 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-xl font-extrabold text-white/95">{Object.keys(roleCounts).length}</p>
          <p className="text-[9px] text-white/50 font-semibold">Roles</p>
        </div>
      </div>

      <div className="gradient-divider" />

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.07] transition-all"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {filterTabs.map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all duration-200 ${
                roleFilter === tab.key
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                  : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              {tab.label}
              <span className={`text-[9px] px-1 py-0.5 rounded-md font-bold ${
                roleFilter === tab.key ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/25'
              }`}>
                {tab.count}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Team Members List */}
      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
        <AnimatePresence mode="popLayout">
          {members.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center">
                <Users className="w-8 h-8 text-purple-400/50" />
              </div>
              <p className="text-sm text-white/50 font-semibold mb-1">No team members yet</p>
              <p className="text-xs text-white/30 mb-4 max-w-[240px] mx-auto">
                Add team members to collaborate on campaigns, contacts, and more.
              </p>
              <motion.button
                onClick={() => setShowInviteModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-purple-500/10 border border-purple-500/25 text-purple-300 font-semibold text-xs hover:from-purple-500/30 hover:to-purple-500/15 transition-all"
                style={{ boxShadow: '0 0 18px rgba(139,92,246,0.15)' }}
              >
                <UserPlus className="w-3.5 h-3.5" /> Add Team Member
              </motion.button>
            </motion.div>
          ) : filteredMembers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-medium">No members found</p>
              <p className="text-xs text-white/25 mt-1">Try adjusting your search or filter</p>
            </motion.div>
          ) : (
            filteredMembers.map((member, i) => {
              const config = roleConfig[member.role]
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-all duration-200 cursor-pointer group"
                  whileHover={{
                    boxShadow: `0 0 15px ${config.color}08`,
                  }}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white/80"
                      style={{
                        background: `linear-gradient(135deg, ${member.avatarColor}30, ${member.avatarColor}10)`,
                        border: `1.5px solid ${member.avatarColor}25`,
                      }}
                    >
                      {getInitials(member.name)}
                    </div>
                    {member.isOnline && (
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0c0c14] animate-pulse-dot"
                        style={{ boxShadow: '0 0 6px rgba(34,197,94,0.6)' }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-[12px] font-bold text-white/90 truncate">{member.name}</h3>
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${config.bgClass} ${config.textClass} border ${config.borderClass}`}
                      >
                        {config.icon}
                        {config.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/35 truncate">{member.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {member.permissions.slice(0, 3).map(perm => (
                        <span
                          key={perm}
                          className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 font-medium"
                        >
                          {perm}
                        </span>
                      ))}
                      {member.permissions.length > 3 && (
                        <span className="text-[8px] text-white/20">+{member.permissions.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[9px] text-white/25 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {member.lastActive}
                    </span>
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); handleRemoveMember(member) }}
                      whileTap={{ scale: 0.9 }}
                      className="text-[9px] text-red-400/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Remove
                    </motion.button>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Invite Button */}
      {members.length > 0 && (
        <motion.button
          onClick={() => setShowInviteModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-purple-500/10 border border-purple-500/25 text-purple-300 font-semibold text-sm hover:from-purple-500/30 hover:to-purple-500/15 transition-all"
          style={{ boxShadow: '0 0 18px rgba(139,92,246,0.15)' }}
        >
          <UserPlus className="w-4 h-4" /> Invite Team Member
        </motion.button>
      )}

      {/* Role Definitions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/15">
            <Shield className="w-3 h-3 text-neon-purple" />
            <span className="text-[11px] font-bold text-purple-400/90 uppercase tracking-wider">Roles</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(roleConfig) as Role[]).map((role, i) => {
            const config = roleConfig[role]
            const memberCount = roleCounts[role] || 0
            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={`glass-card rounded-xl p-3 ${config.bgClass} border ${config.borderClass}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}15`, border: `1px solid ${config.color}25` }}
                  >
                    <div style={{ color: config.color }}>{config.icon}</div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold" style={{ color: config.color }}>{config.label}</p>
                    <p className="text-[8px] text-white/30">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <p className="text-[9px] text-white/35 leading-relaxed">{config.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/15">
            <Activity className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider">Activity</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
        </div>
        {activityLog.length === 0 ? (
          <div className="glass-card rounded-2xl py-10 text-center">
            <Activity className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-white/30 font-medium">No activity yet</p>
            <p className="text-[10px] text-white/20 mt-1">Team activity will appear here as members are added</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
            {activityLog.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${entry.color}12`, border: `1px solid ${entry.color}20` }}
                >
                  <div style={{ color: entry.color }}>{activityIcons[entry.type]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/75 font-medium truncate">
                    <span className="font-bold text-white/90">{entry.memberName}</span> — {entry.detail}
                  </p>
                  <p className="text-[9px] text-white/30 mt-0.5">{entry.timestamp}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#14141f] border-t border-white/10 rounded-t-3xl p-5 space-y-4"
            >
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/95">Add Team Member</h3>
                  <p className="text-[10px] text-white/40">Add a new member to your team</p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/50 font-medium">Full Name</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-purple-500/30 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/50 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-purple-500/30 transition-all"
                  />
                </div>
              </div>

              {/* Role Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/50 font-medium">Role</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(roleConfig) as Role[]).map((role) => {
                    const config = roleConfig[role]
                    return (
                      <motion.button
                        key={role}
                        onClick={() => setInviteRole(role)}
                        whileTap={{ scale: 0.95 }}
                        className={`py-2 rounded-xl text-[10px] font-semibold transition-all duration-200 flex flex-col items-center gap-1 ${
                          inviteRole === role
                            ? `${config.bgClass} ${config.textClass} border ${config.borderClass}`
                            : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06]'
                        }`}
                      >
                        <div style={{ color: inviteRole === role ? config.color : undefined }}>{config.icon}</div>
                        {config.label}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/50 font-medium flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Permissions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {allPermissions.map((perm) => {
                    const isSelected = invitePermissions.includes(perm)
                    return (
                      <motion.button
                        key={perm}
                        onClick={() => togglePermission(perm)}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-1.5 py-2 px-2 rounded-lg text-[10px] font-medium transition-all ${
                          isSelected
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-white/[0.03] text-white/35 border border-white/[0.06]'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3 h-3 text-purple-400" />
                        ) : (
                          <X className="w-3 h-3 text-white/15" />
                        )}
                        {perm}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <motion.button
                  onClick={() => setShowInviteModal(false)}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 font-medium text-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleInvite}
                  disabled={isInviting}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> Add Member
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
