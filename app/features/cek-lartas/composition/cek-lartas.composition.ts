import { createController } from "../adapters/controllers/cek-lartas.controller";
import { createInswSource } from "@infrastructure/cek-lartas/insw/insw-lartas-data-source";

/** Composition root for the Next.js implementation of Cek LARTAS. */
export const controller = createController(createInswSource());
