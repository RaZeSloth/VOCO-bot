import Puppeteer from 'puppeteer';
import cron, { ScheduledTask } from 'node-cron';
import { green } from 'chalk';
import { lesson } from './interfaces';
import { client } from '..';
import { TextBasedChannel } from 'discord.js';

const getAllSchoolTimesAndLessons = async (options?: { getNextWeek?: boolean }): Promise<lesson[]> => {
	const lesson_array: string[] = [];
	const times_array: string[] = [];
	const b = await Puppeteer.launch();
	const page = await b.newPage();
	await page.goto('https://voco.ee/tunniplaan/');
	await page.select('#course_select', '1692');
	await new Promise(r => setTimeout(r, 500));
	if (options?.getNextWeek) {
		await page.click('.fc-next-button');
		await new Promise(r => setTimeout(r, 500));
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
	const times = times_array.filter(d => {
		if (d.toString().includes('-')) {
			return d;
		}
	});
	let m: number;
	let c: number;
	const fil_times: lesson[] = [];
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

const getMinforCron = (time: string) => {
	return time.split('-')[0].trim().split(':')[1];
};

const getHourforCron = (time: string) => {
	return time.split('-')[0].trim().split(':')[0];
};
const startCronJobs = async (): Promise<ScheduledTask[]> => {
	const cron_job_array: ScheduledTask[] = [];
	const data = await getAllSchoolTimesAndLessons();
	const day = new Date().getDay();
	if (day > 1 && day <= 5) {
		const currentDay = data[day - 1];
		for (const lesson of currentDay) {
			const job = cron.schedule(`${getMinforCron(lesson.time)} ${getHourforCron(lesson.time)} * * *`, async () => {
				await (client.channels.cache.get('1021885044102529024') as TextBasedChannel).send(`<@1021468029726494751> ${lesson.lesson}`);
			});
			cron_job_array.push(job);
			console.log(green(`Lesson nr ${currentDay.indexOf(lesson) + 1} at ${lesson.time} is scheduled`));
		}
		return cron_job_array;
	}
};

export = async () => {
	const crons = await startCronJobs();

	cron.schedule('0 0 * * *', async () => {
		crons.forEach(cron => cron.stop());
		await startCronJobs();
	});
};

