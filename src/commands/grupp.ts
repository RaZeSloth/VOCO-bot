import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { command } from '../util/interfaces';

export = {
	name: 'grupp',
	description: 'Vali enda grupp ja saa ✨special✨ gruppi role',
	dmPermission: false,
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'grupp',
			type: ApplicationCommandOptionType.String,
			required: true,
			description: 'Vali kas grupp 1 või grupp 2',
			choices: [
				{
					name: 'Grupp 1',
					value: 'g1',
				},
				{
					name: 'Grupp 2',
					value: 'g2',
				},
			],
		},
	],
	async execute(client, int: ChatInputCommandInteraction) {
		const grupp = int.options.getString('grupp');
		await int.reply({ ephemeral: true, content: grupp === 'g1' ? 'Grupp 1' : 'Grupp 2' });
	},
} as command;