import { VocoBot } from '../../util/Bot';
import { command } from '../../util/interfaces';

export = {
	name: 'skipi',
	description: 'Skipi muusikat',
	async execute(client: VocoBot, int) {
		if (!int.inCachedGuild()) return;
		if (!client.music.getQueue(int.guild.id) || client.music.getQueue(int.guild.id).songs.length <= 1) return int.reply({ content: 'Midagi pole mängimas või on ainult üks laul mängimas', ephemeral: true });
		await int.reply({ content: 'Skipin...', ephemeral: true });
		await client.music.skip(int.guild.id);
		await int.editReply({ content: 'Skipitud!' });
	},
} as command