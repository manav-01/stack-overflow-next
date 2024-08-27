import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import React from "react";

function Home() {
  return (
    <div>
      <header>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton afterSwitchSessionUrl="/" />
        </SignedIn>
        <UserButton />
      </header>
      <h1 className="h1-bold">Next js13 we&apos;re coming! </h1>
      <h2 className="h2-bold">Next js13 we&apos;re coming! </h2>
      <h3 className="h3-bold">Next js13 we&apos;re coming! </h3>
    </div>
  );
}

export default Home;
