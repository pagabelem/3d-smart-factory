import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const [totalProjects, totalStagiaires, totalEncadrants, commitsThisWeek] = await Promise.all([
    prisma.project.count(),
    prisma.user.count({ where: { role: "STAGIAIRE" } }),
    prisma.user.count({ where: { role: "ENCADRANT" } }),
    prisma.gitCommit.count({
      where: {
        commitDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    })
  ])

  return NextResponse.json({
    totalProjects,
    totalStagiaires,
    totalEncadrants,
    commitsThisWeek,
  })
}