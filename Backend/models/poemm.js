import mongoose from 'mongoose';

const poemSchema =mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        poem: {
            type: String,
            required: true,
        },
        author: {
            type: String,
            required: true,
        }
    },
    {
        timestamps: true,
    }
)
export const Poem = mongoose.model('Cat', poemSchema);

