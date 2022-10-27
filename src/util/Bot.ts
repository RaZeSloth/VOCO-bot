import { ChatInputCommandInteraction, Client, codeBlock, Collection, EmbedBuilder, GatewayIntentBits, GuildTextBasedChannel } from 'discord.js';
import path from 'path';
import { colors, command, lesson } from './interfaces';
import dt from 'distube';
class VocoBot extends Client {
	commands: Collection<string, command>;
	cache: Collection<number, lesson[][]>;
	music: dt;
	constructor() {
		super({ intents: [GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
		this.commands = new Collection();
		this.cache = new Collection();
	}
	async dt_launch() {
		const distube = new dt(this, {
			searchSongs: 0,
			searchCooldown: 0,
			emitNewSongOnly: true,
			emitAddSongWhenCreatingQueue: false,
			savePreviousSongs: true,
			emptyCooldown: 60,
			leaveOnEmpty: true,
			nsfw: false,
			leaveOnFinish: false,
		});
		distube.on('playSong', (queue, song) => {
			(song.metadata as { i: ChatInputCommandInteraction }).i.followUp({ embeds: [new EmbedBuilder().setDescription(`Pelun \`${song.name}\` - \`${song.formattedDuration}\``).setColor(colors.embed_color).setImage(song.thumbnail)] });
		});
		distube.on('addSong', (queue, song) => {
			(song.metadata as { i: ChatInputCommandInteraction }).i.followUp({ embeds: [new EmbedBuilder().setDescription(`Lisan \`${song.name}\` - \`${song.formattedDuration}\``).setColor(colors.embed_color).setImage(song.thumbnail)] });
		});
		distube.on('addList', (queue, playlist) => {
			(playlist.metadata as { i: ChatInputCommandInteraction }).i.followUp({ embeds: [new EmbedBuilder().setDescription(`Lisan playlisti \`${playlist.name}\` - \`${playlist.songs.length}\` laulu`).setColor(colors.embed_color)] });
		});
		distube.on('error', (chan, err) => {
			(this.channels.cache.get('1035257987364827156') as GuildTextBasedChannel).send({ embeds: [new EmbedBuilder().setDescription(codeBlock(err.message)).setColor(colors.embed_color), new EmbedBuilder().setDescription(codeBlock(err.stack)).setColor(colors.embed_color)] });
		});

		this.music = distube;
	}
	async start() {
		['cmd_handler', 'event_handler'].map(async hand => await (await import(path.resolve(__dirname, `../handlers/${hand}`))).default(this));
		await (await import('../util/tunniplaan')).init();
		await this.dt_launch();
	}
}

export { VocoBot };
