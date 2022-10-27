import { codeBlock, EmbedBuilder } from 'discord.js';
import { VocoBot } from '../../util/Bot';
import { colors, command } from '../../util/interfaces';

export = {
	name: 'järjekord',
	description: 'Näe muusika järjekorda',
	async execute(client: VocoBot, int) {
		const queue = client.music.getQueue(int.guild.id);
		if (!queue) return int.reply({ content: 'Midagi pole mängimas', ephemeral: true });
		const embed = new EmbedBuilder()
			.setDescription(codeBlock(queue.songs.map((song, i) => {
				return `${`#${i + 1}`} - ${song.name} | ${song.formattedDuration}`;
			}).join('\n')))
			.setColor(colors.embed_color);
		await int.reply({ embeds: [embed], ephemeral: true });
	},
} as command;