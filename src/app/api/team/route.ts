import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - Fetch all team members
export async function GET() {
  try {
    const members = await db.teamMember.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ members: members.map(m => ({ ...m, permissions: JSON.parse(m.permissions) })) })
  } catch (error) {
    console.error('Team GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

// POST - Add a new team member
export async function POST(request: Request) {
  try {
    const { name, email, role, permissions, avatarColor } = await request.json()
    if (!name || !email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    
    // Check for duplicate email
    const existing = await db.teamMember.findFirst({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Member with this email already exists' }, { status: 409 })
    
    const member = await db.teamMember.create({
      data: {
        name, email, role: role || 'agent',
        permissions: JSON.stringify(permissions || []),
        avatarColor: avatarColor || '#8b5cf6',
        isOnline: true, lastActive: 'Now'
      }
    })
    return NextResponse.json({ member: { ...member, permissions: JSON.parse(member.permissions) } }, { status: 201 })
  } catch (error) {
    console.error('Team POST error:', error)
    return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 })
  }
}

// PUT - Update a team member
export async function PUT(request: Request) {
  try {
    const { id, name, email, role, permissions, avatarColor, isOnline, lastActive } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    
    const member = await db.teamMember.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
        ...(permissions !== undefined && { permissions: JSON.stringify(permissions) }),
        ...(avatarColor !== undefined && { avatarColor }),
        ...(isOnline !== undefined && { isOnline }),
        ...(lastActive !== undefined && { lastActive }),
      }
    })
    return NextResponse.json({ member: { ...member, permissions: JSON.parse(member.permissions) } })
  } catch (error) {
    console.error('Team PUT error:', error)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}

// DELETE - Remove a team member
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    
    await db.teamMember.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Team DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 })
  }
}
