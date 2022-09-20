import { AttachmentBuilder } from 'discord.js';
import path from 'path';
import { command } from '../util/interfaces';

export = {
	name: 'tunniplaan',
	description: 'Näe selle nädala tunniplaani',
	async execute(client, int) {
		await int.reply({ files: [new AttachmentBuilder(`${path.dirname(require.main.filename)}${path.sep}/img/tunniplaan.png`)] });
	},
} as command;