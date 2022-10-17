import { ApplicationCommandDataResolvable, ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { VocoBot } from './Bot';

type command = ApplicationCommandDataResolvable & {
	execute(client: VocoBot, int: ChatInputCommandInteraction | ContextMenuCommandInteraction): unknown | Promise<unknown>
}

type partial_lesson = { lesson: string | null; time: string | null; }[];
type raw_lesson = { time: string; lesson: string; };
type lesson = { time?: string; special_lesson?: string; group_1?: string, group_2?: string };


export { command, lesson, partial_lesson, raw_lesson };