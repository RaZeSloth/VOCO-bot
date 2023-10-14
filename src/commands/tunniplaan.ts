import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, codeBlock, ComponentType, EmbedBuilder, StringSelectMenuBuilder } from 'discord.js';
import { command, lesson, week_type } from '../util/interfaces';
import lessonsModel from '../model/lessonsModel';
import { sanitizeString } from '../util/functions';
import emailModel from '../model/emailModel';

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
					choices: [
						{
							name: '1',
							value: '1',
						},
						{
							name: '2',
							value: '2',
						},
						{
							name: '1+2',
							value: '1+2',
						},
						{
							name: '1/2',
							value: '1/2',
						},
					],
				},
			],
		},
		{
			name: 'analüüsi',
			type: ApplicationCommandOptionType.Subcommand,
			description: 'Analüüsi tunniplaani',
		},
		{
			name: 'liitu',
			type: ApplicationCommandOptionType.Subcommand,
			description: 'Liitu tunniplaani uuendustega',
			options: [
				{
					name: 'email',
					type: ApplicationCommandOptionType.String,
					description: 'Email, kuhu saata tunniplaani uuendused',
					required: true,
				},
			],
		},
		{
			name: 'lahku',
			type: ApplicationCommandOptionType.Subcommand,
			description: 'Lahku tunniplaani uuendustest',
		},
	],
	async autocomplete(client, int) {
		const subcommand = int.options.getSubcommand();
		if (subcommand === 'seadista') {
			const focused = int.options.getFocused(true);
			const lessons = await lessonsModel.find({});
			const lesson_names = lessons.map(lesson => ({ name: lesson.lessonName, group: lesson?.lessonGroup }));
			const lesson_filtered = lesson_names.map((lesson, index) => ({ lesson: lesson, index: index.toString() })).filter(data => data.lesson.name.toLowerCase().includes(focused.value.toLowerCase()));
			const firstTenLessons = lesson_names.map((lesson, index) => ({ name: turnicate(lesson, 90), value: index.toString() })).slice(0, 23);
			return await int.respond(focused.value !== '' ? lesson_filtered.map(data => ({ name: turnicate(data.lesson, 90), value: data.index })).slice(0, 23) : firstTenLessons);
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
			const weeksToCache = [week_type.this_week, week_type.next_week];
			for (const week of weeksToCache) {
				const cachedWeek = client.cache.get(week);
				if (cachedWeek) {
					for (const day of cachedWeek) {
						for (const lesson of day) {
							const matchingLesson = lesson.lessons.find(lessonData => sanitizeString(lessonData.name) === tund.lessonName);
							if (matchingLesson) {
								matchingLesson.lesson_group = grupp;
								client.cache.set(week, cachedWeek);
							}
						}
					}
				}
			}
			const embed = new EmbedBuilder()
				.setTitle('Tunniplaan updatitud')
				.setColor('#000000')
				.setDescription(`Tund ${codeBlock(tund.lessonName)} on nüüd ${codeBlock(grupp)}`);
			await int.reply({ ephemeral: true, embeds: [embed] });
		}
		if (subcommand === 'analüüsi') {
			await int.deferReply({ ephemeral: true });
			const day = new Date().getDay();
			let lessons: lesson[][];
			if (day >= 1 && day <= 5) {
				lessons = client.cache.get(week_type.this_week);
				if (!lessons) {
					lessons = await (await import('../util/tunniplaan')).getAllSchoolTimesAndLessons();
					client.cache.set(week_type.this_week, lessons);
				}
			} else {
				lessons = client.cache.get(week_type.next_week);
				if (!lessons) {
					lessons = await (await import('../util/tunniplaan')).getAllSchoolTimesAndLessons({ getNextWeek: true });
					client.cache.set(week_type.next_week, lessons);
				}
			}
			let totalLessonCount = 0;
			const lessonCountForGroup = { group_1: 0, group_2: 0, group_1_2: 0 };
			for (let i = 0; i < lessons.length; i++) {
				for (let j = 0; j < lessons[i].length; j++) {
					totalLessonCount += lessons[i][j].lesson_count || 0;
					lessonCountForGroup.group_1 += lessons[i][j].lessons.reduce((acc, lesson) => acc + (lesson.lesson_group === '1' ? 1 : 0), 0);
					lessonCountForGroup.group_2 += lessons[i][j].lessons.reduce((acc, lesson) => acc + (lesson.lesson_group === '2' ? 1 : 0), 0);
					lessonCountForGroup.group_1_2 += lessons[i][j].lessons.reduce((acc, lesson) => acc + (lesson.lesson_group === '1+2' || lesson.lesson_group === '1/2' ? 1 : 0), 0);


				}
			}
			const embed = new EmbedBuilder()
				.setTitle('Tunniplaan analüüs')
				.setColor('#000000')
				// .setDescription(`Tunde kokku: ${codeBlock(totalLessonCount.toString())}\nTunde esimesel rühmal: ${codeBlock(lessonCountForGroup.group_1.toString())}\nTunde teisel rühmal: ${codeBlock(lessonCountForGroup.group_2.toString())}\nTunde koos: ${codeBlock(lessonCountForGroup.group_1_2.toString())}`);
				.addFields({ name: 'Tunde kokku', value: `${codeBlock(totalLessonCount.toString())}` }, { name: 'Tunde esimesel rühmal', value: codeBlock(lessonCountForGroup.group_1.toString()), inline: true }, { name: 'Tunde teisel rühmal', value: codeBlock(lessonCountForGroup.group_2.toString()), inline: true }, { name: 'Tunde koos', value: codeBlock(lessonCountForGroup.group_1_2.toString()), inline: true });
			await int.editReply({ embeds: [embed] });
		}
		if (subcommand === 'liitu') {
			await int.deferReply({ ephemeral: true });
			const email = int.options.getString('email');
			// Check if email is an actual email with regex
			if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) {
				await int.editReply({ content: 'See pole õige email' });
				return;
			}
			const emailExists = await emailModel.exists({ userId: int.user.id });
			if (emailExists) {
				const emailData = await emailModel.findOne({ userId: int.user.id });
				emailData.email = email;
				emailData.lastUpdated = new Date();
				emailData.save();
				await int.editReply({ content: 'Email edukalt uuendatud' });
				return;
			}
			const emailData = new emailModel({ email: email, userId: int.user.id, lastUpdated: new Date() });
			await emailData.save();
			await int.editReply({ content: 'Email edukalt lisatud' });
		}
		if (subcommand === 'lahku') {
			await int.deferReply({ ephemeral: true });
			const emailExists = await emailModel.exists({ userId: int.user.id });
			if (!emailExists) {
				await int.editReply({ content: 'Sa ei ole liitunud tunniplaani uuendustega' });
				return;
			}
			await emailModel.deleteOne({ userId: int.user.id });
			await int.editReply({ content: 'Email edukalt eemaldatud' });
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