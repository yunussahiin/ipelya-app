Expo Video (expo-video)
=======================

A library that provides an API to implement video playback in apps.

Ask AI

[](https://github.com/expo/expo/tree/sdk-54/packages/expo-video)[](https://www.npmjs.com/package/expo-video)[](https://github.com/expo/expo/tree/sdk-54/packages/expo-video/CHANGELOG.md)

Bundled version:

~3.0.14

Copy page

* * * * *

`expo-video` is a cross-platform, performant video component for React Native and Expo with Web support.

#### Known issues [](https://docs.expo.dev/versions/latest/sdk/video/#known-issues)

When two [`VideoView`](https://docs.expo.dev/versions/latest/sdk/video/#videoview) components are overlapping and have the [`contentFit`](https://docs.expo.dev/versions/latest/sdk/video/#contentfit) prop set to [`cover`](https://docs.expo.dev/versions/latest/sdk/video/#videocontentfit), one of the videos may be displayed out of bounds. This is a [known upstream issue](https://github.com/androidx/media/issues/1107). To work around this issue, use the [`surfaceType`](https://docs.expo.dev/versions/latest/sdk/video/#surfacetype) prop and set it to [`textureView`](https://docs.expo.dev/versions/latest/sdk/video/#surfacetype-1).

Installation[](https://docs.expo.dev/versions/latest/sdk/video/#installation)
-----------------------------------------------------------------------------

Terminal

Copy

`npx expo install expo-video`

If you are installing this in an [existing React Native app](https://docs.expo.dev/bare/overview/), make sure to [install `expo`](https://docs.expo.dev/bare/installing-expo-modules/) in your project.

Configuration in app config[](https://docs.expo.dev/versions/latest/sdk/video/#configuration-in-app-config)
-----------------------------------------------------------------------------------------------------------

You can configure `expo-video` using its built-in [config plugin](https://docs.expo.dev/config-plugins/introduction/) if you use config plugins in your project ([Continuous Native Generation (CNG)](https://docs.expo.dev/workflow/continuous-native-generation/)). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect. If your app does not use CNG, then you'll need to manually configure the library.

### Example app.json with config plugin[](https://docs.expo.dev/versions/latest/sdk/video/#example-appjson-with-config-plugin)

app.json

Copy

`{
  "expo": {
    "plugins": [
      [
        "expo-video",
        {
          "supportsBackgroundPlayback": true,
          "supportsPictureInPicture": true
        }
      ]
    ],
  }
}`

### Configurable properties[](https://docs.expo.dev/versions/latest/sdk/video/#configurable-properties)

| Name                         | Default     | Description |
| ---------------------------- | ----------- | ----------- |
| `supportsBackgroundPlayback` | `undefined` |

Only for:

A boolean value to enable background playback on iOS. If `true`, the `audio` key is added to the `UIBackgroundModes` array in the Info.plist file. If `false`, the key is removed. When `undefined`, the key is not modified.

 |
| `supportsPictureInPicture` | `undefined` |

A boolean value to enable Picture-in-Picture on Android and iOS. If `true`, enables the `android:supportsPictureInPicture` property on Android and adds the `audio` key to the `UIBackgroundModes` array in the Info.plist file on iOS. If `false`, the key is removed. When `undefined`, the configuration is not modified.

 |

Usage[](https://docs.expo.dev/versions/latest/sdk/video/#usage)
---------------------------------------------------------------

Here's a simple example of a video with a play and pause button.

Video

Copy

Open in Snack

`import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, Button } from 'react-native';

const videoSource =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export default function VideoScreen() {
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  return (
    <View style={styles.contentContainer}>  <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture />  <View style={styles.controlsContainer}>  <Button
          title={isPlaying ? 'Pause' : 'Play'}
          onPress={() => {
            if (isPlaying) {
              player.pause();
            } else {
              player.play();
            }
          }}
        />  </View>  </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
  },
  video: {
    width: 350,
    height: 275,
  },
  controlsContainer: {
    padding: 10,
  },
});`

Show More

### Receiving events[](https://docs.expo.dev/versions/latest/sdk/video/#receiving-events)

The changes in properties of the [`VideoPlayer`](https://docs.expo.dev/versions/latest/sdk/video/#videoplayer) do not update the React state. Therefore, to display the information about the current state of the `VideoPlayer`, it is necessary to listen to the [events](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerevents) it emits. The event system is based on the [`EventEmitter`](https://docs.expo.dev/versions/latest/sdk/expo/#eventemitter) class and [hooks](https://docs.expo.dev/versions/latest/sdk/expo/#hooks) from the [`expo`](https://docs.expo.dev/versions/latest/sdk/expo/) package. There are a few ways to listen to events:

#### `useEvent` hook[](https://docs.expo.dev/versions/latest/sdk/video/#useevent-hook)

Creates a listener that will return a stateful value that can be used in a component. It also cleans up automatically when the component unmounts.

useEvent

Copy

`import { useEvent } from 'expo';
// ... Other imports, definition of the component, creating the player etc.

const { status, error } = useEvent(player, 'statusChange', { status: player.status });
// Rest of the component...`

#### `useEventListener` hook[](https://docs.expo.dev/versions/latest/sdk/video/#useeventlistener-hook)

Built around the `Player.addListener` and `Player.removeListener` methods, creates an event listener with automatic cleanup.

useEventListener

Copy

`import { useEventListener } from 'expo';
// ...Other imports, definition of the component, creating the player etc.

useEventListener(player, 'statusChange', ({ status, error }) => {
  setPlayerStatus(status);
  setPlayerError(error);
  console.log('Player status changed: ', status);
});
// Rest of the component...`

#### `Player.addListener` method[](https://docs.expo.dev/versions/latest/sdk/video/#playeraddlistener-method)

Most flexible way to listen to events, but requires manual cleanup and more boilerplate code.

Player.addListener

Copy

`// ...Imports, definition of the component, creating the player etc.

useEffect(() => {
  const subscription = player.addListener('statusChange', ({ status, error }) => {
    setPlayerStatus(status);
    setPlayerError(error);
    console.log('Player status changed: ', status);
  });

  return () => {
    subscription.remove();
  };
}, []);
// Rest of the component...`

### Playing local media from the assets directory[](https://docs.expo.dev/versions/latest/sdk/video/#playing-local-media-from-the-assets-directory)

`expo-video` supports playing local media loaded using the `require` function. You can use the result as a source directly, or assign it to the `assetId` parameter of a [`VideoSource`](https://docs.expo.dev/versions/latest/sdk/video/#videosource) if you also want to configure other properties.

Playing local media

Copy

`import { VideoSource } from 'expo-video';

const assetId = require('./assets/bigbuckbunny.mp4');

const videoSource: VideoSource = {
  assetId,
  metadata: {
    title: 'Big Buck Bunny',
    artist: 'The Open Movie Project',
  },
};

const player1 = useVideoPlayer(assetId); // You can use the `asset` directly as a video source
const player2 = useVideoPlayer(videoSource);`

### Preloading videos[](https://docs.expo.dev/versions/latest/sdk/video/#preloading-videos)

While another video is playing, a video can be loaded before showing it in the view. This allows for quicker transitions between subsequent videos and a better user experience.

To preload a video, you have to create a `VideoPlayer` with a video source. Even when the player is not connected to a `VideoView`, it will fill the buffers. Once it is connected to the `VideoView`, it will be able to start playing without buffering.

In some cases, it is beneficial to preload a video later in the screen lifecycle. In that case, a `VideoPlayer` with a `null` source should be created. To start preloading, replace the player source with a video source using the `replace()` function.

Here is an example of how to preload a video:

Preloading videos

Copy

Open in Snack

`import { useVideoPlayer, VideoView, VideoSource } from 'expo-video';
import { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const bigBuckBunnySource: VideoSource =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const elephantsDreamSource: VideoSource =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';

export default function PreloadingVideoPlayerScreen() {
  const player1 = useVideoPlayer(bigBuckBunnySource, player => {
    player.play();
  });

  const player2 = useVideoPlayer(elephantsDreamSource, player => {
    player.currentTime = 20;
  });

  const [currentPlayer, setCurrentPlayer] = useState(player1);

  const replacePlayer = useCallback(async () => {
    currentPlayer.pause();
    if (currentPlayer === player1) {
      setCurrentPlayer(player2);
      player1.pause();
      player2.play();
    } else {
      setCurrentPlayer(player1);
      player2.pause();
      player1.play();
    }
  }, [player1, currentPlayer]);

  return (
    <View style={styles.contentContainer}>  <VideoView player={currentPlayer} style={styles.video} nativeControls={false} />  <TouchableOpacity style={styles.button} onPress={replacePlayer}>  <Text style={styles.buttonText}>Replace Player</Text>  </TouchableOpacity>  </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#4630ec',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#eeeeee',
    textAlign: 'center',
  },
  video: {
    width: 300,
    height: 168.75,
    marginVertical: 20,
  },
});`

Show More

### Using the VideoPlayer directly[](https://docs.expo.dev/versions/latest/sdk/video/#using-the-videoplayer-directly)

In most cases, the [`useVideoPlayer`](https://docs.expo.dev/versions/latest/sdk/video/#usevideoplayersource-setup) hook should be used to create a `VideoPlayer` instance. It manages the player's lifecycle and ensures that it is properly disposed of when the component is unmounted. However, in some advanced use cases, it might be necessary to create a `VideoPlayer` that does not get automatically destroyed when the component is unmounted. In those cases, the `VideoPlayer` can be created using the [`createVideoPlayer`](https://docs.expo.dev/versions/latest/sdk/video/#videocreatevideoplayersource) function. You need be aware of the risks that come with this approach, as it is your responsibility to call the [`release()`](https://docs.expo.dev/versions/latest/sdk/expo/#release) method when the player is no longer needed. If not handled properly, this approach may lead to memory leaks.

Creating player instance

Copy

`import { createVideoPlayer } from 'expo-video';
const player = createVideoPlayer(videoSource);`

> On Android, mounting multiple `VideoView` components at the same time with the same `VideoPlayer` instance will not work due to a [platform limitation](https://github.com/expo/expo/issues/35012).

### Caching videos[](https://docs.expo.dev/versions/latest/sdk/video/#caching-videos)

If your app frequently replays the same video, caching can be utilized to minimize network usage and enhance user experience, albeit at the cost of increased device storage usage. `expo-video` supports video caching on `Android` and `iOS` platforms. This feature can be activated by setting the [`useCaching`](https://docs.expo.dev/versions/latest/sdk/video/#videosource) property of a [`VideoSource`](https://docs.expo.dev/versions/latest/sdk/video/#videosource) object to `true`.

The cache is persistent and will be cleared on a least-recently-used basis once the preferred size is exceeded. Furthermore, the system can clear the cache due to low storage availability, so it's not advisable to depend on the cache to store critical data.

The cache functions offline. If a portion or the entirety of a video is cached, it can be played from the cache even when the device is offline until the cached data is exhausted.

> Due to platform limitations, the cache cannot be used with HLS video sources on iOS. Caching DRM-protected videos is not supported on Android and iOS.

### Managing the cache[](https://docs.expo.dev/versions/latest/sdk/video/#managing-the-cache)

-   The preferred cache size in bytes can be defined using the [`setVideoCacheSizeAsync`](https://docs.expo.dev/versions/latest/sdk/video/#videosetvideocachesizeasyncsizebytes) function. The default cache size is 1GB.
-   The [`getCurrentVideoCacheSize`](https://docs.expo.dev/versions/latest/sdk/video/#videogetcurrentvideocachesize) can be used to get the current storage occupied by the cache in bytes.
-   All cached videos can be cleared using the [`clearVideoCacheAsync`](https://docs.expo.dev/versions/latest/sdk/video/#videoclearvideocacheasync) function.

API[](https://docs.expo.dev/versions/latest/sdk/video/#api)
-----------------------------------------------------------

`import { VideoView, useVideoPlayer } from 'expo-video';`

Components[](https://docs.expo.dev/versions/latest/sdk/video/#components)
-------------------------------------------------------------------------

### `VideoView`[](https://docs.expo.dev/versions/latest/sdk/video/#videoview)

Type: `React.[PureComponent](https://react.dev/reference/react/PureComponent)<[VideoViewProps](https://docs.expo.dev/versions/latest/sdk/video/#videoviewprops)>`

VideoViewProps[](https://docs.expo.dev/versions/latest/sdk/video/#videoviewprops)

### `allowsFullscreen`[](https://docs.expo.dev/versions/latest/sdk/video/#allowsfullscreen)

Optional - Type: `boolean` - Default: `true`

Determines whether fullscreen mode is allowed or not.

> Note: This option has been deprecated in favor of the `fullscreenOptions` prop and will be disabled in the future.

### `allowsPictureInPicture`[](https://docs.expo.dev/versions/latest/sdk/video/#allowspictureinpicture)

Optional - Type: `boolean`

Determines whether the player allows Picture in Picture (PiP) mode.

> Note: The `supportsPictureInPicture` property of the [config plugin](https://docs.expo.dev/versions/latest/sdk/video/#configuration-in-app-config) has to be configured for the PiP to work.

### `allowsVideoFrameAnalysis`[](https://docs.expo.dev/versions/latest/sdk/video/#allowsvideoframeanalysis)

Optional - Type: `boolean` - Default: `true`

Specifies whether to perform video frame analysis (Live Text in videos). Check official [Apple documentation](https://developer.apple.com/documentation/avkit/avplayerviewcontroller/allowsvideoframeanalysis) for more details.

### `contentFit`[](https://docs.expo.dev/versions/latest/sdk/video/#contentfit)

Optional - Type: `[VideoContentFit](https://docs.expo.dev/versions/latest/sdk/video/#videocontentfit)` - Default: `'contain'`

Describes how the video should be scaled to fit in the container. Options are `'contain'`, `'cover'`, and `'fill'`.

### `contentPosition`[](https://docs.expo.dev/versions/latest/sdk/video/#contentposition)

Optional - Type: `{ dx: number, dy: number }`

Determines the position offset of the video inside the container.

### `crossOrigin`[](https://docs.expo.dev/versions/latest/sdk/video/#crossorigin)

Optional - Literal type: `string` - Default: `undefined`

Determines the [cross origin policy](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/crossorigin) used by the underlying native view on web. If `undefined` (default), does not use CORS at all. If set to `'anonymous'`, the video will be loaded with CORS enabled. Note that some videos may not play if CORS is enabled, depending on the CDN settings. If you encounter issues, consider adjusting the `crossOrigin` property.

Acceptable values are: `'anonymous'` | `'use-credentials'`

### `fullscreenOptions`[](https://docs.expo.dev/versions/latest/sdk/video/#fullscreenoptions)

Optional - Type: `[FullscreenOptions](https://docs.expo.dev/versions/latest/sdk/video/#fullscreenoptions)`

Determines the fullscreen mode options.

### `nativeControls`[](https://docs.expo.dev/versions/latest/sdk/video/#nativecontrols)

Optional - Type: `boolean` - Default: `true`

Determines whether native controls should be displayed or not.

### `onFirstFrameRender`[](https://docs.expo.dev/versions/latest/sdk/video/#onfirstframerender)

Optional - Type: `() => void`

A callback to call after the mounted `VideoPlayer` has rendered the first frame into the `VideoView`. This event can be used to hide any cover images that conceal the initial loading of the player.

> Note: This event may also be called during playback when the current video track changes (for example when the player switches video quality).

### `onFullscreenEnter`[](https://docs.expo.dev/versions/latest/sdk/video/#onfullscreenenter)

Optional - Type: `() => void`

A callback to call after the video player enters fullscreen mode.

### `onFullscreenExit`[](https://docs.expo.dev/versions/latest/sdk/video/#onfullscreenexit)

Optional - Type: `() => void`

A callback to call after the video player exits fullscreen mode.

### `onPictureInPictureStart`[](https://docs.expo.dev/versions/latest/sdk/video/#onpictureinpicturestart)

Optional - Type: `() => void`

A callback to call after the video player enters Picture in Picture (PiP) mode.

### `onPictureInPictureStop`[](https://docs.expo.dev/versions/latest/sdk/video/#onpictureinpicturestop)

Optional - Type: `() => void`

A callback to call after the video player exits Picture in Picture (PiP) mode.

### `player`[](https://docs.expo.dev/versions/latest/sdk/video/#player)

Type: `[VideoPlayer](https://docs.expo.dev/versions/latest/sdk/video/#videoplayer)`

A video player instance. Use [`useVideoPlayer()`](https://docs.expo.dev/versions/latest/sdk/video/#usevideoplayersource-setup) hook to create one.

### `playsInline`[](https://docs.expo.dev/versions/latest/sdk/video/#playsinline)

Optional - Type: `boolean`

Determines whether a video should be played "inline", that is, within the element's playback area.

### `requiresLinearPlayback`[](https://docs.expo.dev/versions/latest/sdk/video/#requireslinearplayback)

Optional - Type: `boolean` - Default: `false`

Determines whether the player allows the user to skip media content.

### `showsTimecodes`[](https://docs.expo.dev/versions/latest/sdk/video/#showstimecodes)

Optional - Type: `boolean` - Default: `true`

Determines whether the timecodes should be displayed or not.

### `startsPictureInPictureAutomatically`[](https://docs.expo.dev/versions/latest/sdk/video/#startspictureinpictureautomatically)

Optional - Type: `boolean` - Default: `false`

Determines whether the player should start Picture in Picture (PiP) automatically when the app is in the background.

> Note: Only one player can be in Picture in Picture (PiP) mode at a time.

> Note: The `supportsPictureInPicture` property of the [config plugin](https://docs.expo.dev/versions/latest/sdk/video/#configuration-in-app-config) has to be configured for the PiP to work.

### `surfaceType`[](https://docs.expo.dev/versions/latest/sdk/video/#surfacetype)

Optional - Type: `[SurfaceType](https://docs.expo.dev/versions/latest/sdk/video/#surfacetype)` - Default: `'surfaceView'`

Determines the type of the surface used to render the video.

> This prop should not be changed at runtime.

### `useExoShutter`[](https://docs.expo.dev/versions/latest/sdk/video/#useexoshutter)

Optional - Type: `boolean` - Default: `false`

Determines whether the player should use the default ExoPlayer shutter that covers the `VideoView` before the first video frame is rendered. Setting this property to `false` makes the Android behavior the same as iOS.

#### Inherited Props[](https://docs.expo.dev/versions/latest/sdk/video/#inherited-props)

-   `[ViewProps](https://reactnative.dev/docs/view#props)`

### `VideoAirPlayButton`[](https://docs.expo.dev/versions/latest/sdk/video/#videoairplaybutton)

Type: `React.[Element](https://www.typescriptlang.org/docs/handbook/jsx.html#function-component)<[VideoAirPlayButtonProps](https://docs.expo.dev/versions/latest/sdk/video/#videoairplaybuttonprops)>`

A view displaying the [`AVRoutePickerView`](https://developer.apple.com/documentation/avkit/avroutepickerview). Shows a button, when pressed, an AirPlay device picker shows up, allowing users to stream the currently playing video to any available AirPlay sink.

> When using this view, make sure that the [`allowsExternalPlayback`](https://docs.expo.dev/versions/latest/sdk/video/#allowsexternalplayback) player property is set to `true`.

VideoAirPlayButtonProps[](https://docs.expo.dev/versions/latest/sdk/video/#videoairplaybuttonprops)

### `activeTint`[](https://docs.expo.dev/versions/latest/sdk/video/#activetint)

Optional - Type: `[ColorValue](https://reactnative.dev/docs/colors)` - Default: `undefined`

The color of the button icon while AirPlay sharing is active.

### `onBeginPresentingRoutes`[](https://docs.expo.dev/versions/latest/sdk/video/#onbeginpresentingroutes)

Optional - Type: `() => void`

A callback called when the AirPlay route selection popup is about to show.

### `onEndPresentingRoutes`[](https://docs.expo.dev/versions/latest/sdk/video/#onendpresentingroutes)

Optional - Type: `() => void`

A callback called when the AirPlay route selection popup has disappeared.

### `prioritizeVideoDevices`[](https://docs.expo.dev/versions/latest/sdk/video/#prioritizevideodevices)

Optional - Type: `boolean` - Default: `true`

Determines whether the AirPlay device selection popup should show video outputs first.

### `tint`[](https://docs.expo.dev/versions/latest/sdk/video/#tint)

Optional - Type: `[ColorValue](https://reactnative.dev/docs/colors)` - Default: `undefined`

The color of the button icon while AirPlay sharing is not active.

#### Inherited Props[](https://docs.expo.dev/versions/latest/sdk/video/#inherited-props-1)

-   `[Omit](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)<[ViewProps](https://reactnative.dev/docs/view#props), 'children'>`

Component Methods[](https://docs.expo.dev/versions/latest/sdk/video/#component-methods)
---------------------------------------------------------------------------------------

### `enterFullscreen()`[](https://docs.expo.dev/versions/latest/sdk/video/#enterfullscreen)

Enters fullscreen mode.

Returns:

`[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<void>`

### `exitFullscreen()`[](https://docs.expo.dev/versions/latest/sdk/video/#exitfullscreen)

Exits fullscreen mode.

Returns:

`[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<void>`

### `startPictureInPicture()`[](https://docs.expo.dev/versions/latest/sdk/video/#startpictureinpicture)

Enters Picture in Picture (PiP) mode. Throws an exception if the device does not support PiP.

> Note: Only one player can be in Picture in Picture (PiP) mode at a time.

> Note: The `supportsPictureInPicture` property of the [config plugin](https://docs.expo.dev/versions/latest/sdk/video/#configuration-in-app-config) has to be configured for the PiP to work.

Returns:

`[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<void>`

### `stopPictureInPicture()`[](https://docs.expo.dev/versions/latest/sdk/video/#stoppictureinpicture)

Exits Picture in Picture (PiP) mode.

Returns:

`[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<void>`

Hooks[](https://docs.expo.dev/versions/latest/sdk/video/#hooks)
---------------------------------------------------------------

### `useVideoPlayer(source, setup)`[](https://docs.expo.dev/versions/latest/sdk/video/#usevideoplayersource-setup)

| Parameter | Type                                                                          | Description |
| --------- | ----------------------------------------------------------------------------- | ----------- |
| source    | `[VideoSource](https://docs.expo.dev/versions/latest/sdk/video/#videosource)` |

A video source that is used to initialize the player.

 |
| setup(optional) | `(player: [VideoPlayer](https://docs.expo.dev/versions/latest/sdk/video/#videoplayer)) => void` |

A function that allows setting up the player. It will run after the player is created.

 |

Creates a `VideoPlayer`, which will be automatically cleaned up when the component is unmounted.

Returns:

`[VideoPlayer](https://docs.expo.dev/versions/latest/sdk/video/#videoplayer)`

Classes[](https://docs.expo.dev/versions/latest/sdk/video/#classes)
-------------------------------------------------------------------

### `VideoPlayer`[](https://docs.expo.dev/versions/latest/sdk/video/#videoplayer)

Type: Class extends `[SharedObject](https://docs.expo.dev/versions/v54.0.0/sdk/expo/#sharedobjecttype)<[VideoPlayerEvents](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerevents)>`

A class that represents an instance of the video player.

VideoPlayer Properties

### `allowsExternalPlayback`[](https://docs.expo.dev/versions/latest/sdk/video/#allowsexternalplayback)

Type: `boolean` - Default: `true`

Determines whether the player should allow external playback.

### `audioMixingMode`[](https://docs.expo.dev/versions/latest/sdk/video/#audiomixingmode)

Type: `[AudioMixingMode](https://docs.expo.dev/versions/latest/sdk/video/#audiomixingmode)` - Default: `'auto'`

Determines how the player will interact with other audio playing in the system.

### `audioTrack`[](https://docs.expo.dev/versions/latest/sdk/video/#audiotrack)

Literal type: `union` - Default: `null`

Specifies the audio track currently played by the player. `null` when no audio is played.

Acceptable values are: `null` | `[AudioTrack](https://docs.expo.dev/versions/latest/sdk/video/#audiotrack)`

### `availableAudioTracks`[](https://docs.expo.dev/versions/latest/sdk/video/#availableaudiotracks)

Read Only - Type: `[AudioTrack[]](https://docs.expo.dev/versions/latest/sdk/video/#audiotrack)`

An array of audio tracks available for the current video.

### `availableSubtitleTracks`[](https://docs.expo.dev/versions/latest/sdk/video/#availablesubtitletracks)

Read Only - Type: `[SubtitleTrack[]](https://docs.expo.dev/versions/latest/sdk/video/#subtitletrack)`

An array of subtitle tracks available for the current video.

### `availableVideoTracks`[](https://docs.expo.dev/versions/latest/sdk/video/#availablevideotracks)

Read Only - Type: `[VideoTrack[]](https://docs.expo.dev/versions/latest/sdk/video/#videotrack)`

An array of video tracks available for the current video.

> On iOS, when using a HLS source, make sure that the uri contains `.m3u8` extension or that the [`contentType`](https://docs.expo.dev/versions/latest/sdk/video/#contenttype) property of the [`VideoSource`](https://docs.expo.dev/versions/latest/sdk/video/#videosource) has been set to `'hls'`. Otherwise, the video tracks will not be available.

### `bufferedPosition`[](https://docs.expo.dev/versions/latest/sdk/video/#bufferedposition)

Read Only - Type: `number`

Float value indicating how far the player has buffered the video in seconds.

This value is 0 when the player has not buffered up to the current playback time. When it's impossible to determine the buffer state (for example, when the player isn't playing any media), this value is -1.

### `bufferOptions`[](https://docs.expo.dev/versions/latest/sdk/video/#bufferoptions)

Type: `[BufferOptions](https://docs.expo.dev/versions/v54.0.0/sdk/video/#bufferoptions-1)`

Specifies buffer options which will be used by the player when buffering the video.

> You should provide a `BufferOptions` object when setting this property. Setting individual buffer properties is not supported.

### `currentLiveTimestamp`[](https://docs.expo.dev/versions/latest/sdk/video/#currentlivetimestamp)

Read Only - Literal type: `union`

The exact timestamp when the currently displayed video frame was sent from the server, based on the `EXT-X-PROGRAM-DATE-TIME` tag in the livestream metadata. If this metadata is missing, this property will return `null`.

Acceptable values are: `null` | `number`

### `currentOffsetFromLive`[](https://docs.expo.dev/versions/latest/sdk/video/#currentoffsetfromlive)

Read Only - Literal type: `union`

Float value indicating the latency of the live stream in seconds. If a livestream doesn't have the required metadata, this will return `null`.

Acceptable values are: `null` | `number`

### `currentTime`[](https://docs.expo.dev/versions/latest/sdk/video/#currenttime)

Type: `number`

Float value indicating the current playback time in seconds.

If the player is not yet playing, this value indicates the time position at which playback will begin once the `play()` method is called.

Setting `currentTime` to a new value seeks the player to the given time. Note that frame accurate seeking may incur additional decoding delay which can impact seeking performance. Consider using the [`seekBy`](https://docs.expo.dev/versions/latest/sdk/video/#seekbyseconds) function if the time does not have to be set precisely.

### `duration`[](https://docs.expo.dev/versions/latest/sdk/video/#duration)

Read Only - Type: `number`

Float value indicating the duration of the current video in seconds.

### `isExternalPlaybackActive`[](https://docs.expo.dev/versions/latest/sdk/video/#isexternalplaybackactive)

Read Only - Type: `boolean`

Indicates whether the player is currently playing back the media to an external device via AirPlay.

### `isLive`[](https://docs.expo.dev/versions/latest/sdk/video/#islive)

Read Only - Type: `boolean`

Boolean value indicating whether the player is currently playing a live stream.

### `loop`[](https://docs.expo.dev/versions/latest/sdk/video/#loop)

Type: `boolean` - Default: `false`

Determines whether the player should automatically replay after reaching the end of the video.

### `muted`[](https://docs.expo.dev/versions/latest/sdk/video/#muted)

Type: `boolean` - Default: `false`

Boolean value whether the player is currently muted. Setting this property to `true`/`false` will mute/unmute the player.

### `playbackRate`[](https://docs.expo.dev/versions/latest/sdk/video/#playbackrate)

Type: `number` - Default: `1.0`

Float value between `0` and `16.0` indicating the current playback speed of the player.

### `playing`[](https://docs.expo.dev/versions/latest/sdk/video/#playing)

Read Only - Type: `boolean`

Boolean value whether the player is currently playing.

> Use `play` and `pause` methods to control the playback.

### `preservesPitch`[](https://docs.expo.dev/versions/latest/sdk/video/#preservespitch)

Type: `boolean` - Default: `true`

Boolean value indicating if the player should correct audio pitch when the playback speed changes.

### `showNowPlayingNotification`[](https://docs.expo.dev/versions/latest/sdk/video/#shownowplayingnotification)

Type: `boolean` - Default: `false`

Boolean value determining whether the player should show the now playing notification.

### `status`[](https://docs.expo.dev/versions/latest/sdk/video/#status)

Read Only - Type: `[VideoPlayerStatus](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerstatus)`

Indicates the current status of the player.

### `staysActiveInBackground`[](https://docs.expo.dev/versions/latest/sdk/video/#staysactiveinbackground)

Type: `boolean` - Default: `false`

Determines whether the player should continue playing after the app enters the background.

### `subtitleTrack`[](https://docs.expo.dev/versions/latest/sdk/video/#subtitletrack)

Literal type: `union` - Default: `null`

Specifies the subtitle track which is currently displayed by the player. `null` when no subtitles are displayed.

> To ensure a valid subtitle track, always assign one of the subtitle tracks from the [`availableSubtitleTracks`](https://docs.expo.dev/versions/latest/sdk/video/#availablesubtitletracks) array.

Acceptable values are: `null` | `[SubtitleTrack](https://docs.expo.dev/versions/latest/sdk/video/#subtitletrack)`

### `targetOffsetFromLive`[](https://docs.expo.dev/versions/latest/sdk/video/#targetoffsetfromlive)

Type: `number`

Float value indicating the time offset from the live in seconds.

### `timeUpdateEventInterval`[](https://docs.expo.dev/versions/latest/sdk/video/#timeupdateeventinterval)

Type: `number` - Default: `0`

Float value indicating the interval in seconds at which the player will emit the [`timeUpdate`](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerevents) event. When the value is equal to `0`, the event will not be emitted.

### `videoTrack`[](https://docs.expo.dev/versions/latest/sdk/video/#videotrack)

Read Only - Literal type: `union` - Default: `null`

Specifies the video track currently played by the player. `null` when no video is displayed.

Acceptable values are: `null` | `[VideoTrack](https://docs.expo.dev/versions/latest/sdk/video/#videotrack)`

### `volume`[](https://docs.expo.dev/versions/latest/sdk/video/#volume)

Type: `number` - Default: `1.0`

Float value between `0` and `1.0` representing the current volume. Muting the player doesn't affect the volume. In other words, when the player is muted, the volume is the same as when unmuted. Similarly, setting the volume doesn't unmute the player.

VideoPlayer Methods

### `generateThumbnailsAsync(times, options)`[](https://docs.expo.dev/versions/latest/sdk/video/#generatethumbnailsasynctimes-options)

| Parameter         | Type                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| times             | `number                                                                                           | number[]` |
| options(optional) | `[VideoThumbnailOptions](https://docs.expo.dev/versions/latest/sdk/video/#videothumbnailoptions)` |

Generates thumbnails from the currently played asset. The thumbnails are references to native images, thus they can be used as a source of the `Image` component from `expo-image`.

Returns:

`[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[VideoThumbnail[]](https://docs.expo.dev/versions/latest/sdk/video/#videothumbnail)>`

### `pause()`[](https://docs.expo.dev/versions/latest/sdk/video/#pause)

Pauses the player.

Returns:

`void`

### `play()`[](https://docs.expo.dev/versions/latest/sdk/video/#play)

Resumes the player.

Returns:

`void`

### `replace(source, disableWarning)`[](https://docs.expo.dev/versions/latest/sdk/video/#replacesource-disablewarning)

| Parameter                | Type                                                                          |
| ------------------------ | ----------------------------------------------------------------------------- |
| source                   | `[VideoSource](https://docs.expo.dev/versions/latest/sdk/video/#videosource)` |
| disableWarning(optional) | `boolean`                                                                     |

Replaces the current source with a new one.

> On iOS, this method loads the asset data synchronously on the UI thread and can block it for extended periods of time. Use `replaceAsync` to load the asset asynchronously and avoid UI lags.

> This method will be deprecated in the future.

Returns:

`void`

### `replaceAsync(source)`[](https://docs.expo.dev/versions/latest/sdk/video/#replaceasyncsource)

| Parameter | Type                                                                          |
| --------- | ----------------------------------------------------------------------------- |
| source    | `[VideoSource](https://docs.expo.dev/versions/latest/sdk/video/#videosource)` |

Replaces the current source with a new one, while offloading loading of the asset to a different thread.

> On Android and Web, this method is equivalent to `replace`.

Returns:

`[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<void>`

### `replay()`[](https://docs.expo.dev/versions/latest/sdk/video/#replay)

Seeks the playback to the beginning.

Returns:

`void`

### `seekBy(seconds)`[](https://docs.expo.dev/versions/latest/sdk/video/#seekbyseconds)

| Parameter | Type     |
| --------- | -------- |
| seconds   | `number` |

Seeks the playback by the given number of seconds. The time to which the player seeks may differ from the specified requested time for efficiency, depending on the encoding and what is currently buffered by the player. Use this function to implement playback controls that seek by specific amount of time, in which case, the actual time usually does not have to be precise. For frame accurate seeking, use the [`currentTime`](https://docs.expo.dev/versions/latest/sdk/video/#currenttime) property.

Returns:

`void`

### `VideoThumbnail`[](https://docs.expo.dev/versions/latest/sdk/video/#videothumbnail)

Type: Class extends `[SharedRef](https://docs.expo.dev/versions/v54.0.0/sdk/expo/#sharedreftype)<'image'>`

Represents a video thumbnail that references a native image. Instances of this class can be passed as a source to the `Image` component from `expo-image`.

VideoThumbnail Properties

### `actualTime`[](https://docs.expo.dev/versions/latest/sdk/video/#actualtime)

Type: `number`

The time in seconds at which the thumbnail was actually generated.

### `height`[](https://docs.expo.dev/versions/latest/sdk/video/#height)

Type: `number`

Height of the created thumbnail.

### `nativeRefType`[](https://docs.expo.dev/versions/latest/sdk/video/#nativereftype)

Type: `string`

The type of the native reference.

### `requestedTime`[](https://docs.expo.dev/versions/latest/sdk/video/#requestedtime)

Type: `number`

The time in seconds at which the thumbnail was to be created.

### `width`[](https://docs.expo.dev/versions/latest/sdk/video/#width)

Type: `number`

Width of the created thumbnail.

Methods[](https://docs.expo.dev/versions/latest/sdk/video/#methods)
-------------------------------------------------------------------

### `Video.clearVideoCacheAsync()`[](https://docs.expo.dev/versions/latest/sdk/video/#videoclearvideocacheasync)

Clears all video cache.

> This function can be called only if there are no existing `VideoPlayer` instances.

Returns:

`[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<void>`

A promise that fulfills after the cache has been cleaned.

### `Video.createVideoPlayer(source)`[](https://docs.expo.dev/versions/latest/sdk/video/#videocreatevideoplayersource)

| Parameter | Type                                                                          |
| --------- | ----------------------------------------------------------------------------- |
| source    | `[VideoSource](https://docs.expo.dev/versions/latest/sdk/video/#videosource)` |

Creates a direct instance of `VideoPlayer` that doesn't release automatically.

> For most use cases you should use the [`useVideoPlayer`](https://docs.expo.dev/versions/latest/sdk/video/#usevideoplayer) hook instead. See the [Using the VideoPlayer Directly](https://docs.expo.dev/versions/latest/sdk/video/#using-the-videoplayer-directly) section for more details.

Returns:

`[VideoPlayer](https://docs.expo.dev/versions/latest/sdk/video/#videoplayer)`

### `Video.getCurrentVideoCacheSize()`[](https://docs.expo.dev/versions/latest/sdk/video/#videogetcurrentvideocachesize)

Returns the space currently occupied by the video cache in bytes.

Returns:

`number`

### `Video.isPictureInPictureSupported()`[](https://docs.expo.dev/versions/latest/sdk/video/#videoispictureinpicturesupported)

Returns whether the current device supports Picture in Picture (PiP) mode.

Returns:

`boolean`

A `boolean` which is `true` if the device supports PiP mode, and `false` otherwise.

### `Video.setVideoCacheSizeAsync(sizeBytes)`[](https://docs.expo.dev/versions/latest/sdk/video/#videosetvideocachesizeasyncsizebytes)

| Parameter | Type     |
| --------- | -------- |
| sizeBytes | `number` |

Sets desired video cache size in bytes. The default video cache size is 1GB. Value set by this function is persistent. The cache size is not guaranteed to be exact and the actual cache size may be slightly larger. The cache is evicted on a least-recently-used basis.

> This function can be called only if there are no existing `VideoPlayer` instances.

Returns:

`[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<void>`

A promise that fulfills after the cache size has been set.

Types[](https://docs.expo.dev/versions/latest/sdk/video/#types)
---------------------------------------------------------------

### `AudioMixingMode`[](https://docs.expo.dev/versions/latest/sdk/video/#audiomixingmode-1)

Literal Type: `string`

Specifies the audio mode that the player should use. Audio mode is set on per-app basis, if there are multiple players playing and have different a `AudioMode` specified, the highest priority mode will be used. Priority order: 'doNotMix' > 'auto' > 'duckOthers' > 'mixWithOthers'.

-   `mixWithOthers`: The player will mix its audio output with other apps.
-   `duckOthers`: The player will lower the volume of other apps if any of the active players is outputting audio.
-   `auto`: The player will allow other apps to keep playing audio only when it is muted. On iOS it will always interrupt other apps when `showNowPlayingNotification` is `true` due to system requirements.
-   `doNotMix`: The player will pause playback in other apps, even when it's muted.

> On iOS, the Now Playing notification is dependent on the audio mode. If the audio mode is different from `doNotMix` or `auto` this feature will not work.

Acceptable values are: `'mixWithOthers'` | `'duckOthers'` | `'auto'` | `'doNotMix'`

### `AudioTrack`[](https://docs.expo.dev/versions/latest/sdk/video/#audiotrack-1)

| Property | Type     | Description |
| -------- | -------- | ----------- |
| id       | `string` |

Only for:

A string used by expo-video to identify the audio track.

 |
| label | `string` |

Label of the audio track in the language of the device.

 |
| language | `string` |

Language of the audio track. For example, 'en', 'pl', 'de'.

 |

### `BufferOptions`[](https://docs.expo.dev/versions/latest/sdk/video/#bufferoptions-1)

Specifies buffer options which will be used by the player when buffering the video.

| Property                 | Type    | Description |
| ------------------------ | ------- | ----------- |
| maxBufferBytes(optional) | `number | null`       |

Only for:

The maximum number of bytes that the player can buffer from the network. When 0 the player will automatically decide appropriate buffer size.

Default:`0`

 |
| minBufferForPlayback(optional) | `number` |

Only for:

Minimum duration of the buffer in seconds required to continue playing after the player has been paused or started buffering.

> This property will be ignored if `preferredForwardBufferDuration` is lower.

Default:`2`

 |
| preferredForwardBufferDuration(optional) | `number` |

Only for:

The duration in seconds which determines how much media the player should buffer ahead of the current playback time.

On iOS when set to `0` the player will automatically decide appropriate buffer duration.

Equivalent to [`AVPlayerItem.preferredForwardBufferDuration`](https://developer.apple.com/documentation/avfoundation/avplayeritem/1643630-preferredforwardbufferduration).

Default:`Android: 20, iOS: 0`

 |
| prioritizeTimeOverSizeThreshold(optional) | `boolean` |

Only for:

A Boolean value which determines whether the player should prioritize time over size when buffering media.

Default:`false`

 |
| waitsToMinimizeStalling(optional) | `boolean` |

Only for:

A Boolean value that indicates whether the player should automatically delay playback in order to minimize stalling.

Equivalent to [`AVPlayer.automaticallyWaitsToMinimizeStalling`](https://developer.apple.com/documentation/avfoundation/avplayer/1643482-automaticallywaitstominimizestal).

Default:`true`

 |

### `ContentType`[](https://docs.expo.dev/versions/latest/sdk/video/#contenttype)

Literal Type: `string`

Specifies the content type of the source.

-   `auto`: The player will automatically determine the content type of the video.
-   `progressive`: The player will use progressive download content type. This is the default `ContentType` when the uri does not contain an extension.
-   `hls`: The player will use HLS content type.
-   `dash`: The player will use DASH content type (Android-only).
-   `smoothStreaming`: The player will use SmoothStreaming content type (Android-only).

Acceptable values are: `'auto'` | `'progressive'` | `'hls'` | `'dash'` | `'smoothStreaming'`

### `DRMOptions`[](https://docs.expo.dev/versions/latest/sdk/video/#drmoptions)

Specifies DRM options which will be used by the player while loading the video.

| Property                        | Type     | Description |
| ------------------------------- | -------- | ----------- |
| base64CertificateData(optional) | `string` |

Only for:

Specifies the base64 encoded certificate data for the FairPlay DRM. When this property is set, the `certificateUrl` property is ignored.

 |
| certificateUrl(optional) | `string` |

Only for:

Specifies the certificate URL for the FairPlay DRM.

 |
| contentId(optional) | `string` |

Only for:

Specifies the content ID of the stream.

 |
| headers(optional) | `Record<string, string>` |

Determines headers sent to the license server on license requests.

 |
| licenseServer | `string` |

Determines the license server URL.

 |
| multiKey(optional) | `boolean` |

Only for:

Specifies whether the DRM is a multi-key DRM.

 |
| type | `[DRMType](https://docs.expo.dev/versions/latest/sdk/video/#drmtype)` |

Determines which type of DRM to use.

 |

### `DRMType`[](https://docs.expo.dev/versions/latest/sdk/video/#drmtype)

Literal Type: `string`

Specifies which type of DRM to use:

-   Android supports ClearKey, PlayReady and Widevine.
-   iOS supports FairPlay.

Acceptable values are: `'clearkey'` | `'fairplay'` | `'playready'` | `'widevine'`

### `IsExternalPlaybackActiveChangeEventPayload`[](https://docs.expo.dev/versions/latest/sdk/video/#isexternalplaybackactivechangeeventpayload)

| Property                 | Type      | Description |
| ------------------------ | --------- | ----------- |
| isExternalPlaybackActive | `boolean` |

The current external playback status.

 |
| oldIsExternalPlaybackActive(optional) | `boolean` |

The previous external playback status.

 |

### `MutedChangeEventPayload`[](https://docs.expo.dev/versions/latest/sdk/video/#mutedchangeeventpayload)

Data delivered with the [`mutedChange`](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerevents) event.

| Property | Type      | Description |
| -------- | --------- | ----------- |
| muted    | `boolean` |

Boolean value whether the player is currently muted.

 |
| oldMuted(optional) | `boolean` |

Previous value of the `isMuted` property.

 |

### `PlaybackRateChangeEventPayload`[](https://docs.expo.dev/versions/latest/sdk/video/#playbackratechangeeventpayload)

Data delivered with the [`playbackRateChange`](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerevents) event.

| Property                  | Type     | Description |
| ------------------------- | -------- | ----------- |
| oldPlaybackRate(optional) | `number` |

Previous value of the `playbackRate` property.

 |
| playbackRate | `number` |

Float value indicating the current playback speed of the player.

 |

### `PlayerError`[](https://docs.expo.dev/versions/latest/sdk/video/#playererror)

Contains information about any errors that the player encountered during the playback

| Property | Type     | Description |
| -------- | -------- | ----------- |
| message  | `string` |

 |

### `PlayingChangeEventPayload`[](https://docs.expo.dev/versions/latest/sdk/video/#playingchangeeventpayload)

Data delivered with the [`playingChange`](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerevents) event.

| Property  | Type      | Description |
| --------- | --------- | ----------- |
| isPlaying | `boolean` |

Boolean value whether the player is currently playing.

 |
| oldIsPlaying(optional) | `boolean` |

Previous value of the `isPlaying` property.

 |

### `SourceChangeEventPayload`[](https://docs.expo.dev/versions/latest/sdk/video/#sourcechangeeventpayload)

Data delivered with the [`sourceChange`](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerevents) event.

| Property            | Type                                                                          | Description |
| ------------------- | ----------------------------------------------------------------------------- | ----------- |
| oldSource(optional) | `[VideoSource](https://docs.expo.dev/versions/latest/sdk/video/#videosource)` |

Previous source of the player.

 |
| source | `[VideoSource](https://docs.expo.dev/versions/latest/sdk/video/#videosource)` |

New source of the player.

 |

### `SourceLoadEventPayload`[](https://docs.expo.dev/versions/latest/sdk/video/#sourceloadeventpayload)

Data delivered with the [`sourceLoad`](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerevents) event, contains information about the video source that has finished loading.

| Property             | Type                                                                          | Description |
| -------------------- | ----------------------------------------------------------------------------- | ----------- |
| availableAudioTracks | `[AudioTrack[]](https://docs.expo.dev/versions/latest/sdk/video/#audiotrack)` |

Audio tracks available for the loaded video source.

 |
| availableSubtitleTracks | `[SubtitleTrack[]](https://docs.expo.dev/versions/latest/sdk/video/#subtitletrack)` |

Subtitle tracks available for the loaded video source.

 |
| availableVideoTracks | `[VideoTrack[]](https://docs.expo.dev/versions/latest/sdk/video/#videotrack)` |

Video tracks available for the loaded video source.

> On iOS, when using a HLS source, make sure that the uri contains `.m3u8` extension or that the [`contentType`](https://docs.expo.dev/versions/latest/sdk/video/#contenttype) property of the [`VideoSource`](https://docs.expo.dev/versions/latest/sdk/video/#videosource) has been set to `'hls'`. Otherwise, the video tracks will not be available.

 |
| duration | `number` |

Duration of the video source in seconds.

 |
| videoSource | `[VideoSource](https://docs.expo.dev/versions/latest/sdk/video/#videosource) | null` |

The video source that has been loaded.

 |

### `StatusChangeEventPayload`[](https://docs.expo.dev/versions/latest/sdk/video/#statuschangeeventpayload)

Data delivered with the [`statusChange`](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerevents) event.

| Property        | Type                                                                          | Description |
| --------------- | ----------------------------------------------------------------------------- | ----------- |
| error(optional) | `[PlayerError](https://docs.expo.dev/versions/latest/sdk/video/#playererror)` |

Error object containing information about the error that occurred.

 |
| oldStatus(optional) | `[VideoPlayerStatus](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerstatus)` |

Previous status of the player.

 |
| status | `[VideoPlayerStatus](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerstatus)` |

New status of the player.

 |

### `SubtitleTrack`[](https://docs.expo.dev/versions/latest/sdk/video/#subtitletrack-1)

| Property | Type     | Description |
| -------- | -------- | ----------- |
| id       | `string` |

Only for:

A string used by `expo-video` to identify the subtitle track.

 |
| label | `string` |

Label of the subtitle track in the language of the device.

 |
| language | `string` |

Language of the subtitle track. For example, `en`, `pl`, `de`.

 |

### `SubtitleTrackChangeEventPayload`[](https://docs.expo.dev/versions/latest/sdk/video/#subtitletrackchangeeventpayload)

| Property                   | Type                                                                             | Description |
| -------------------------- | -------------------------------------------------------------------------------- | ----------- |
| oldSubtitleTrack(optional) | `[SubtitleTrack](https://docs.expo.dev/versions/latest/sdk/video/#subtitletrack) | null`       |

Previous subtitle track of the player.

 |
| subtitleTrack | `[SubtitleTrack](https://docs.expo.dev/versions/latest/sdk/video/#subtitletrack) | null` |

New subtitle track of the player.

 |

### `SurfaceType`[](https://docs.expo.dev/versions/latest/sdk/video/#surfacetype-1)

Literal Type: `string`

Describes the type of the surface used to render the video.

-   `surfaceView`: Uses the `SurfaceView` to render the video. This value should be used in the majority of cases. Provides significantly lower power consumption, better performance, and more features.
-   `textureView`: Uses the `TextureView` to render the video. Should be used in cases where the SurfaceView is not supported or causes issues (for example, overlapping video views).

You can learn more about surface types in the official [ExoPlayer documentation](https://developer.android.com/media/media3/ui/playerview#surfacetype).

Acceptable values are: `'textureView'` | `'surfaceView'`

### `TimeUpdateEventPayload`[](https://docs.expo.dev/versions/latest/sdk/video/#timeupdateeventpayload)

Data delivered with the [`timeUpdate`](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerevents) event, contains information about the current playback progress.

| Property         | Type     | Description |
| ---------------- | -------- | ----------- |
| bufferedPosition | `number` |

Only for:

Float value indicating how far the player has buffered the video in seconds. Same as the [`bufferedPosition`](https://docs.expo.dev/versions/latest/sdk/video/#bufferedPosition) property.

 |
| currentLiveTimestamp | `number | null` |

Only for:

The exact timestamp when the currently displayed video frame was sent from the server, based on the `EXT-X-PROGRAM-DATE-TIME` tag in the livestream metadata. Same as the [`currentLiveTimestamp`](https://docs.expo.dev/versions/latest/sdk/video/#currentlivetimestamp) property.

 |
| currentOffsetFromLive | `number | null` |

Only for:

Float value indicating the latency of the live stream in seconds. Same as the [`currentOffsetFromLive`](https://docs.expo.dev/versions/latest/sdk/video/#currentoffsetfromlive) property.

 |
| currentTime | `number` |

Float value indicating the current playback time in seconds. Same as the [`currentTime`](https://docs.expo.dev/versions/latest/sdk/video/#currenttime) property.

 |

### `VideoContentFit`[](https://docs.expo.dev/versions/latest/sdk/video/#videocontentfit)

Literal Type: `string`

Describes how a video should be scaled to fit in a container.

-   `contain`: The video maintains its aspect ratio and fits inside the container, with possible letterboxing/pillarboxing.
-   `cover`: The video maintains its aspect ratio and covers the entire container, potentially cropping some portions.
-   `fill`: The video stretches/squeezes to completely fill the container, potentially causing distortion.

Acceptable values are: `'contain'` | `'cover'` | `'fill'`

### `VideoMetadata`[](https://docs.expo.dev/versions/latest/sdk/video/#videometadata)

Contains information that will be displayed in the now playing notification when the video is playing.

| Property         | Type     | Description |
| ---------------- | -------- | ----------- |
| artist(optional) | `string` |

Only for:

Secondary text that will be displayed under the title.

 |
| artwork(optional) | `string` |

Only for:

The uri of the video artwork.

 |
| title(optional) | `string` |

Only for:

The title of the video.

 |

### `VideoPlayerEvents`[](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerevents)

Handlers for events which can be emitted by the player.

| Property         | Type                                                                                                                               | Description |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| audioTrackChange | `(payload: [AudioTrackChangeEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#audiotrackchangeeventpayload)) => void` |

Handler for an event emitted when the current audio track changes.

 |
| availableAudioTracksChange | `(payload: [AvailableAudioTracksChangeEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#availableaudiotrackschangeeventpayload)) => void` |

Handler for an event emitted when the available audio tracks change.

 |
| availableSubtitleTracksChange | `(payload: [AvailableSubtitleTracksChangeEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#availablesubtitletrackschangeeventpayload)) => void` |

Handler for an event emitted when the available subtitle tracks change.

 |
| isExternalPlaybackActiveChange | `(payload: [IsExternalPlaybackActiveChangeEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#isexternalplaybackactivechangeeventpayload)) => void` |

Only for:

Handler for an event emitted when the video player starts or stops sharing the video via AirPlay.

 |
| mutedChange | `(payload: [MutedChangeEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#mutedchangeeventpayload)) => void` |

Handler for an event emitted when the `muted` property of the player changes

 |
| playbackRateChange | `(payload: [PlaybackRateChangeEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#playbackratechangeeventpayload)) => void` |

Handler for an event emitted when the `playbackRate` property of the player changes.

 |
| playingChange | `(payload: [PlayingChangeEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#playingchangeeventpayload)) => void` |

Handler for an event emitted when the player starts or stops playback.

 |
| playToEnd | `() => void` |

Handler for an event emitted when the player plays to the end of the current source.

 |
| sourceChange | `(payload: [SourceChangeEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#sourcechangeeventpayload)) => void` |

Handler for an event emitted when the current media source of the player changes.

 |
| sourceLoad | `(payload: [SourceLoadEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#sourceloadeventpayload)) => void` |

Handler for an event emitted when the player has finished loading metadata for the current video source. This event is emitted when the player has finished metadata for a [`VideoSource`](https://docs.expo.dev/versions/latest/sdk/video/#videosource), but it doesn't mean that there is enough data buffered to start the playback.

 |
| statusChange | `(payload: [StatusChangeEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#statuschangeeventpayload)) => void` |

Handler for an event emitted when the status of the player changes.

 |
| subtitleTrackChange | `(payload: [SubtitleTrackChangeEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#subtitletrackchangeeventpayload)) => void` |

Handler for an event emitted when the current subtitle track changes.

 |
| timeUpdate | `(payload: [TimeUpdateEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#timeupdateeventpayload)) => void` |

Handler for an event emitted in a given interval specified by the `timeUpdateEventInterval`.

 |
| videoTrackChange | `(payload: [VideoTrackChangeEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#videotrackchangeeventpayload)) => void` |

Handler for an event emitted when the current video track changes.

 |
| volumeChange | `(payload: [VolumeChangeEventPayload](https://docs.expo.dev/versions/latest/sdk/video/#volumechangeeventpayload)) => void` |

Handler for an event emitted when the `volume` of `muted` property of the player changes.

 |

### `VideoPlayerStatus`[](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerstatus)

Literal Type: `string`

Describes the current status of the player.

-   `idle`: The player is not playing or loading any videos.
-   `loading`: The player is loading video data from the provided source
-   `readyToPlay`: The player has loaded enough data to start playing or to continue playback.
-   `error`: The player has encountered an error while loading or playing the video.

Acceptable values are: `'idle'` | `'loading'` | `'readyToPlay'` | `'error'`

### `VideoSize`[](https://docs.expo.dev/versions/latest/sdk/video/#videosize)

Specifies the size of a video track.

| Property | Type     | Description |
| -------- | -------- | ----------- |
| height   | `number` |

Height of the video track in pixels.

 |
| width | `number` |

Width of the video track in pixels.

 |

### `VideoSource`[](https://docs.expo.dev/versions/latest/sdk/video/#videosource)

Type: `string` or `number` or `null` or `object` shaped as below:

| Property          | Type     | Description |
| ----------------- | -------- | ----------- |
| assetId(optional) | `number` |

The asset ID of a local video asset, acquired with the `require` function. This property is exclusive with the `uri` property. When both are present, the `assetId` will be ignored.

 |
| contentType(optional) | `[ContentType](https://docs.expo.dev/versions/latest/sdk/video/#contenttype)` |

Only for:

Specifies the content type of the video source. When set to `'auto'`, the player will try to automatically determine the content type.

You should use this property when playing HLS, SmoothStreaming or DASH videos from an uri, which does not contain a standardized extension for the corresponding media type.

Default:`'auto'`

 |
| drm(optional) | `[DRMOptions](https://docs.expo.dev/versions/latest/sdk/video/#drmoptions)` |

Specifies the DRM options which will be used by the player while loading the video.

 |
| headers(optional) | `Record<string, string>` |

Only for:

Specifies headers sent with the video request.

> For DRM license headers use the `headers` field of [`DRMOptions`](https://docs.expo.dev/versions/latest/sdk/video/#drmoptions).

 |
| metadata(optional) | `[VideoMetadata](https://docs.expo.dev/versions/latest/sdk/video/#videometadata)` |

Only for:

Specifies information which will be displayed in the now playing notification. When undefined the player will display information contained in the video metadata.

 |
| uri(optional) | `string` |

The URI of the video.

This property is exclusive with the `assetId` property. When both are present, the `assetId` will be ignored.

 |
| useCaching(optional) | `boolean` |

Only for:

Specifies whether the player should use caching for the video.

> Due to platform limitations, the cache cannot be used with HLS video sources on iOS. Caching DRM-protected videos is not supported on Android and iOS.

Default:`false`

 |

### `VideoThumbnailOptions`[](https://docs.expo.dev/versions/latest/sdk/video/#videothumbnailoptions)

Additional options for video thumbnails generation.

| Property            | Type     | Description |
| ------------------- | -------- | ----------- |
| maxHeight(optional) | `number` |

Only for:

If provided, the generated thumbnail will not exceed this height in pixels, preserving its aspect ratio.

 |
| maxWidth(optional) | `number` |

Only for:

If provided, the generated thumbnail will not exceed this width in pixels, preserving its aspect ratio.

 |

### `VideoTrack`[](https://docs.expo.dev/versions/latest/sdk/video/#videotrack-1)

Specifies a VideoTrack loaded from a [`VideoSource`](https://docs.expo.dev/versions/latest/sdk/video/#videosource).

| Property | Type    | Description |
| -------- | ------- | ----------- |
| bitrate  | `number | null`       |

Specifies the bitrate in bits per second. This is the peak bitrate if known, or else the average bitrate if known, or else null.

 |
| frameRate | `number | null` |

Specifies the frame rate of the video track in frames per second.

 |
| id | `string` |

The id of the video track.

> This field is platform-specific and may return different depending on the operating system.

 |
| isSupported | `boolean` |

Only for:

Indicates whether the video track format is supported by the device.

 |
| mimeType | `string | null` |

MimeType of the video track or null if unknown.

 |
| size | `[VideoSize](https://docs.expo.dev/versions/latest/sdk/video/#videosize)` |

Size of the video track.

 |

### `VideoTrackChangeEventPayload`[](https://docs.expo.dev/versions/latest/sdk/video/#videotrackchangeeventpayload)

Data delivered with the [`videoTrackChange`](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerevents) event, contains information about the video track which is currently being played.

| Property                | Type                                                                       | Description |
| ----------------------- | -------------------------------------------------------------------------- | ----------- |
| oldVideoTrack(optional) | `[VideoTrack](https://docs.expo.dev/versions/latest/sdk/video/#videotrack) | null`       |

Previous video track of the player.

 |
| videoTrack | `[VideoTrack](https://docs.expo.dev/versions/latest/sdk/video/#videotrack) | null` |

New video track of the player.

 |

### `VolumeChangeEventPayload`[](https://docs.expo.dev/versions/latest/sdk/video/#volumechangeeventpayload)

Data delivered with the [`volumeChange`](https://docs.expo.dev/versions/latest/sdk/video/#videoplayerevents) event.

| Property            | Type     | Description |
| ------------------- | -------- | ----------- |
| oldVolume(optional) | `number` |

Previous value of the `volume` property.

 |
| volume | `number` |

Float value indicating the current volume of the player.

 |