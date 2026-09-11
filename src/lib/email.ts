import { Resend } from "resend"

export async function sendWelcomeEmail({
  to,
  prenom,
  encadrantName,
  dateDebut,
  dateFin,
}: {
  to: string
  prenom: string
  encadrantName: string
  dateDebut: string
  dateFin: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("RESEND_API_KEY non configuree, email de bienvenue non envoye a", to)
    return { sent: false, reason: "no_api_key" }
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: "3D Smart Factory <onboarding@resend.dev>",
      to,
      subject: "Bienvenue sur 3D Smart Factory",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bonjour ${prenom},</h2>
          <p>Bienvenue sur la plateforme <strong>3D Smart Factory</strong> !</p>
          <p>Votre compte stagiaire a ete cree avec succes. Voici un recapitulatif de vos informations :</p>
          <ul>
            <li>Email : ${to}</li>
            <li>Encadrant assigne : ${encadrantName}</li>
            <li>Debut de stage : ${dateDebut}</li>
            <li>Fin de stage : ${dateFin}</li>
          </ul>
          <p>Vous pouvez des a present vous connecter a votre espace personnel pour suivre votre progression, envoyer vos documents et consulter vos objectifs.</p>
          <p>Bon stage,<br>L'equipe 3D Smart Factory</p>
        </div>
      `,
    })

    return { sent: true }
  } catch (error) {
    console.error("Erreur envoi email de bienvenue:", error)
    return { sent: false, reason: "send_error" }
  }
}