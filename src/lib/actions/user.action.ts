"use server"

import User, { IUser } from "@/database/user.model"
import { connectToDatabase } from "../mongoose"
import { CreateUserParams, DeleteUserParams, GetAllUserParams, GetSavedQuestionsParams, GetUserByIdParams, GetUserStatesParams, ToggleSaveQuestionParams, UpdateUserParams } from "./shared.types";
import { revalidatePath } from "next/cache";
import Question, { IQuestion } from "@/database/question.model";
import { FilterQuery } from "mongoose";
import Tag from "@/database/tag.model";
import Answer from "@/database/answer.model";
import { pages } from "next/dist/build/templates/app-page";




export async function getUserById(params: any) {
    try {
        await connectToDatabase();

        const { userId } = params;

        const user = await User.findOne({ clerkId: userId });

        return user;

    } catch (error) {
        console.log(error)
        throw error;
    }
}

export async function createUser(userData: CreateUserParams) {
    try {
        connectToDatabase();

        const newUser = await User.create(userData);
        return newUser;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function updateUser(params: UpdateUserParams) {

    try {
        connectToDatabase();

        const { clerkId, updateDate, path } = params;

        await User.findOneAndUpdate({ clerkId }, updateDate, { new: true });

        revalidatePath(path);

    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteUser(params: DeleteUserParams) {
    try {
        connectToDatabase();

        const { clerkId } = params;

        const user = await User.findOne({ clerkId })

        if (!user) {
            throw new Error("User not found");
        }

        // Delete user from database
        // and Question, Answer, Comments, etc.

        // Get user question ids
        // const userQuestionIds = await Question.find({ author: user._id }).distinct('_id');

        // delete user questions
        await Question.deleteMany({ author: user._id });

        // Todo: delete user answers, comments, etc.
        const deleteUser = await User.findByIdAndDelete(user._id);

        return deleteUser;
    } catch (error) {
        console.log(error);
        throw error;
    }
}


export async function getAllUsers(params: GetAllUserParams) {
    const { searchQuery, filter, page = 1, pageSize = 10 } = params;

    const skipAmount = (page - 1) * pageSize;

    const query: FilterQuery<IUser> = {};

    if (searchQuery) {
        query.$or = [
            { name: { $regex: new RegExp(searchQuery, 'i') } },
            { username: { $regex: new RegExp(searchQuery, 'i') } }
        ]
    }

    try {
        connectToDatabase();

        let sortOptions = {};

        switch (filter) {
            case "new_users":
                sortOptions = { joinedAt: -1 }
                break;
            case "old_users":
                sortOptions = { joinedAt: 1 }
                break;
            case "top_contributors":
                sortOptions = { reputation: -1 }
                break;

            default:
                break;
        }

        const users = await User
            .find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize)


        const totalUsers = await User.countDocuments(query);
        const isNext = totalUsers > skipAmount + users.length;
        return { users, isNext, totalUsers }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function toggleSaveQuestion(params: ToggleSaveQuestionParams) {
    try {
        connectToDatabase();

        const { userId, questionId, path } = params;

        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        const isQuestionSaved = user.saved.includes(questionId);

        if (isQuestionSaved) {
            // remove question from saved
            await User.findByIdAndUpdate(userId,
                { $pull: { saved: questionId } },
                { new: true }
            )
        } else {
            // Add question to saved
            await User.findByIdAndUpdate(
                userId,
                { $addToSet: { saved: questionId } },
                { new: true }
            )
        }

        revalidatePath(path);
    } catch (error) {
        console.log(error);
        throw error;
    }
}


export async function getSavedQuestions(params: GetSavedQuestionsParams) {

    try {
        connectToDatabase();

        const { clerkId, searchQuery, filter } = params;

        const query: FilterQuery<IQuestion> = searchQuery ? {
            $or:
                [
                    { title: { $regex: new RegExp(searchQuery, "i") } },
                    { tags: { $in: await Tag.find({ name: { $regex: new RegExp(searchQuery, "i") } }).select("_id") } }

                ]
        } : {};

        // For Filter
        let sortOptions = {};
        switch (filter) {
            case "most_recent":
                sortOptions = { createdAt: -1 }
                break;
            case "oldest":
                sortOptions = { createdAt: 1 }
                break;
            case "most_voted":
                sortOptions = { upvotes: -1 }
                break;
            case "most_viewed":
                sortOptions = { views: -1 }
                break;
            case "most_answered":
                sortOptions = { answers: -1 }
                break;

            default:
                break;
        }


        const user = await User.findOne({ clerkId })
            .populate({
                path: 'saved', match: query, options: { sort: sortOptions },
                populate: [
                    { path: 'tags', model: Tag, select: " _id name" },
                    { path: 'author', model: User, select: " _id clerkId name picture" }
                ]
            });

        if (!user) {
            throw new Error('User not found');
        }
        const savedQuestions = user.saved;

        return { questions: savedQuestions };

    } catch (error) {
        console.log(error);
        throw error;
    }

}


export async function getUserInfo(params: GetUserByIdParams) {
    try {
        await connectToDatabase();

        const { userId } = params;

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            throw new Error("User not found");
        }

        const totalQuestions = await Question.countDocuments({ author: user._id });

        const totalAnswers = await Answer.countDocuments({ author: user._id });

        return ({
            user,
            totalQuestions,
            totalAnswers
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getUserQuestions(params: GetUserStatesParams) {
    try {
        connectToDatabase();

        const { userId, page = 1, pageSize = 10 } = params;

        const totalQuestions = await Question.countDocuments({ author: userId });

        const userQuestions = await Question
            .find({ author: userId })
            .sort({ views: -1, upvotes: -1 })
            .populate('tags', '_id name')
            .populate('author', '_id clerkId name picture');

        return { totalQuestions, questions: userQuestions };
    } catch (error) {
        console.log(error);
        throw error;
    }
}


export async function getUserAnswers(params: GetUserStatesParams) {
    try {
        connectToDatabase();

        const { userId, page = 1, pageSize = 10 } = params;

        const totalAnswers = await Answer.countDocuments({ author: userId });

        const userAnswers = await Answer
            .find({ author: userId })
            .populate('question', '_id title')
            .populate('author', '_id clerkId name picture');

        return { totalAnswers, answers: userAnswers }
    } catch (error) {
        console.log(error);
        throw error;
    }
}
// export async function getAllUsers(params: GetAllUserParams) {
//     try {
//         connectToDatabase();
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }