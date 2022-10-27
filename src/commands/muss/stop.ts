import { VocoBot } from '../../util/Bot';
import { command } from '../../util/interfaces';

export = {
	name: 'stop',
	description: 'Stopi muusika',
	async execute(client: VocoBot, int) {
		if (!int.inCachedGuild()) return;
		if (!client.music.getQueue(int.guild.id)) return int.reply({ content: 'Midagi pole mängimas', ephemeral: true });
		await client.music.stop(int.guild.id);
		await int.reply({ content: 'Muss läbi', ephemeral: true });
	},
} as command