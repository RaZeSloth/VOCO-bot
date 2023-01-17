import { ApplicationCommandDataResolvable, ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { VocoBot } from './Bot';

type command = ApplicationCommandDataResolvable & {
	execute(client: VocoBot, int: ChatInputCommandInteraction | ContextMenuCommandInteraction): unknown | Promise<unknown>
}

type partial_lesson = { lesson: string | null; time: string | null; }[];
type raw_lesson = { time: string; lesson: string; };
type lesson = { time?: string; lessons: string[], lesson_count?: number };

enum week_type {
	'this_week' = 0,
	'next_week' = 1,
}
enum colors {
	'embed_color' = '#000000'
}
export { command, lesson, partial_lesson, raw_lesson, week_type, colors };