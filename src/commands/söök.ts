import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { command } from '../util/interfaces';

export = {
	name: 'söök',
	description: 'Näe söögimenüüd',
	async execute(client, int) {
		await int.deferReply({ ephemeral: true });
		const embed = new EmbedBuilder()
			.setTitle('Söök')
			.setColor('#000000')
			.setDescription('See on tänane söök kell 12:00 - 12:30');
		const menu = await (await import('../util/functions')).getFoodForToday();
		embed.setImage('attachment://sook.png');
		await int.editReply({ embeds: [embed], files: [new AttachmentBuilder(menu, { name: 'sook.png' })] });
	},
} as command;