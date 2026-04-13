import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, EmbedBuilder, LabelBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { inspect } from 'util';
import { VocoBot } from '../util/Bot';
import { useModal } from '../util/functions';
import { command } from '../util/interfaces';

export = {
	name: 'eval',
	description: 'JavaScripti eval funktsioon',
	options: [
		{
			name: 'nähtavus',
			type: ApplicationCommandOptionType.String,
			description: 'Kas näidata tulemust või mitte (Kui ei ole valitud, siis on nähtav)',
			choices: [
				{
					name: 'nähtav',
					value: 'visible',
				},
				{
					name: 'peidetud',
					value: 'hidden',
				},
			],

		},
	],
	async execute(client: VocoBot, int: ChatInputCommandInteraction) {
		if (int.user.id !== '777474453114191882') {
			return int.reply({ flags: MessageFlags.Ephemeral, content: 'ඞ' });
		}
		const d = Date.now();
		const deleteButton = new ButtonBuilder()
			.setCustomId('del')
			.setEmoji('883358104320868353')
			.setStyle(ButtonStyle.Danger);
		const modal = new ModalBuilder()
			.addLabelComponents(new LabelBuilder().setLabel('Code').setTextInputComponent(new TextInputBuilder().setCustomId('code').setRequired(true).setStyle(TextInputStyle.Paragraph)))
			.setTitle('Eval modal 📥')
			.setCustomId(`eval_${d}`);
		const editModalInt = await useModal(int, modal, 20 * 60 * 60 * 1000);
		if (!editModalInt) return;
		const code = editModalInt.fields.getTextInputValue('code');
		const embed = new EmbedBuilder();


		try {
			let evaled = await eval(code),
				output;
			if (evaled?.constructor.name === 'Promise') {
				output = '📤 Output (Promise)';
			} else {
				output = '📤 Output';
			}
			if (inspect(evaled).length > 800) {
				evaled = inspect(evaled).substring(0, 800) + '...';
			}
			console.log(int.options.getString('nähtavus'));
			const hidden = int.options.getString('nähtavus') === 'hidden';
			embed
				.addFields({ name: '📥 Input', value: `\`\`\`\n${(code.length > 1024) ? code.substring(0, 990) + '...' : code}\n\`\`\`` }, { name: output, value: `\`\`\`js\n${evaled}\n\`\`\`` }, { name: 'Status', value: 'Success' })
				.setColor('#000000');
			const response = await editModalInt.reply({ embeds: [embed], components: hidden ? [] : [new ActionRowBuilder<ButtonBuilder>().addComponents(deleteButton)], flags: hidden ? MessageFlags.Ephemeral : undefined });
			const msg = await response.fetch();
			if (!hidden) {
				const inter = await msg.awaitMessageComponent({ componentType: ComponentType.Button, filter: (m) => int.user.id === m.user.id }).catch(() => null);
				if (inter) {
					if (inter.customId === 'del') {
						await inter.deferUpdate().catch(() => null);
						await msg.delete().catch(() => null);
					} else {
						return;
					}
				}
			}
			return;
		} catch (e) {
			const hidden = int.options.getString('nähtavus') === 'hidden';

			embed
				.addFields(
					{ name: '📥 Input', value: `\`\`\`\n${(code.length > 1024) ? code.substring(0, 990) + '...' : code}\n\`\`\`` },
					{ name: '📤 Output', value: `\`\`\`js\n${(e.length > 1024) ? e.substring(0, 990) + '...' : e.message}\n\`\`\`` },
					{ name: 'Status', value: 'Error' },
				)
				.setColor('#000000');
			const response = await editModalInt.reply({ embeds: [embed], components: hidden ? [] : [new ActionRowBuilder<ButtonBuilder>().addComponents(deleteButton)], flags: hidden ? MessageFlags.Ephemeral : undefined });
			const msg = await response.fetch();
			if (!hidden) {
				const inter = await msg.awaitMessageComponent({ componentType: ComponentType.Button, filter: (m) => int.user.id === m.user.id }).catch(() => null);
				if (inter) {
					if (inter.customId === 'del') {
						await inter.deferUpdate().catch(() => null);
						await msg.delete().catch(() => null);
					} else {
						return;
					}
				}
			}

			return;
		}
	},
} as command;