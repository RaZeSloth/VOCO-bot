import { ActionRowBuilder, AttachmentBuilder, ComponentType, EmbedBuilder, SelectMenuBuilder } from 'discord.js';
import { command, lesson } from '../util/interfaces';
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
	async execute(client, int) {
		await int.deferReply({ ephemeral: true });
		const day = new Date().getDay();
		const date = Date.now();
		let lesson_array: lesson[] = [];
		let embed: EmbedBuilder;
		const selectMenu = new SelectMenuBuilder()
			.setCustomId(`tunniplaan_${date}`)
			.setPlaceholder('Vali päev')
			.addOptions(days);

		if (day >= 1 && day <= 5) {
			const lessons = await (await import('../util/tunniplaan')).getAllSchoolTimesAndLessons();
			lesson_array = lessons;
			embed = new EmbedBuilder()
				.setTitle('Tunniplaan')
				.setColor('#000000')
				.setDescription('See on tänane tunniplaan');
			for (const lesson of lessons[day - 1]) {
				embed.addFields({ name: lesson.time, value: lesson.lesson });
			}
		} else {
			const lessons = await (await import('../util/tunniplaan')).getAllSchoolTimesAndLessons({ getNextWeek: true });
			lesson_array = lessons;
			embed = new EmbedBuilder()
				.setTitle('Tunniplaan')
				.setColor('#000000')
				.setDescription('See on järgmise nädala esmaspäeva tunniplaan');
			for (const lesson of lessons[0]) {
				embed.addFields({ name: lesson.time, value: lesson.lesson });
			}

		}
		const r = await int.followUp({ ephemeral: true, embeds: [embed], components: [new ActionRowBuilder<SelectMenuBuilder>().addComponents(selectMenu)] });
		const col = r.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: 20 * 60_000 });
		col.on('collect', async (i) => {
			const day = parseInt(i.values[0]);
			const currentDay = new Date().getDay();
			const embed = new EmbedBuilder()
				.setTitle('Tunniplaan')
				.setColor('#000000')
				.setDescription(`See on ${currentDay >= 1 && currentDay <= 5 ? '' : 'järgmise'} ${days[day - 1].label.toLowerCase()}${day !== 5 ? 'ase' : 'se'} päeva tunniplaan`);
			for (const lesson of lesson_array[day - 1]) {
				embed.addFields({ name: lesson.time, value: lesson.lesson });
			}
			await i.update({ embeds: [embed] });
		});
	},
} as command;