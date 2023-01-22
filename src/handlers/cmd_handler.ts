import { VocoBot } from '../util/Bot';
import glob from 'glob';
import path from 'path';
import { yellow, green } from 'chalk';
import { command } from '../util/interfaces';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextBasedChannel } from 'discord.js';
export = async (client: VocoBot) => {
	const failid = glob.sync(path.resolve(__dirname, '../commands/**/*.{js,ts}'));
	if (failid.length <= 0) return console.log(yellow('Pole kommande lol'));
	const slashCmdArray: command[] = [];
	for (const file of failid) {
		const slashCommand = await import(file);
		slashCmdArray.push(slashCommand.default);
		client.commands.set(slashCommand.name, slashCommand);
	}
	client.on('ready', async () => {
		console.log(green(`Startup: ${new Date()}`));
		// (client.channels.cache.get('1022185184298283068') as TextBasedChannel).send({ embeds: [new EmbedBuilder().setColor('#000000').setTitle('Reeglid!').setDescription('1. Jälgi [Discordi reegleid](https://discord.com/guidelines)\n2. Kasuta </defineeri:1022073502108495912> kommandi, et seada endale grupi rolli.\n3. Olge lugupidav, kodanikusõbralik ja vastutulelik.\n4. Ei mingit sobimatut või ebaturvalist sisu.\n5. Ärge kuritarvitage ega saatke rämpsposti üheski kanalis.\n6. NSFW sisu ei ole mingil juhul lubatud.\n7. Selle serveri esmane keel on eesti keel.\n8. Discord nimed ja avatarid peavad olema sobilikud.\n9. Ärge pingige inimesi ilma nende taga oleva õigustatud põhjenduseta.\n10. Ärge reklaamige ilma loata.\n11. Ei mingeid suuri spoilereid ühestki animest, filmist, telesaatest või mängust avalikel kanalitel.\n12. Püsige teemas ja kasutage kanaleid õigesti.\n13. Kuulake serveri admine :)')] });
		// await (await client.channels.fetch('1029435516644507768') as TextBasedChannel).send({ content: 'Vajuta nuppe', components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel('Tunni ping').setStyle(ButtonStyle.Primary).setCustomId('add_role_tund'), new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId('add_role_buss').setLabel('Bussi ping'))] });
		await client.application.commands.set(slashCmdArray);
	});
}
