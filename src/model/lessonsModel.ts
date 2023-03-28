import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
	lessonName: String,
	lessonGroup: {
		required: false,
		type: String,
	},
	lastUpdated: Date,
});
const lessonsModel = mongoose.model('lessons', lessonSchema);
export default lessonsModel;