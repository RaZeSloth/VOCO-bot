import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { VocoBot } from '../../util/Bot';
import { command } from '../../util/interfaces';

export = {
	name: 'pelu',
	description: 'Pela muusikat',
	options: [
		{
			name: 'muusika',
			description: 'Vali muusika (url või nimi)',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],
	async execute(client: VocoBot, int: ChatInputCommandInteraction) {
		const muusika = int.options.getString('muusika');
		if (!int.inCachedGuild()) return;
		await int.deferReply({ ephemeral: false });
		await client.music.play(int.member?.voice.channel, muusika, { metadata: { i: int } });

	},
} as command