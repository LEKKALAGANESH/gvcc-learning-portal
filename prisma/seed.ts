import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Local CC0 sample clips under public/videos — no external host (avoids 403/CORS/offline
// breakage). Served at /videos/<file>.mp4. Six lessons map onto three short clips.
const lessons = [
  { slug: "intro-motion-design", title: "Introduction to Motion Design", category: "Design",
    description: "How movement guides attention — the foundations of motion on screen.",
    file: "big-buck-bunny" },
  { slug: "color-and-light", title: "Color & Light Fundamentals", category: "Design",
    description: "Reading color, contrast, and light to set mood and hierarchy.",
    file: "sintel" },
  { slug: "storytelling-basics", title: "Storytelling for Creators", category: "Fundamentals",
    description: "Structure, pacing, and the shape of a compelling short narrative.",
    file: "jellyfish" },
  { slug: "composition-101", title: "Composition 101", category: "Design",
    description: "Framing, balance, and the rule of thirds in practice.",
    file: "big-buck-bunny" },
  { slug: "sound-and-pacing", title: "Sound & Pacing", category: "Production",
    description: "How audio and cut rhythm shape the feel of a scene.",
    file: "sintel" },
  { slug: "animation-principles", title: "Animation Principles", category: "Development",
    description: "Timing, squash & stretch, and easing that make motion feel alive.",
    file: "jellyfish" },
];

async function main() {
  // Demo account so the app is drivable immediately.
  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "demo@gvcc.dev" },
    update: {},
    create: { email: "demo@gvcc.dev", name: "Demo Student", passwordHash },
  });

  // Reset the catalog (cascade clears dependent bookmarks/progress) then seed fresh.
  await prisma.video.deleteMany();
  for (const l of lessons) {
    await prisma.video.create({
      data: {
        slug: l.slug,
        title: l.title,
        description: l.description,
        category: l.category,
        durationSec: 10, // clips are ~10s; the player reads real duration from metadata
        url: `/videos/${l.file}.mp4`,
        thumbnail: "", // unused — cards render deterministic gradients (src/lib/thumb.ts)
      },
    });
  }
  console.log(`Seeded ${lessons.length} lessons + demo user (demo@gvcc.dev / password123).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
