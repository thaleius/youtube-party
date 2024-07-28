import { Innertube, UniversalCache } from "https://deno.land/x/youtubei@v10.0.0-deno/deno.ts";
import uniqBy from 'https://cdn.skypack.dev/lodash/uniqBy';
import shuffle from 'https://cdn.skypack.dev/lodash/shuffle';
import take from 'https://cdn.skypack.dev/lodash/take';
import { SongData } from "common/components/lyrics/Lyrics.tsx";
import { CompactVideo, GridVideo, MusicDescriptionShelf, PlaylistPanelVideo, PlaylistVideo, ReelItem, Video, WatchCardCompactVideo } from "https://deno.land/x/youtubei@v10.0.0-deno/deno/src/parser/nodes.ts";

const youtube = await Innertube.create({
  cache: new UniversalCache(
    // Enables persistent caching
    true,
    // Path to the cache directory. The directory will be created if it doesn't exist
    './.cache/youtube' 
  )
});

export async function search(q: string) {
  try {

    const result = await youtube.search(q, {type: 'video', sort_by: 'relevance'})

    // filter out videos without duration (live?), then get first 10 videos
    // @ts-ignore - no type for duration
    const videos = result.videos.filter((item) => item.duration?.seconds).slice(0, 10);

    return videos.map(item => normalizeVideo(item));
  } catch (error) {
    console.error(error);
    return [];
  }
}

type YTVideo = Video | GridVideo | ReelItem | CompactVideo | PlaylistVideo | PlaylistPanelVideo | WatchCardCompactVideo;

const normalizeVideo = (video: YTVideo) => {
  return {
    title: video.title.text ?? 'Untitled',
    // @ts-ignore - no type for thumbnails
    thumbnail: video.thumbnails?.[0].url,
    // @ts-ignore - no type for id
    id: video.id,
    likes: new Set<string>(),
    added: Date.now(),
    // @ts-ignore - no type for duration
    duration: video.duration?.text ?? '-',
  }
}

async function getRelatedVideos(videoId: string) {
  try {
    const videoDetails = await youtube.getInfo(videoId);
    const related = videoDetails.watch_next_feed.map(related => normalizeVideo(related));
    return related;
  } catch (error) {
    console.error("Error fetching related videos:", error);
    throw error;
  }
}

export async function getRecommendations(queue: { id: string }[], maxRecommendations = 5) {
  let allRecommendations: string[] = [];

  for (const video of queue) {
    try {
      const relatedVideos = await getRelatedVideos(video.id);
      allRecommendations.push(...relatedVideos.slice(0, maxRecommendations));
    } catch (error) {
      console.error(`Error processing video ID ${video.id}:`, error);
    }
  }

  // filter out duplicates that are in queue
  const newRecommendations = allRecommendations.filter((video) => !queue.some((item) => item.id === video.id));

  const uniqueRecommendations = uniqBy(newRecommendations, 'id');

  const shuffledRecommendations = shuffle(uniqueRecommendations);

  const finalRecommendations = take(shuffledRecommendations, maxRecommendations);

  return finalRecommendations;
}

export async function updateRecommendations(session: any, code: string) {
  const recommendations = await getRecommendations(session.queue);

  recommendations.forEach(() => {
    session?.recommendedQueue.pop()
  })
  recommendations.forEach((video) => {
    session?.recommendedQueue.push(video)
  })

  return session;
}

const lyrics = await lazyEternalVar("lyrics") ?? $$(new Map<string, SongData>());

export const getSongData = async (id: string): Promise<SongData> => {
  const errorHandler = (error: string, status: number) => {
    if (status === 1)
      lyrics.set(id, {
        status,
        lyrics: '',
        error
      });
    return {
      status,
      lyrics: '',
      error
    };
  }

  if (lyrics.has(id)) {
    return lyrics.get(id)!;
  }

  let data;

  try {
    data = await youtube.music.getLyrics(id);
  } catch (error) {
    if (error.toString().includes('Lyrics not available')) {
      return errorHandler('Lyrics not available', 1);
    }
    return errorHandler(error.toString(), 2);
  }

  if (!data || !data.description?.text)
    return errorHandler('Lyrics not available', 1);

  const songData = {
    status: 0,
    lyrics: data.description.text,
    footer: data.footer.text,
  };

  lyrics.set(id, songData);

  return songData;
};

export const getLyrics = async (id: string): Promise<MusicDescriptionShelf | undefined> => {
  return await youtube.music.getLyrics(id);
}