import { ApplicationCommandDataResolvable, ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { VocoBot } from './Bot';

type command = ApplicationCommandDataResolvable & {
	execute(client: VocoBot, int: ChatInputCommandInteraction | ContextMenuCommandInteraction): unknown | Promise<unknown>
}

export { command };