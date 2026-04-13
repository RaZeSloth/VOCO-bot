import { ApplicationCommandType, MessageFlags } from 'discord.js';
import { command } from '../util/interfaces';

export = {
	name: 'abi',
	description: 'Saa nats abi',
	type: ApplicationCommandType.ChatInput,
	async execute(client, int) {
		await int.reply({ flags: MessageFlags.Ephemeral, content: 'WIP' });
	},
} as command;