TO LAUNCH GAME from mobile go to this link https://fish-of-fortune.vercel.app/


An explanation of creative and technical approach

I inspire old 16bit games like mario, packman etc. Raw game remember me gameplay of guitar hero. So i used old game sounds. For visual i want 
soft colors like in Fish of Fortune. In technical approach i looking for simplify.

Record every step by documentation task and time record
1. Read requirements: 10 min
2. Test code from document: 2 min
3. Choose game development strategy: 15 min
4. Implement CLI in VS Code: 3 min
5. Troubleshoot Google Cloud issues: 12 min
6. Generate asset images: 1 hour (performed in parallel with CLI tasks using Gemini Banana)
7. Add functionality to import image assets: 2 min
8. Edit image names and remove backgrounds: 4 min
9. Test results: 5 min
10. Generate background with bubbles for better motion simulation: 15 min
11. Apply background to the game field: 1 min
12. Ask Gemini to add sound support: 4 min
13. Search for sound effects: 1 min
14. Integrate sounds into the game: 1 min
15. Refactor code with Gemini: 3 min
16. Final check (everything works great): 10 seconds
17. Server deploy for mobile gaming 1 hour
Total time spent: 3 hours 38 minutes 10 seconds

Prompts used during development:
"Enable support for image assets in this game."
"Apply the same logic to the background and game field."
"Use 'starrynight.png' as a texture. Make it loop and move like other objects."
"Visualize lives as 3 hearts."
"Improve the 'life lost' visualization."
"Add particle effects when coins, gems, or mines are collected."
"Add sound slots for: Game Over, Game Win, and Gem Pickup."
"Add invulnerability time when an obstacle is hit."
"Refactor code."

Challenges which i meet
When generating 3D models with AI, i noticed some interesting things. AI seems to have a hard time with flat surfaces.
 i had a generated house porch with 12k polys that i had to fix manually.

It also does weird things with hair, creating an insane poly count. For that, i just used the Decimate modifier in Blender,
and it worked great.

i also had trouble with the AI textures—they weighed a ton, which wasn't an option for me. Plus, it generated a bunch of useless materials.
Since i needed to optimize everything, i just grabbed a texture Atlas and textured it all by hand

Than i create all this 3d models by hand, but its not part of my tasks. But i done this, attached it too.  

Tools used: Blender, Photoshop, VS Code, Gemini CLI, Gemini Image Generator (Banana), and myinstants.com for sounds.