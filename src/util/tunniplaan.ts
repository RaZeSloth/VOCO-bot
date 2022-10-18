import Puppeteer from 'puppeteer';
import cron, { ScheduledTask } from 'node-cron';
import { green, yellow } from 'chalk';
import { lesson, partial_lesson, raw_lesson, week_type } from './interfaces';
import { client } from '..';
import { EmbedBuilder, GuildTextBasedChannel } from 'discord.js';
import { getFoodForToday } from './functions';
const cron_jobs: Set<ScheduledTask> = new Set();
const getAllSchoolTimesAndLessons_old = async (options?: { getNextWeek?: boolean }): Promise<partial_lesson[]> => {
	const lesson_array: string[] = [];
	const times_array: string[] = [];
	const b = await Puppeteer.launch({ headless: true });
	const page = await b.newPage();
	await page.goto('https://voco.ee/tunniplaan/');
	await page.select('#course_select', '1692');
	await new Promise(r => setTimeout(r, 2000));
	if (options?.getNextWeek) {
		await page.click('.fc-next-button');
		await new Promise(r => setTimeout(r, 2000));
	}
	const lessons = await page.$$('.fc-title');
	const timeWhenLesson = await page.$$('.fc-time span');
	for (const lesson of lessons) {
		const lesson_text = await page.evaluate(e => e.textContent, lesson);
		lesson_array.push(lesson_text);
	}
	for (const time of timeWhenLesson) {
		const time_text = await page.evaluate(e => e.textContent, time);
		times_array.push(time_text);
	}
	await b.close();
	const times = times_array.filter(d => {
		if (d.toString().includes('-')) {
			return d;
		}
	});
	let m: number;
	let c: number;
	const fil_times: partial_lesson[] = [];
	for (let k = 0; k < times.length; k++) {
		if (!m) {
			m = parseInt(times[k]);
			fil_times[0] = [{ lesson: lesson_array[k], time:times[k] }];
			c = k;
		} else if (m < parseInt(times[k])) {
			fil_times[c].push({ lesson: lesson_array[k], time:times[k] });
			m = parseInt(times[k]);
		} else if (m > parseInt(times[k])) {
			c++;
			fil_times[c] = [{ lesson: lesson_array[k], time:times[k] }];
			m = parseInt(times[k]);
		}
	}

	return fil_times;
};

const getAllSchoolTimesAndLessons = async (options?: { getNextWeek?: boolean }): Promise<lesson[][]> => {
	const b = await Puppeteer.launch({ headless: true });
	const page = await b.newPage();
	const raw_lessons_objects: raw_lesson[] = [];
	const url = `https://siseveeb.voco.ee/veebivormid/tunniplaan/tunniplaan?oppegrupp=1692&nadal=${!options?.getNextWeek ? new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', '.') : new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', '.')}`;
	await page.goto(url);
	await new Promise(r => setTimeout(r, 2000));
	const contents = await page.$$('.fc-content');
	for (const content of contents) {
		const content_object = await page.evaluate(e => {
			return { time: e.querySelector('.fc-time span')?.textContent, lesson: e.querySelector('.fc-title')?.textContent };
		}, content);
		if (content_object.time && content_object.lesson) {
			raw_lessons_objects.push(content_object);
		}
	}
	const les_object_arr: lesson[] = [];
	for (const partial_lesson of raw_lessons_objects) {
		if (partial_lesson.lesson.includes('R1')) {
			// console.log({ before: raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) + 1], after: raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) - 1] })
			// console.log({ currentLessonTime: partial_lesson.time, beforeLessonTime: raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) - 1].time, afterLessonTime: raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) + 1].time });
			const currentLessonTime = partial_lesson.time;
			const beforeLessonTime = raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) - 1].time;
			const afterLessonTime = raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) + 1].time;
			if (currentLessonTime === afterLessonTime) {
				les_object_arr.push({ group_1: partial_lesson.lesson, group_2: raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) + 1].lesson, time: partial_lesson.time });
			}
			if (currentLessonTime === beforeLessonTime) {
				les_object_arr.push({ group_1: partial_lesson.lesson, group_2: raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) - 1].lesson, time: partial_lesson.time });
			}
			if (currentLessonTime !== beforeLessonTime && currentLessonTime !== afterLessonTime) les_object_arr.push({ group_1: partial_lesson.lesson, group_2: raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) + 1].time === partial_lesson.time ? raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) + 1].lesson : raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) - 1].lesson, time: partial_lesson.time });
		}
		if (!partial_lesson.lesson.includes('R1') && !partial_lesson.lesson.includes('R2')) {
			const currentLessonTime = partial_lesson.time;
			const beforeLessonTime = raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) - 1]?.time;
			const afterLessonTime = raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) + 1]?.time;
			if (currentLessonTime === afterLessonTime) {
				les_object_arr.push({ group_1: partial_lesson.lesson, group_2: raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) + 1].lesson, time: partial_lesson.time });
			}
			if (currentLessonTime === beforeLessonTime) {
				les_object_arr.push({ group_1: partial_lesson.lesson, group_2: raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) - 1].lesson, time: partial_lesson.time });
			}

			les_object_arr.push({ special_lesson: partial_lesson.lesson, time: partial_lesson.time });
		}
		if (partial_lesson.lesson.includes('R2')) {
			continue;
		}
	}
	let m: number;
	let c: number;
	const fil_times: lesson[][] = [];
	for (let i = 0; i < les_object_arr.length; i++) {
		if (!m) {
			m = parseInt(les_object_arr[i].time);
			fil_times[0] = [les_object_arr[i]];
			c = i;
		} else if (m < parseInt(les_object_arr[i].time)) {
			fil_times[c].push(les_object_arr[i]);
			m = parseInt(les_object_arr[i].time);
		} else if (m > parseInt(les_object_arr[i].time)) {
			c++;
			fil_times[c] = [les_object_arr[i]];
			m = parseInt(les_object_arr[i].time);
		}
	}
	client.cache.set(options?.getNextWeek ? week_type.next_week : week_type.this_week, fil_times);
	return fil_times;
};

const getMinforCron = (time: string) => {
	return parseInt(time.split('-')[0].trim().split(':')[1]);
};

const getHourforCron = (time: string) => {
	return parseInt(time.split('-')[0].trim().split(':')[0]);
};

const getCrons = (time: string, eating_time?: boolean) => {
	const date = new Date();
	date.setHours(getHourforCron(time));
	date.setMinutes(getMinforCron(time));
	date.setMinutes(date.getMinutes() - 15);
	if (eating_time) {
		date.setMinutes(date.getMinutes() + 35);
	}
	return { string: `${date.getMinutes()} ${date.getHours()} * * *`, date };
};
const startCronJobs = async () => {
	const day = new Date().getDay();
	if (day >= 1 && day <= 5) {
		const data = await getAllSchoolTimesAndLessons();
		const currentDay = data[day - 1];
		for (const lesson of currentDay) {
			const lesson_object_cron = getCrons(lesson.time, currentDay.indexOf(lesson) === 2);
			const job = cron.schedule(lesson_object_cron.string, async () => {
				const notification_embed = new EmbedBuilder()
					.setTitle(lesson.time)
					.setColor('#000000');
				if (lesson.special_lesson) {
					notification_embed.setDescription(lesson.special_lesson);
				} else {
					notification_embed.setDescription(`${lesson.group_1}\n----------------------------------\n${lesson.group_2}`);
				}
				await (client.channels.cache.get('1029381699009794139') as GuildTextBasedChannel).send({ content: '<@&1029335363040329749>', embeds: [notification_embed] });
				job.stop();
			}, { timezone: 'Europe/Tallinn' });
			cron_jobs.add(job);
			console.log(green(`Lesson nr ${currentDay.indexOf(lesson) + 1} at ${lesson_object_cron.date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })} is scheduled`));
		}
		cron.schedule('45 11 * * *', async () => {
			const food = await getFoodForToday();
			await (client.channels.cache.get('1029381699009794139') as GuildTextBasedChannel).send({ content: 'Söömine! 12:00 - 12:30', files: [food] });
		}, { timezone: 'Europe/Tallinn' });
		console.log(green('Food at 11:45 is scheduled'));
	} else {
		console.log(yellow('Weekend day, skipping...'));
	}
};

export ={ init: async () => {
	await startCronJobs();
	cron.schedule('0 0 * * *', async () => {
		cron_jobs.forEach(job => job.stop());
		cron_jobs.clear();
		await (client.channels.cache.get('1029381699009794139') as GuildTextBasedChannel).bulkDelete(100).catch(() => null);
		await startCronJobs();
	}, { timezone: 'Europe/Tallinn' });
}, getAllSchoolTimesAndLessons, getAllSchoolTimesAndLessons_old };
