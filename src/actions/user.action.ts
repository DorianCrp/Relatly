"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { count } from "console";
import { revalidatePath } from "next/cache";

export async function syncUser() {
  try {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user)
      return;

    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (existingUser)
      return existingUser

    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ""} ${user.lastName || ""}`,
        username: user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl,
      }
    })
    return dbUser;

  } catch (error) {
    console.log("Error in syncUser", error);
  }
}

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
}

export async function getDbUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await getUserByClerkId(clerkId);

  if (!user) throw new Error("User not found");

  return user.id;
}

export async function getRandomUsers() {
  try {
    const userId = await getDbUserId();

    if (!userId) return [];

    // get 3 random users exclude ourselves & users that we already follow
    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: 3,
    });

    return randomUsers;
  } catch (error) {
    console.log("Error fetching random users", error);
    return [];
  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return;

    if (userId === targetUserId) throw new Error("You cannot follow yourself");

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
    } else {
      // follow
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId,
          },
        }),

        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId, // user being followed
            creatorId: userId, // user following
          },
        }),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log("Error in toggleFollow", error);
    return { success: false, error: "Error toggling follow" };
  }
}

export async function getTopInfluencers(limit = 10) {
  try {
    const influencers = await prisma.user.findMany({
      orderBy: {
        followers: {
          _count: "desc", // Trie par le nombre de followers (du plus grand au plus petit)
        },
      },
      take: limit, // Limite le nombre de résultats à 10
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true, // Récupère le nombre de followers
          },
        },
      },
    });

    return influencers.map((user) => ({
      id: user.id,
      name: user.name ?? user.username,
      username: user.username,
      image: user.image ?? "/avatar.png",
      followerCount: user._count.followers, // Nombre total de followers
    }));
  } catch (error) {
    console.error("Error fetching top influencers:", error);
    return [];
  }
}



// Fonction pour récupérer les followers d'un utilisateur
export async function getFollowers(userId: string) {
  try {
    const followers = await prisma.user.findMany({
      where: {
        following: {
          some: {
            followingId: userId, // Trouve tous ceux qui suivent cet utilisateur
          },
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        createdAt: true, // Ajouté
        bio: true,       // Ajouté
        location: true,  // Ajouté
        website: true,   // Ajouté
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    return followers;
  } catch (error) {
    console.log("Error fetching followers", error);
    return [];
  }
}

// Fonction pour récupérer les utilisateurs que cet utilisateur suit
export async function getFollowing(userId: string) {
  try {
    const following = await prisma.user.findMany({
      where: {
        followers: {
          some: {
            followerId: userId, // Trouve tous ceux que cet utilisateur suit
          },
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        createdAt: true, // Ajouté
        bio: true,       // Ajouté
        location: true,  // Ajouté
        website: true,   // Ajouté
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    return following;
  } catch (error) {
    console.log("Error fetching following", error);
    return [];
  }
}



