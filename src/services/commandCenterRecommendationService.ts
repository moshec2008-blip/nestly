import { getDailyFocus } from "@/services/commandCenterService";
import type {
  CommandCenterContext,
  CommandCenterItem,
  CommandCenterRecommendation,
  CommandCenterRecommendationProvider,
} from "@/types/commandCenter";

export class RuleBasedCommandCenterRecommendationProvider
  implements CommandCenterRecommendationProvider
{
  async recommendNextAction(
    _context: CommandCenterContext,
    items: CommandCenterItem[]
  ): Promise<CommandCenterRecommendation> {
    const item = getDailyFocus(items);

    return {
      item,
      reason: item?.reason ?? "אין כרגע פעולה אחת שדורשת טיפול.",
    };
  }
}

export const commandCenterRecommendationProvider =
  new RuleBasedCommandCenterRecommendationProvider();
