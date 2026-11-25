# One Bowl

A small web game you play with your face. A few little animals share one bowl of noodles, and whoever eats the most in 30 seconds wins. Made for Shared Minds (ITP) as the first prototype of my final project.

- **Chew** (open and close your mouth) to take a bite.
- **Shake your head** to fling off a topping you don't want. It might land in someone else's noodles.
- **1 / 2 / 3** add chili, vinegar or sugar to the shared soup. Anyone who hates that taste eats slower.
- **Hold SPACE** to fill one cup of water, press again to pour it in and calm the soup down.

Before eating, food cards flash by for 2 seconds each: left (← or A) for "nope", right (D or →) for "yum", or tilt your head. Answers stay secret until the end.

Make your own animal: bunny, cat, puppy or bear, with fur colour, pattern, eyes, eye colour and cheeks.

Right now it's single player against three computer animals. Shared noodles between players and online rooms come next.

## How it works

- **Face tracking:** MediaPipe Face Landmarker in the browser (mouth open, head shake, head tilt). Keyboard works too: J to chew, K to shake.
- **Art:** every animal is drawn in code with a crayon texture, so each part can be swapped.

Plain HTML and JavaScript with p5.js. Open `index.html` through any static server.
