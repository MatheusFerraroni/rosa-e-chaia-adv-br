#!/usr/bin/env node

import path from "node:path";

import {
  buildSite,
  checkDist,
  collectPublications,
  DEFAULT_PROJECT_ROOT,
} from "./lib/publications.mjs";

const command = process.argv[2];

try {
  if (command === "validate") {
    const { publications } = await collectPublications();
    console.log(
      `${publications.length} publicação(ões) validada(s) com sucesso.`,
    );
  } else if (command === "build") {
    const { publications, outputRoot } = await buildSite();
    console.log(
      `${publications.length} publicação(ões) gerada(s) em ${path.relative(
        DEFAULT_PROJECT_ROOT,
        outputRoot,
      )}/.`,
    );
  } else if (command === "check") {
    const { publications } = await checkDist();
    console.log(
      `Artefato validado com ${publications.length} publicação(ões).`,
    );
  } else {
    console.error("Uso: node scripts/publications.mjs <validate|build|check>");
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
