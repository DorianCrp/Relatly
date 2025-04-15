"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { toggleFollow } from "@/actions/user.action";

function UnfollowButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUnfollow = async () => {
    setIsLoading(true);

    try {
      await toggleFollow(userId);
      toast.success("User unfollowed successfully");
    } catch (error) {
      toast.error("Error unfollowing user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleUnfollow}
      disabled={isLoading}
      className="w-24"
    >
      {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : "Unfollow"}
    </Button>
  );
}

export default UnfollowButton;
