import Question from "@/components/forms/Question";
import { getUserById } from "@/lib/actions/user.action";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

async function page() {
  const { userId }: { userId: string | null } = auth();

  // const userId = "123456789";
  if (!userId) {
    redirect("/sign-in");
  }

  const mongoUser = await getUserById({ userId });
  console.log("mongoUser", mongoUser);

  return (
    <div>
      <h1 className="h1-bold text-dark100_light900">Ask Questions</h1>
      <div className="mt-9">
        <Question mongoUserId={JSON.stringify(mongoUser._id)} />
      </div>
    </div>
  );
}

export default page;
