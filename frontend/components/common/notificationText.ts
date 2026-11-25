import type { NotificationItem } from "@/types/notification";
import { translate, type Language } from "@/services/translations";

export function getNotificationMessage(
  notification: NotificationItem,
  language: Language = "fr",
) {
  const title =
    notification.request?.title || translate(language, "Demande sans titre");
  const actor =
    notification.actor?.username || translate(language, "Un étudiant");

  switch (notification.kind) {
    case "proposal_received":
      return translate(
        language,
        "{{actor}} a proposé son aide pour votre demande « {{title}} ».",
      )
        .replace("{{actor}}", actor)
        .replace("{{title}}", title);
    case "proposal_accepted":
      return translate(
        language,
        "{{actor}} a accepté votre proposition d’aide pour « {{title}} ».",
      )
        .replace("{{actor}}", actor)
        .replace("{{title}}", title);
    case "proposal_rejected":
      return translate(
        language,
        "{{actor}} a refusé votre proposition d’aide pour « {{title}} ».",
      )
        .replace("{{actor}}", actor)
        .replace("{{title}}", title);
    case "proposal_not_selected":
      return translate(
        language,
        "Un autre étudiant a été retenu pour la demande « {{title}} ».",
      ).replace("{{title}}", title);
    case "review_received":
      return translate(language, "{{actor}} a évalué la séance « {{title}} ».")
        .replace("{{actor}}", actor)
        .replace("{{title}}", title);
  }
}
