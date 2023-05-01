import { ApplicationCommandDataResolvable, AutocompleteInteraction, ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { VocoBot } from './Bot';

type command = ApplicationCommandDataResolvable & {
	execute(client: VocoBot, int: ChatInputCommandInteraction | ContextMenuCommandInteraction): unknown | Promise<unknown>,
	autocomplete?(client: VocoBot, int: AutocompleteInteraction): unknown | Promise<unknown>,
}

type partial_lesson = { lesson: string | null; time: string | null; }[];
type raw_lesson = { time: string; lesson: string; };
type LessonGroup = '1' | '2' | '1+2' | '1/2' | string;

type lesson = { time?: string; lessons: {name: string, lesson_group?: LessonGroup}[], lesson_count?: number };
enum week_type {
	'this_week' = 0,
	'next_week' = 1,
}
enum colors {
	'embed_color' = '#000000'
}
export { command, lesson, partial_lesson, raw_lesson, week_type, colors, LessonGroup };