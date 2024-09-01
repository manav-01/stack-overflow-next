"use server"

import User from "@/database/user.model"
import { connectToDatabase } from "../mongoose"
import { GetTopInteractedTagsParams } from "./shared.types"


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