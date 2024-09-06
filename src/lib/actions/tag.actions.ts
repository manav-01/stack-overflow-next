"use server"

import User from "@/database/user.model"
import { connectToDatabase } from "../mongoose"
import { GetAllTagsParams, GetQuestionByTagIdParams, GetTopInteractedTagsParams } from "./shared.types"
import Tag, { ITag } from "@/database/tag.model";
import { FilterQuery } from "mongoose";
import Question from "@/database/question.model";




export async function GetTopInteractedTags(params: GetTopInteractedTagsParams) {

    try {
        connectToDatabase();

        const { userId } = params;


        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Find interactions for the user and group by tags...
        // Interaction...

        return [{ _id: '1', name: 'Java' }, { _id: '2', name: 'React' }];
    } catch (error) {
        console.log(error)
        throw error;
    }
}

export async function getAllTags(params: GetAllTagsParams) {

    try {
        connectToDatabase();

        const { searchQuery } = params;

        const query: FilterQuery<ITag> = searchQuery ? {
            name: { $regex: new RegExp(searchQuery, "i") }
        } : {};

        const tags = await Tag.find(query);

        return { tags };




    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getQuestionByTagId(params: GetQuestionByTagIdParams) {
    try {
        connectToDatabase();

        const { tagId, page = 1, pageSize = 10, searchQuery } = params;

        const tagFilter: FilterQuery<ITag> = { _id: tagId };

        const tag = await Tag.findOne(tagFilter).populate(
            {
                path: 'questions',
                model: Question,
                match: searchQuery ? {
                    $or:
                        [{ title: { $regex: searchQuery, $options: 'i' } },
                        { tags: { $in: await Tag.find({ name: { $regex: new RegExp(searchQuery, "i") } }).select("_id") } }
                        ]
                } : {},
                options: {
                    sort: { createdAt: -1 },
                },
                populate: [
                    { path: 'tags', model: Tag, select: "_id name" },
                    { path: 'author', model: User, select: '_id clerkId name picture' }
                ]

            }

        );

        if (!tag) {
            throw new Error('Tag not found');
        }

        const questions = tag.questions;
        return { tagTitle: tag.name, questions }


    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getTopPopularTags() {
    try {
        connectToDatabase();

        const popularTags = await Tag.aggregate(
            [
                {
                    $project: {
                        name: 1, numberOfQuestions: { $size: "$questions" }
                    }
                },
                {
                    $sort: { numberOfQuestions: -1 }
                },
                {
                    $limit: 5
                }
            ]
        );

        return popularTags;

    } catch (error) {
        console.log(error);
        throw error;
    }
}