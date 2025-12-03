# Gesture-Driven Letter Physics

An interactive webcam prototype that uses face tracking and hand gestures to control physics-based letter blocks in real-time.

## Features

### Gesture Controls

- **Head Roll/Tilt** - Tilt your head left or right to change the gravity direction for the entire canvas
- **Hand Swipe** - Swipe your hand to apply impulse forces to nearby letters
- **Clenched Fist** - Toggle "Heavy Mass" mode (5x mass, low bounce)
- **Open Palm** - Toggle "Floaty" mode (0.2x mass, high bounce)

### Physics

- Letters are rendered as physical blocks using Matter.js
- Realistic collision detection, stacking, and bouncing
- Smooth transitions between physics parameter changes
- Visible mass and restitution effects

### Visual Design

- Crisp letter rendering with drop shadows for depth
- Clean, minimal UI with unobtrusive gesture indicators
- Small webcam preview in the corner
- Smooth animations throughout

## How to Use

1. Open `index.html` in a modern web browser (Chrome, Firefox, or Edge recommended)
2. Grant camera permissions when prompted
3. Wait for the models to load (may take a few seconds)
4. Start gesturing!

### Tips

- **Head Tilt**: Tilt your head slowly for smooth gravity changes
- **Swipe**: Make quick, decisive hand movements for best results
- **Hand Gestures**:
  - Make a tight fist for heavy mode
  - Open your palm wide for floaty mode
  - Return to neutral position for normal mode

## Technical Stack

- **Physics Engine**: Matter.js v0.19.0
- **Computer Vision**: MediaPipe (Face Mesh + Hands)
- **Rendering**: HTML5 Canvas with custom rendering
- **Styling**: Modern CSS with gradients and shadows

## Browser Requirements

- WebRTC support for camera access
- Modern JavaScript (ES6+)
- Good GPU for smooth physics simulation

## Project Structure

```
├── index.html      # Main HTML structure
├── style.css       # Styling and layout
├── app.js          # Main application logic
└── README.md       # This file
```

## How It Works

### Face Tracking
The application uses MediaPipe Face Mesh to detect facial landmarks. By tracking the positions of the eyes, it calculates the head roll angle and maps it to a gravity vector that affects all physics objects.

### Hand Tracking
MediaPipe Hands detects hand landmarks in real-time. The application:
- Tracks palm position to detect swipe velocity
- Measures finger extension to distinguish between fist and open palm
- Applies physics changes based on detected gestures

### Physics System
Matter.js provides the physics simulation. The application smoothly interpolates physics parameters when gestures change them, creating natural transitions between different modes.

## Development

The project uses CDN-hosted libraries for easy setup. No build process required - just open the HTML file!

## Future Enhancements

- Add more gesture controls (pinch, wave, etc.)
- Different letter colors based on mass
- Sound effects for collisions
- Mobile device support with touch controls
- Persistent letter customization

## License

MIT
