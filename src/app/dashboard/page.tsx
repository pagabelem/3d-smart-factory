import { redirect } from "next/navigation"
import { auth } from "@/src/lib/auth"

export default async function DashboardPage() {
  const session = await auth()
  const role = session?.user?.role
  
  if (role === "ADMIN") redirect("/dashboard/admin")
  if (role === "ENCADRANT") redirect("/dashboard/encadrant")
  if (role === "STAGIAIRE") redirect("/dashboard/stagiaire")
  
  redirect("/login")
}