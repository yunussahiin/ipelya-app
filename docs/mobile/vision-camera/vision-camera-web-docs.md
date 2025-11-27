Camera Devices
What are Camera Devices?
Camera Devices are the physical (or "virtual") devices that can be used to record videos or capture photos.

Physical: A physical Camera Device is a camera lens on your phone. Different physical Camera Devices have different specifications, such as different capture formats, resolutions, zoom levels, and more. Some phones have multiple physical Camera Devices. Examples:
"Backside Wide-Angle Camera"
"Frontside Wide-Angle Camera (FaceTime HD)"
"Ultra-Wide-Angle back camera"
Virtual: A virtual camera device is a combination of one or more physical camera devices, and provides features such as virtual-device-switchover while zooming (see video on the right) or combined photo delivery from all physical cameras to produce higher quality images. Examples:
"Triple-Camera"
"Dual-Wide-Angle Camera"
Select the default Camera
If you simply want to use the default CameraDevice, you can just use whatever is available:

Hooks API
Imperative API
const devices = Camera.getAvailableCameraDevices()
const device = getCameraDevice(devices, 'back')

And VisionCamera will automatically find the best matching CameraDevice for you!

🚀 Continue with: Camera Lifecycle

Custom Device Selection
For advanced use-cases, you might want to select a different CameraDevice for your app.

A CameraDevice consists of the following specifications:

id: A unique ID used to identify this Camera Device
position: The position of this Camera Device relative to the phone
back: The Camera Device is located on the back of the phone
front: The Camera Device is located on the front of the phone
external: The Camera Device is an external device. These devices can be either:
USB Camera Devices (if they support the USB Video Class (UVC) Specification)
Continuity Camera Devices (e.g. your iPhone's or Mac's Camera connected through WiFi/Continuity)
Bluetooth/WiFi Camera Devices (if they are supported in the platform-native Camera APIs)
physicalDevices: The physical Camera Devices (lenses) this Camera Device consists of. This can either be one of these values ("physical" device) or any combination of these values ("virtual" device):
ultra-wide-angle-camera: The "fish-eye" camera for 0.5x zoom
wide-angle-camera: The "default" camera for 1x zoom
telephoto-camera: A zoomed-in camera for 3x zoom
sensorOrientation: The orientation of the Camera sensor/lens relative to the phone. Cameras are usually in landscape-left orientation, meaning they are rotated by 90°. This includes their resolutions, so a 4k format might be 3840x2160, not 2160x3840
minZoom: The minimum possible zoom factor for this Camera Device. If this is a multi-cam, this is the point where the device with the widest field of view is used (e.g. ultra-wide)
maxZoom: The maximum possible zoom factor for this Camera Device. If this is a multi-cam, this is the point where the device with the lowest field of view is used (e.g. telephoto)
neutralZoom: A value between minZoom and maxZoom where the "default" Camera Device is used (e.g. wide-angle). When using multi-cams, make sure to start off at this zoom level, so the user can optionally zoom out to the ultra-wide-angle Camera instead of already starting zoomed out
formats: The list of CameraDeviceFormats (See "Camera Formats") this Camera Device supports. A format specifies:
Video Resolution (see "Formats: Video Resolution")
Photo Resolution (see "Formats: Photo Resolution")
FPS (see "Formats: FPS")
Video Stabilization Mode (see: "Formats: Video Stabilization Mode")
Pixel Format (see: "Formats: Pixel Format")
Examples on an iPhone
Here's a list of some Camera Devices an iPhone 13 Pro has:

Back Wide Angle Camera 1x (['wide-angle-camera'])
Back Ultra-Wide Angle Camera 0.5x (['ultra-wide-angle-camera'])
Back Telephoto Camera 3x (['telephoto-camera'])
Back Dual Camera 1x + 3x (['wide-angle-camera', 'telephoto-camera'])
Back Dual-Wide Camera 0.5x + 1x (['ultra-wide-angle-camera', 'wide-angle-camera'])
Back Triple Camera 0.5x + 1x + 3x (['ultra-wide-angle-camera', 'wide-angle-camera', 'telephoto-camera'])
Back LiDAR Camera 1x (['wide-angle-camera'] + depth)
Front Wide Angle 1x (['wide-angle-camera'])
Front True-Depth 1x (['wide-angle-camera'] + depth)
Selecting Multi-Cams
Multi-Cams are virtual Camera Devices that consist of more than one physical Camera Device. For example:

ultra-wide + wide + telephoto = "Triple-Camera"
ultra-wide + wide = "Dual-Wide-Camera"
wide + telephoto = "Dual-Camera"
Benefits of Multi-Cams:

Multi-Cams can smoothly switch between the physical Camera Devices (lenses) while zooming.
Multi-Cams can capture Frames from all physical Camera Devices at the same time and fuse them together to create higher-quality Photos.
Downsides of Multi-Cams:

The Camera takes longer to initialize and uses more resources
To use the "Triple-Camera" in your app, you can just search for a device that contains all three physical Camera Devices:

Hooks API
Imperative API
const devices = Camera.getAvailableCameraDevices()
const device = getCameraDevice(devices, 'back', {
  physicalDevices: [
    'ultra-wide-angle-camera',
    'wide-angle-camera',
    'telephoto-camera'
  ]
})

This will try to find a CameraDevice that consists of all three physical Camera Devices, or the next best match (e.g. "Dual-Camera", or just a single wide-angle-camera) if not found. With the "Triple-Camera", we can now zoom out to a wider field of view:


If you want to do the filtering/sorting fully yourself, you can also just get all devices, then implement your own filter:

Hooks API
Imperative API
const devices = Camera.getAvailableCameraDevices()
const device = findBestDevice(devices)

Selecting external Cameras
VisionCamera supports using external Camera Devices, such as:

USB Camera Devices (if they support the USB Video Class (UVC) Specification)
Continuity Camera Devices (e.g. your iPhone's or Mac's Camera connected through WiFi/Continuity)
Bluetooth/WiFi Camera Devices (if they are supported in the platform-native Camera APIs)
Since external Camera Devices can be plugged in/out at any point, you need to make sure to listen for changes in the Camera Devices list when using external Cameras:

Hooks API
Imperative API
Add a listener by using the addCameraDevicesChangedListener(..) API:

const listener = Camera.addCameraDevicesChangedListener((devices) => {
  console.log(`Devices changed: ${devices}`)
  this.usbCamera = devices.find((d) => d.position === "external")
})
// ...
listener.remove()


Camera Formats

What are camera formats?
Each camera device (see "Camera Devices") provides a number of formats that have different specifications. There are formats specifically designed for high-resolution photo capture (but lower FPS), or formats that are designed for slow-motion video capture which have frame-rates of up to 240 FPS (but lower resolution).

What if I don't want to choose a format?
If you don't want to specify a Camera Format, you don't have to. The Camera automatically chooses the best matching format for the current camera device. This is why the Camera's format property is optional.

🚀 Continue with: Taking Photos

Choosing custom formats
To understand a bit more about camera formats, you first need to understand a few "general camera basics":

Each camera device is built differently, e.g. front-facing Cameras often don't have resolutions as high as the Cameras on the back. (see "Camera Devices")
Formats are designed for specific use-cases, here are some examples for formats on a Camera Device:
4k Photos, 4k Videos, 30 FPS (high quality)
4k Photos, 1080p Videos, 60 FPS (high FPS)
4k Photos, 1080p Videos, 240 FPS (ultra high FPS/slow motion)
720p Photos, 720p Videos, 30 FPS (smaller buffers/e.g. faster face detection)
Each app has different requirements, so the format filtering is up to you.
The videoResolution and videoAspectRatio options also affect the preview, as preview is also running in the video stream.
To get all available formats, simply use the CameraDevice's formats property. These are a CameraFormat's props:

photoHeight/photoWidth: The resolution that will be used for taking photos. Choose a format with your desired resolution.
videoHeight/videoWidth: The resolution that will be used for recording videos and streaming into frame processors. This also affects the preview's aspect ratio. Choose a format with your desired resolution.
minFps/maxFps: A range of possible values for the fps property. For example, if your format has minFps: 1 and maxFps: 60, you can either use fps={30}, fps={60} or any other value in between for recording videos and streaming into frame processors.
videoStabilizationModes: All supported Video Stabilization Modes, digital and optical. If this specific format contains your desired VideoStabilizationMode, you can pass it to your <Camera> via the videoStabilizationMode property.
supportsVideoHdr: Whether this specific format supports true 10-bit HDR for video capture. If this is true, you can enable videoHdr on your <Camera>.
supportsPhotoHdr: Whether this specific format supports HDR for photo capture. It will use multiple captures to fuse over-exposed and under-exposed Images together to form one HDR photo. If this is true, you can enable photoHdr on your <Camera>.
supportsDepthCapture: Whether this specific format supports depth data capture. For devices like the TrueDepth/LiDAR cameras, this will always be true.
...and more. See the CameraDeviceFormat type for all supported properties.
You can either find a matching format manually by looping through your CameraDevice's formats property, or by using the helper functions from VisionCamera:

Hooks API
Imperative API
const device = ...
const format = getCameraFormat(device, [
  { videoAspectRatio: 16 / 9 },
  { videoResolution: { width: 3048, height: 2160 } },
  { fps: 60 }
])

The filter is ordered by priority (descending), so if there is no format that supports both 4k and 60 FPS, the function will prefer 4k@30FPS formats over 1080p@60FPS formats, because 4k is a more important requirement than 60 FPS.

If you want to record slow-motion videos, you want a format with a really high FPS setting, for example:

Hooks API
Imperative API
const device = ...
const format = getCameraFormat(device, [
  { fps: 240 }
])

If there is no format that has exactly 240 FPS, the closest thing to it will be used.

You can also use the 'max' flag to just use the maximum available resolution:

Hooks API
Imperative API
const device = ...
const format = getCameraFormat(device, [
  { videoResolution: 'max' },
  { photoResolution: 'max' }
])

Templates
For common use-cases, VisionCamera also exposes pre-defined Format templates:

Hooks API
Imperative API
const device = ...
const format = getCameraFormat(device, Templates.Snapchat)

Camera Props
The Camera View provides a few props that depend on the specified format.

FPS
For example, a camera device might have a 1080p and a 4k format, but the 4k one can only stream at 60 FPS, while the 1080p format can do 240 FPS.

To find a 240 FPS format we can use the useCameraFormat(..) hook to find a suitable format, then pass it's maximum supported FPS as the Camera's target FPS:

function App() {
  const device = ...
  const format = useCameraFormat(device, [
    { fps: 240 }
  ])
  const fps = format.maxFps // <-- 240 FPS, or lower if 240 FPS is not available

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      format={format}
      fps={fps}
    />
  )
}

Setting fps to a single number will configure the Camera to use a fixed FPS rate.

Under low/dark lighting conditions, a Camera could throttle it's FPS rate to receive more light, which would result in higher quality and better exposed photos and videos. VisionCamera provides an API to set a variable FPS rate, which internally automatically adjusts FPS rate depending on lighting conditions. To use this, simply set fps to a tuple ([min, max]).

For example, we could target 30 FPS, but allow the Camera to throttle down to 20 FPS under low lighting conditions:

function App() {
  // ...
  const format = ...
  const minFps = Math.max(format.minFps, 20)
  const maxFps = Math.min(format.maxFps, 30)

  return (
    <Camera
      {...props}
      fps={[minFps, maxFps]}
    />
  )
}

Other Props
Other props that depend on the format:

videoHdr: Enables HDR video capture and preview
photoHdr: Enables HDR photo capture
videoStabilizationMode: Specifies the video stabilization mode to use for the video pipeline


Preview
The Preview View
The <Camera> component renders a Preview view for the Camera. It can be styled like any other view, although in most cases you would want to just use style={{ flex: 1 }}.

Resize Mode
The Preview's scaling mode can be configured through the resizeMode property, which can be either "cover" (center-crop to fill the view) or "contain" (scale to fit inside the view, potentially with black spacings).

Disable Preview
If you don't need to display a Preview, you can set preview={false}. Since the Preview is a separate output stream, disabling it will save resources.

Skia Frame Processors will disable the native Preview to use a custom Skia Canvas instead.

Start/Stop Events
When starting/stopping the Camera session or when switching Camera devices (e.g. from front -> back), the Preview View will momentarily stop receiving frames and appears "frozen". To get notified about pauses in the preview view, use the onPreviewStarted and onPreviewStopped events:

<Camera
  {...props}
  onPreviewStarted={() => console.log('Preview started!')}
  onPreviewStopped={() => console.log('Preview stopped!')}
/>

Preview Frame Rate (FPS)
The Preview view is running at the same frame rate as the Video stream, configured by the fps prop, or a value close to 30 FPS by default.

<Camera {...props} fps={60} />

See FPS for more information.

Resolution
On iOS, the Video resolution also determines the Preview resolution, so if you Camera format has a low Video resolution, your Preview will also be in low resolution:

const lowResolutionFormat = useCameraFormat(device, [
  { videoResolution: { width: 640, height: 480 } },
])

On Android, the Preview will always be in full HD or the Preview View's size, whichever is smaller. If a format is specified, the preview will try to match the video's resolution and aspect ratio if video is enabled, and photo's resolution and aspect ratio if photo is enabled.

<Camera
  {...props}
  format={bestFormatForPhoto}
  photo={true} // Preview will be in the photo resolution
/>

Overlays and Masks
On Android, the Preview View supports two implementation modes which are controllable through the androidPreviewViewType prop:

"surface-view": Uses a SurfaceView for rendering. This is more efficient and supports HDR rendering, but doesn't support masks, transparency, rotations or clipping.
"texture-view": Uses a TextureView for rendering. This is less efficient and doesn't support HDR rendering, but supports masks, transparency, rotations and clipping.
<Camera {...props} androidPreviewViewType="texture-view" />



Taking Photos
Camera Functions
The Camera provides certain functions which are available through a ref object:

function App() {
  const camera = useRef<Camera>(null)
  // ...

  return (
    <Camera
      ref={camera}
      {...cameraProps}
    />
  )
}

To use these functions, you need to wait until the onInitialized event has been fired.

Taking Photos
To take a photo you first have to enable photo capture:

<Camera
  {...props}
  photo={true}
/>

Then, simply use the Camera's takePhoto(...) function:

const photo = await camera.current.takePhoto()

You can customize capture options such as automatic red-eye reduction, enable flash, disable the shutter sound and more using the TakePhotoOptions parameter.

This function returns a PhotoFile which is stored in a temporary directory and can either be displayed using <Image> or <FastImage>, uploaded to a backend, or saved to the Camera Roll using react-native-cameraroll.

Resolution
Photos are always captured in the resolution of the currently selected format (See "Formats"). By default the Camera will select a format with the highest photo resolution available.

If you want to use a custom resolution, configure the Camera to use a format that matches the desired photoResolution:

const format = useCameraFormat(device, [
  { photoResolution: { width: 1280, height: 720 } }
])

return <Camera {...props} format={format} />

Flash
The takePhoto(...) function can be configured to enable the flash automatically (when the scene is dark), always or never, which will only be used for this specific capture request:

const photo = await camera.current.takePhoto({
  flash: 'on' // 'auto' | 'off'
})

Note that flash is only available on camera devices where hasFlash is true; for example most front cameras don't have a flash.

Photo Quality Balance
The photo capture pipeline can be configured to prioritize speed over quality, quality over speed or balance both quality and speed using the photoQualityBalance prop. If set to speed, the Camera pipeline will capture photos faster at the cost of lower quality:

return <Camera {...props} photoQualityBalance="speed" />

Taking Snapshots
In addition to photo capture VisionCamera also supports snapshot capture, which can take photos at speeds of up to just 16 milliseconds. A snapshot is grabbed from the Preview View of the Camera, and will not perform any AE/AF/AWB precapture sequences.

To take a snapshot simply use the Camera's takeSnapshot(..) function:

const snapshot = await camera.current.takeSnapshot({
  quality: 90
})

note
On iOS, snapshot capture requires video to be enabled.

Saving the Photo to the Camera Roll
Since the Photo is stored as a temporary file, you need to save it to the Camera Roll to permanentely store it. You can use react-native-cameraroll for this:

const file = await camera.current.takePhoto()
await CameraRoll.save(`file://${file.path}`, {
  type: 'photo',
})

Getting the Photo's data
To get the Photo's pixel data, you can use fetch(...) to read the local file as a Blob:

const file = await camera.current.takePhoto()
const result = await fetch(`file://${file.path}`)
const data = await result.blob();


Recording Videos
Camera Functions
The Camera provides certain functions which are available through a ref object:

function App() {
  const camera = useRef<Camera>(null)
  // ...

  return (
    <Camera
      ref={camera}
      {...cameraProps}
    />
  )
}

To use these functions, you need to wait until the onInitialized event has been fired.

Recording Videos
To start a video recording you first have to enable video capture:

<Camera
  {...props}
  video={true}
  audio={true} // <-- optional
/>

Then, simply use the Camera's startRecording(...) function:

camera.current.startRecording({
  onRecordingFinished: (video) => console.log(video),
  onRecordingError: (error) => console.error(error)
})

You can customize capture options such as video codec, file type, enable flash and more using the RecordVideoOptions parameter.

For any error that occured while recording the video, the onRecordingError callback will be invoked with a CaptureError and the recording is therefore cancelled.

To stop the video recording, you can call stopRecording(...):

await camera.current.stopRecording()

Once a recording has been stopped, the onRecordingFinished callback passed to the startRecording(...) function will be invoked with a VideoFile which you can then use to display in a <Video> component, uploaded to a backend, or saved to the Camera Roll using react-native-cameraroll.

Pause/Resume
To pause/resume the recordings, you can use pauseRecording() and resumeRecording():

await camera.current.pauseRecording()
...
await camera.current.resumeRecording()

Cancel
To cancel the recording, you can use cancelRecording(), which will stop the recording, delete the temporary video file and call the startRecording's onRecordingError callback with a capture/recording-canceled error.

await camera.current.cancelRecording()

Flash
The startRecording(...) function can be configured to enable the flash while recording, which natively just enables the torch under the hood:

camera.current.startRecording({
  flash: 'on',
  ...
})

Note that flash is only available on camera devices where hasTorch is true; for example most front cameras don't have a torch.

Video Codec
By default, videos are recorded in the H.264 video codec which is a widely adopted video codec.

VisionCamera also supports H.265 (HEVC), which is much more efficient in encoding performance and can be up to 50% smaller in file size. If you can handle H.265 on your backend, configure the video recorder to encode in H.265:

camera.current.startRecording({
  ...props,
  videoCodec: 'h265'
})

tip
If the device does not support h265, VisionCamera will automatically fall-back to a supported codec like h264 instead.

Video Bit Rate
Videos are recorded with a target bit-rate, which the encoder aims to match as closely as possible. A lower bit-rate means less quality (and less file size), a higher bit-rate means higher quality (and larger file size) since it can assign more bits to moving pixels.

To simply record videos with higher quality, use a videoBitRate of 'high', which effectively increases the bit-rate by 20%:

<Camera {...props} videoBitRate="high" />

To use a lower bit-rate for lower quality and lower file-size, use a videoBitRate of 'low', which effectively decreases the bit-rate by 20%:

<Camera {...props} videoBitRate="low" />

Custom Bit Rate
If you want to use a custom bit-rate, you first need to understand how bit-rate is calculated.

The bit-rate is a product of multiple factors such as resolution, FPS, pixel-format (HDR or non HDR), and video codec. As a good starting point, those are the recommended base bit-rates for their respective resolutions:

480p: 2 Mbps
720p: 5 Mbps
1080p: 10 Mbps
4K: 30 Mbps
8K: 100 Mbps
These bit-rates assume a frame rate of 30 FPS, a non-HDR pixel-format, and a H.264 video codec.

To calculate your target bit-rate, you can use this formula:

let bitRate = baseBitRate
bitRate = bitRate / 30 * fps // FPS
if (videoHdr === true) bitRate *= 1.2 // 10-Bit Video HDR
if (codec === 'h265') bitRate *= 0.8 // H.265
bitRate *= yourCustomFactor // e.g. 0.5x for half the bit-rate

And then pass it to the <Camera> component (in Mbps):

<Camera {...props} videoBitRate={bitRate} />

Video Frame Rate (FPS)
The resulting video will be recorded at the frame rate provided to the fps prop.

<Camera {...props} fps={60} />

See FPS for more information.

Saving the Video to the Camera Roll
Since the Video is stored as a temporary file, you need save it to the Camera Roll to permanentely store it. You can use react-native-cameraroll for this:

camera.current.startRecording({
  ...props,
  onRecordingFinished: (video) => {
    const path = video.path
    await CameraRoll.save(`file://${path}`, {
      type: 'video',
    })
  },
})


Zooming
Native Zoom Gesture
The <Camera> component already provides a natively implemented zoom gesture which you can enable with the enableZoomGesture prop. If you don't need any additional logic in your zoom gesture, you can skip to the next section.

🚀 Next section: Focusing

If you want to setup a custom gesture, such as the one in Snapchat or Instagram where you move up your finger while recording, first understand how zoom is expressed.

Min, Max and Neutral Zoom
A Camera device has different minimum, maximum and neutral zoom values. Those values are expressed through the CameraDevice's minZoom, maxZoom and neutralZoom props, and are represented in "scale". So if the maxZoom property of a device is 2, that means the view can be enlarged by twice it's zoom, aka the viewport halves.

The minZoom value is always 1.
The maxZoom value can have very high values (such as 128), but often you want to clamp this value to something realistic like 16.
The neutralZoom value is often 1, but can be larger than 1 for devices with "fish-eye" (ultra-wide-angle) cameras. In those cases, the user expects to be at whatever zoom value neutralZoom is (e.g. 2) per default, and if he tries to zoom out even more, he goes to minZoom (1), which switches over to the "fish-eye" (ultra-wide-angle) camera as seen in this GIF:

The Camera's zoom property expects values to be in the same "factor" scale as the minZoom, neutralZoom and maxZoom values - so if you pass zoom={device.minZoom} it is at the minimum available zoom, where as if you pass zoom={device.maxZoom} the maximum zoom value possible is zoomed in. It is recommended that you start at device.neutralZoom and let the user manually zoom out to the fish-eye camera on demand (if available).

Logarithmic scale
A Camera's zoom property is represented in a logarithmic scale. That means, increasing from 1 to 2 will appear to be a much larger offset than increasing from 127 to 128. If you want to implement a zoom gesture (<PinchGestureHandler>, <PanGestureHandler>), try to flatten the zoom property to a linear scale by raising it exponentially. (zoom.value ** 2)

Pinch-to-zoom
The above example only demonstrates how to animate the zoom property. To actually implement pinch-to-zoom or pan-to-zoom, take a look at the VisionCamera example app, the pinch-to-zoom gesture can be found here, and the pan-to-zoom gesture can be found here. They implement a real world use-case, where the maximum zoom value is clamped to a realistic value, and the zoom responds very gracefully by using a logarithmic scale.

Example (Reanimated + Gesture Handler)
While you can use any animation library to animate the zoom property (or use no animation library at all) it is recommended to use react-native-reanimated to achieve best performance. Head over to their Installation guide to install Reanimated if you haven't already.

Overview
Make the Camera View animatable using createAnimatedComponent
Make the Camera's zoom property animatable using addWhitelistedNativeProps
Create a SharedValue using useSharedValue which represents the zoom state (from 0 to 1)
Use useAnimatedProps to map the zoom SharedValue to the zoom property.
We apply the animated props to the ReanimatedCamera component's animatedProps property.
Code
The following example implements a pinch-to-zoom gesture using react-native-gesture-handler and react-native-reanimated:

import { Camera, useCameraDevice, CameraProps } from 'react-native-vision-camera'
import Reanimated, { useAnimatedProps, useSharedValue } from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

Reanimated.addWhitelistedNativeProps({
  zoom: true,
})
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)

export function App() {
  const device = useCameraDevice('back')
  const zoom = useSharedValue(device.neutralZoom)

  const zoomOffset = useSharedValue(0);
  const gesture = Gesture.Pinch()
    .onBegin(() => {
      zoomOffset.value = zoom.value
    })
    .onUpdate(event => {
      const z = zoomOffset.value * event.scale
      zoom.value = interpolate(
        z,
        [1, 10],
        [device.minZoom, device.maxZoom],
        Extrapolation.CLAMP,
      )
    })

  const animatedProps = useAnimatedProps<CameraProps>(
    () => ({ zoom: zoom.value }),
    [zoom]
  )

  if (device == null) return <NoCameraDeviceError />
  return (
    <GestureDetector gesture={gesture}>
      <ReanimatedCamera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        animatedProps={animatedProps}
      />
    </GestureDetector>
  )
}

You can also use Gesture Handler to implement different zoom gestures, such as the slide-up-to-zoom as seen in Instagram or Snapchat, or a slider as seen in the stock iOS Camera app.



Orientation

Camera Sensor Orientation
A Camera sensor is configured to deliver buffers in a specific size, for example 4096x2160. To avoid re-allocating such large buffers every time the phone rotates, the Camera pipeline will always deliver buffers in it's native sensor orientation (see sensorOrientation) and frames need to be rotated to appear up-right.

Since actually rotating pixels in such large buffers is really expensive and causes an unnecessary performance overhead, VisionCamera applies rotations through flags or transforms:

Photo & Video Output
Photos and videos will be captured in a potentially "wrong" orientation, and VisionCamera will write an EXIF flag to the photo/video file with the correct presentation rotation.

info
This is handled automatically, and it's behaviour can be controlled via the outputOrientation property.

Preview View
The Preview output will stream in a potentially "wrong" orientation, but uses view transforms (rotate + translate matrix) to properly display the Camera stream "up-right".

info
This will always happen automatically according to the screen's rotation.

Frame Processor Output
Frame Processors will stream frames in a potentially "wrong" orientation, and the client is responsible for properly interpreting the Frame data.

info
This needs to be handled manually, see Frame.orientation. For example, in MLKit just pass the Frame's orientation to the detect(...) method.

Instead of always rotating up-right to portrait, you might also want to rotate the Frame to either preview-, or output-orientation, depending on your use-case.

Implementation
VisionCamera supports three ways to implement orientation:

Camera UI (preview view) is locked, but the buttons can rotate to the desired photo/video output orientation (recommended)
Camera UI (preview view) also rotates alongside with the photo/video output orientation
Both Camera UI (preview view) and photo/video output orientation are locked to a specific orientation
The outputOrientation prop
The orientation in which photos and videos are captured can be adjusted via the outputOrientation property:

<Camera {...props} outputOrientation="device" />

"device": With the output orientation set to device (the default), photos and videos will be captured in the phone's physical orientation, even if the screen-rotation is locked. This means, even though the preview view and other views don't rotate to landscape, holding the phone in landscape mode will still capture landscape photos. This is the same behaviour as in the iOS stock Camera.

"preview": Similar to device, the preview orientation mode will follow the phone's physical orientation, allowing the user to capture landscape photos and videos - but will always respect screen-rotation locks. This means that the user is not able to capture landscape photos or videos if the preview view and other views stay in portrait mode (e.g. if the screen-lock is on).

Listen to orientation changes
Whenever the output orientation changes, the onOutputOrientationChanged event will be called with the new output orientation. This is a good point to rotate the buttons to the desired output orientation now.

The onPreviewOrientationChanged event will be called whenever the preview orientation changes, which might be unrelated to the output orientation. Depending on the device's natural orientation (e.g. iPads being landscape by default), you should rotate all buttons on the UI relative to the preview orientation.

As a helper method, VisionCamera fires the onUIRotationChanged event whenever the target UI rotation changes. You can directly apply this rotation to any UI elements such as buttons to rotate them to the correct orientation:

const [uiRotation, setUiRotation] = useState(0)
const uiStyle: ViewStyle = {
  transform: [{ rotate: `${uiRotation}deg` }]
}

return (
  <View>
    <Camera {...props} onUIRotationChanged={setUiRotation} />
    <FlipCameraButton style={uiStyle} />
  </View>
)

tip
For a smoother user experience, you should animate changes to the UI rotation. Use a library like react-native-reanimated to smoothly animate the rotate style.

The Frame's orientation
In a Frame Processor, frames are streamed in their native sensor orientation. This means even if the phone is rotated from portrait to landscape, the Frame's width and height stay the same.

The Frame's orientation represents the image buffer's orientation, relative to the device's native portrait mode.

For example, if the Frame's orientation is landscape-right, it is 90° rotated and needs to be counter-rotated by -90° to appear "up-right".

On an iPhone, "up-right" means portrait mode (the home-button is at the bottom). On an iPad, "up-right" might mean a landscape orientation.

Instead of actually rotating pixels in the buffers, frame processor plugins just need to interpret the frame as being rotated.

MLKit handles this via a orientation property on the MLImage/VisionImage object:

public override func callback(_ frame: Frame, withArguments _: [AnyHashable: Any]?) -> Any? {
  let mlImage = MLImage(sampleBuffer: frame.buffer)
  mlImage.orientation = frame.orientation
  // ...
}

You can then either rotate to preview-, or output-orientation, depending on your use-case.

Rotate Frame.orientation to output Orientation
If you have a Frame Processor that detects objects or faces and the user holds the phone in a landscape orientation, your algorithm might not be able to detect the object or face because it is rotated.

In this case you can just rotate the Frame.orientation by the outputOrientation (see onOutputOrientationChanged), and it will then be a landscape Frame if the user rotates the phone to landscape, or a portrait Frame if the user holds the phone in portrait.

Rotate Frame.orientation to preview Orientation
If you have a Frame Processor tht applies some drawing operations or provides visual feedback to the Preview, you don't want to use the outputOrientation as that can be different than the previewOrientation.

In this case you can follow the same idea as above, just rotate the Frame.orientation by the previewOrientation (see onPreviewOrientationChanged) to receive a Frame in the same orientation the Preview view is currently in.

Orientation in Skia Frame Processors
A Skia Frame Processor applies orientation via rotation and translation. This means the coordinate system stays the same, but output will be rotated accordingly. For a landscape-left frame, (0,0) will not be top left, but rather top right.

Mirroring (isMirrored)
The photo-, video- and snapshot- outputs can be mirrored alongside the vertical axis (left/right flipped) by setting isMirrored to true. By default, outputs are mirrored in the selfie camera, and not mirrored in any other cameras. To disable mirroring even for the selfie camera, just set isMirrored to false.

The preview view is always mirrored in the selfie camera, and never mirrored in any other cameras.

<Camera {...props} isMirrored={true} />

Exposure
Adjusting exposure
To adjust the exposure of the Camera, you can use the Camera's exposure property:

<Camera {...props} exposure={-1} />

Values for the exposure prop range from device.minExposure to device.maxExposure, inclusively. By default (undefined), it is set to neutral auto exposure.

Instead of manually adjusting ISO and Exposure-Duration, this acts as an "exposure compensation bias", meaning the Camera will still continuously automatically adjust exposure as it goes, but premultiplies the given exposure value to it's ISO and Exposure Duration settings.

exposure={-2}	exposure={0}	exposure={2}
Exposure -2	Exposure Neutral	Exposure +2
Animating
Just like zoom, this property can be animated using Reanimated.

Add the exposure prop to the whitelisted animateable properties:
import Reanimated, { addWhitelistedNativeProps } from "react-native-reanimated"

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)
addWhitelistedNativeProps({
  exposure: true,
})

Implement your animation, for example with an exposure slider:
function App() {
  // 1. create shared value for exposure slider (from -1..0..1)
  const exposureSlider = useSharedValue(0)

  // 2. map slider to [minExposure, 0, maxExposure]
  const exposureValue = useDerivedValue(() => {
    if (device == null) return 0

    return interpolate(exposureSlider.value,
                       [-1, 0, 1],
                       [device.minExposure, 0, device.maxExposure])
  }, [exposureSlider, device])

  // 3. pass it as an animated prop
  const animatedProps = useAnimatedProps(() => ({
    exposure: exposureValue.value
  }), [exposureValue])

  // 4. render Camera
  return (
    <ReanimatedCamera
      {...props}
      animatedProps={animatedProps}
    />
  )
}


HDR
What is HDR?
HDR ("High Dynamic Range") is a capture mode that captures colors in a much wider range, allowing for much better details and brighter colors.

Standard Dynamic Range ("SDR")	High Dynamic Range ("HDR")
SDR Photo	HDR Photo
Photo HDR
Photo HDR is accomplished by running three captures instead of one, an underexposed photo, a normal photo, and an overexposed photo. Then, these images are fused together to create darker darks and brighter brights.


Video HDR
Video HDR is accomplished by using a 10-bit HDR pixel format with custom configuration on the hardware sensor that allows for capturing wider color ranges.

On iOS, this uses the kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange Pixel Format.
On Android, this uses the Dynamic Range Format HLG10, HDR10 or DOLBY_VISION_10B_HDR_OEM.
If true 10-bit Video HDR is not available, the OS will sometimes fall back to EDR ("Extended Dynamic Range"), which, similar to how Photo HDR works, just doubles the video frame rate to capture one longer-exposed frame and one shorter exposed frame.

Using HDR
To enable HDR capture, you need to select a format (see "Camera Formats") that supports HDR capture:

Hooks API
Imperative API
const format = getCameraFormat(device, [
  { photoHdr: true },
  { videoHdr: true },
])

Then, pass the format to the Camera and enable the videoHdr/photoHdr props if it is supported:

const format = ...

return (
  <Camera
    {...props}
    format={format}
    videoHdr={format.supportsVideoHdr}
    photoHdr={format.supportsPhotoHdr}
  />
)

Now, all captures (takePhoto(..) and startRecording(..)) will be configured to use HDR.


Video Stabilization
What is Video Stabilization?
Video Stabilization is an algorithm that stabilizes the recorded video to smoothen any jitters, shaking, or abrupt movements from the user's camera movement.


There are multiple different approaches to Video Stabilization, either software- or hardware-based. Video Stabilization always crops the image to a smaller view area so it has room to shift the image around, so expect a "zoomed-in" effect. Also, since Video Stabilization is a complex algorithm, enabling it will increase the time the Camera takes to initialize.

Software Based Video Stabilization
A software-based Video Stabilization mode uses CPU or GPU based algorithms that keep track of the camera movement over time by using multiple past frames to compare the change in pixels.

Hardware Based Video Stabilization
Hardware-based Video Stabilization algorithms work with the gyroscope sensor on the device and an actual moving part on the Camera lens to immediately cancel out any abrupt movements like jitters or shaking from the Camera.

Using Video Stabilization
To use Video Stabilization, you need to select a format (see "Camera Formats") that supports the given Video Stabilization mode:

Hooks API
Imperative API
const format = getCameraFormat(device, [
  { videoStabilizationMode: 'cinematic-extended' }
])

Then, pass the format to the Camera and enable the videoStabilizationMode prop if it is supported:

const format = ...
const supportsVideoStabilization = format.videoStabilizationModes.includes('cinematic-extended')
const stabilizationMode = supportsVideoStabilization ? 'cinematic-extended' : undefined

return (
  <Camera
    {...props}
    format={format}
    videoStabilizationMode={stabilizationMode}
  />
)

Now, the video pipeline will stabilize frames over time.

Latency
Video stabilization will introduce an additional latency in the video capture and frame processor pipeline as frames will need to be processed before being available to VisionCamera. With the most advanced video stabilization setting, you can expect delays of up to 3 seconds.

For Video Capture: stopRecording(...) will take longer to actually complete the recording.
For Frame Processors: Frames will arrive at a later point in time. If a Frame just arrived with cinematic-extended video stabilization, it might already be 3 seconds old.
For Skia Frame Processors: Since Skia Frame Processors have to process the Frames first before drawing them onto the Preview, this now means that the Preview is also delayed by the latency of the video stabilization algorithm. If you use Skia Frame Processors, it is recommended to use fast software-based-, or no video stabilization at all.


GPS Location Tags

What are GPS Location Tags?
GPS Location Tags are location properties stored in image files (via EXIF tags) or video files (via QuickTime/MP4 tags).

VisionCamera provides an API to easily add such location tags to captured photos or videos.

Configure Location Permissions
First, you need to add the required permissions to access the user's location:

React Native
Expo
iOS
Open your project's Info.plist and add the following lines inside the outermost <dict> tag:

<key>NSLocationWhenInUseUsageDescription</key>
<string>$(PRODUCT_NAME) needs access to your location.</string>

Android
Open your project's AndroidManifest.xml and add the following lines inside the <manifest> tag:

<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

Request Location Permissions
After adding the required permissions to your app's manifests, prompt the user to grant location permission at runtime:

Hooks API
Imperative API
Get the current permission status:

const permissionStatus = Camera.getLocationPermissionStatus()

And if it is not granted, request permission:

const newPermissionStatus = await Camera.requestLocationPermission()

Enable GPS Location Tags
Use the enableLocation property to start streaming location updates and automatically add GPS Location Tags to images (EXIF tags) and videos:

<Camera {...props} enableLocation={true} />

Once enabled, all captured photos (see "Taking Photos") and videos (see "Recording Videos") will contain location tags.

Enable or disable Location APIs
Location APIs are considered privacy-sensitive APIs by Apple. When you are not using privacy-sensitive APIs (like location) but still include them in your app's code, the Apple review team might reject your app.

To avoid that, you can disable the location APIs and VisionCamera will not compile those privacy-sensitive APIs into your app. Simply set the required flag before building your app:

React Native
Expo
Inside your Podfile, add the VCEnableLocation flag and set it to false:
react native: 
$VCEnableLocation = false


before building your app:

React Native
Expo
Inside your Expo config (app.json, app.config.json or app.config.js), add the enableLocation flag to the react-native-vision-camera plugin and set it to false:

{
  "name": "my app",
  "plugins": [
    [
      "react-native-vision-camera",
      {
        // ...
        "enableLocation": false
      }
    ]
  ]
}


Then rebuild your app and any location-related APIs will be excluded from the build.



Performance
Performance of VisionCamera
VisionCamera is highly optimized to be as fast as a native Camera app, and is sometimes even faster than that. I am using highly efficient native GPU buffer formats (such as YUV 4:2:0, or lossy compressed YUV 4:2:0), running the video pipelines in parallel, using C++ for the Frame Processors implementation, and other tricks to make sure VisionCamera is as efficient as possible.

Making it faster
There are a few things you can do to make your Camera faster which requires a core understanding of how Cameras work under the hood:

Simpler Camera Device
Selecting a "simpler" Camera Device (i.e. a Camera Device with less physical cameras) allows the Camera to initialize faster as it does not have to start multiple devices at once. You can prefer a simple wide-angle Camera (['wide-angle-camera']) over a triple camera (['ultra-wide-angle-camera', 'wide-angle-camera', 'telephoto-camera']) to significantly speed up initialization time.

Hooks API
Imperative API
const devices = Camera.getAvailableCameraDevices()
const fasterDevice = getCameraDevice(devices, 'back', {
  physicalDevices: ['wide-angle-camera']
})
const slowerDevice = getCameraDevice(devices, 'back', {
  physicalDevices: ['ultra-wide-angle-camera', 'wide-angle-camera', 'telephoto-camera']
})

See "Camera Devices" for more information.

note
By default (when not passing the options object), a simpler device is already chosen.

No Video HDR
Video HDR uses 10-bit formats and/or additional processing steps that come with additional computation overhead. Disable videoHdr for higher efficiency.

Buffer Compression
Enable Buffer Compression (enableBufferCompression) to use lossy-compressed buffers for the Camera's video pipeline. These buffers can use less memory and are more efficient.

note
When not using a frameProcessor, buffer compression is automatically enabled.

Video Stabilization
Video Stabilization requires additional overhead to start the algorithm, so disabling videoStabilizationMode can significantly speed up the Camera initialization time.

Pixel Format
The Camera's native PixelFormat is yuv. If you set pixelFormat="rgb", the pipeline will need to convert the yuv buffers to rgb, which introduces additional overhead and consumes more memory.

If you are using any Frame Processor Plugins that work with rgb, try to replace them with yuv-based plugins instead and set your pixelFormat to yuv.

Disable unneeded pipelines
Only enable photo, video, codeScanner or frameProcessor if needed.

No Skia Frame Processor
If you are not using Skia, use useFrameProcessor instead of useSkiaFrameProcessor, as useFrameProcessor is more lightweight.

Using isActive
The isActive prop controls whether the Camera should actively stream frames. Instead of fully unmounting the <Camera> component and remounting it again, keep it mounted and just switch isActive on or off. This makes the Camera resume much faster as it internally keeps the session warmed up.

Fast Photos
If you need to take photos as fast as possible, use a photoQualityBalance of 'speed' to speed up the photo pipeline:

return <Camera {...props} photoQualityBalance="speed" />

Snapshot Capture
If photo capture is still too slow for your use-case, consider taking snapshots instead:

const snapshot = await camera.current.takeSnapshot({
  quality: 85
})

Appropriate Format resolution
Choose formats efficiently. If your backend can only handle 1080p videos, don't select a 4k format if you have to downsize it later anyways - instead use 1080p already for the Camera:

Hooks API
Imperative API
const format = getCameraFormat(device, [
  { videoResolution: { width: 1920, height: 1080 } }
])

Appropriate Format FPS
Same as with format resolutions, also record at the frame rate you expect. Setting your frame rate higher can use more memory and heat up the battery. If your backend can only handle 30 FPS, there is no need to record at 60 FPS, instead set the Camera' fps to 30:

return <Camera {...props} fps={30} />




Camera Errors

Why?
Since the Camera library is quite big, there is a lot that can "go wrong". VisionCamera provides thoroughly typed errors to help you quickly identify the cause and fix the problem.

switch (error.code) {
  case "device/configuration-error":
    // prompt user
    break
  case "device/microphone-unavailable":
    // ask for permission
    break
  case "capture/recording-in-progress":
    // stop recording
    break
  default:
    console.error(error)
    break
}

Troubleshooting
See Troubleshooting if you're having "weird issues".

The Error types
The CameraError type is a baseclass type for all other errors and provides the following properties:

code: A typed code in the form of {domain}/{code} that can be used to quickly identify and group errors
message: A non-localized message text that provides a more information and context about the error and possibly problematic values.
cause?: An ErrorWithCause instance that provides information about the cause of the error. (Optional)
cause.message: The message of the error that caused the camera error.
cause.code?: The native error's error-code. (iOS only)
cause.domain?: The native error's domain. (iOS only)
cause.details?: More dictionary-style information about the cause. (iOS only)
cause.stacktrace?: A native Java stacktrace for the cause. (Android only)
cause.cause?: The cause that caused this cause. (Recursive) (Optional)
info
See the CameraError.ts file for a list of all possible error codes

Runtime Errors
The CameraRuntimeError represents any kind of error that occured in the Camera session, either in one of the outputs or the preview itself.

If the Camera session encounters an error, it will call the onError event:

function App() {
  const onError = useCallback((error: CameraRuntimeError) => {
    console.error(error)
  }, [])

  return <Camera onError={onError} {...cameraProps} />
}

Capture Errors
The CameraCaptureError represents any kind of error that occured only while taking a photo or recording a video.

If there was an error during capture, it will be thrown as a JS Error (Promise rejection):

function App() {
  const camera = useRef<Camera>(null)

  // called when the user presses a "capture" button
  const onPress = useCallback(() => {
    try {
      const photo = await camera.current.takePhoto()
    } catch (e) {
      if (e instanceof CameraCaptureError) {
        switch (e.code) {
          case "capture/file-io-error":
            console.error("Failed to write photo to disk!")
            break
          default:
            console.error(e)
            break
        }
      }
    }
  }, [camera])

  return <Camera ref={camera} {...cameraProps} />
}


