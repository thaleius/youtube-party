import QRCode from "common/components/QR.tsx";
import VideoPlayer from "common/components/VideoPlayer.tsx";
import { QueueItem } from "common/components/QueueItem.tsx";

import QRCodeOverlay from "common/components/QRCodeOverlay.tsx";
import UserDisplay from "common/components/UserDisplay.tsx";
import { getSession, getRecommendedQueue } from "backend/sessions.ts";

import { NowPlaying } from "common/components/NowPlaying.tsx";
import addDurations from "common/helper.tsx";

import ToggleThemeButton from "common/components/ToggleThemeButton.tsx";
import { Item } from "backend/sessions.ts";

import { ToggleDiscordControls } from "common/components/integrations/discord/DiscordPopup.tsx";
import Discord from "common/components/integrations/discord/Discord.tsx";
import { sorter } from "common/sort.tsx";

export default async function App() {
  const session = await getSession();

  // discord controls toggle
  const showDiscordControls = $$(false);

  const toggleDiscordControls = () => {
    showDiscordControls.val = !showDiscordControls.val;
  }

  const current = always(() => {
    if (session.currentlyPlaying) {
      return (
        <div class="px-4 mx-0">
          <div class="text-accent-500 font-semibold text-sm mb-2">
            currently playing
          </div>
          <NowPlaying item={session.currentlyPlaying} />
        </div>
      );
    }
    return <></>;
  });

  const recommended = await getRecommendedQueue(session.code);

  const timeLeft = always(() => {
    let timeCounter = "0:00";
    session.queue.forEach((item: Item) => {
      timeCounter = addDurations(timeCounter, item.duration);
    });
    return timeCounter;
  });


  const recommendations = always(() => {
    if (recommended.length === 0) {
      return <></>
    }

    return (
      <div class="flex flex-col gap-3 mt-5">
        <div class="text-black dark:text-white">RECOMMENDED:</div>
        <div class="space-y-4">{
          recommended.$.map(item => {
            return <QueueItem item={item} type={'search'} code={session.code}></QueueItem>
          })}
        </div>
      </div>
    )

	});

  const sortedQueue = always(() => session.queue.toSorted(sorter).filter(item => item !== session.currentlyPlaying));

  // assign video player component to a variable, so it can be rendered conditionally
  const videoPlayer = always(() => {
    return <VideoPlayer queue={sortedQueue} session={session} />;
  });

  // assign discord component to a variable, so it doesn't rerender on every state change
  const discord = always(() => <Discord code={session.code} />);

  // load from local storage
  if (localStorage.getItem('showDiscordControls') !== showDiscordControls.val.toString()) {
    showDiscordControls.val = localStorage.getItem('showDiscordControls') === 'true';
  }

  // show discord or video controls based on the state of showDiscordControls
  const showDiscordOrVideoControls = always(() => {
    // save in local storage
    localStorage.setItem('showDiscordControls', showDiscordControls.val.toString());
    if (showDiscordControls.val) {
      return discord;
    } else {
      return videoPlayer;
    }
  });

  return (
    <main class="w-screen h-screen relative bg-gray-50 dark:bg-gray-950">
      <div class="mx-auto grid md:grid-cols-2 h-screen">
        
        <div class="flex flex-col h-screen hidden md:flex items-center justify-center p-8">
          <QRCode code={session.code}/>
          <div class="text-black dark:text-white text-3xl font-semibold mt-4 text-center">
            Party code: <a target="_blank" href={`${window.location.origin}/welcome/${encodeURIComponent(session.code)}`}>{session.code}</a>
          </div>
          {/* <div class="text-xl text-white dark:text-white font-semibold">
              {num} 
          </div> */}
          <UserDisplay clients={session.clients} />

        </div>
        
        <div class="flex flex-col overflow-y-hidden h-screen bg-white dark:bg-white/5 border border-black dark:border-white/10 rounded-xl">
          <div class="flex px-8 mx-0 mt-8 mb-4">
              {showDiscordOrVideoControls}
          </div>
          <div class="flex items-center justify-end px-12 h-10 mb-4">
            <ToggleDiscordControls togglePointer={toggleDiscordControls} />
            <ToggleThemeButton />
          </div>

          {current}
          <div class="px-4 py-4 border-t border-black dark:border-white/20 dark:text-white mx-0 overflow-y-scroll flex-grow">
            {always(() =>
              timeLeft.val !== "0:00" ? (
                <p class="mb-4"> Queue will last for {timeLeft} </p>
              ) : (
                <div>
                  <p class="mb-2 font-bold">The queue is empty right now.</p>
                  <p>
                    Be the first one to add a song! Just scan the code on the
                    left.
                  </p>
                </div>
              )
            )}
            <div class="space-y-4">
              {
                sortedQueue.$.map(item => <QueueItem item={item} type={'player'} code={session.code}></QueueItem>)
              }
            </div>
            {recommendations}
          </div>
        </div>
      </div>

      <QRCodeOverlay code={session.code} />
    </main>
  );
}