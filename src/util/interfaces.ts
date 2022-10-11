import { ApplicationCommandDataResolvable, ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { VocoBot } from './Bot';

type command = ApplicationCommandDataResolvable & {
	execute(client: VocoBot, int: ChatInputCommandInteraction | ContextMenuCommandInteraction): unknown | Promise<unknown>
}

type lesson = { lesson: string | null; time: string | null; }[];


export { command, lesson };