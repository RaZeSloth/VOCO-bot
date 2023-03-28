import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, codeBlock, ComponentType, EmbedBuilder, StringSelectMenuBuilder } from 'discord.js';
import { command, lesson, week_type } from '../util/interfaces';
import lessonsModel from '../model/lessonsModel';

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
	type: ApplicationCommandType.ChatInput,
	description: 'Näe nädalate tunniplaani',
	options: [
		{
			name: 'näita',
			description: 'Näita tunniplaani',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'järgmine_nädal',
					description: 'Näita järgmise nädala tunniplaani',
					type: ApplicationCommandOptionType.Boolean,
				},
			],
		},
		{
			name: 'seadista',
			description: 'Seadista tunniplaani gruppe',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'tund',
					description: 'Tund, mida muuta',
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
				},
				{
					name: 'grupp',
					description: 'Grupp',
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
				},
			],
		},
	],
	async autocomplete(client, int) {
		const subcommand = int.options.getSubcommand();
		if (subcommand === 'seadista') {
			const focused = int.options.getFocused(true);
			if (focused.name === 'tund') {
				const lessons = await lessonsModel.find({});
				const lesson_names = lessons.map(lesson => ({ name: lesson.lessonName, group: lesson?.lessonGroup }));
				const lesson_filtered = lesson_names.map((lesson, index) => ({ lesson: lesson, index: index.toString() })).filter(data => data.lesson.name.toLowerCase().includes(focused.value));
				const firstTenLessons = lesson_names.map((lesson, index) => ({ name: turnicate(lesson, 90), value: index.toString() })).slice(0, 23);
				return await int.respond(focused.value !== '' ? lesson_filtered.map(data => ({ name: turnicate(data.lesson, 90), value: data.index })).slice(0, 23) : firstTenLessons);
			}
			if (focused.name === 'grupp') {
				const lesson_groups = ['1', '2', '1+2', '1/2'];
				const lesson_filtered = lesson_groups.filter(grupp => grupp.toLowerCase().includes(focused.value));
				return await int.respond(lesson_filtered.map(grupp => ({ name: grupp, value: grupp })));
			}
		}
	},
	async execute(client, int: ChatInputCommandInteraction) {
		const subcommand = int.options.getSubcommand();
		if (subcommand === 'näita') {
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
						embed.addFields({ name: lesson.time, value: codeBlock(lesson.lessons.map(data => `${data.name}${(data?.lesson_group) ? ` - ${data.lesson_group}` : ''}`).join('\n\n')) });
					}
				}
				if (lessons[0] && next_week_selected) {
					for (const lesson of lessons[0]) {
						embed.addFields({ name: lesson.time, value: codeBlock(lesson.lessons.map(data => `${data.name}${(data?.lesson_group) ? ` - ${data.lesson_group}` : ''}`).join('\n\n')) });
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
					embed.addFields({ name: lesson.time, value: codeBlock(lesson.lessons.map(data => `${data.name}${(data?.lesson_group) ? ` - ${data.lesson_group}` : ''}`).join('\n\n')) });
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
						embed.addFields({ name: lesson.time, value: codeBlock(lesson.lessons.map(data => `${data.name}${(data?.lesson_group) ? ` - ${data.lesson_group}` : ''}`).join('\n\n')) });
					}
				}
				await i.update({ embeds: [embed], components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(updatedSelect)] });
			});
		}
		if (subcommand === 'seadista') {
			if (int.user.id !== '777474453114191882') {
				await int.reply({ ephemeral: true, content: 'Praegast on see command ainult Mikule' });
				return;
			}
			const tund = (await lessonsModel.find({}))[parseInt(int.options.getString('tund'))];

			if (!tund) {
				await int.reply({ ephemeral: true, content: 'Sellist tundi ei eksisteeri' });
				return;
			}
			const grupp = int.options.getString('grupp');
			tund.lessonGroup = grupp;
			await tund.save();
			const embed = new EmbedBuilder()
				.setTitle('Tunniplaan updatitud')
				.setColor('#000000')
				.setDescription(`Tund ${codeBlock(tund.lessonName)} on nüüd ${codeBlock(grupp)}`);
			await int.reply({ ephemeral: true, embeds: [embed] });
		}
	},
} as command;

function turnicate(lessonData: { name: string, group: string }, length: number) {
	const str = lessonData.name.length > length ? lessonData.name.slice(0, length - 3) + '...' : lessonData.name;
	if (lessonData.group) {
		return `${str} (${lessonData.group})`;
	}
	return str;
}