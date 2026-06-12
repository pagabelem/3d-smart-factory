/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const tasks = await prisma.task.findMany({
    include: {
      project: true,
      assignee: true,
    }
  })

  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, projectId, assigneeId, status } = body

  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      assigneeId,
      status,
    }
  })

  return NextResponse.json(task, { status: 201 })
}