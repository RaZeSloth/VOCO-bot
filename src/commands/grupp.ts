import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js';
import { command } from '../util/interfaces';

export = {
	name: 'defineeri',
	description: 'Vali enda grupp ja saa ✨special✨ gruppi role',
	dmPermission: false,
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'nimi',
			description: 'Teie päris nimi, võib olla ka hüüdnimi.',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
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
		if (int.guild.id !== '1021468029726494751') return await int.reply({ content: 'See käsk töötab ainult ITA22 serveris!', ephemeral: true });
		const grupp = int.options.getString('grupp');
		const nimi = int.options.getString('nimi');
		const kasutaja = (int.member as GuildMember);
		await kasutaja.setNickname(nimi).catch((e) => console.error(e.name));
		if (kasutaja.roles.cache.hasAny('1021472465744044092', '1021472491367047188')) {
			await (int.member as GuildMember).roles.remove(['1021472465744044092', '1021472491367047188']);
		}
		await kasutaja.roles.add(grupp === 'g1' ? '1021472465744044092' : '1021472491367047188');
		return await int.reply({ embeds: [new EmbedBuilder().setColor('#000000').setDescription(`Nimi muutetud: **${nimi}**\nTeie grupp: ${grupp === 'g1' ? '<@&1021472465744044092>' : '<@&1021472491367047188>'}`)], ephemeral: true });
	},
} as command;