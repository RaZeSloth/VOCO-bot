import { CommandInteraction } from 'discord.js';
import { VocoBot } from '../util/Bot';

export = async (client: VocoBot, int: CommandInteraction) => {
	if (int.isChatInputCommand()) {
		const command = client.commands.get(int.commandName);
		try {
			await command.execute(client, int);
		}
		catch (e) {
			console.error(e);
		}

	}
}