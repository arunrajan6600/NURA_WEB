/**
 * backend/prisma/seed.ts
 *
 * Production/Development seed – creates both the minimal development verification data
 * and restores the original portfolio project posts (works) to keep parity with previous state.
 *
 * Run via:  npm run db:seed
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

const PUBLISHED_SLUG = 'seed-hello-world';
const DRAFT_SLUG     = 'seed-draft-post';

async function main() {
  console.log('🌱  Starting database seed...');

  // ── 1. Published verification post (blog) ──────────────────────────────────
  const publishedPost = await prisma.post.upsert({
    where: { slug: PUBLISHED_SLUG },
    update: {
      status:      'published',
      type:        'blog',
    },
    create: {
      title:       'Hello World (Seed)',
      slug:        PUBLISHED_SLUG,
      status:      'published',
      type:        'blog',
      featured:    true,
      pinned:      false,
      archived:    false,
      excerpt:     'This is the seed published post used for development verification.',
      thumbnailUrl: null,
      thumbnailAlt: null,
      authorId:    '00000000-0000-0000-0000-000000000001',
      viewCount:   0,
      likeCount:   0,
      publishedAt: new Date(),
    },
  });

  console.log(`  ✅  Verification published post: ${publishedPost.id} / ${publishedPost.slug}`);

  // Re-create cells for verification published post
  await prisma.cell.deleteMany({ where: { postId: publishedPost.id } });
  await prisma.cell.createMany({
    data: [
      {
        postId:     publishedPost.id,
        type:       'markdown',
        content:    '# Hello World\n\nWelcome to the seed post.',
        orderIndex: 1,
      },
      {
        postId:     publishedPost.id,
        type:       'markdown',
        content:    '## Section Two\n\nThis is the second cell of the seed post.',
        orderIndex: 2,
      },
      {
        postId:     publishedPost.id,
        type:       'markdown',
        content:    '## Section Three\n\nThird cell to verify ordering.',
        orderIndex: 3,
      },
    ],
  });

  console.log('  ✅  3 ordered cells created for verification published post');

  // ── 2. Draft verification post (article) ───────────────────────────────────
  const draftPost = await prisma.post.upsert({
    where: { slug: DRAFT_SLUG },
    update: {
      status:     'draft',
      type:       'article',
    },
    create: {
      title:      'Draft Post (Seed)',
      slug:       DRAFT_SLUG,
      status:     'draft',
      type:       'article',
      featured:   false,
      pinned:     false,
      archived:   false,
      excerpt:    'This is the seed draft post. View count must NOT increment on GET.',
      authorId:   '00000000-0000-0000-0000-000000000001',
      viewCount:  0,
      likeCount:  0,
      publishedAt: null,
    },
  });

  console.log(`  ✅  Verification draft post:     ${draftPost.id} / ${draftPost.slug}`);

  // ── 3. Original Works / Projects ───────────────────────────────────────────

  const originalProjects = [
    {
      id: "MGPZ0GNQR2H1DHGMDC7",
      title: "test",
      slug: "test",
      status: "draft",
      featured: false,
      type: "project",
      excerpt: "test",
      thumbnailUrl: "https://nuraweb.s3.ap-south-1.amazonaws.com/070dada1-6421-4d09-b762-70703f20ded8.png",
      thumbnailAlt: "",
      createdAt: new Date("2025-10-14T02:56:30.038Z"),
      updatedAt: new Date("2025-10-14T02:56:41.117Z"),
      viewCount: 1,
      cells: [
        {
          id: "MGPZ0PHKTILBOKGE1UF",
          type: "image",
          content: JSON.stringify({
            url: "https://nuraweb.s3.ap-south-1.amazonaws.com/070dada1-6421-4d09-b762-70703f20ded8.png",
            alt: "desc",
          }),
          orderIndex: 1,
        },
      ],
    },
    {
      id: "MF0HJ7N5BRKT5L6CWO",
      title: "akalam abhayam | അകലം അഭയം | 2025",
      slug: "akalam-abhayam-2025",
      status: "published",
      featured: false,
      type: "project",
      excerpt: null,
      thumbnailUrl: null,
      thumbnailAlt: null,
      createdAt: new Date("2025-09-01T02:13:14.993Z"),
      updatedAt: new Date("2025-09-26T07:09:10.420Z"),
      publishedAt: new Date("2025-09-01T02:13:14.993Z"),
      viewCount: 0,
      cells: [
        {
          id: "MG0I42KTLI45YMGW4X",
          type: "markdown",
          content: "AI Model: YOLO  \nSoftwares: Touchdesigner [Visual Manipulation & Text], VCV Rack [Audio Synthesis]\n\n*18 July 2025*",
          orderIndex: 1,
        },
      ],
    },
    {
      id: "MF0H2T15OJYREBYNFR",
      title: "bhashanaishadham ambu | 2024",
      slug: "bhashanaishadham-ambu",
      status: "published",
      featured: false,
      type: "project",
      excerpt: "experimental, interactive",
      thumbnailUrl: null,
      thumbnailAlt: null,
      createdAt: new Date("2025-09-01T02:00:29.561Z"),
      updatedAt: new Date("2025-09-01T02:37:43.329Z"),
      publishedAt: new Date("2025-09-01T02:00:29.561Z"),
      viewCount: 1,
      cells: [
        {
          id: "MF0IEOMYL41MOIUBHDR",
          type: "markdown",
          content: "Bhasha Naishadha Ambu is an experiment to find and manipulate the numerical data from a vector embedding AI model and compare the vector values with the positions of 3D points from a masked video of Ambu (the child). Then the words corresponding to the positional values from video is selected and superimposed over the video. The fundamental intention of this experiment is to explore how language, pixels, vectors are all interconnected in a world of pseudo-futurism which might transformed to a \"future\".\n\nVideo Credits: Rajesh Karthy, Dr. Jaseera Majid'  \n\n*10 October 2024*",
          orderIndex: 1,
        },
        {
          id: "MF0IEON2GH023ZAWIMU",
          type: "video",
          content: JSON.stringify({
            url: "https://nuraweb.s3.ap-south-1.amazonaws.com/2bd2eb1d-d012-48d3-b834-3bc32e8504de.mp4",
            title: "",
            provider: "direct",
          }),
          orderIndex: 2,
        },
        {
          id: "MF0IEON7PNNKED18OCB",
          type: "video",
          content: JSON.stringify({
            url: "https://nuraweb.s3.ap-south-1.amazonaws.com/382795eb-63be-4d0e-b8d2-4ed926f220e1.mp4",
            title: "",
            provider: "direct",
          }),
          orderIndex: 3,
        },
      ],
    },
    {
      id: "MEPZ3BSMXOV2VNKISP",
      title: "google maps street view controlled by VCV in touchdesigner | 2025",
      slug: "google-maps-street-view-controlled-by-vcv-in-touchdesigner",
      status: "published",
      featured: false,
      type: "project",
      excerpt: "Using music data from VCV Rack processed through touchdesigner, google maps street view is controlled",
      thumbnailUrl: null,
      thumbnailAlt: null,
      createdAt: new Date("2025-08-24T17:39:19.030Z"),
      updatedAt: new Date("2025-09-01T02:36:12.714Z"),
      publishedAt: new Date("2025-08-24T17:39:19.030Z"),
      viewCount: 0,
      cells: [
        {
          id: "MF0ICQQC0IIPLUJA3JTV",
          type: "markdown",
          content: "Street View: Kottarakkara\n\nGoogle Maps API + Touchdesigner + VCV Rack + Python + ChatGPT\n\n*25 july 2025*",
          orderIndex: 1,
        },
        {
          id: "MF0ICQQJWXPRIAY4R7",
          type: "video",
          content: JSON.stringify({
            url: "https://nuraweb.s3.ap-south-1.amazonaws.com/4de83eb5-54f6-4259-9b3a-c6ffc2c02290.mp4",
            title: "",
            provider: "direct",
          }),
          orderIndex: 2,
        },
      ],
    },
  ];

  for (const proj of originalProjects) {
    const { cells, ...projData } = proj;

    const post = await prisma.post.upsert({
      where: { id: proj.id },
      update: {
        title:        projData.title,
        slug:         projData.slug,
        status:       projData.status,
        type:         projData.type,
        excerpt:      projData.excerpt,
        thumbnailUrl: projData.thumbnailUrl,
        thumbnailAlt: projData.thumbnailAlt,
        updatedAt:    projData.updatedAt,
        publishedAt:  projData.publishedAt,
      },
      create: {
        id:           projData.id,
        title:        projData.title,
        slug:         projData.slug,
        status:       projData.status,
        type:         projData.type,
        featured:     projData.featured,
        pinned:       false,
        archived:     false,
        excerpt:      projData.excerpt,
        thumbnailUrl: projData.thumbnailUrl,
        thumbnailAlt: projData.thumbnailAlt,
        authorId:    '00000000-0000-0000-0000-000000000001',
        viewCount:   projData.viewCount,
        likeCount:   0,
        createdAt:    projData.createdAt,
        updatedAt:    projData.updatedAt,
        publishedAt:  projData.publishedAt,
      },
    });

    console.log(`  ✅  Project post: ${post.id} / ${post.slug}`);

    // Re-create cells
    await prisma.cell.deleteMany({ where: { postId: post.id } });
    await prisma.cell.createMany({
      data: cells.map(c => ({
        id:         c.id,
        postId:     post.id,
        type:       c.type,
        content:    c.content,
        orderIndex: c.orderIndex,
      })),
    });

    console.log(`  ✅  ${cells.length} cells created for post: ${post.id}`);
  }

  // ── 4. Summary ─────────────────────────────────────────────────────────────
  const postCount = await prisma.post.count();
  const cellCount = await prisma.cell.count();

  console.log('\n📊  Seed summary:');
  console.log(`    Posts: ${postCount}`);
  console.log(`    Cells: ${cellCount}`);
  console.log('\n✅  Seed complete.\n');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
