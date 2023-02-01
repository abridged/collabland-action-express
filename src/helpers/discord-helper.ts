import {
  APIChatInputApplicationCommandInteraction,
  ApplicationCommandOptionType,
} from "discord-api-types/v10";

/**
 * Get value for command option
 * @param interaction - Discord interaction object
 * @param name - Option name
 * @returns
 */
export function getCommandOptionValue<
  T extends string | number | boolean = string
>(
  interaction: APIChatInputApplicationCommandInteraction,
  name: string
): T | undefined {
  const option = interaction.data.options?.find((o) => o.name === name);
  if (option == null) return undefined;
  switch (option.type) {
    case ApplicationCommandOptionType.String:
      return option.value as T;
    case ApplicationCommandOptionType.Boolean:
      return option.value as T;
    case ApplicationCommandOptionType.Number:
    case ApplicationCommandOptionType.Integer:
      return option.value as T;
    case ApplicationCommandOptionType.Mentionable:
    case ApplicationCommandOptionType.User:
    case ApplicationCommandOptionType.Role:
      return option.value as T;
    case ApplicationCommandOptionType.Channel:
      return option.value as T;
  }
}
