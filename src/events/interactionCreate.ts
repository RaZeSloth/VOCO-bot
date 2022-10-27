import { Interaction } from 'discord.js';
import { VocoBot } from '../util/Bot';

export = async (client: VocoBot, int: Interaction) => {
	if (int.isChatInputCommand()) {
		const command = client.commands.get(int.commandName);
		if (!command) return;
		try {
			await command.execute(client, int);
		} catch (e) {
			console.error(e);
		}
	}
	if (int.isButton() && int.inCachedGuild()) {
		if (int.customId === 'add_role_tund') {
			if (int.member?.roles.cache.has('1029335363040329749')) {
				int.member.roles.remove('1029335363040329749');
				int.reply({ content: 'Eemaldasin <@&1029335363040329749> role!', ephemeral: true });
			} else {
				int.member.roles.add('1029335363040329749');
				int.reply({ content: 'Lisasin <@&1029335363040329749> role!', ephemeral: true });
			}
		}
	}
}