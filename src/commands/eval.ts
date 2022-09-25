import { exec } from 'child_process';
import { ActionRowBuilder, ChatInputCommandInteraction, codeBlock, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { useModal } from '../util/functions';
import { command } from '../util/interfaces';

export = {
	name: 'bash',
	description: 'Reversitud bash shell boti hosti (Mõeldud ainult Mikule)',
	async execute(client, int: ChatInputCommandInteraction) {
		if (int.user.id !== '777474453114191882') {
			return int.reply({ ephemeral: true, content: 'Ainult Mikule mõeldud kommand.' });
		}
		const d = Date.now();
		const modal = new ModalBuilder()
			.setComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('code').setLabel('Script').setRequired(true).setStyle(TextInputStyle.Paragraph)))
			.setTitle('Reverse shelli input 📥')
			.setCustomId(`eval_${d}`);
		const editModalInt = await useModal(int, modal, 20 * 60 * 60 * 1000);
		if (!editModalInt) return;
		const code = editModalInt.fields.getTextInputValue('code');


		try {
			exec(code, (error, stdout, stderr) => {
				if (error) {
					editModalInt.reply({ embeds: [new EmbedBuilder().setTitle('Error (failure)').setColor('#000000').setDescription(codeBlock(error.message))] });
					return;
				}
				if (stderr) {
					editModalInt.reply({ embeds: [new EmbedBuilder().setTitle('Stderr (failure)').setColor('#000000').setDescription(codeBlock(stderr))] });
					return;
				}
				editModalInt.reply({ embeds: [new EmbedBuilder().setTitle('Stdout (success)').setColor('#000000').setDescription(codeBlock(stdout))] });
			});
			return;
		} catch (e) {
			editModalInt.reply({ content: e.toString() }).catch(() => null);
			return;
		}
	},
} as command;