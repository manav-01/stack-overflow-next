"use server"

import Question from "@/database/question.model";
import { connectToDatabase } from "../mongoose"
import { CreateQuestionParams } from "./shared.types";
import Tag from "@/database/tag.model";
import { revalidatePath } from "next/cache";


export async function createQuestion(params: CreateQuestionParams) {

    try {
        connectToDatabase();
        const { title, content, tags, author, path } = params;
        // create the question
        const question = await Question.create({
            title, content, author
        })

        const tagDocuments = [];

        // Create the tags or get them if they already exist.
        for (const tag of tags) {
            const existingTag = await Tag.findOneAndUpdate(
                { name: { $regex: new RegExp(`^${tag}$`, "i") } },
                { $setOnInsert: { name: tag }, $push: { questions: question._id } },
                { upsert: true, new: true }
            )


            tagDocuments.push(existingTag?._id);
        }


        // add tags id into Question document's tags array element for tag relation.
        await Question.findOneAndUpdate(question._id, {
            $push: { tags: { $each: tagDocuments } }
        });

        // Create am interaction record for the user's ask_question action.

        // Increment author's reputation by +5 for creating a question

        revalidatePath(path);
    } catch (error) {
        console.log(error)
    }
}