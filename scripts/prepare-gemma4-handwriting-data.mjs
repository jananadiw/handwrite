#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const DEFAULT_SOURCE =
  "/Users/jananadiw/Documents/projects/handwrite/image_data";
const DEFAULT_OUT =
  "/Users/jananadiw/Documents/projects/handwrite/training_data/gemma4-handwriting";
const SUPPORTED_GLYPHS = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."abcdefghijklmnopqrstuvwxyz",
];
const PROMPT =
  "Analyze this handwritten alphabet photo for font extraction. Detect uppercase A-Z and lowercase a-z when present. Return JSON only using compact keys: c=letter, b=[ymin,xmin,ymax,xmax] normalized 0..1000, q=confidence percent, i=issues.";

const args = parseArgs(process.argv.slice(2));
const sourceDir = resolve(args.source ?? DEFAULT_SOURCE);
const outputDir = resolve(args.out ?? DEFAULT_OUT);
const force = Boolean(args.force);

if (!existsSync(sourceDir) || !statSync(sourceDir).isDirectory()) {
  throw new Error(`Source directory does not exist: ${sourceDir}`);
}

if (existsSync(outputDir)) {
  if (!force) {
    throw new Error(
      `Output already exists: ${outputDir}\nRe-run with --force to replace it.`,
    );
  }

  rmSync(outputDir, { recursive: true, force: true });
}

const imageFiles = readdirSync(sourceDir)
  .filter((file) => [".jpg", ".jpeg"].includes(extname(file).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

if (imageFiles.length === 0) {
  throw new Error(`No JPG images found in ${sourceDir}`);
}

const imagesDir = join(outputDir, "images");
const annotationsDir = join(outputDir, "annotations");
const splitsDir = join(outputDir, "splits");
mkdirSync(imagesDir, { recursive: true });
mkdirSync(annotationsDir, { recursive: true });
mkdirSync(splitsDir, { recursive: true });

const rows = imageFiles.map((file, index) => {
  const sourcePath = join(sourceDir, file);
  const id = `handwrite_${String(index + 1).padStart(4, "0")}`;
  const copiedName = `${id}.jpg`;
  const imagePath = join(imagesDir, copiedName);
  const annotationName = `${id}.json`;
  const dimensions = getImageDimensions(sourcePath);

  copyFileSync(sourcePath, imagePath);

  return {
    id,
    group: getImageGroup(file),
    sourceImage: sourcePath,
    originalFileName: file,
    image: `images/${copiedName}`,
    annotation: `annotations/${annotationName}`,
    width: dimensions.width,
    height: dimensions.height,
    sha256: sha256File(sourcePath),
  };
});

const splitById = assignSplits(rows);
const manifestRows = rows.map((row) => ({
  ...row,
  split: splitById.get(row.id),
}));

for (const row of manifestRows) {
  const annotation = {
    annotationStatus: "todo",
    id: row.id,
    split: row.split,
    image: row.image,
    sourceImage: row.sourceImage,
    originalFileName: row.originalFileName,
    width: row.width,
    height: row.height,
    target: {
      usable: true,
      orientationDegrees: 0,
      letters: [],
      globalIssues: [],
    },
    notes: [
      "Fill target.letters with one object per visible glyph.",
      "Each letter entry must look like {\"c\":\"A\",\"b\":[ymin,xmin,ymax,xmax],\"q\":95}.",
      "Boxes are normalized 0..1000 and ordered [ymin,xmin,ymax,xmax].",
      "Set annotationStatus to complete only after manual review.",
    ],
  };
  writeJson(join(outputDir, row.annotation), annotation);
}

writeJsonl(
  join(outputDir, "manifest.jsonl"),
  manifestRows.map(omitInternalFields),
);

for (const split of ["train", "val", "test"]) {
  const splitRows = manifestRows.filter((row) => row.split === split);
  writeFileSync(
    join(splitsDir, `${split}.txt`),
    `${splitRows.map((row) => row.id).join("\n")}\n`,
  );
  writeJsonl(
    join(outputDir, `${split}.todo.jsonl`),
    splitRows.map((row) => buildTodoTrainingExample(row)),
  );
}

writeFileSync(
  join(outputDir, "README.md"),
  buildReadme({
    sourceDir,
    outputDir,
    rows: manifestRows,
  }),
);

const splitCounts = countBy(manifestRows, (row) => row.split);
console.log(`Prepared ${rows.length} images at ${outputDir}`);
console.log(
  `Splits: train=${splitCounts.train ?? 0}, val=${splitCounts.val ?? 0}, test=${
    splitCounts.test ?? 0
  }`,
);
console.log("Next: label annotations/*.json, then build final SFT JSONL.");

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--force") {
      parsed.force = true;
      continue;
    }

    if (arg === "--source" || arg === "--out") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`${arg} needs a value`);
      }
      parsed[arg.slice(2)] = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function getImageDimensions(imagePath) {
  const output = execFileSync(
    "sips",
    ["-g", "pixelWidth", "-g", "pixelHeight", imagePath],
    { encoding: "utf8" },
  );
  const width = Number(output.match(/pixelWidth:\s+(\d+)/)?.[1]);
  const height = Number(output.match(/pixelHeight:\s+(\d+)/)?.[1]);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(`Could not read image dimensions for ${imagePath}`);
  }

  return { width, height };
}

function getImageGroup(fileName) {
  return basename(fileName, extname(fileName)).match(/IMG_\d+/)?.[0] ?? fileName;
}

function assignSplits(rows) {
  const groups = Object.entries(groupBy(rows, (row) => row.group)).sort(
    ([groupA, rowsA], [groupB, rowsB]) =>
      rowsA.length - rowsB.length || groupA.localeCompare(groupB),
  );
  const total = rows.length;
  const targets = {
    test: Math.max(2, Math.round(total * 0.08)),
    val: Math.max(4, Math.round(total * 0.12)),
  };
  const counts = { test: 0, val: 0, train: 0 };
  const splitById = new Map();

  for (const [, groupRows] of groups) {
    const split =
      counts.test < targets.test
        ? "test"
        : counts.val < targets.val
          ? "val"
          : "train";

    for (const row of groupRows) {
      splitById.set(row.id, split);
      counts[split] += 1;
    }
  }

  return splitById;
}

function buildTodoTrainingExample(row) {
  return {
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image: row.image },
          { type: "text", text: PROMPT },
        ],
      },
      {
        role: "assistant",
        content: [
          {
            type: "text",
            text: JSON.stringify({
              usable: true,
              orientationDegrees: 0,
              letters: [],
              globalIssues: ["TODO: replace with reviewed annotation"],
            }),
          },
        ],
      },
    ],
  };
}

function buildReadme({ sourceDir, outputDir, rows }) {
  const splitCounts = countBy(rows, (row) => row.split);
  return `# Gemma 4 Handwriting Dataset

Generated from:

\`\`\`text
${sourceDir}
\`\`\`

Output:

\`\`\`text
${outputDir}
\`\`\`

## Counts

- Images: ${rows.length}
- Train: ${splitCounts.train ?? 0}
- Val: ${splitCounts.val ?? 0}
- Test: ${splitCounts.test ?? 0}

## Label Format

Edit files in \`annotations/\`. Each completed annotation should keep this target shape:

\`\`\`json
{
  "usable": true,
  "orientationDegrees": 0,
  "letters": [
    { "c": "A", "b": [120, 80, 210, 145], "q": 95 }
  ],
  "globalIssues": []
}
\`\`\`

\`b\` is \`[ymin, xmin, ymax, xmax]\` normalized to 0..1000.

Supported glyph labels:

\`\`\`text
${SUPPORTED_GLYPHS.join(" ")}
\`\`\`

## Pixel Box Conversion

If a labeling tool exports pixel boxes as \`x, y, width, height\`:

\`\`\`text
ymin = round(y / imageHeight * 1000)
xmin = round(x / imageWidth * 1000)
ymax = round((y + height) / imageHeight * 1000)
xmax = round((x + width) / imageWidth * 1000)
\`\`\`

## Current Status

The \`*.todo.jsonl\` files are placeholders only. Do not train on them yet.
First fill and review \`annotations/*.json\`, set \`annotationStatus\` to \`complete\`,
then generate final SFT JSONL from completed annotations.
`;
}

function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(`${filePath}\n`.trim(), `${JSON.stringify(value, null, 2)}\n`);
}

function omitInternalFields(row) {
  const cleaned = { ...row };
  delete cleaned.group;
  return cleaned;
}

function writeJsonl(filePath, rows) {
  writeFileSync(filePath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function groupBy(items, keyFn) {
  return items.reduce((groups, item) => {
    const key = keyFn(item);
    groups[key] ??= [];
    groups[key].push(item);
    return groups;
  }, {});
}

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
