import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - Fetch all flows
export async function GET() {
  try {
    const flows = await db.flow.findMany({ orderBy: { updatedAt: 'desc' } })
    return NextResponse.json({ flows: flows.map(f => ({ ...f, nodes: JSON.parse(f.nodes) })) })
  } catch (error) {
    console.error('Flows GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch flows' }, { status: 500 })
  }
}

// POST - Create a new flow
export async function POST(request: Request) {
  try {
    const { name, description, nodes, active } = await request.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    
    const flow = await db.flow.create({
      data: { name, description: description || '', nodes: JSON.stringify(nodes || []), active: active || false }
    })
    return NextResponse.json({ flow: { ...flow, nodes: JSON.parse(flow.nodes) } }, { status: 201 })
  } catch (error) {
    console.error('Flows POST error:', error)
    return NextResponse.json({ error: 'Failed to create flow' }, { status: 500 })
  }
}

// PUT - Update a flow
export async function PUT(request: Request) {
  try {
    const { id, name, description, nodes, active } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    
    const flow = await db.flow.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(nodes !== undefined && { nodes: JSON.stringify(nodes) }),
        ...(active !== undefined && { active }),
      }
    })
    return NextResponse.json({ flow: { ...flow, nodes: JSON.parse(flow.nodes) } })
  } catch (error) {
    console.error('Flows PUT error:', error)
    return NextResponse.json({ error: 'Failed to update flow' }, { status: 500 })
  }
}

// DELETE - Delete a flow
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    
    await db.flow.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Flows DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete flow' }, { status: 500 })
  }
}
