import Image from "next/image";
import Link from "next/link";
import { getTopInfluencers } from "@/actions/user.action";

export default async function TopInfluencersPage() {
  const influencers = await getTopInfluencers(10);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Top Influencers</h1>

      {influencers.length === 0 ? (
        <p className="text-gray-500">Aucun influenceur trouvé.</p>
      ) : (
        <ul className="space-y-4">
          {influencers.map((influencer) => (
            <li
              key={influencer.id}
              className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-lg shadow"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={influencer.image}
                  alt={influencer.name}
                  width={50}
                  height={50}
                  className="rounded-full object-cover"
                />
                <div>
                  <Link href={`/profile/${influencer.username}`} className="text-lg font-semibold hover:underline">
                    {influencer.name}
                  </Link>
                  <p className="text-sm text-gray-500">@{influencer.username}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {influencer.followerCount} followers
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
