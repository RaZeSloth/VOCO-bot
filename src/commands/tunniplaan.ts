import { ActionRowBuilder, ApplicationCommandOptionType, ChatInputCommandInteraction, codeBlock, ComponentType, EmbedBuilder, StringSelectMenuBuilder } from 'discord.js';
import { command, lesson, week_type } from '../util/interfaces';

const days = [
	{
		label: 'Esmaspäev',
		value: '1',
	},
	{
		label: 'Teisipäev',
		value: '2',
	},
	{
		label: 'Kolmapäev',
		value: '3',
	},
	{
		label: 'Neljapäev',
		value: '4',
	},
	{
		label: 'Reede',
		value: '5',
	},
];
export = {
	name: 'tunniplaan',
	description: 'Näe nädalate tunniplaani',
	options: [
		{
			name: 'järgmine_nädal',
			description: 'Kas näidata järgmise nädala tunniplaani?',
			required: false,
			type: ApplicationCommandOptionType.Boolean,
		},
	],
	async execute(client, int: ChatInputCommandInteraction) {
		await int.deferReply({ ephemeral: true });
		const day = new Date().getDay();
		const date = Date.now();
		let lesson_array: lesson[][] = [];
		let embed: EmbedBuilder;
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(`tunniplaan_${date}`)
			.setPlaceholder('Vali päev')
			.addOptions(days);

		if (day >= 1 && day <= 5) {
			let lessons: lesson[][];
			const next_week_selected: boolean = int.options.getBoolean('järgmine_nädal');
			if (next_week_selected) {
				lessons = await (await import('../util/tunniplaan')).getAllSchoolTimesAndLessons({ getNextWeek: true });
				client.cache.set(week_type.next_week, lessons);

			} else if (client.cache.has(week_type.this_week)) {
				lessons = client.cache.get(week_type.this_week);
			} else {
				lessons = await (await import('../util/tunniplaan')).getAllSchoolTimesAndLessons();
				client.cache.set(week_type.this_week, lessons);
			}
			lesson_array = lessons;
			embed = new EmbedBuilder()
				.setTitle('Tunniplaan')
				.setColor('#000000')
				.setDescription(next_week_selected ? 'See on järgmise esmaspäevase päeva tunniplaan' : 'See on tänane tunniplaan');
			if (lessons[day - 1] && !next_week_selected) {
				for (const lesson of lessons[day - 1]) {
					embed.addFields({ name: lesson.time, value: codeBlock(lesson.lessons.join('\n\n')) });
				}
			}
			if (lessons[0] && next_week_selected) {
				for (const lesson of lessons[0]) {
					embed.addFields({ name: lesson.time, value: codeBlock(lesson.lessons.join('\n\n')) });
				}
			}
		} else {
			let lessons: lesson[][];
			if (client.cache.has(week_type.next_week)) {
				lessons = client.cache.get(week_type.next_week);
			} else {
				lessons = await (await import('../util/tunniplaan')).getAllSchoolTimesAndLessons({ getNextWeek: true });
			}
			lesson_array = lessons;
			embed = new EmbedBuilder()
				.setTitle('Tunniplaan')
				.setColor('#000000')
				.setDescription('See on järgmise nädala esmaspäeva tunniplaan');
			for (const lesson of lessons[0]) {
				embed.addFields({ name: lesson.time, value: codeBlock(lesson.lessons.join('\n\n')) });
			}

		}
		const r = await int.followUp({ ephemeral: true, embeds: [embed], components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)] });
		const col = r.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 20 * 60_000 });
		col.on('collect', async (i) => {
			const day = parseInt(i.values[0]);
			const updatedSelect = selectMenu.setPlaceholder(`Vali päev (${days[day - 1].label})`);
			const currentDay = new Date().getDay();
			const next_week_selected: boolean = int.options.getBoolean('järgmine_nädal');
			const embed = new EmbedBuilder()
				.setTitle('Tunniplaan')
				.setColor('#000000')
				.setDescription(`See on ${(currentDay >= 1 && currentDay <= 5 && !next_week_selected) ? '' : 'järgmise'} ${days[day - 1].label.toLowerCase()}${day !== 5 ? 'ase' : 'se'} päeva tunniplaan`);
			if (lesson_array[day - 1]) {
				for (const lesson of lesson_array[day - 1]) {
					embed.addFields({ name: lesson.time, value: codeBlock(lesson.lessons.join('\n\n')) });
				}
			}
			await i.update({ embeds: [embed], components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(updatedSelect)] });
		});
	},
} as command;