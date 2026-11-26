// src/server/api.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// src/server/routes.ts
import { Router } from "express";
import crypto2 from "crypto";
import jwt2 from "jsonwebtoken";
import bcrypt2 from "bcryptjs";

// src/server/db.ts
import fs2 from "fs";
import path2 from "path";
import bcrypt from "bcryptjs";

// src/data/defaultMeals.ts
var INITIAL_MEALS = [
  // --- أولاً: ميكس بوكس ---
  {
    code: "Sale-01",
    name: "\u0645\u064A\u0643\u0633 \u0628\u0648\u0643\u0633 01 - \u062C\u0627\u062A\u0648\u0647 \u0648\u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A \u0648\u0644\u0627\u0646\u0634\u0648\u0646",
    category: "mix_box",
    ingredients: "\u0642\u0637\u0639\u0629 \u062C\u0627\u062A\u0648\u0629 \u0645\u063A\u0644\u0641\u0629 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u062A\u064A \u0628\u0627\u0646 \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A + \u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u062A\u064A \u0628\u0627\u0646 \u0644\u0627\u0646\u0634\u0648\u0646 \u0643\u0648\u0631\u062F\u0646 \u0628\u064A\u0641 + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644",
    distributorPrice: 50,
    factoryPrice: 35,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________7b046020.jpg"
  },
  {
    code: "Sale-02",
    name: "\u0645\u064A\u0643\u0633 \u0628\u0648\u0643\u0633 02 - \u062C\u0627\u062A\u0648\u0647 \u0648\u0628\u0627\u0646\u064A\u0629 \u0628\u0644\u062F\u064A \u0648\u0633\u0637",
    category: "mix_box",
    ingredients: "\u0642\u0637\u0639\u0629 \u062C\u0627\u062A\u0648\u0629 \u0645\u063A\u0644\u0641\u0629 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u0641\u0631\u0627\u062E \u0628\u0627\u0646\u064A\u0629 \u0628\u0644\u062F\u064A + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644",
    distributorPrice: 55,
    factoryPrice: 37,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________47cab4f5.jpg"
  },
  {
    code: "Sale-03",
    name: "\u0645\u064A\u0643\u0633 \u0628\u0648\u0643\u0633 03 - \u062C\u0627\u062A\u0648\u0647 \u0648\u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A \u0648\u062A\u0631\u0643\u064A \u0645\u062F\u062E\u0646",
    category: "mix_box",
    ingredients: "\u0642\u0637\u0639\u0629 \u062C\u0627\u062A\u0648\u0629 \u0645\u063A\u0644\u0641\u0629 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A + \u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u062A\u0631\u0643\u064A \u0645\u062F\u062E\u0646 + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644",
    distributorPrice: 60,
    factoryPrice: 41,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________7b046020.jpg"
  },
  {
    code: "Sale-04",
    name: "\u0645\u064A\u0643\u0633 \u0628\u0648\u0643\u0633 04 - \u062C\u0627\u062A\u0648\u0647 \u0648\u0643\u0641\u062A\u0629 \u0645\u0634\u0648\u064A\u0629 \u0648\u0628\u0627\u0646\u064A\u0629 \u0628\u062A\u064A \u0628\u0627\u0646",
    category: "mix_box",
    ingredients: "\u0642\u0637\u0639\u0629 \u062C\u0627\u062A\u0648\u0629 \u0645\u063A\u0644\u0641\u0629 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u062A\u064A \u0628\u0627\u0646 \u0643\u0641\u062A\u0629 \u0645\u0634\u0648\u064A\u0629 \u0639 \u0627\u0644\u0641\u062D\u0645 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u062A\u064A \u0628\u0627\u0646 \u0641\u0631\u0627\u062E \u0628\u0627\u0646\u064A\u0629 \u0628\u0644\u062F\u064A + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644",
    distributorPrice: 65,
    factoryPrice: 47,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________47cab4f5.jpg"
  },
  {
    code: "Sale-05",
    name: "\u0645\u064A\u0643\u0633 \u0628\u0648\u0643\u0633 05 - \u062C\u0627\u062A\u0648\u0647 \u0648\u0643\u0641\u062A\u0629 \u0648\u0628\u0627\u0646\u064A\u0629 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637",
    category: "mix_box",
    ingredients: "\u0642\u0637\u0639\u0629 \u062C\u0627\u062A\u0648\u0629 \u0645\u063A\u0644\u0641\u0629 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u0643\u0641\u062A\u0629 \u0645\u0634\u0648\u064A\u0629 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u0641\u0631\u0627\u062E \u0628\u0627\u0646\u064A\u0629 + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644",
    distributorPrice: 80,
    factoryPrice: 56,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________7b046020.jpg"
  },
  {
    code: "Sale-06",
    name: "\u0645\u064A\u0643\u0633 \u0628\u0648\u0643\u0633 06 - \u0628\u0648\u0643\u0633 \u0627\u0644\u062C\u0627\u062A\u0648\u0647 \u0627\u0644\u0633\u0631\u064A\u0639",
    category: "mix_box",
    ingredients: "\u0642\u0637\u0639\u0629 \u062C\u0627\u062A\u0648\u0629 \u0645\u063A\u0644\u0641\u0629 + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644",
    distributorPrice: 35,
    factoryPrice: 23,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________47cab4f5.jpg"
  },
  {
    code: "Sale-07",
    name: "\u0645\u064A\u0643\u0633 \u0628\u0648\u0643\u0633 07 - \u062C\u0627\u062A\u0648\u0647 \u0648\u062D\u0644\u0648\u064A\u0627\u062A \u0634\u0631\u0642\u064A\u0629",
    category: "mix_box",
    ingredients: "\u0642\u0637\u0639\u0629 \u062C\u0627\u062A\u0648\u0629 \u0645\u063A\u0644\u0641\u0629 + 2 \u0642\u0637\u0639\u0629 \u062D\u0644\u0648\u064A\u0627\u062A \u0634\u0631\u0642\u064A + \u0639\u0635\u064A\u0631 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644",
    distributorPrice: 50,
    factoryPrice: 37,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________7b046020.jpg"
  },
  {
    code: "Sale-08",
    name: "\u0645\u064A\u0643\u0633 \u0628\u0648\u0643\u0633 08 - \u062C\u0627\u062A\u0648\u0647 \u0648\u0645\u064A\u0646\u064A \u0628\u064A\u062A\u0632\u0627 \u0648\u0628\u0627\u062A\u0648\u0646 \u0633\u0627\u0644\u064A\u0629",
    category: "mix_box",
    ingredients: "\u0642\u0637\u0639\u0629 \u062C\u0627\u062A\u0648\u0629 \u0645\u063A\u0644\u0641\u0629 + 2 \u0642 \u0645\u064A\u0646\u064A \u0628\u064A\u062A\u0632\u0627 + 2 \u0628\u0627\u062A\u0648\u0646 \u0633\u0627\u0644\u064A\u0629 + \u0639\u0635\u064A\u0631 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644",
    distributorPrice: 45,
    factoryPrice: 29,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________47cab4f5.jpg"
  },
  {
    code: "Sale-09",
    name: "\u0645\u064A\u0643\u0633 \u0628\u0648\u0643\u0633 09 - \u062C\u0627\u062A\u0648\u0647 \u0648\u0645\u064A\u0646\u064A \u0628\u064A\u062A\u0632\u0627 \u0648\u062D\u0644\u0648\u0649 \u0634\u0631\u0642\u064A",
    category: "mix_box",
    ingredients: "\u0642\u0637\u0639\u0629 \u062C\u0627\u062A\u0648\u0629 \u0645\u063A\u0644\u0641\u0629 + 2 \u0642 \u0645\u064A\u0646\u064A \u0628\u064A\u062A\u0632\u0627 + \u0642\u0637\u0639\u0629 \u062D\u0644\u0648\u0649 \u0634\u0631\u0642\u064A + \u0639\u0635\u064A\u0631 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644",
    distributorPrice: 50,
    factoryPrice: 35,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________7b046020.jpg"
  },
  {
    code: "Sale-10",
    name: "\u0645\u064A\u0643\u0633 \u0628\u0648\u0643\u0633 10 - \u062A\u0631\u064A\u0648 \u0633\u0646\u062F\u0648\u062A\u0634\u0627\u062A \u0628\u062A\u064A \u0628\u0627\u0646 \u0643\u0641\u062A\u0629 \u0648\u0631\u0648\u0645\u064A \u0648\u062A\u0631\u0643\u064A",
    category: "mix_box",
    ingredients: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0643\u0641\u062A\u0629 \u0628\u062A\u064A \u0628\u0627\u0646 + \u0633\u0646\u062F\u0648\u062A\u0634 \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A \u0628\u062A\u064A \u0628\u0627\u0646 + \u0633\u0646\u062F\u0648\u062A\u0634 \u062A\u0631\u0643\u064A \u0645\u062F\u062E\u0646/\u0644\u0627\u0646\u0634\u0648\u0646/\u0628\u0633\u0637\u0631\u0645\u0629 + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644",
    distributorPrice: 45,
    factoryPrice: 31,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________47cab4f5.jpg"
  },
  {
    code: "Sale-11",
    name: "\u0645\u064A\u0643\u0633 \u0628\u0648\u0643\u0633 11 - \u062C\u0627\u062A\u0648\u0647 \u0648\u0645\u062E\u0628\u0648\u0632\u0627\u062A \u0648\u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u062A\u064A \u0628\u0627\u0646",
    category: "mix_box",
    ingredients: "\u0642\u0637\u0639\u0629 \u062C\u0627\u062A\u0648\u0629 \u0645\u063A\u0644\u0641\u0629 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u062A\u064A \u0628\u0627\u0646 \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A/\u0641\u064A\u062A\u0627/\u0628\u0633\u0637\u0631\u0645\u0629 + \u0642 \u0628\u0627\u062A\u0648\u0646 \u0633\u0627\u0644\u064A\u0629 + \u0642 \u0645\u064A\u0646\u064A \u0628\u064A\u062A\u0632\u0627 + \u0639\u0635\u064A\u0631 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644",
    distributorPrice: 39,
    factoryPrice: 29,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________7b046020.jpg"
  },
  {
    code: "Sale-12",
    name: "\u0628\u0627\u062A\u064A\u0629",
    category: "mix_box",
    ingredients: "\u0642\u0637\u0639\u0629 \u062C\u0627\u062A\u0648\u0629 \u0645\u063A\u0644\u0641\u0629 + \u0628\u0627\u062A\u064A\u0629 + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644",
    distributorPrice: 44,
    factoryPrice: 32,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________47cab4f5.jpg"
  },
  // --- ثانياً: سندوتش بوكس ---
  {
    code: "Sale-13",
    name: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u0648\u0643\u0633 13 - \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A \u0648\u0644\u0627\u0646\u0634\u0648\u0646 \u0643\u0648\u0631\u062F\u0646 \u0628\u064A\u0641",
    category: "sandwich_box",
    ingredients: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A + \u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u0644\u0627\u0646\u0634\u0648\u0646 \u0643\u0648\u0631\u062F\u0646 \u0628\u064A\u0641 + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0647 + \u0645\u0646\u062F\u064A\u0644 \u0645\u0639\u0637\u0631",
    distributorPrice: 42,
    factoryPrice: 32,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________7b046020.jpg"
  },
  {
    code: "Sale-14",
    name: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u0648\u0643\u0633 14 - \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A \u0648\u062A\u0631\u0643\u064A \u0645\u062F\u062E\u0646 \u0648\u0644\u0627\u0646\u0634\u0648\u0646",
    category: "sandwich_box",
    ingredients: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A + \u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u062A\u0631\u0643\u064A \u0645\u062F\u062E\u0646 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u0644\u0627\u0646\u0634\u0648\u0646 \u0643\u0648\u0631\u062F\u0646 \u0628\u064A\u0641 + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0647 + \u0645\u0646\u062F\u064A\u0644 \u0645\u0639\u0637\u0631",
    distributorPrice: 48,
    factoryPrice: 38,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________47cab4f5.jpg"
  },
  {
    code: "Sale-15",
    name: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u0648\u0643\u0633 15 - \u0641\u0631\u0627\u062E \u0628\u0627\u0646\u064A\u0629 \u0648\u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A \u0648\u0633\u0637",
    category: "sandwich_box",
    ingredients: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u0641\u0631\u0627\u062E \u0628\u0627\u0646\u064A\u0629 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0647 + \u0645\u0646\u062F\u064A\u0644 \u0645\u0639\u0637\u0631",
    distributorPrice: 48,
    factoryPrice: 38,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________7b046020.jpg"
  },
  {
    code: "Sale-16",
    name: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u0648\u0643\u0633 16 - \u0643\u0641\u062A\u0629 \u0645\u0634\u0648\u064A\u0629 \u0648\u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A \u0648\u0633\u0637",
    category: "sandwich_box",
    ingredients: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u0643\u0641\u062A\u0629 \u0645\u0634\u0648\u064A\u0629 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0647 + \u0645\u0646\u062F\u064A\u0644 \u0645\u0639\u0637\u0631",
    distributorPrice: 48,
    factoryPrice: 38,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________47cab4f5.jpg"
  },
  {
    code: "Sale-17",
    name: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u0648\u0643\u0633 17 - \u0643\u0641\u062A\u0629 \u0645\u0634\u0648\u064A\u0629 \u0648\u0641\u0631\u0627\u062E \u0628\u0627\u0646\u064A\u0629 \u0648\u0633\u0637",
    category: "sandwich_box",
    ingredients: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u0643\u0641\u062A\u0629 \u0645\u0634\u0648\u064A\u0629 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u0641\u0631\u0627\u062E \u0628\u0627\u0646\u064A\u0629 + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0647 + \u0645\u0646\u062F\u064A\u0644 \u0645\u0639\u0637\u0631",
    distributorPrice: 55,
    factoryPrice: 43,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________7b046020.jpg"
  },
  {
    code: "Sale-18",
    name: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u0648\u0643\u0633 18 - \u062B\u0644\u0627\u062B\u064A \u0641\u0627\u062E\u0631: \u0643\u0641\u062A\u0629 \u0648\u0628\u0627\u0646\u064A\u0629 \u0648\u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A",
    category: "sandwich_box",
    ingredients: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u0643\u0641\u062A\u0629 \u0645\u0634\u0648\u064A\u0629 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u0641\u0631\u0627\u062E \u0628\u0627\u0646\u064A\u0629 + \u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0631\u0646\u0633\u0627\u0648\u064A \u0648\u0633\u0637 \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0647 + \u0645\u0646\u062F\u064A\u0644 \u0645\u0639\u0637\u0631",
    distributorPrice: 65,
    factoryPrice: 50,
    hasJuice: true,
    isActive: true,
    image: "/assets/aistudio/________________47cab4f5.jpg"
  }
];
var CELEBRE_CONFIG = {
  name: "C\xC9L\xC8BRE CATERING",
  arabicName: "\u0633\u064A\u0644\u064A\u0628\u0631\u064A \u0644\u0625\u062F\u0627\u0631\u0629 \u0643\u0627\u062A\u0631\u064A\u0646\u062C \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062A",
  tagline: "\u0643\u0644 \u0645\u0646\u0627\u0633\u0628\u0629.. \u0623\u062D\u0644\u0649 \u0645\u0639 \u0633\u064A\u0644\u064A\u0628\u0631\u064A",
  hotline: "01284484868",
  phoneFormatted: "0128 448 4868",
  whatsappNumber: "201284484868",
  domain: "https://celebre-eg.com",
  logoUrl: "/assets/aistudio/file_00000000d54881f4a6381c9836766eb2_a5413292.png",
  boxImage: "/assets/aistudio/________________69afd9d6.jpg",
  socials: {
    facebook: "https://www.facebook.com/celebre.catering",
    tiktok: "https://www.tiktok.com/@celebre.catering",
    instagram: "https://www.instagram.com/celebre.catering"
  },
  drinkAdjustments: {
    noJuiceDiscount: 5,
    juicePackageCost: 1,
    // 1 EGP package cost deduction
    factoryNoJuiceDiscount: 6,
    // 5 EGP juice + 1 EGP package = -6 EGP from factory
    pepsiExtra: 10,
    factoryPepsiAddition: 10
  },
  orientalSweetAdjustments: {
    addWithJuiceCustomer: 20,
    addWithJuiceFactory: 10,
    replaceJuiceCustomer: 15,
    replaceJuiceFactory: 5
  }
};

// src/lib/prisma.ts
import fs from "fs";
import path from "path";
import { createRequire } from "module";

// src/server/safeLogger.ts
function sanitizeText(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/postgres(ql)?:\/\/([^:@]+):([^@]+)@/gi, "postgresql://$2:***@").replace(/mysql:\/\/([^:@]+):([^@]+)@/gi, "mysql://$2:***@").replace(/mongodb(\+srv)?:\/\/([^:@]+):([^@]+)@/gi, "mongodb://$2:***@").replace(/(?:\+?20|0)?1[0125]\d{8}/g, "01*********").replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, "Bearer [REDACTED_JWT]").replace(/eyJ[A-Za-z0-9-_=]{10,}\.[A-Za-z0-9-_=]{10,}\.?[A-Za-z0-9-_.+/=]*/g, "[REDACTED_JWT]").replace(/(["']?password["']?\s*:\s*["'])[^"']+([^"']*["'])/gi, "$1***$2").replace(/(["']?passwordHash["']?\s*:\s*["'])[^"']+([^"']*["'])/gi, "$1***$2").replace(/(["']?secret["']?\s*:\s*["'])[^"']+([^"']*["'])/gi, "$1***$2");
}
function sanitizeError(err, context) {
  if (!err) {
    return {
      errorName: "UnknownError",
      errorMessage: "Unknown error occurred",
      context,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const errorName = err.name || "Error";
  const errorCode = err.code || err.errorCode || void 0;
  const clientVersion = err.clientVersion || void 0;
  const rawMessage = typeof err.message === "string" ? err.message : String(err);
  const errorMessage = sanitizeText(rawMessage);
  let stackTrace = void 0;
  if (typeof err.stack === "string") {
    stackTrace = sanitizeText(err.stack);
  }
  let errorMeta = void 0;
  if (err.meta && typeof err.meta === "object") {
    try {
      const stringified = JSON.stringify(err.meta);
      errorMeta = JSON.parse(sanitizeText(stringified));
    } catch {
      errorMeta = "[Unserializable Meta]";
    }
  }
  return {
    errorName,
    errorCode,
    errorMessage,
    errorMeta,
    stackTrace,
    clientVersion,
    context,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function logServerError(err, context) {
  const sanitized = sanitizeError(err, context);
  console.error(`[CELEBRE_SERVER_ERROR][${sanitized.context || "General"}]:`, {
    errorName: sanitized.errorName,
    errorCode: sanitized.errorCode,
    errorMessage: sanitized.errorMessage,
    errorMeta: sanitized.errorMeta,
    clientVersion: sanitized.clientVersion,
    timestamp: sanitized.timestamp,
    stackTrace: sanitized.stackTrace
  });
  return sanitized;
}

// src/lib/prisma.ts
var require2 = createRequire(import.meta.url);
var SUPABASE_ROOT_CA = `-----BEGIN CERTIFICATE-----
MIIDzzCCAregAwIBAgIUBhalAwMQ7BA1NH7td4msPPwxHzowDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIzMTAyNDA3NTM0NVoXDTMzMTAyMTA3NTM0NVow
czELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEmMCQGA1UEAwwdU3VwYWJhc2Ug
SW50ZXJtZWRpYXRlIDIwMjEgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEK
AoIBAQDOAMhXirH+EGIn8GaDp8T53rEogf7kM8OKW2uQ5yU/wxPa+w8BXgTzWy3W
JDAUhZE78oUtAd9kk5zKPrLXoT3W61PPnOc/9dceL5gB7/78m7EKCySziAA2c8vR
fnYPfznedDXi2lryttSYmMf2qbZDErAxwJDUm6cyq+HLAfb2qUH28u6jP8I9GDtG
PkQnjqtiRXEKjbTc/ntqCQrhtFK02mHkMSju7nEpkNYryunv5n/c9mrRY9/8GwmP
3uSZz3CQ8yQ/E0f8T9gCca2TcKuTQmW2pQqtHv1MuZ3jfJE5Nr9+Fap5kdzDJtdf
BdKofVNZlnYIru5yhUZywY3xYFfHAgMBAAGjYzBhMA8GA1UdEwEB/wQFMAMBAf8w
DgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBQVoFMuvXJ9Yv+QJr6/GJX0Z0VA+jAf
BgNVHSMEGDAWgBSo17l2N9gs7ZISJp4OMiTVLWlGLDANBgkqhkiG9w0BAQsFAAOC
AQEAcjxkXf4FIEbJEBmMAuh313ua6btovY0apR+gP8NfLZmjUh0q9Oc7TmMVRtuW
JIL9jlEMqw0Y4PP3+//pSvMiaxqaGhmXsgrd3w1B5vQnaASuerra3UhFX9CJnpMd
jGxaXipY8zJa602lEwzD24wrKriRRqOhX2NRLHeQuTkQiQgFTnDx1pJhqZ78hnKX
ccaawiv1PA2Tl253LdQaYv6VcJ5mh1jobznRBkfHen2kDgt17YKJW3ttLzaCMiLu
5iqgXEf0E58pLZE5e2jutI7oEHFH7KTAPG5Xguoyond/HSq4bTK31lVva3S7Du87
cCQq7WEcSzy2kH6DWMkWoF0zbg==
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----`;
function getCaCertPath() {
  const possiblePaths = [
    path.resolve(process.cwd(), "data", "supabase-ca.pem"),
    path.resolve(process.cwd(), "certs", "supabase-ca.pem"),
    path.resolve("/tmp", "supabase-ca.pem")
  ];
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).size > 500) return p;
    } catch {
    }
  }
  const tmpPath = path.resolve("/tmp", "supabase-ca.pem");
  try {
    fs.writeFileSync(tmpPath, SUPABASE_ROOT_CA, "utf8");
    return tmpPath;
  } catch {
    return possiblePaths[0];
  }
}
var globalForPrisma = globalThis;
var prismaInstance = null;
var prismaInitFailed = false;
function formatDatabaseUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.port === "6543" || url.hostname.includes("pooler.supabase.com")) {
      if (!url.searchParams.has("pgbouncer")) {
        url.searchParams.set("pgbouncer", "true");
      }
      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "1");
      }
      if (!url.searchParams.has("connect_timeout")) {
        url.searchParams.set("connect_timeout", "15");
      }
      if (!url.searchParams.has("sslmode")) {
        url.searchParams.set("sslmode", "require");
      }
      if (!url.searchParams.has("sslrootcert")) {
        const caPath = getCaCertPath();
        url.searchParams.set("sslrootcert", caPath);
      }
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}
function getSafeConnectionMetadata() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    return { configured: false };
  }
  try {
    const url = new URL(raw);
    const username = url.username || "";
    const maskedUser = username.length > 12 ? `${username.slice(0, 10)}...${username.slice(-3)}` : username;
    return {
      configured: true,
      host: url.hostname,
      port: url.port || "5432",
      database: url.pathname.replace(/^\//, "") || "postgres",
      userPrefix: maskedUser || "unknown",
      isPoolerPort: url.port === "6543",
      hasPgbouncer: url.searchParams.has("pgbouncer"),
      hasSslmode: url.searchParams.has("sslmode"),
      sslmodeValue: url.searchParams.get("sslmode") || "default"
    };
  } catch {
    return { configured: true, error: "invalid_url_syntax" };
  }
}
function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  if (prismaInstance) {
    return prismaInstance;
  }
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    return null;
  }
  if (prismaInitFailed) {
    return null;
  }
  try {
    let PrismaClientClass;
    try {
      const clientModule = require2("@prisma/client");
      PrismaClientClass = clientModule?.PrismaClient;
    } catch {
      return null;
    }
    if (!PrismaClientClass) {
      return null;
    }
    const formattedUrl = formatDatabaseUrl(rawUrl);
    prismaInstance = new PrismaClientClass({
      datasources: {
        db: {
          url: formattedUrl
        }
      },
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
    });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance;
    }
    return prismaInstance;
  } catch (err) {
    prismaInitFailed = true;
    logServerError(err, "Prisma.Client.Initialization");
    return null;
  }
}
var prisma = new Proxy({}, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (!client) {
      if (prop === "$connect") {
        return async () => {
          throw new Error("DATABASE_URL is not configured or Prisma client initialization failed");
        };
      }
      if (prop === "$disconnect") {
        return async () => {
        };
      }
      throw new Error(`PrismaClient unavailable (DATABASE_URL missing or engine init failed)`);
    }
    const val = client[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  }
});

// src/server/schemaInit.ts
import pg from "pg";
var REQUIRED_TABLES = [
  "meals",
  "bookings",
  "booking_items",
  "payments",
  "factory_orders",
  "factory_payments",
  "audit_logs",
  "admin_users"
];
var TABLE_DDL_QUERIES = {
  meals: `
    CREATE TABLE IF NOT EXISTS "meals" (
      "id" TEXT PRIMARY KEY,
      "code" TEXT UNIQUE NOT NULL,
      "name" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "ingredients" TEXT NOT NULL,
      "distributorPrice" DOUBLE PRECISION NOT NULL,
      "factoryPrice" DOUBLE PRECISION NOT NULL,
      "hasJuice" BOOLEAN NOT NULL DEFAULT true,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "image" TEXT,
      "version" INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  bookings: `
    CREATE TABLE IF NOT EXISTS "bookings" (
      "id" TEXT PRIMARY KEY,
      "bookingCode" TEXT UNIQUE NOT NULL,
      "securityCode" TEXT NOT NULL,
      "customerName" TEXT NOT NULL,
      "customerPhone" TEXT NOT NULL,
      "customerWhatsapp" TEXT,
      "preferredContact" TEXT NOT NULL DEFAULT 'whatsapp',
      "eventName" TEXT NOT NULL,
      "eventDate" TEXT NOT NULL,
      "deliveryTime" TEXT NOT NULL,
      "deliveryGovernorate" TEXT NOT NULL,
      "deliveryAddress" TEXT NOT NULL,
      "notes" TEXT,
      "totalMealsCount" INTEGER NOT NULL,
      "totalDistributorPrice" DOUBLE PRECISION NOT NULL,
      "totalFactoryPrice" DOUBLE PRECISION,
      "profitMargin" DOUBLE PRECISION,
      "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "remainingAmount" DOUBLE PRECISION NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'INITIAL',
      "statusNotes" TEXT,
      "isTest" BOOLEAN NOT NULL DEFAULT false,
      "version" INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  booking_items: `
    CREATE TABLE IF NOT EXISTS "booking_items" (
      "id" TEXT PRIMARY KEY,
      "bookingId" TEXT NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
      "mealId" TEXT,
      "mealCode" TEXT NOT NULL,
      "mealName" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "ingredients" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL,
      "drinkOption" TEXT NOT NULL DEFAULT 'standard',
      "orientalSweetOption" TEXT DEFAULT 'none',
      "baseDistributorPrice" DOUBLE PRECISION NOT NULL,
      "unitDistributorPrice" DOUBLE PRECISION NOT NULL,
      "totalDistributorPrice" DOUBLE PRECISION NOT NULL,
      "baseFactoryPrice" DOUBLE PRECISION,
      "unitFactoryPrice" DOUBLE PRECISION,
      "totalFactoryPrice" DOUBLE PRECISION,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  payments: `
    CREATE TABLE IF NOT EXISTS "payments" (
      "id" TEXT PRIMARY KEY,
      "bookingId" TEXT NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
      "amount" DOUBLE PRECISION NOT NULL,
      "method" TEXT NOT NULL,
      "date" TEXT NOT NULL,
      "notes" TEXT,
      "receiptNumber" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  factory_orders: `
    CREATE TABLE IF NOT EXISTS "factory_orders" (
      "id" TEXT PRIMARY KEY,
      "orderNumber" TEXT UNIQUE NOT NULL,
      "bookingId" TEXT NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
      "bookingCode" TEXT NOT NULL,
      "version" INTEGER NOT NULL DEFAULT 1,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "eventDate" TEXT NOT NULL,
      "deliveryTime" TEXT NOT NULL,
      "deliveryLocation" TEXT NOT NULL,
      "itemsJson" TEXT NOT NULL,
      "packagingNotes" TEXT,
      "factoryCostTotal" DOUBLE PRECISION DEFAULT 0,
      "paidAmount" DOUBLE PRECISION DEFAULT 0,
      "remainingAmount" DOUBLE PRECISION DEFAULT 0,
      "paymentStatus" TEXT DEFAULT 'UNPAID',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  factory_payments: `
    CREATE TABLE IF NOT EXISTS "factory_payments" (
      "id" TEXT PRIMARY KEY,
      "factoryOrderId" TEXT NOT NULL REFERENCES "factory_orders"("id") ON DELETE CASCADE,
      "factoryOrderNumber" TEXT NOT NULL,
      "bookingId" TEXT NOT NULL,
      "bookingCode" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "method" TEXT NOT NULL,
      "paymentType" TEXT NOT NULL DEFAULT 'GENERAL',
      "date" TEXT NOT NULL,
      "notes" TEXT,
      "receiptNumber" TEXT,
      "recordedBy" TEXT NOT NULL DEFAULT '\u0627\u0644\u0625\u062F\u0627\u0631\u0629',
      "status" TEXT NOT NULL DEFAULT 'VALID',
      "cancelledBy" TEXT,
      "cancelledAt" TIMESTAMP(3),
      "cancelReason" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  audit_logs: `
    CREATE TABLE IF NOT EXISTS "audit_logs" (
      "id" TEXT PRIMARY KEY,
      "bookingId" TEXT REFERENCES "bookings"("id") ON DELETE SET NULL,
      "bookingCode" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "performedBy" TEXT NOT NULL,
      "details" TEXT NOT NULL,
      "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  admin_users: `
    CREATE TABLE IF NOT EXISTS "admin_users" (
      "id" TEXT PRIMARY KEY,
      "username" TEXT UNIQUE NOT NULL,
      "email" TEXT UNIQUE NOT NULL,
      "name" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'admin',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `
};
var SCHEMA_COLUMN_MIGRATIONS = [
  // 1. booking_items: Oriental sweet option and prices (critical for CLB-2026-5131 & all bookings)
  `ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "orientalSweetOption" TEXT DEFAULT 'none';`,
  `UPDATE "booking_items" SET "orientalSweetOption" = 'none' WHERE "orientalSweetOption" IS NULL;`,
  `ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "drinkOption" TEXT DEFAULT 'standard';`,
  'ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "mealId" TEXT;',
  'ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "baseFactoryPrice" DOUBLE PRECISION;',
  'ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "unitFactoryPrice" DOUBLE PRECISION;',
  'ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "totalFactoryPrice" DOUBLE PRECISION;',
  // 2. bookings columns
  'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "isTest" BOOLEAN NOT NULL DEFAULT false;',
  'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customerWhatsapp" TEXT;',
  `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "preferredContact" TEXT NOT NULL DEFAULT 'whatsapp';`,
  'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "statusNotes" TEXT;',
  'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "totalFactoryPrice" DOUBLE PRECISION;',
  'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "profitMargin" DOUBLE PRECISION;',
  // 3. payments columns
  'ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "notes" TEXT;',
  'ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;',
  // 4. factory_orders columns
  'ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "packagingNotes" TEXT;',
  'ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "factoryCostTotal" DOUBLE PRECISION DEFAULT 0;',
  'ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "paidAmount" DOUBLE PRECISION DEFAULT 0;',
  'ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "remainingAmount" DOUBLE PRECISION DEFAULT 0;',
  `ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'UNPAID';`,
  // 5. factory_payments columns
  `ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "paymentType" TEXT NOT NULL DEFAULT 'GENERAL';`,
  `UPDATE "factory_payments" SET "paymentType" = 'GENERAL' WHERE "paymentType" IS NULL;`,
  'ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "notes" TEXT;',
  'ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;',
  `ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "recordedBy" TEXT DEFAULT '\u0627\u0644\u0625\u062F\u0627\u0631\u0629';`,
  `ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'VALID';`,
  'ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "cancelledBy" TEXT;',
  'ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);',
  'ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;',
  // 6. meals columns
  'ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "hasJuice" BOOLEAN NOT NULL DEFAULT true;',
  'ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;',
  'ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "image" TEXT;',
  'ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;'
];
async function checkTablesStatus(client) {
  try {
    const rawTables = await client.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const existing = rawTables.map((t) => t.table_name);
    const existingRequired = REQUIRED_TABLES.filter((t) => existing.includes(t));
    const missing = REQUIRED_TABLES.filter((t) => !existing.includes(t));
    return {
      allReady: missing.length === 0,
      existingTables: existingRequired,
      missingTables: missing
    };
  } catch (err) {
    logServerError(err, "SchemaInit.CheckTables");
    return {
      allReady: false,
      existingTables: [],
      missingTables: REQUIRED_TABLES
    };
  }
}
async function ensureSchemaReady(client) {
  const status = await checkTablesStatus(client);
  const created = [];
  const errors = [];
  if (!status.allReady) {
    for (const tableName of status.missingTables) {
      const ddl = TABLE_DDL_QUERIES[tableName];
      if (ddl) {
        try {
          await client.$executeRawUnsafe(ddl);
          created.push(tableName);
        } catch (err) {
          logServerError(err, `SchemaInit.Prisma.${tableName}`);
          errors.push(`Prisma ${tableName}: ${err?.message?.slice(0, 100)}`);
        }
      }
    }
    const midCheck = await checkTablesStatus(client);
    if (!midCheck.allReady && process.env.DATABASE_URL) {
      const rawUrl = process.env.DATABASE_URL;
      const formattedUrl = formatDatabaseUrl(rawUrl);
      const pgUrl = new URL(formattedUrl);
      pgUrl.searchParams.delete("sslmode");
      const pgClient = new pg.Client({
        connectionString: pgUrl.toString(),
        connectionTimeoutMillis: 7e3,
        ssl: {
          rejectUnauthorized: true,
          ca: SUPABASE_ROOT_CA,
          servername: pgUrl.hostname
        }
      });
      try {
        await pgClient.connect();
        for (const tableName of midCheck.missingTables) {
          const ddl = TABLE_DDL_QUERIES[tableName];
          if (ddl) {
            try {
              await pgClient.query(ddl);
              if (!created.includes(tableName)) {
                created.push(tableName);
              }
            } catch (pgErr) {
              logServerError(pgErr, `SchemaInit.pgClient.${tableName}`);
              errors.push(`pg ${tableName}: ${pgErr?.message?.slice(0, 100)}`);
            }
          }
        }
      } catch (connErr) {
        errors.push(`pg connection: ${connErr?.message?.slice(0, 100)}`);
      } finally {
        try {
          await pgClient.end();
        } catch {
        }
      }
    }
  }
  let columnsEnsured = true;
  for (const alterQuery of SCHEMA_COLUMN_MIGRATIONS) {
    try {
      await client.$executeRawUnsafe(alterQuery);
    } catch (colErr) {
      logServerError(colErr, "SchemaInit.ColumnMigration");
      columnsEnsured = false;
      errors.push(`Column migration: ${colErr?.message?.slice(0, 100)}`);
    }
  }
  try {
    const mealCount = await client.meal.count();
    if (mealCount === 0) {
      for (const m of INITIAL_MEALS) {
        await client.meal.create({
          data: {
            id: `meal-${m.code}`,
            code: m.code,
            name: m.name,
            category: m.category,
            ingredients: m.ingredients,
            distributorPrice: m.distributorPrice,
            factoryPrice: m.factoryPrice ?? 0,
            hasJuice: m.hasJuice ?? true,
            isActive: m.isActive ?? true,
            image: m.image
          }
        }).catch(() => {
        });
      }
    } else {
      await client.meal.updateMany({
        where: { code: "Sale-12" },
        data: {
          name: "\u0628\u0627\u062A\u064A\u0629",
          ingredients: "\u0642\u0637\u0639\u0629 \u062C\u0627\u062A\u0648\u0629 \u0645\u063A\u0644\u0641\u0629 + \u0628\u0627\u062A\u064A\u0629 + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644"
        }
      }).catch(() => {
      });
      await client.meal.updateMany({
        where: { code: "Sale-05" },
        data: {
          factoryPrice: 56
        }
      }).catch(() => {
      });
    }
  } catch {
  }
  const postCheck = await checkTablesStatus(client);
  let rlsEnforced = false;
  if (postCheck.allReady) {
    try {
      await ensureRlsSecurity(client);
      rlsEnforced = true;
    } catch (rlsErr) {
      logServerError(rlsErr, "SchemaInit.RLS");
      errors.push(`RLS init error: ${rlsErr?.message?.slice(0, 100)}`);
    }
  }
  return {
    success: postCheck.allReady,
    created,
    tablesFound: postCheck.existingTables,
    columnsEnsured,
    rlsEnforced,
    errors
  };
}
var columnsMigrationRun = false;
async function ensureColumnsReady(client) {
  if (columnsMigrationRun) return { applied: 0, errors: [] };
  let applied = 0;
  const errors = [];
  for (const alterQuery of SCHEMA_COLUMN_MIGRATIONS) {
    try {
      await client.$executeRawUnsafe(alterQuery);
      applied++;
    } catch (colErr) {
      errors.push(colErr?.message || "Error");
    }
  }
  columnsMigrationRun = true;
  return { applied, errors };
}
var SUPABASE_RLS_QUERIES = [
  // 1. Roles verification for standard pg environments
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated NOLOGIN;
    END IF;
  END $$;`,
  // 2. Enable RLS on all 8 tables
  "ALTER TABLE IF EXISTS public.meals ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.booking_items ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.factory_orders ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.factory_payments ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;",
  "ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;",
  // 3. Revoke direct access from anon and authenticated
  "REVOKE ALL ON TABLE public.bookings FROM anon, authenticated;",
  "REVOKE ALL ON TABLE public.booking_items FROM anon, authenticated;",
  "REVOKE ALL ON TABLE public.payments FROM anon, authenticated;",
  "REVOKE ALL ON TABLE public.factory_orders FROM anon, authenticated;",
  "REVOKE ALL ON TABLE public.factory_payments FROM anon, authenticated;",
  "REVOKE ALL ON TABLE public.admin_users FROM anon, authenticated;",
  "REVOKE ALL ON TABLE public.audit_logs FROM anon, authenticated;",
  // 4. Meals: Read-only SELECT for active meals
  "REVOKE ALL ON TABLE public.meals FROM anon, authenticated;",
  "GRANT SELECT ON TABLE public.meals TO anon, authenticated;",
  // 5. Clean and set policies
  'DROP POLICY IF EXISTS "meals_public_select_active" ON public.meals;',
  'DROP POLICY IF EXISTS "bookings_deny_direct_anon_authenticated" ON public.bookings;',
  'DROP POLICY IF EXISTS "booking_items_deny_direct_anon_authenticated" ON public.booking_items;',
  'DROP POLICY IF EXISTS "payments_deny_direct_anon_authenticated" ON public.payments;',
  'DROP POLICY IF EXISTS "factory_orders_deny_direct_anon_authenticated" ON public.factory_orders;',
  'DROP POLICY IF EXISTS "factory_payments_deny_direct_anon_authenticated" ON public.factory_payments;',
  'DROP POLICY IF EXISTS "admin_users_deny_direct_anon_authenticated" ON public.admin_users;',
  'DROP POLICY IF EXISTS "audit_logs_deny_direct_anon_authenticated" ON public.audit_logs;',
  'CREATE POLICY "meals_public_select_active" ON public.meals FOR SELECT TO anon, authenticated USING ("isActive" = true);',
  'CREATE POLICY "bookings_deny_direct_anon_authenticated" ON public.bookings FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  'CREATE POLICY "booking_items_deny_direct_anon_authenticated" ON public.booking_items FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  'CREATE POLICY "payments_deny_direct_anon_authenticated" ON public.payments FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  'CREATE POLICY "factory_orders_deny_direct_anon_authenticated" ON public.factory_orders FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  'CREATE POLICY "factory_payments_deny_direct_anon_authenticated" ON public.factory_payments FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  'CREATE POLICY "admin_users_deny_direct_anon_authenticated" ON public.admin_users FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  'CREATE POLICY "audit_logs_deny_direct_anon_authenticated" ON public.audit_logs FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  "ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;"
];
async function ensureRlsSecurity(client) {
  let appliedCount = 0;
  const errors = [];
  for (const query of SUPABASE_RLS_QUERIES) {
    try {
      await client.$executeRawUnsafe(query);
      appliedCount++;
    } catch (err) {
      errors.push(err?.message?.slice(0, 100) || "Unknown error");
    }
  }
  return {
    success: errors.length === 0,
    appliedCount,
    errors
  };
}
async function getRlsStatusReport(client) {
  try {
    const rawRls = await client.$queryRaw`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
    `;
    const rawPolicies = await client.$queryRaw`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
    `;
    const tables = {};
    let securedCount = 0;
    for (const tableName of REQUIRED_TABLES) {
      const match = rawRls.find((t) => t.tablename === tableName);
      const isRls = match ? Boolean(match.rowsecurity) : false;
      const policies = rawPolicies.filter((p) => p.tablename === tableName).map((p) => p.policyname);
      tables[tableName] = {
        tableName,
        rlsEnabled: isRls,
        policiesCount: policies.length,
        policies
      };
      if (isRls) {
        securedCount++;
      }
    }
    return {
      allSecured: securedCount === REQUIRED_TABLES.length,
      totalTables: REQUIRED_TABLES.length,
      securedTablesCount: securedCount,
      tables
    };
  } catch (err) {
    logServerError(err, "GetRlsStatusReport");
    return {
      allSecured: false,
      totalTables: REQUIRED_TABLES.length,
      securedTablesCount: 0,
      tables: {}
    };
  }
}

// src/server/db.ts
var FACTORY_PEPSI_ACCOUNTING = {
  juiceCostDeduction: 5,
  packageCostDeduction: 1,
  // 1 EGP package cost deduction
  totalJuiceDeduction: 6,
  // 5 + 1 = 6 EGP deduction
  pepsiCostAddition: 10,
  netAdjustment: 4
  // -5 (juice) - 1 (package) + 10 (can) = +4 EGP net
};
var VALID_FACTORY_PAYMENT_TYPES = ["DEPOSIT", "INSTALLMENT", "FINAL_SETTLEMENT", "GENERAL"];
var VALID_FACTORY_PAYMENT_METHODS = ["instapay", "bank_transfer", "cash", "vodafone_cash", "other"];
function normalizeFactoryPaymentType(val) {
  const upper = (val || "").trim().toUpperCase();
  return VALID_FACTORY_PAYMENT_TYPES.includes(upper) ? upper : "GENERAL";
}
function normalizeFactoryPaymentMethod(val) {
  const clean = (val || "").trim().toLowerCase();
  return VALID_FACTORY_PAYMENT_METHODS.includes(clean) ? clean : "cash";
}
function calculateFactoryPaymentStatus(paidAmount, costTotal) {
  const paid = Math.round((paidAmount || 0) * 100) / 100;
  const cost = Math.round((costTotal || 0) * 100) / 100;
  if (paid <= 0) return "UNPAID";
  if (paid < cost) return "PARTIALLY_PAID";
  if (paid === cost) return "FULLY_PAID";
  return "OVERPAID";
}
function formatFactoryPaymentTypeLabel(paymentType) {
  switch (normalizeFactoryPaymentType(paymentType)) {
    case "DEPOSIT":
      return "\u0639\u0631\u0628\u0648\u0646 \u062A\u0634\u063A\u064A\u0644";
    case "INSTALLMENT":
      return "\u062F\u0641\u0639\u0629 \u0645\u0627\u0644\u064A\u0629";
    case "FINAL_SETTLEMENT":
      return "\u062A\u0633\u0648\u064A\u0629 \u062E\u062A\u0627\u0645\u064A\u0629";
    default:
      return "\u062F\u0641\u0639\u0629 \u0644\u0644\u0645\u0635\u0646\u0639";
  }
}
function formatFactoryPaymentMethodLabel(method) {
  switch ((method || "").toLowerCase()) {
    case "instapay":
      return "\u0625\u0646\u0633\u062A\u0627\u0628\u0627\u064A";
    case "bank_transfer":
      return "\u062A\u062D\u0648\u064A\u0644 \u0628\u0646\u0643\u064A";
    case "cash":
      return "\u0646\u0642\u062F\u064A";
    case "vodafone_cash":
      return "\u0641\u0648\u062F\u0627\u0641\u0648\u0646 \u0643\u0627\u0634";
    default:
      return "\u0623\u062E\u0631\u0649";
  }
}
function mapFactoryPaymentRecord(p) {
  return {
    id: p.id,
    factoryOrderId: p.factoryOrderId,
    factoryOrderNumber: p.factoryOrderNumber,
    bookingId: p.bookingId,
    bookingCode: p.bookingCode,
    amount: Number(p.amount) || 0,
    method: p.method || "cash",
    paymentType: normalizeFactoryPaymentType(p.paymentType),
    date: p.date,
    notes: p.notes || void 0,
    receiptNumber: p.receiptNumber || void 0,
    recordedBy: p.recordedBy || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629",
    status: p.status || "VALID",
    cancelledBy: p.cancelledBy || void 0,
    cancelledAt: p.cancelledAt instanceof Date ? p.cancelledAt.toISOString() : p.cancelledAt || void 0,
    cancelReason: p.cancelReason || void 0,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt || void 0
  };
}
function hydrateFactoryOrderFinancials(fo, rawPayments) {
  let parsedItems = Array.isArray(fo.items) ? fo.items : [];
  if (!Array.isArray(fo.items) && typeof fo.itemsJson === "string") {
    try {
      parsedItems = JSON.parse(fo.itemsJson);
    } catch {
    }
  }
  const itemsTotal = parsedItems.reduce((acc, item) => acc + (Number(item.totalFactoryPrice) || 0), 0);
  const costTotal = fo.factoryCostTotal !== void 0 && fo.factoryCostTotal !== null && Number(fo.factoryCostTotal) > 0 ? Number(fo.factoryCostTotal) : itemsTotal;
  const sourcePayments = rawPayments !== void 0 ? rawPayments : Array.isArray(fo.payments) ? fo.payments : [];
  const paymentsList = sourcePayments.map(mapFactoryPaymentRecord);
  const validPayments = paymentsList.filter((p) => p.status === "VALID");
  const paidAmount = validPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = costTotal - paidAmount;
  const paymentStatus = calculateFactoryPaymentStatus(paidAmount, costTotal);
  return {
    id: fo.id,
    orderNumber: fo.orderNumber,
    bookingId: fo.bookingId,
    bookingCode: fo.bookingCode,
    version: fo.version || 1,
    status: fo.status,
    eventDate: fo.eventDate,
    deliveryTime: fo.deliveryTime,
    deliveryLocation: fo.deliveryLocation,
    factoryCostTotal: costTotal,
    paidToFactoryAmount: paidAmount,
    remainingToFactoryAmount: remainingAmount,
    paymentStatus,
    payments: paymentsList,
    items: parsedItems,
    packagingNotes: fo.packagingNotes || "",
    sentBy: fo.sentBy || void 0,
    sentAt: fo.sentAt || void 0,
    createdAt: fo.createdAt instanceof Date ? fo.createdAt.toISOString() : fo.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: fo.updatedAt instanceof Date ? fo.updatedAt.toISOString() : fo.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
  };
}
var IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT
);
var DATA_DIR = IS_SERVERLESS ? path2.resolve("/tmp", "celebre-data") : path2.resolve(process.cwd(), "data");
var DB_FILE = path2.resolve(DATA_DIR, "db.json");
var isPrismaConnected = false;
var databaseUrl = process.env.DATABASE_URL;
try {
  if (!fs2.existsSync(DATA_DIR)) {
    fs2.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("[DB] Non-writable filesystem detected, fallback storage will use RAM:", err?.message);
}
function getInitialData() {
  const seededMeals = INITIAL_MEALS.map((m, idx) => ({
    ...m,
    id: `meal-${idx + 1}`,
    version: 1,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }));
  const defaultPassword = process.env.ADMIN_PASSWORD || "Celebre@2026";
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(defaultPassword, salt);
  return {
    meals: seededMeals,
    bookings: [],
    payments: [],
    factoryOrders: [],
    factoryPayments: [],
    auditLogs: [],
    adminUsers: [
      {
        id: "admin-1",
        username: "admin",
        email: "management@celebre-eg.com",
        role: "super_admin",
        name: "\u0625\u062F\u0627\u0631\u0629 \u0633\u064A\u0644\u064A\u0628\u0631\u064A",
        passwordHash
      },
      {
        id: "factory-1",
        username: "factory",
        email: "factory@celebre-eg.com",
        role: "factory",
        name: "\u0645\u0633\u0624\u0648\u0644 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639",
        passwordHash: bcrypt.hashSync("Factory@2026", 10)
      }
    ],
    factoryOrderCounter: 100
  };
}
function loadLocalDB() {
  try {
    const seedFile = path2.resolve(process.cwd(), "data", "db.json");
    if (!fs2.existsSync(DB_FILE)) {
      let initial;
      if (fs2.existsSync(seedFile)) {
        try {
          initial = JSON.parse(fs2.readFileSync(seedFile, "utf8"));
          if (!initial.factoryPayments) initial.factoryPayments = [];
        } catch {
          initial = getInitialData();
        }
      } else {
        initial = getInitialData();
      }
      try {
        fs2.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
      } catch (writeErr) {
      }
      return initial;
    }
    const raw = fs2.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.factoryPayments) parsed.factoryPayments = [];
    if (!parsed.meals || parsed.meals.length < 18) {
      const initial = getInitialData();
      parsed.meals = initial.meals;
      try {
        saveLocalDB(parsed);
      } catch {
      }
    }
    return parsed;
  } catch (err) {
    const initial = getInitialData();
    return initial;
  }
}
function saveLocalDB(data) {
  try {
    fs2.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
  }
}
var memoryDB = loadLocalDB();
function generateBookingCode() {
  const randomDigits = Math.floor(1e3 + Math.random() * 9e3);
  return `CLB-2026-${randomDigits}`;
}
function generateSecurityCode() {
  return Math.floor(1e3 + Math.random() * 9e3).toString();
}
function normalizeBookingCode(str) {
  return (str || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function normalizePhone(phone) {
  return (phone || "").replace(/\D/g, "").replace(/^20/, "");
}
var PROTECTED_BOOKINGS = {
  codes: Object.freeze(["CLB-2026-5131"]),
  phones: Object.freeze(["01158855911", "201158855911"]),
  names: Object.freeze(["\u0623\u062D\u0645\u062F \u0639\u0635\u0627\u0645 \u0627\u0644\u062F\u064A\u0646 \u062D\u0633\u064A\u0646"]),
  primaryIds: Object.freeze(["bk-1793362871199-5131"])
};
function isStrictlyProtectedBooking(booking) {
  if (!booking) return false;
  const code = (booking.bookingCode || "").trim().toUpperCase();
  const phone = normalizePhone(booking.customerPhone || "");
  const name = (booking.customerName || "").trim();
  const id = (booking.id || "").trim();
  if (PROTECTED_BOOKINGS.codes.includes(code)) return true;
  if (PROTECTED_BOOKINGS.primaryIds.includes(id)) return true;
  for (const p of PROTECTED_BOOKINGS.phones) {
    if (phone && normalizePhone(p) === phone) return true;
  }
  if (name.includes("\u0623\u062D\u0645\u062F \u0639\u0635\u0627\u0645 \u0627\u0644\u062F\u064A\u0646")) return true;
  return false;
}
function classifyBookingRecord(b) {
  if (isStrictlyProtectedBooking(b)) return "PROTECTED_REAL";
  const testNamePatterns = ["\u062A\u062C\u0631\u0628", "\u0641\u062D\u0635", "\u0627\u062E\u062A\u0628\u0627\u0631", "\u062A\u0633\u062A", "test", "\u0634\u0631\u0643\u0629 \u0627\u0644\u0646\u0648\u0631 \u0644\u0644\u0645\u0624\u062A\u0645\u0631\u0627\u062A"];
  const testPhonePatterns = [
    "01033334444",
    "01022223333",
    "01099887766",
    "01009988776",
    "01234567890",
    "01011223344",
    "01223344556",
    "01073746999",
    "01049462574",
    "01099864798",
    "01028338678",
    "01072714940",
    "01071088193",
    "01037906440"
  ];
  const name = (b.customerName || "").toLowerCase();
  const notes = (b.notes || "").toLowerCase();
  const phone = normalizePhone(b.customerPhone || "");
  const isExplicitTest = Boolean(b.isTest);
  const isNameTest = testNamePatterns.some((p) => name.includes(p.toLowerCase()));
  const isNotesTest = notes.includes("\u0641\u062D\u0635") || notes.includes("\u062A\u062C\u0631\u0628") || notes.includes("test");
  const isPhoneTest = testPhonePatterns.some((p) => phone === normalizePhone(p));
  if (isExplicitTest || isNameTest || isNotesTest || isPhoneTest) {
    return "CONFIRMED_TEST";
  }
  return "LEGACY_DEMO";
}
function isBookingCodeMatch(storedCode, queryCode) {
  if (!storedCode || !queryCode) return false;
  const sClean = storedCode.trim().toUpperCase();
  const qClean = queryCode.trim().toUpperCase();
  if (sClean === qClean) return true;
  const sNorm = normalizeBookingCode(storedCode);
  const qNorm = normalizeBookingCode(queryCode);
  if (sNorm === qNorm) return true;
  if (qNorm.length >= 4 && sNorm.endsWith(qNorm)) return true;
  return false;
}
function isVerificationMatch(storedPin, storedPhone, queryVerify) {
  if (!queryVerify || !queryVerify.trim()) {
    return true;
  }
  const cleanVerify = queryVerify.trim();
  if (storedPin && storedPin.trim() === cleanVerify) return true;
  const qDigits = cleanVerify.replace(/\D/g, "");
  const sPhoneDigits = normalizePhone(storedPhone);
  const qPhoneDigits = normalizePhone(cleanVerify);
  if (sPhoneDigits && qPhoneDigits && (sPhoneDigits === qPhoneDigits || sPhoneDigits.endsWith(qPhoneDigits) || qPhoneDigits.endsWith(sPhoneDigits))) {
    return true;
  }
  if (qDigits.length >= 4 && sPhoneDigits.endsWith(qDigits)) {
    return true;
  }
  return false;
}
var db = {
  isPostgres() {
    return isPrismaConnected || !!databaseUrl;
  },
  async getMeals(includeSecret = false) {
    if (databaseUrl) {
      try {
        const dbMeals = await prisma.meal.findMany({
          orderBy: { code: "asc" }
        });
        if (dbMeals && dbMeals.length > 0) {
          return dbMeals.map((m) => {
            const meal = {
              id: m.id,
              code: m.code,
              name: m.name,
              category: m.category,
              ingredients: m.ingredients,
              distributorPrice: m.distributorPrice,
              factoryPrice: includeSecret ? m.factoryPrice : void 0,
              hasJuice: m.hasJuice,
              isActive: m.isActive,
              image: m.image || void 0,
              version: m.version,
              updatedAt: m.updatedAt.toISOString()
            };
            return meal;
          });
        }
      } catch (err) {
      }
    }
    memoryDB = loadLocalDB();
    return memoryDB.meals.map((m) => {
      if (includeSecret) {
        return m;
      }
      const { factoryPrice, ...publicMeal } = m;
      return publicMeal;
    });
  },
  async getMealById(id) {
    memoryDB = loadLocalDB();
    return memoryDB.meals.find((m) => m.id === id || m.code === id);
  },
  async updateMeal(id, updates, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    memoryDB = loadLocalDB();
    const idx = memoryDB.meals.findIndex((m) => m.id === id || m.code === id);
    if (idx === -1) return null;
    const current = memoryDB.meals[idx];
    const updated = {
      ...current,
      ...updates,
      version: current.version + 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryDB.meals[idx] = updated;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.meal.updateMany({
            where: {
              OR: [{ id }, { code: id }]
            },
            data: {
              name: updates.name !== void 0 ? updates.name : void 0,
              distributorPrice: updates.distributorPrice !== void 0 ? updates.distributorPrice : void 0,
              factoryPrice: updates.factoryPrice !== void 0 ? updates.factoryPrice : void 0,
              ingredients: updates.ingredients !== void 0 ? updates.ingredients : void 0,
              hasJuice: updates.hasJuice !== void 0 ? updates.hasJuice : void 0,
              isActive: updates.isActive !== void 0 ? updates.isActive : void 0,
              version: { increment: 1 },
              updatedAt: /* @__PURE__ */ new Date()
            }
          });
        }
      } catch (err) {
        logServerError(err, "db.updateMeal.prisma");
      }
    }
    this.addAuditLog({
      bookingId: "",
      bookingCode: updated.code || "MENU_UPDATE",
      action: "\u062A\u062D\u062F\u064A\u062B \u0648\u062C\u0628\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u064A\u0648",
      performedBy,
      details: `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0648\u062C\u0628\u0629 ${updated.code} (${updated.name}). \u0645\u0648\u0632\u0639: ${updated.distributorPrice} \u062C\u060C \u0645\u0635\u0646\u0639: ${updated.factoryPrice} \u062C.`
    });
    saveLocalDB(memoryDB);
    return updated;
  },
  async createBooking(data) {
    memoryDB = loadLocalDB();
    let totalMealsCount = 0;
    let totalDistributorPrice = 0;
    let totalFactoryPrice = 0;
    const validatedItems = data.items.map((item) => {
      const meal = memoryDB.meals.find((m) => m.code === item.mealCode);
      if (!meal) {
        throw new Error(`\u0627\u0644\u0648\u062C\u0628\u0629 ${item.mealCode} \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u064A\u0648 \u0627\u0644\u0631\u0633\u0645\u064A`);
      }
      const quantity = Math.max(1, Math.floor(item.quantity));
      totalMealsCount += quantity;
      const baseDistributorPrice = meal.distributorPrice;
      const baseFactoryPrice = meal.factoryPrice || 0;
      const sweetOpt = item.orientalSweetOption || "none";
      let orientalSweetDistributorDelta = 0;
      let orientalSweetFactoryDelta = 0;
      let sweetLabel = "\u0628\u062F\u0648\u0646 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A";
      if (sweetOpt === "add_with_juice") {
        orientalSweetDistributorDelta = 20;
        orientalSweetFactoryDelta = 10;
        sweetLabel = "\u0625\u0636\u0627\u0641\u0629 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A \u0645\u0639 \u0627\u0644\u0639\u0635\u064A\u0631 (+20 \u062C)";
      } else if (sweetOpt === "replace_juice") {
        orientalSweetDistributorDelta = 15;
        orientalSweetFactoryDelta = 5;
        sweetLabel = "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A (+15 \u062C)";
      }
      let distributorDrinkDelta = 0;
      let factoryDrinkDelta = 0;
      if (sweetOpt !== "replace_juice" && meal.hasJuice) {
        if (item.drinkOption === "no_juice") {
          distributorDrinkDelta = -CELEBRE_CONFIG.drinkAdjustments.noJuiceDiscount;
          factoryDrinkDelta = -FACTORY_PEPSI_ACCOUNTING.totalJuiceDeduction;
        } else if (item.drinkOption === "pepsi") {
          distributorDrinkDelta = CELEBRE_CONFIG.drinkAdjustments.pepsiExtra;
          factoryDrinkDelta = FACTORY_PEPSI_ACCOUNTING.netAdjustment;
        }
      }
      const unitDistributorPrice = Math.max(0, baseDistributorPrice + distributorDrinkDelta + orientalSweetDistributorDelta);
      const unitFactoryPrice = Math.max(0, baseFactoryPrice + factoryDrinkDelta + orientalSweetFactoryDelta);
      const itemTotalDistributor = unitDistributorPrice * quantity;
      const itemTotalFactory = unitFactoryPrice * quantity;
      totalDistributorPrice += itemTotalDistributor;
      totalFactoryPrice += itemTotalFactory;
      return {
        mealId: meal.id,
        mealCode: meal.code,
        mealName: meal.name,
        ingredients: meal.ingredients,
        category: meal.category,
        quantity,
        drinkOption: item.drinkOption,
        orientalSweetOption: sweetOpt,
        orientalSweetLabel: sweetLabel,
        orientalSweetDistributorAdjustment: orientalSweetDistributorDelta,
        baseDistributorPrice,
        unitDistributorPrice,
        totalDistributorPrice: itemTotalDistributor,
        baseFactoryPrice,
        factoryDrinkAdjustment: factoryDrinkDelta,
        factoryOrientalSweetAdjustment: orientalSweetFactoryDelta,
        unitFactoryPrice,
        totalFactoryPrice: itemTotalFactory
      };
    });
    if (totalMealsCount < 50) {
      throw new Error(`\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u0644\u0637\u0644\u0628 50 \u0648\u062C\u0628\u0629. \u0625\u062C\u0645\u0627\u0644\u064A \u0639\u062F\u062F \u0627\u0644\u0648\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u062D\u062F\u062F\u0629 (${totalMealsCount} \u0648\u062C\u0628\u0629) \u0623\u0642\u0644 \u0645\u0646 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649.`);
    }
    let bookingCode = generateBookingCode();
    let collisionAttempts = 0;
    while (memoryDB.bookings.some((b) => b.bookingCode === bookingCode) && collisionAttempts < 10) {
      bookingCode = generateBookingCode();
      collisionAttempts++;
    }
    const securityCode = generateSecurityCode();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const isTest = data.isTest ?? Boolean(
      data.customerName.includes("\u062A\u062C\u0631\u064A\u0628") || data.notes && data.notes.includes("\u062A\u062C\u0631\u064A\u0628") || data.eventName.includes("\u062A\u062C\u0631\u064A\u0628")
    );
    const newBooking = {
      id: `bk-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      bookingCode,
      securityCode,
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone.trim(),
      customerWhatsapp: data.customerWhatsapp?.trim() || data.customerPhone.trim(),
      preferredContact: data.preferredContact,
      eventName: data.eventName.trim(),
      eventDate: data.eventDate,
      deliveryTime: data.deliveryTime,
      deliveryGovernorate: data.deliveryGovernorate,
      deliveryAddress: data.deliveryAddress.trim(),
      notes: data.notes?.trim() || "",
      items: validatedItems,
      totalMealsCount,
      totalDistributorPrice,
      totalFactoryPrice,
      profitMargin: totalDistributorPrice - totalFactoryPrice,
      paidAmount: 0,
      remainingAmount: totalDistributorPrice,
      status: "INITIAL",
      statusNotes: "\u062D\u062C\u0632 \u0645\u0628\u062F\u0626\u064A \u062C\u062F\u064A\u062F \u0645\u0633\u062C\u0644 \u0639\u0628\u0631 \u0627\u0644\u0645\u0648\u0642\u0639",
      isTest,
      version: 1,
      createdAt: now,
      updatedAt: now
    };
    memoryDB.bookings.unshift(newBooking);
    saveLocalDB(memoryDB);
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.booking.create({
            data: {
              id: newBooking.id,
              bookingCode: newBooking.bookingCode,
              securityCode: newBooking.securityCode,
              customerName: newBooking.customerName,
              customerPhone: newBooking.customerPhone,
              customerWhatsapp: newBooking.customerWhatsapp,
              preferredContact: newBooking.preferredContact,
              eventName: newBooking.eventName,
              eventDate: newBooking.eventDate,
              deliveryTime: newBooking.deliveryTime,
              deliveryGovernorate: newBooking.deliveryGovernorate,
              deliveryAddress: newBooking.deliveryAddress,
              notes: newBooking.notes,
              totalMealsCount: newBooking.totalMealsCount,
              totalDistributorPrice: newBooking.totalDistributorPrice,
              totalFactoryPrice: newBooking.totalFactoryPrice,
              profitMargin: newBooking.profitMargin,
              paidAmount: 0,
              remainingAmount: newBooking.remainingAmount,
              status: "INITIAL",
              statusNotes: newBooking.statusNotes,
              isTest,
              version: 1,
              items: {
                create: validatedItems.map((it) => ({
                  mealId: it.mealId,
                  mealCode: it.mealCode,
                  mealName: it.mealName,
                  category: it.category,
                  ingredients: it.ingredients,
                  quantity: it.quantity,
                  drinkOption: it.drinkOption,
                  orientalSweetOption: it.orientalSweetOption || "none",
                  baseDistributorPrice: it.baseDistributorPrice,
                  unitDistributorPrice: it.unitDistributorPrice,
                  totalDistributorPrice: it.totalDistributorPrice,
                  baseFactoryPrice: it.baseFactoryPrice,
                  unitFactoryPrice: it.unitFactoryPrice,
                  totalFactoryPrice: it.totalFactoryPrice
                }))
              }
            }
          });
        }
      } catch (err) {
        const sanitized = logServerError(err, "db.createBooking.prisma");
        if (process.env.STRICT_DB === "true") {
          const strictError = new Error(sanitized.errorMessage);
          strictError.code = sanitized.errorCode;
          throw strictError;
        }
      }
    }
    this.addAuditLog({
      bookingId: newBooking.id,
      bookingCode: newBooking.bookingCode,
      action: "\u0625\u0646\u0634\u0627\u0621 \u062D\u062C\u0632 \u0645\u0628\u062F\u0626\u064A",
      performedBy: "\u0627\u0644\u0639\u0645\u064A\u0644 (\u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A)",
      details: `\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u062C\u0632 \u0631\u0642\u0645 ${bookingCode} \u0628\u0625\u062C\u0645\u0627\u0644\u064A ${totalMealsCount} \u0648\u062C\u0628\u0629 \u0648\u0642\u064A\u0645\u0629 ${totalDistributorPrice} \u062C\u0646\u064A\u0647.`
    });
    saveLocalDB(memoryDB);
    return newBooking;
  },
  async getBookings(filters) {
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const whereClause = {};
          if (filters?.status && filters.status !== "ALL") {
            whereClause.status = filters.status;
          }
          if (filters?.search) {
            const q = filters.search.trim();
            whereClause.OR = [
              { bookingCode: { contains: q, mode: "insensitive" } },
              { customerName: { contains: q, mode: "insensitive" } },
              { customerPhone: { contains: q } },
              { eventName: { contains: q, mode: "insensitive" } }
            ];
          }
          const dbBookings = await client.booking.findMany({
            where: whereClause,
            include: {
              items: true,
              payments: true,
              factoryOrders: {
                include: {
                  payments: { orderBy: { createdAt: "desc" } }
                },
                orderBy: { createdAt: "desc" }
              },
              auditLogs: true
            },
            orderBy: { createdAt: "desc" }
          });
          if (dbBookings && dbBookings.length > 0) {
            return dbBookings.map((b) => ({
              id: b.id,
              bookingCode: b.bookingCode,
              securityCode: b.securityCode,
              customerName: b.customerName,
              customerPhone: b.customerPhone,
              customerWhatsapp: b.customerWhatsapp || b.customerPhone,
              preferredContact: b.preferredContact || "whatsapp",
              eventName: b.eventName,
              eventDate: b.eventDate,
              deliveryTime: b.deliveryTime,
              deliveryGovernorate: b.deliveryGovernorate,
              deliveryAddress: b.deliveryAddress,
              notes: b.notes || "",
              totalMealsCount: b.totalMealsCount,
              totalDistributorPrice: b.totalDistributorPrice,
              totalFactoryPrice: b.totalFactoryPrice || 0,
              profitMargin: b.profitMargin || b.totalDistributorPrice - (b.totalFactoryPrice || 0),
              paidAmount: b.paidAmount,
              remainingAmount: b.remainingAmount,
              status: b.status || "INITIAL",
              statusNotes: b.statusNotes || "",
              isTest: b.isTest ?? (b.bookingCode === "CLB-2026-1699" || b.customerName.includes("\u062A\u062C\u0631\u064A\u0628")),
              version: b.version,
              createdAt: b.createdAt.toISOString(),
              updatedAt: b.updatedAt.toISOString(),
              items: b.items.map((it) => {
                const sweetOpt = it.orientalSweetOption || "none";
                const sweetDist = sweetOpt === "add_with_juice" ? 20 : sweetOpt === "replace_juice" ? 15 : 0;
                const sweetFact = sweetOpt === "add_with_juice" ? 10 : sweetOpt === "replace_juice" ? 5 : 0;
                return {
                  mealId: it.mealId || it.mealCode,
                  mealCode: it.mealCode,
                  mealName: it.mealName,
                  category: it.category,
                  ingredients: it.ingredients,
                  quantity: it.quantity,
                  drinkOption: it.drinkOption || "standard",
                  orientalSweetOption: sweetOpt,
                  orientalSweetLabel: sweetOpt === "add_with_juice" ? "\u0625\u0636\u0627\u0641\u0629 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A \u0645\u0639 \u0627\u0644\u0639\u0635\u064A\u0631 (+20 \u062C)" : sweetOpt === "replace_juice" ? "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A (+15 \u062C)" : void 0,
                  orientalSweetDistributorAdjustment: sweetDist,
                  factoryOrientalSweetAdjustment: sweetFact,
                  baseDistributorPrice: it.baseDistributorPrice,
                  unitDistributorPrice: it.unitDistributorPrice,
                  totalDistributorPrice: it.totalDistributorPrice,
                  baseFactoryPrice: it.baseFactoryPrice || 0,
                  unitFactoryPrice: it.unitFactoryPrice || 0,
                  totalFactoryPrice: it.totalFactoryPrice || 0
                };
              }),
              payments: b.payments.map((p) => ({
                id: p.id,
                bookingId: p.bookingId,
                amount: p.amount,
                method: p.method,
                date: p.date,
                notes: p.notes || "",
                receiptNumber: p.receiptNumber || "",
                status: p.notes && p.notes.includes("[\u0645\u0644\u063A\u0627\u0629") ? "CANCELLED" : "VALID",
                createdAt: p.createdAt.toISOString()
              })),
              factoryOrders: (b.factoryOrders || []).map((fo) => hydrateFactoryOrderFinancials(fo)),
              auditLogs: b.auditLogs.map((al) => ({
                id: al.id,
                bookingId: al.bookingId || "",
                bookingCode: al.bookingCode || b.bookingCode || "",
                action: al.action,
                performedBy: al.performedBy,
                details: al.details,
                timestamp: al.timestamp.toISOString()
              }))
            }));
          }
        }
      } catch (err) {
        logServerError(err, "db.getBookings.prisma");
      }
    }
    memoryDB = loadLocalDB();
    let results = [...memoryDB.bookings];
    if (filters?.status && filters.status !== "ALL") {
      results = results.filter((b) => b.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(
        (b) => b.bookingCode.toLowerCase().includes(q) || b.customerName.toLowerCase().includes(q) || b.customerPhone.includes(q) || b.eventName.toLowerCase().includes(q)
      );
    }
    return results.map((b) => ({
      ...b,
      isTest: b.isTest ?? (b.bookingCode === "CLB-2026-1699" || b.customerName.includes("\u062A\u062C\u0631\u064A\u0628")),
      payments: memoryDB.payments.filter((p) => p.bookingId === b.id),
      factoryOrders: memoryDB.factoryOrders.filter((fo) => fo.bookingId === b.id).map((fo) => hydrateFactoryOrderFinancials(
        fo,
        (memoryDB.factoryPayments || []).filter((p) => p.factoryOrderId ? p.factoryOrderId === fo.id : p.factoryOrderNumber === fo.orderNumber)
      )),
      auditLogs: memoryDB.auditLogs.filter((al) => al.bookingId === b.id)
    }));
  },
  async getBookingById(id) {
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          let b2 = null;
          try {
            b2 = await client.booking.findFirst({
              where: {
                OR: [
                  { id },
                  { bookingCode: id }
                ]
              },
              include: {
                items: true,
                payments: true,
                factoryOrders: {
                  include: {
                    payments: { orderBy: { createdAt: "desc" } }
                  },
                  orderBy: { createdAt: "desc" }
                },
                auditLogs: true
              }
            });
          } catch (findErr) {
            if (String(findErr?.message || "").includes("booking_items.")) {
              ensureColumnsReady(client).catch(() => {
              });
              b2 = await client.booking.findFirst({
                where: {
                  OR: [
                    { id },
                    { bookingCode: id }
                  ]
                },
                include: {
                  payments: true,
                  factoryOrders: {
                    include: {
                      payments: { orderBy: { createdAt: "desc" } }
                    },
                    orderBy: { createdAt: "desc" }
                  },
                  auditLogs: true
                }
              });
            } else {
              throw findErr;
            }
          }
          if (b2) {
            return {
              id: b2.id,
              bookingCode: b2.bookingCode,
              securityCode: b2.securityCode,
              customerName: b2.customerName,
              customerPhone: b2.customerPhone,
              customerWhatsapp: b2.customerWhatsapp || b2.customerPhone,
              preferredContact: b2.preferredContact || "whatsapp",
              eventName: b2.eventName,
              eventDate: b2.eventDate,
              deliveryTime: b2.deliveryTime,
              deliveryGovernorate: b2.deliveryGovernorate,
              deliveryAddress: b2.deliveryAddress,
              notes: b2.notes || "",
              totalMealsCount: b2.totalMealsCount,
              totalDistributorPrice: b2.totalDistributorPrice,
              totalFactoryPrice: b2.totalFactoryPrice || 0,
              profitMargin: b2.profitMargin || b2.totalDistributorPrice - (b2.totalFactoryPrice || 0),
              paidAmount: b2.paidAmount,
              remainingAmount: b2.remainingAmount,
              status: b2.status || "INITIAL",
              statusNotes: b2.statusNotes || "",
              isTest: b2.isTest ?? (b2.bookingCode === "CLB-2026-1699" || b2.customerName.includes("\u062A\u062C\u0631\u064A\u0628")),
              version: b2.version,
              createdAt: b2.createdAt.toISOString(),
              updatedAt: b2.updatedAt.toISOString(),
              items: (b2.items || []).map((it) => {
                const sweetOpt = it.orientalSweetOption || "none";
                const sweetDist = sweetOpt === "add_with_juice" ? 20 : sweetOpt === "replace_juice" ? 15 : 0;
                const sweetFact = sweetOpt === "add_with_juice" ? 10 : sweetOpt === "replace_juice" ? 5 : 0;
                return {
                  mealId: it.mealId || it.mealCode,
                  mealCode: it.mealCode,
                  mealName: it.mealName,
                  category: it.category,
                  ingredients: it.ingredients,
                  quantity: it.quantity,
                  drinkOption: it.drinkOption || "standard",
                  orientalSweetOption: sweetOpt,
                  orientalSweetLabel: sweetOpt === "add_with_juice" ? "\u0625\u0636\u0627\u0641\u0629 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A \u0645\u0639 \u0627\u0644\u0639\u0635\u064A\u0631 (+20 \u062C)" : sweetOpt === "replace_juice" ? "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A (+15 \u062C)" : void 0,
                  orientalSweetDistributorAdjustment: sweetDist,
                  factoryOrientalSweetAdjustment: sweetFact,
                  baseDistributorPrice: it.baseDistributorPrice,
                  unitDistributorPrice: it.unitDistributorPrice,
                  totalDistributorPrice: it.totalDistributorPrice,
                  baseFactoryPrice: it.baseFactoryPrice || 0,
                  unitFactoryPrice: it.unitFactoryPrice || 0,
                  totalFactoryPrice: it.totalFactoryPrice || 0
                };
              }),
              payments: (b2.payments || []).map((p) => ({
                id: p.id,
                bookingId: p.bookingId,
                amount: p.amount,
                method: p.method,
                date: p.date,
                notes: p.notes || "",
                receiptNumber: p.receiptNumber || "",
                status: p.notes && p.notes.includes("[\u0645\u0644\u063A\u0627\u0629") ? "CANCELLED" : "VALID",
                createdAt: p.createdAt.toISOString()
              })),
              factoryOrders: (b2.factoryOrders || []).map((fo) => hydrateFactoryOrderFinancials(fo)),
              auditLogs: (b2.auditLogs || []).map((al) => ({
                id: al.id,
                bookingId: al.bookingId || "",
                bookingCode: al.bookingCode || b2.bookingCode || "",
                action: al.action,
                performedBy: al.performedBy,
                details: al.details,
                timestamp: al.timestamp.toISOString()
              }))
            };
          }
        }
      } catch (err) {
        logServerError(err, "db.getBookingById.prisma");
      }
    }
    memoryDB = loadLocalDB();
    const b = memoryDB.bookings.find((item) => item.id === id || item.bookingCode === id);
    if (!b) return null;
    return {
      ...b,
      isTest: b.isTest ?? (b.bookingCode === "CLB-2026-1699" || b.customerName.includes("\u062A\u062C\u0631\u064A\u0628")),
      payments: memoryDB.payments.filter((p) => p.bookingId === b.id),
      factoryOrders: memoryDB.factoryOrders.filter((fo) => fo.bookingId === b.id).map((fo) => hydrateFactoryOrderFinancials(
        fo,
        (memoryDB.factoryPayments || []).filter((p) => p.factoryOrderId ? p.factoryOrderId === fo.id : p.factoryOrderNumber === fo.orderNumber)
      )),
      auditLogs: memoryDB.auditLogs.filter((al) => al.bookingId === b.id)
    };
  },
  /**
   * Authoritative lookup strictly by primary key ID (b.id).
   * Used for all update, delete, payment, and status modification operations.
   * NEVER falls back to bookingCode to guarantee total data isolation.
   */
  async getBookingByPrimaryId(bookingId) {
    if (!bookingId || typeof bookingId !== "string") return null;
    const cleanId = bookingId.trim();
    if (!cleanId) return null;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          let dbBooking = null;
          try {
            dbBooking = await client.booking.findUnique({
              where: { id: cleanId },
              include: {
                items: true,
                payments: { orderBy: { createdAt: "desc" } },
                factoryOrders: {
                  include: {
                    payments: { orderBy: { createdAt: "desc" } }
                  },
                  orderBy: { createdAt: "desc" }
                },
                auditLogs: { orderBy: { timestamp: "desc" } }
              }
            });
          } catch (findErr) {
            if (String(findErr?.message || "").includes("booking_items.")) {
              ensureColumnsReady(client).catch(() => {
              });
              dbBooking = await client.booking.findUnique({
                where: { id: cleanId },
                include: {
                  payments: { orderBy: { createdAt: "desc" } },
                  factoryOrders: {
                    include: {
                      payments: { orderBy: { createdAt: "desc" } }
                    },
                    orderBy: { createdAt: "desc" }
                  },
                  auditLogs: { orderBy: { timestamp: "desc" } }
                }
              });
            } else {
              throw findErr;
            }
          }
          if (dbBooking) {
            return {
              id: dbBooking.id,
              bookingCode: dbBooking.bookingCode,
              securityCode: dbBooking.securityCode,
              customerName: dbBooking.customerName,
              customerPhone: dbBooking.customerPhone,
              customerWhatsapp: dbBooking.customerWhatsapp || void 0,
              preferredContact: dbBooking.preferredContact,
              eventName: dbBooking.eventName,
              eventDate: dbBooking.eventDate,
              deliveryTime: dbBooking.deliveryTime,
              deliveryGovernorate: dbBooking.deliveryGovernorate,
              deliveryAddress: dbBooking.deliveryAddress,
              notes: dbBooking.notes || "",
              totalMealsCount: dbBooking.totalMealsCount,
              totalDistributorPrice: dbBooking.totalDistributorPrice,
              totalFactoryPrice: dbBooking.totalFactoryPrice ?? void 0,
              profitMargin: dbBooking.profitMargin ?? void 0,
              paidAmount: dbBooking.paidAmount,
              remainingAmount: dbBooking.remainingAmount,
              status: dbBooking.status,
              statusNotes: dbBooking.statusNotes || "",
              isTest: dbBooking.isTest,
              version: dbBooking.version,
              createdAt: dbBooking.createdAt.toISOString(),
              updatedAt: dbBooking.updatedAt.toISOString(),
              items: (dbBooking.items || []).map((it) => {
                const sweetOpt = it.orientalSweetOption || "none";
                const sweetDist = sweetOpt === "add_with_juice" ? 20 : sweetOpt === "replace_juice" ? 15 : 0;
                const sweetFact = sweetOpt === "add_with_juice" ? 10 : sweetOpt === "replace_juice" ? 5 : 0;
                return {
                  mealId: it.mealId,
                  mealCode: it.mealCode,
                  mealName: it.mealName,
                  category: it.category,
                  ingredients: it.ingredients,
                  quantity: it.quantity,
                  drinkOption: it.drinkOption,
                  orientalSweetOption: sweetOpt,
                  orientalSweetLabel: sweetOpt === "add_with_juice" ? "\u0625\u0636\u0627\u0641\u0629 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A \u0645\u0639 \u0627\u0644\u0639\u0635\u064A\u0631 (+20 \u062C)" : sweetOpt === "replace_juice" ? "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A (+15 \u062C)" : void 0,
                  orientalSweetDistributorAdjustment: sweetDist,
                  factoryOrientalSweetAdjustment: sweetFact,
                  baseDistributorPrice: it.baseDistributorPrice,
                  unitDistributorPrice: it.unitDistributorPrice,
                  totalDistributorPrice: it.totalDistributorPrice,
                  baseFactoryPrice: it.baseFactoryPrice,
                  factoryDrinkAdjustment: it.factoryDrinkAdjustment ?? void 0,
                  unitFactoryPrice: it.unitFactoryPrice,
                  totalFactoryPrice: it.totalFactoryPrice
                };
              }),
              payments: dbBooking.payments.map((p) => ({
                id: p.id,
                bookingId: p.bookingId,
                amount: p.amount,
                method: p.method,
                date: p.date,
                notes: p.notes || "",
                receiptNumber: p.receiptNumber || void 0,
                recordedBy: p.recordedBy || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629",
                status: p.status || "VALID",
                createdAt: p.createdAt.toISOString(),
                cancelledBy: p.cancelledBy || void 0,
                cancelledAt: p.cancelledAt?.toISOString() || void 0,
                cancelReason: p.cancelReason || void 0
              })),
              factoryOrders: (dbBooking.factoryOrders || []).map((fo) => hydrateFactoryOrderFinancials(fo)),
              auditLogs: dbBooking.auditLogs.map((al) => ({
                id: al.id,
                bookingId: al.bookingId,
                bookingCode: al.bookingCode,
                action: al.action,
                performedBy: al.performedBy,
                details: al.details,
                timestamp: al.timestamp.toISOString()
              }))
            };
          }
        }
      } catch (err) {
        logServerError(err, "db.getBookingByPrimaryId.prisma");
      }
    }
    memoryDB = loadLocalDB();
    const b = memoryDB.bookings.find((item) => item.id === cleanId);
    if (!b) return null;
    return {
      ...b,
      payments: memoryDB.payments.filter((p) => p.bookingId === b.id),
      factoryOrders: memoryDB.factoryOrders.filter((fo) => fo.bookingId === b.id).map((fo) => hydrateFactoryOrderFinancials(
        fo,
        (memoryDB.factoryPayments || []).filter((p) => p.factoryOrderId ? p.factoryOrderId === fo.id : p.factoryOrderNumber === fo.orderNumber)
      )),
      auditLogs: memoryDB.auditLogs.filter((al) => al.bookingId === b.id)
    };
  },
  /**
   * Universal, resilient resolver for any booking identifier:
   * Accepts internal ID (UUID/timestamp ID) or external visible bookingCode (e.g. CLB-2026-XXXX).
   * Searches PostgreSQL primary key first, then unique bookingCode, then memoryDB,
   * guaranteeing consistent resolution across all admin operations without failing.
   */
  async resolveBookingAnyIdentifier(rawIdentifier) {
    if (!rawIdentifier || typeof rawIdentifier !== "string") return null;
    const clean = rawIdentifier.trim();
    if (!clean) return null;
    const byPrimary = await this.getBookingByPrimaryId(clean);
    if (byPrimary) return byPrimary;
    const byCodeOrId = await this.getBookingById(clean);
    if (byCodeOrId) return byCodeOrId;
    memoryDB = loadLocalDB();
    const mem = memoryDB.bookings.find((b) => b.id === clean || b.bookingCode === clean);
    if (mem) {
      return {
        ...mem,
        payments: memoryDB.payments.filter((p) => p.bookingId === mem.id),
        factoryOrders: memoryDB.factoryOrders.filter((fo) => fo.bookingId === mem.id),
        auditLogs: memoryDB.auditLogs.filter((al) => al.bookingId === mem.id)
      };
    }
    return null;
  },
  async trackBooking(bookingCode, verificationCode) {
    if (!bookingCode || typeof bookingCode !== "string" || !bookingCode.trim()) {
      return null;
    }
    const cleanCode = bookingCode.trim();
    const cleanVerify = (verificationCode || "").trim();
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const dbBookings = await client.booking.findMany({
            where: {
              OR: [
                { bookingCode: { equals: cleanCode, mode: "insensitive" } },
                { bookingCode: { contains: cleanCode, mode: "insensitive" } },
                { id: cleanCode }
              ]
            },
            include: {
              items: true,
              payments: true
            },
            take: 10
          });
          const matched = dbBookings.find((b2) => isBookingCodeMatch(b2.bookingCode, cleanCode));
          if (matched && isVerificationMatch(matched.securityCode, matched.customerPhone, cleanVerify)) {
            const hasVerify2 = Boolean(cleanVerify);
            return {
              id: matched.id,
              bookingCode: matched.bookingCode,
              securityCode: hasVerify2 ? matched.securityCode : "****",
              customerName: matched.customerName,
              customerPhone: hasVerify2 ? matched.customerPhone : matched.customerPhone.replace(/(\d{3})\d+(\d{3})/, "$1*****$2"),
              customerWhatsapp: matched.customerWhatsapp || matched.customerPhone,
              preferredContact: matched.preferredContact || "whatsapp",
              eventName: matched.eventName,
              eventDate: matched.eventDate,
              deliveryTime: matched.deliveryTime,
              deliveryGovernorate: matched.deliveryGovernorate,
              deliveryAddress: matched.deliveryAddress,
              notes: matched.notes || "",
              totalMealsCount: matched.totalMealsCount,
              totalDistributorPrice: matched.totalDistributorPrice,
              paidAmount: matched.paidAmount,
              remainingAmount: matched.remainingAmount,
              status: matched.status || "INITIAL",
              statusNotes: matched.statusNotes || "",
              version: matched.version,
              createdAt: matched.createdAt.toISOString(),
              updatedAt: matched.updatedAt.toISOString(),
              items: matched.items.map((it) => ({
                mealId: it.mealId || it.mealCode,
                mealCode: it.mealCode,
                mealName: it.mealName,
                category: it.category,
                ingredients: it.ingredients,
                quantity: it.quantity,
                drinkOption: it.drinkOption || "standard",
                baseDistributorPrice: it.baseDistributorPrice,
                unitDistributorPrice: it.unitDistributorPrice,
                totalDistributorPrice: it.totalDistributorPrice
              })),
              payments: matched.payments.map((p) => ({
                id: p.id,
                bookingId: p.bookingId,
                amount: p.amount,
                method: p.method,
                date: p.date,
                createdAt: p.createdAt.toISOString()
              })),
              factoryOrders: [],
              auditLogs: []
            };
          }
        }
      } catch (err) {
        logServerError(err, "db.trackBooking.prisma");
      }
    }
    memoryDB = loadLocalDB();
    const b = memoryDB.bookings.find(
      (item) => isBookingCodeMatch(item.bookingCode, cleanCode) && isVerificationMatch(item.securityCode, item.customerPhone, cleanVerify)
    );
    if (!b) return null;
    const hasVerify = Boolean(cleanVerify);
    const { totalFactoryPrice, profitMargin, items, ...publicBooking } = b;
    const publicItems = items.map((item) => {
      const { baseFactoryPrice, unitFactoryPrice, totalFactoryPrice: itemFactPrice, ...publicItem } = item;
      return publicItem;
    });
    return {
      ...publicBooking,
      securityCode: hasVerify ? b.securityCode : "****",
      customerPhone: hasVerify ? b.customerPhone : b.customerPhone.replace(/(\d{3})\d+(\d{3})/, "$1*****$2"),
      items: publicItems,
      payments: memoryDB.payments.filter((p) => p.bookingId === b.id).map((p) => ({
        id: p.id,
        bookingId: p.bookingId,
        amount: p.amount,
        method: p.method,
        date: p.date,
        createdAt: p.createdAt
      })),
      factoryOrders: [],
      auditLogs: []
    };
  },
  async updateBooking(id, updates, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    const cleanId = (id || "").trim();
    if (!cleanId) return null;
    if (cleanId.startsWith("CLB-")) {
      throw new Error("\u0639\u0645\u0644\u064A\u0627\u062A \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062D\u062C\u0632 \u062A\u062A\u0637\u0644\u0628 \u0627\u0644\u0645\u0639\u0631\u0641 \u0627\u0644\u0623\u0633\u0627\u0633\u064A bookingId \u0641\u0642\u0637 \u0648\u0644\u0627 \u062A\u0642\u0628\u0644 bookingCode \u0644\u0645\u0646\u0639 \u062A\u062F\u0627\u062E\u0644 \u0627\u0644\u0633\u062C\u0644\u0627\u062A.");
    }
    memoryDB = loadLocalDB();
    const idx = memoryDB.bookings.findIndex((b) => b.id === cleanId);
    if (idx === -1) return null;
    const current = memoryDB.bookings[idx];
    const prevStatus = current.status;
    let totalMealsCount = updates.totalMealsCount !== void 0 ? updates.totalMealsCount : current.totalMealsCount;
    let totalDistributor = updates.totalDistributorPrice !== void 0 ? updates.totalDistributorPrice : current.totalDistributorPrice;
    let totalFactory = updates.totalFactoryPrice !== void 0 ? updates.totalFactoryPrice : current.totalFactoryPrice || 0;
    if (updates.items && Array.isArray(updates.items)) {
      totalMealsCount = 0;
      totalDistributor = 0;
      totalFactory = 0;
      updates.items.forEach((it) => {
        totalMealsCount += it.quantity;
        totalDistributor += it.totalDistributorPrice;
        totalFactory += it.totalFactoryPrice || 0;
      });
    }
    const profitMargin = totalDistributor - totalFactory;
    const paidAmount = updates.paidAmount !== void 0 ? updates.paidAmount : current.paidAmount;
    const remainingAmount = Math.max(0, totalDistributor - paidAmount);
    const updated = {
      ...current,
      ...updates,
      totalMealsCount,
      totalDistributorPrice: totalDistributor,
      totalFactoryPrice: totalFactory,
      profitMargin,
      paidAmount,
      remainingAmount,
      version: current.version + 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryDB.bookings[idx] = updated;
    let auditDetail = `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062D\u062C\u0632 (\u0627\u0644\u0625\u0635\u062F\u0627\u0631 v${updated.version})`;
    if (updates.status && updates.status !== prevStatus) {
      auditDetail += `. \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062D\u0627\u0644\u0629 \u0645\u0646 ${prevStatus} \u0625\u0644\u0649 ${updates.status}`;
    }
    this.addAuditLog({
      bookingId: updated.id,
      bookingCode: updated.bookingCode,
      action: "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062D\u062C\u0632",
      performedBy,
      details: auditDetail
    });
    saveLocalDB(memoryDB);
    return updated;
  },
  async addPayment(data, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    const numAmount = Number(data.amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      throw new Error("\u0642\u064A\u0645\u0629 \u0627\u0644\u062F\u0641\u0639\u0629 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631");
    }
    const rawIdInput = (data.bookingId || data.bookingCode || "").trim();
    if (!rawIdInput) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062D\u062C\u0632 \u0623\u0648 \u0643\u0648\u062F \u0627\u0644\u062D\u062C\u0632 \u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u0641\u0639\u0629");
    }
    const cleanReceipt = (data.receiptNumber || "").trim();
    const paymentId = `pay-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
    const paymentDate = data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const paymentNotes = (data.notes || "").trim();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const auditLogId = `log-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
    let finalPayment = null;
    let finalBooking = null;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          try {
            await ensureColumnsReady(client);
          } catch {
          }
          await client.$transaction(async (tx) => {
            let dbBooking = null;
            const safeFindBooking = async (whereClause) => {
              try {
                return await tx.booking.findFirst({
                  where: whereClause,
                  include: { payments: true, items: true }
                });
              } catch (lookupErr) {
                if (String(lookupErr?.message || "").includes("booking_items.")) {
                  return await tx.booking.findFirst({
                    where: whereClause,
                    include: { payments: true }
                  });
                }
                throw lookupErr;
              }
            };
            if (data.bookingId && !data.bookingId.startsWith("CLB-")) {
              dbBooking = await safeFindBooking({ id: data.bookingId.trim() });
            }
            const targetCode = data.bookingCode?.trim() || (rawIdInput.startsWith("CLB-") ? rawIdInput : null);
            if (!dbBooking && targetCode) {
              dbBooking = await safeFindBooking({ bookingCode: targetCode });
            }
            if (!dbBooking) {
              dbBooking = await safeFindBooking({
                OR: [
                  { id: rawIdInput },
                  { bookingCode: rawIdInput },
                  ...data.bookingCode ? [{ bookingCode: data.bookingCode.trim() }] : [],
                  ...data.bookingId ? [{ id: data.bookingId.trim() }, { bookingCode: data.bookingId.trim() }] : []
                ]
              });
            }
            if (!dbBooking) {
              memoryDB = loadLocalDB();
              const memBooking2 = memoryDB.bookings.find(
                (b) => b.id === rawIdInput || b.bookingCode === rawIdInput || data.bookingCode && b.bookingCode === data.bookingCode.trim() || data.bookingId && (b.id === data.bookingId.trim() || b.bookingCode === data.bookingId.trim())
              );
              if (memBooking2) {
                dbBooking = await tx.booking.create({
                  data: {
                    id: memBooking2.id,
                    bookingCode: memBooking2.bookingCode,
                    securityCode: memBooking2.securityCode || "0000",
                    customerName: memBooking2.customerName,
                    customerPhone: memBooking2.customerPhone,
                    customerWhatsapp: memBooking2.customerWhatsapp || memBooking2.customerPhone,
                    preferredContact: memBooking2.preferredContact || "whatsapp",
                    eventName: memBooking2.eventName,
                    eventDate: memBooking2.eventDate,
                    deliveryTime: memBooking2.deliveryTime,
                    deliveryGovernorate: memBooking2.deliveryGovernorate,
                    deliveryAddress: memBooking2.deliveryAddress,
                    notes: memBooking2.notes || "",
                    totalMealsCount: memBooking2.totalMealsCount,
                    totalDistributorPrice: memBooking2.totalDistributorPrice,
                    totalFactoryPrice: memBooking2.totalFactoryPrice,
                    profitMargin: memBooking2.profitMargin,
                    paidAmount: memBooking2.paidAmount || 0,
                    remainingAmount: memBooking2.remainingAmount,
                    status: memBooking2.status || "INITIAL",
                    statusNotes: memBooking2.statusNotes,
                    isTest: memBooking2.isTest ?? false,
                    version: memBooking2.version || 1,
                    items: {
                      create: (memBooking2.items || []).map((it) => ({
                        mealId: it.mealId || it.mealCode,
                        mealCode: it.mealCode,
                        mealName: it.mealName,
                        category: it.category || "mix_box",
                        ingredients: it.ingredients || "",
                        quantity: it.quantity,
                        drinkOption: it.drinkOption || "standard",
                        orientalSweetOption: it.orientalSweetOption || "none",
                        baseDistributorPrice: it.baseDistributorPrice,
                        unitDistributorPrice: it.unitDistributorPrice,
                        totalDistributorPrice: it.totalDistributorPrice,
                        baseFactoryPrice: it.baseFactoryPrice,
                        unitFactoryPrice: it.unitFactoryPrice,
                        totalFactoryPrice: it.totalFactoryPrice
                      }))
                    }
                  },
                  include: { payments: true, items: true }
                });
              }
            }
            if (!dbBooking) {
              throw new Error(`\u062A\u0639\u0630\u0631 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0633\u062C\u0644 \u0627\u0644\u062D\u062C\u0632 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A (\u0627\u0644\u0645\u0639\u0631\u0651\u0641 \u0623\u0648 \u0627\u0644\u0643\u0648\u062F: "${rawIdInput}"). \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0635\u062D\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u062C\u0632.`);
            }
            const authoritativeBookingId = dbBooking.id;
            const authoritativeBookingCode = dbBooking.bookingCode;
            const activePayments = (dbBooking.payments || []).filter((p) => !p.notes || !p.notes.includes("[\u0645\u0644\u063A\u0627\u0629"));
            const currentPaid = activePayments.reduce((acc, p) => acc + Number(p.amount), 0);
            const currentRemaining = Math.max(0, dbBooking.totalDistributorPrice - currentPaid);
            if (numAmount > currentRemaining && !data.allowOverpayment) {
              throw new Error(`\u0642\u064A\u0645\u0629 \u0627\u0644\u062F\u0641\u0639\u0629 (${numAmount.toLocaleString("ar-EG")} \u062C) \u062A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0639\u0644\u0649 \u0627\u0644\u0639\u0645\u064A\u0644 (${currentRemaining.toLocaleString("ar-EG")} \u062C). \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u062F\u0641\u0639\u0629 \u062A\u0633\u0648\u064A\u0629 \u062E\u0627\u0635\u0629 \u0623\u0648 \u0632\u064A\u0627\u062F\u0629 \u0645\u0642\u0635\u0648\u062F\u0629\u060C \u064A\u0631\u062C\u0649 \u062A\u0641\u0639\u064A\u0644 \u062E\u064A\u0627\u0631 "\u0633\u0645\u0627\u062D \u0628\u0645\u0628\u0644\u063A \u062A\u0633\u0648\u064A\u0629 \u0632\u0627\u0626\u062F".`);
            }
            if (cleanReceipt) {
              const duplicate = activePayments.find((p) => p.receiptNumber && p.receiptNumber.trim() === cleanReceipt);
              if (duplicate) {
                throw new Error(`\u064A\u0648\u062C\u062F \u0628\u0627\u0644\u0641\u0639\u0644 \u062F\u0641\u0639\u0629 \u0645\u0633\u062C\u0644\u0629 \u0628\u0646\u0641\u0633 \u0631\u0642\u0645 \u0627\u0644\u0625\u064A\u0635\u0627\u0644 / \u0627\u0644\u0645\u0631\u062C\u0639 (${cleanReceipt}) \u0628\u0642\u064A\u0645\u0629 ${duplicate.amount} \u062C \u0644\u0647\u0630\u0627 \u0627\u0644\u062D\u062C\u0632.`);
              }
            }
            const newPaidAmount = currentPaid + numAmount;
            const newRemainingAmount = Math.max(0, dbBooking.totalDistributorPrice - newPaidAmount);
            const auditDetails = `\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u062F\u0641\u0639\u0629 \u0628\u0642\u064A\u0645\u0629 ${numAmount} \u062C.\u0645 \u0628\u0637\u0631\u064A\u0642\u0629 (${data.method}) \u0644\u0644\u062D\u062C\u0632 ${authoritativeBookingCode}. \u0627\u0644\u0645\u0633\u062F\u062F \u0627\u0644\u062C\u062F\u064A\u062F: ${newPaidAmount} \u062C\u060C \u0627\u0644\u0645\u062A\u0628\u0642\u064A: ${newRemainingAmount} \u062C. \u0645\u0631\u062C\u0639: ${cleanReceipt || "\u0644\u0627 \u064A\u0648\u062C\u062F"}.`;
            await tx.payment.create({
              data: {
                id: paymentId,
                amount: numAmount,
                method: data.method,
                date: paymentDate,
                notes: `[\u0633\u062C\u0644\u062A \u0628\u0648\u0627\u0633\u0637\u0629: ${performedBy}] ${paymentNotes}`.trim(),
                receiptNumber: cleanReceipt || null,
                booking: {
                  connect: { id: authoritativeBookingId }
                }
              }
            });
            let updatedBookingRow = null;
            try {
              updatedBookingRow = await tx.booking.update({
                where: { id: authoritativeBookingId },
                data: {
                  paidAmount: newPaidAmount,
                  remainingAmount: newRemainingAmount,
                  version: { increment: 1 },
                  updatedAt: /* @__PURE__ */ new Date()
                },
                include: {
                  items: true,
                  payments: { orderBy: { createdAt: "desc" } },
                  factoryOrders: true,
                  auditLogs: true
                }
              });
            } catch (updateErr) {
              if (String(updateErr?.message || "").includes("booking_items.")) {
                updatedBookingRow = await tx.booking.update({
                  where: { id: authoritativeBookingId },
                  data: {
                    paidAmount: newPaidAmount,
                    remainingAmount: newRemainingAmount,
                    version: { increment: 1 },
                    updatedAt: /* @__PURE__ */ new Date()
                  },
                  include: {
                    payments: { orderBy: { createdAt: "desc" } },
                    factoryOrders: true,
                    auditLogs: true
                  }
                });
              } else {
                throw updateErr;
              }
            }
            await tx.auditLog.create({
              data: {
                id: auditLogId,
                bookingId: authoritativeBookingId,
                bookingCode: authoritativeBookingCode,
                action: "\u062A\u0633\u062C\u064A\u0644 \u062F\u0641\u0639\u0629 \u0645\u0627\u0644\u064A\u0629",
                performedBy,
                details: auditDetails
              }
            });
            finalPayment = {
              id: paymentId,
              bookingId: authoritativeBookingId,
              amount: numAmount,
              method: data.method,
              date: paymentDate,
              notes: paymentNotes,
              receiptNumber: cleanReceipt,
              recordedBy: performedBy,
              status: "VALID",
              createdAt: now
            };
            finalBooking = {
              id: updatedBookingRow.id,
              bookingCode: updatedBookingRow.bookingCode,
              securityCode: updatedBookingRow.securityCode,
              customerName: updatedBookingRow.customerName,
              customerPhone: updatedBookingRow.customerPhone,
              customerWhatsapp: updatedBookingRow.customerWhatsapp || void 0,
              preferredContact: updatedBookingRow.preferredContact,
              eventName: updatedBookingRow.eventName,
              eventDate: updatedBookingRow.eventDate,
              deliveryTime: updatedBookingRow.deliveryTime,
              deliveryGovernorate: updatedBookingRow.deliveryGovernorate,
              deliveryAddress: updatedBookingRow.deliveryAddress,
              notes: updatedBookingRow.notes || "",
              totalMealsCount: updatedBookingRow.totalMealsCount,
              totalDistributorPrice: updatedBookingRow.totalDistributorPrice,
              totalFactoryPrice: updatedBookingRow.totalFactoryPrice ?? void 0,
              profitMargin: updatedBookingRow.profitMargin ?? void 0,
              paidAmount: updatedBookingRow.paidAmount,
              remainingAmount: updatedBookingRow.remainingAmount,
              status: updatedBookingRow.status,
              statusNotes: updatedBookingRow.statusNotes || "",
              isTest: updatedBookingRow.isTest,
              version: updatedBookingRow.version,
              createdAt: updatedBookingRow.createdAt.toISOString(),
              updatedAt: updatedBookingRow.updatedAt.toISOString(),
              items: (updatedBookingRow.items || dbBooking?.items || []).map((it) => ({
                mealId: it.mealId || it.mealCode,
                mealCode: it.mealCode,
                mealName: it.mealName,
                category: it.category,
                ingredients: it.ingredients,
                quantity: it.quantity,
                drinkOption: it.drinkOption || "standard",
                orientalSweetOption: it.orientalSweetOption || "none",
                baseDistributorPrice: it.baseDistributorPrice,
                unitDistributorPrice: it.unitDistributorPrice,
                totalDistributorPrice: it.totalDistributorPrice,
                baseFactoryPrice: it.baseFactoryPrice ?? void 0,
                unitFactoryPrice: it.unitFactoryPrice ?? void 0,
                totalFactoryPrice: it.totalFactoryPrice ?? void 0
              })),
              payments: (updatedBookingRow.payments || []).map((p) => ({
                id: p.id,
                bookingId: p.bookingId,
                amount: p.amount,
                method: p.method,
                date: p.date,
                notes: p.notes || "",
                receiptNumber: p.receiptNumber || "",
                status: p.notes && p.notes.includes("[\u0645\u0644\u063A\u0627\u0629") ? "CANCELLED" : "VALID",
                createdAt: p.createdAt.toISOString()
              }))
            };
          });
        }
      } catch (err) {
        logServerError(err, "db.addPayment.prisma");
        throw new Error(`\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u062F\u0641\u0639\u0629 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A: ${err?.message || "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A"}`);
      }
    }
    memoryDB = loadLocalDB();
    const memBooking = memoryDB.bookings.find(
      (b) => b.id === rawIdInput || b.bookingCode === rawIdInput || data.bookingCode && b.bookingCode === data.bookingCode.trim() || data.bookingId && (b.id === data.bookingId.trim() || b.bookingCode === data.bookingId.trim())
    );
    if (!finalBooking && !memBooking) {
      throw new Error(`\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F (\u0627\u0644\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0645\u0637\u0644\u0648\u0628: "${rawIdInput}"). \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0635\u062D\u0629 \u0631\u0642\u0645 \u0623\u0648 \u0643\u0648\u062F \u0627\u0644\u062D\u062C\u0632.`);
    }
    const targetMemBooking = memBooking || finalBooking;
    const authoritativeId = targetMemBooking.id;
    const authoritativeCode = targetMemBooking.bookingCode;
    if (!finalPayment) {
      const existingPayments = (memoryDB.payments || []).filter(
        (p) => (p.bookingId === authoritativeId || p.bookingId === authoritativeCode) && p.status !== "CANCELLED" && (!p.notes || !p.notes.includes("[\u0645\u0644\u063A\u0627\u0629"))
      );
      const currentPaid = existingPayments.reduce((acc, p) => acc + Number(p.amount), 0);
      const currentRemaining = Math.max(0, targetMemBooking.totalDistributorPrice - currentPaid);
      if (numAmount > currentRemaining && !data.allowOverpayment) {
        throw new Error(`\u0642\u064A\u0645\u0629 \u0627\u0644\u062F\u0641\u0639\u0629 (${numAmount.toLocaleString("ar-EG")} \u062C) \u062A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0639\u0644\u0649 \u0627\u0644\u0639\u0645\u064A\u0644 (${currentRemaining.toLocaleString("ar-EG")} \u062C). \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u062F\u0641\u0639\u0629 \u062A\u0633\u0648\u064A\u0629 \u062E\u0627\u0635\u0629 \u0623\u0648 \u0632\u064A\u0627\u062F\u0629 \u0645\u0642\u0635\u0648\u062F\u0629\u060C \u064A\u0631\u062C\u0649 \u062A\u0641\u0639\u064A\u0644 \u062E\u064A\u0627\u0631 "\u0633\u0645\u0627\u062D \u0628\u0645\u0628\u0644\u063A \u062A\u0633\u0648\u064A\u0629 \u0632\u0627\u0626\u062F".`);
      }
      if (cleanReceipt) {
        const duplicate = existingPayments.find((p) => p.receiptNumber && p.receiptNumber.trim() === cleanReceipt);
        if (duplicate) {
          throw new Error(`\u064A\u0648\u062C\u062F \u0628\u0627\u0644\u0641\u0639\u0644 \u062F\u0641\u0639\u0629 \u0645\u0633\u062C\u0644\u0629 \u0628\u0646\u0641\u0633 \u0631\u0642\u0645 \u0627\u0644\u0625\u064A\u0635\u0627\u0644 / \u0627\u0644\u0645\u0631\u062C\u0639 (${cleanReceipt}) \u0628\u0642\u064A\u0645\u0629 ${duplicate.amount} \u062C \u0644\u0647\u0630\u0627 \u0627\u0644\u062D\u062C\u0632.`);
        }
      }
      const newPaidAmount = currentPaid + numAmount;
      const newRemainingAmount = Math.max(0, targetMemBooking.totalDistributorPrice - newPaidAmount);
      finalPayment = {
        id: paymentId,
        bookingId: authoritativeId,
        amount: numAmount,
        method: data.method,
        date: paymentDate,
        notes: paymentNotes,
        receiptNumber: cleanReceipt,
        recordedBy: performedBy,
        status: "VALID",
        createdAt: now
      };
      finalBooking = {
        ...targetMemBooking,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        version: targetMemBooking.version + 1,
        updatedAt: now,
        payments: [finalPayment, ...existingPayments]
      };
    }
    if (!finalBooking || !finalPayment) {
      throw new Error("\u0641\u0634\u0644 \u0625\u062A\u0645\u0627\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u0641\u0639\u0629 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0623\u0648 \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u062F\u0627\u0626\u0645");
    }
    const memBookingIdx = memoryDB.bookings.findIndex((b) => b.id === authoritativeId || b.bookingCode === authoritativeCode);
    if (memBookingIdx !== -1) {
      memoryDB.bookings[memBookingIdx].paidAmount = finalBooking.paidAmount;
      memoryDB.bookings[memBookingIdx].remainingAmount = finalBooking.remainingAmount;
      memoryDB.bookings[memBookingIdx].version = finalBooking.version;
      memoryDB.bookings[memBookingIdx].updatedAt = now;
    }
    if (!memoryDB.payments.some((p) => p.id === finalPayment.id)) {
      memoryDB.payments.unshift(finalPayment);
    }
    memoryDB.auditLogs.unshift({
      id: auditLogId,
      bookingId: authoritativeId,
      bookingCode: authoritativeCode,
      action: "\u062A\u0633\u062C\u064A\u0644 \u062F\u0641\u0639\u0629 \u0645\u0627\u0644\u064A\u0629",
      performedBy,
      details: `\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u062F\u0641\u0639\u0629 \u0628\u0642\u064A\u0645\u0629 ${numAmount} \u062C.\u0645 \u0628\u0637\u0631\u064A\u0642\u0629 (${data.method}) \u0644\u0644\u062D\u062C\u0632 ${authoritativeCode}. \u0627\u0644\u0645\u0633\u062F\u062F \u0627\u0644\u062C\u062F\u064A\u062F: ${finalBooking.paidAmount} \u062C\u060C \u0627\u0644\u0645\u062A\u0628\u0642\u064A: ${finalBooking.remainingAmount} \u062C. \u0645\u0631\u062C\u0639: ${cleanReceipt || "\u0644\u0627 \u064A\u0648\u062C\u062F"}.`,
      timestamp: now
    });
    saveLocalDB(memoryDB);
    return {
      payment: finalPayment,
      booking: finalBooking
    };
  },
  async cancelPayment(paymentId, reason, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    if (!reason || !reason.trim()) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0633\u0628\u0628 \u0625\u0644\u063A\u0627\u0621 \u0623\u0648 \u0639\u0643\u0633 \u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0644\u062A\u0648\u062B\u064A\u0642\u0647\u0627 \u0641\u064A \u0633\u062C\u0644 \u0627\u0644\u062A\u062F\u0642\u064A\u0642");
    }
    const cleanPaymentId = (paymentId || "").trim();
    if (!cleanPaymentId) {
      throw new Error("\u0645\u0639\u0631\u0641 \u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0645\u0637\u0644\u0648\u0628");
    }
    let payment = null;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const dbPayment = await client.payment.findUnique({
            where: { id: cleanPaymentId }
          });
          if (dbPayment) {
            payment = {
              id: dbPayment.id,
              bookingId: dbPayment.bookingId,
              amount: dbPayment.amount,
              method: dbPayment.method,
              date: dbPayment.date,
              notes: dbPayment.notes || "",
              receiptNumber: dbPayment.receiptNumber || "",
              status: dbPayment.notes && dbPayment.notes.includes("[\u0645\u0644\u063A\u0627\u0629") ? "CANCELLED" : "VALID",
              createdAt: dbPayment.createdAt.toISOString()
            };
          }
        }
      } catch (err) {
        logServerError(err, "db.cancelPayment.findPayment.prisma");
      }
    }
    if (!payment) {
      memoryDB = loadLocalDB();
      const p = memoryDB.payments.find((item) => item.id === cleanPaymentId);
      if (p) payment = p;
    }
    if (!payment) {
      throw new Error(`\u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629 (\u0627\u0644\u0645\u0639\u0631\u0651\u0641: ${cleanPaymentId})`);
    }
    if (payment.status === "CANCELLED" || payment.notes && payment.notes.includes("[\u0645\u0644\u063A\u0627\u0629")) {
      throw new Error("\u0647\u0630\u0647 \u0627\u0644\u062F\u0641\u0639\u0629 \u0645\u0644\u063A\u0627\u0629 \u0628\u0627\u0644\u0641\u0639\u0644 \u0645\u0633\u0628\u0642\u0627\u064B");
    }
    const booking = await this.getBookingById(payment.bookingId);
    if (!booking) {
      throw new Error(`\u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0631\u062A\u0628\u0637 \u0628\u0647\u0630\u0647 \u0627\u0644\u062F\u0641\u0639\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F (\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062D\u062C\u0632: ${payment.bookingId})`);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const updatedNotes = `${payment.notes || ""} [\u0645\u0644\u063A\u0627\u0629 \u0628\u0648\u0627\u0633\u0637\u0629 ${performedBy} \u0641\u064A ${(/* @__PURE__ */ new Date()).toLocaleString("ar-EG")} - \u0633\u0628\u0628: ${reason.trim()}]`.trim();
    const auditLogId = `log-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
    const remainingPayments = (booking.payments || []).filter((p) => p.id !== payment.id && p.status !== "CANCELLED");
    const newPaidAmount = remainingPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const newRemainingAmount = Math.max(0, booking.totalDistributorPrice - newPaidAmount);
    const cancelDetails = `\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062F\u0641\u0639\u0629 \u0628\u0642\u064A\u0645\u0629 ${payment.amount} \u062C.\u0645 \u0644\u0644\u062D\u062C\u0632 ${booking.bookingCode}. \u0627\u0644\u0633\u0628\u0628: ${reason.trim()}. \u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u0645\u0633\u062F\u062F \u0627\u0644\u062C\u062F\u064A\u062F: ${newPaidAmount} \u062C\u060C \u0648\u0627\u0644\u0645\u062A\u0628\u0642\u064A: ${newRemainingAmount} \u062C.`;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: { notes: updatedNotes }
            });
            await tx.booking.update({
              where: { id: booking.id },
              data: {
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                version: { increment: 1 },
                updatedAt: /* @__PURE__ */ new Date()
              }
            });
            await tx.auditLog.create({
              data: {
                id: auditLogId,
                bookingId: booking.id,
                bookingCode: booking.bookingCode,
                action: "\u0625\u0644\u063A\u0627\u0621 \u0648\u0639\u0643\u0633 \u062F\u0641\u0639\u0629 \u0645\u0627\u0644\u064A\u0629",
                performedBy,
                details: cancelDetails
              }
            });
          });
        }
      } catch (err) {
        logServerError(err, "db.cancelPayment.prisma");
        throw new Error(`\u0641\u0634\u0644 \u0625\u0644\u063A\u0627\u0621 \u0648\u0639\u0643\u0633 \u0627\u0644\u062F\u0641\u0639\u0629 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A: ${err?.message || "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A"}`);
      }
    }
    memoryDB = loadLocalDB();
    const memPayment = memoryDB.payments.find((p) => p.id === payment.id);
    if (memPayment) {
      memPayment.status = "CANCELLED";
      memPayment.cancelledBy = performedBy;
      memPayment.cancelledAt = now;
      memPayment.cancelReason = reason.trim();
      memPayment.notes = updatedNotes;
    }
    const memBooking = memoryDB.bookings.find((b) => b.id === booking.id);
    if (memBooking) {
      memBooking.paidAmount = newPaidAmount;
      memBooking.remainingAmount = newRemainingAmount;
      memBooking.version += 1;
      memBooking.updatedAt = now;
    }
    memoryDB.auditLogs.unshift({
      id: auditLogId,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      action: "\u0625\u0644\u063A\u0627\u0621 \u0648\u0639\u0643\u0633 \u062F\u0641\u0639\u0629 \u0645\u0627\u0644\u064A\u0629",
      performedBy,
      details: cancelDetails,
      timestamp: now
    });
    saveLocalDB(memoryDB);
    const freshBooking = await this.getBookingByPrimaryId(booking.id) || await this.getBookingById(booking.id);
    return {
      success: true,
      payment: {
        ...payment,
        status: "CANCELLED",
        cancelledBy: performedBy,
        cancelledAt: now,
        cancelReason: reason.trim(),
        notes: updatedNotes
      },
      booking: freshBooking || {
        ...booking,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount
      }
    };
  },
  async updateBookingStatus(id, newStatus, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629", statusNotes) {
    const allowedStatuses = [
      "INITIAL",
      "PENDING_CONFIRMATION",
      "CONFIRMED",
      "IN_PRODUCTION",
      "READY_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED"
    ];
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error(`\u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629: ${newStatus}`);
    }
    const cleanId = (id || "").trim();
    if (!cleanId) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0645\u0639\u0631\u0641 \u0627\u0644\u062D\u062C\u0632 \u0623\u0648 \u0643\u0648\u062F \u0627\u0644\u062D\u062C\u0632");
    }
    const booking = await this.resolveBookingAnyIdentifier(cleanId);
    if (!booking) {
      throw new Error(`\u062A\u0639\u0630\u0631 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0633\u062C\u0644 \u0627\u0644\u062D\u062C\u0632 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A (\u0627\u0644\u0645\u0639\u0631\u0651\u0641 \u0623\u0648 \u0627\u0644\u0643\u0648\u062F: "${cleanId}")`);
    }
    if (newStatus === "CONFIRMED" && booking.totalMealsCount < 50) {
      throw new Error(`\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u0644\u0637\u0644\u0628 50 \u0648\u062C\u0628\u0629. \u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0623\u0643\u064A\u062F \u062D\u062C\u0632 \u064A\u0642\u0644 \u0625\u062C\u0645\u0627\u0644\u064A \u0648\u062C\u0628\u0627\u062A\u0647 \u0639\u0646 50 \u0648\u062C\u0628\u0629 (\u0627\u0644\u0639\u062F\u062F \u0627\u0644\u062D\u0627\u0644\u064A: ${booking.totalMealsCount} \u0648\u062C\u0628\u0629).`);
    }
    const prevStatus = booking.status;
    const newVersion = booking.version + 1;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const noteText = statusNotes && statusNotes.trim() ? statusNotes.trim() : `\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062D\u0627\u0644\u0629 \u0645\u0646 (${prevStatus}) \u0625\u0644\u0649 (${newStatus}) \u0628\u0648\u0627\u0633\u0637\u0629 (${performedBy}) \u0641\u064A ${(/* @__PURE__ */ new Date()).toLocaleString("ar-EG")}.`;
    const updatedBooking = {
      ...booking,
      status: newStatus,
      statusNotes: noteText,
      version: newVersion,
      updatedAt: now
    };
    memoryDB = loadLocalDB();
    const memIdx = memoryDB.bookings.findIndex((b) => b.id === booking.id || b.bookingCode === booking.bookingCode);
    if (memIdx !== -1) {
      memoryDB.bookings[memIdx] = updatedBooking;
    } else {
      memoryDB.bookings.unshift(updatedBooking);
    }
    if (newStatus === "CANCELLED") {
      const activeOrders = (memoryDB.factoryOrders || []).filter(
        (fo) => (fo.bookingId === booking.id || fo.bookingCode === booking.bookingCode) && fo.status !== "CANCELLED" && fo.status !== "COMPLETED"
      );
      for (const fo of activeOrders) {
        fo.status = "CANCELLED";
        fo.updatedAt = now;
      }
    }
    saveLocalDB(memoryDB);
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.booking.update({
            where: { id: booking.id },
            data: {
              status: newStatus,
              statusNotes: noteText,
              version: newVersion,
              updatedAt: /* @__PURE__ */ new Date()
            }
          });
          if (newStatus === "CANCELLED") {
            await client.factoryOrder.updateMany({
              where: {
                bookingId: booking.id,
                status: { notIn: ["CANCELLED", "COMPLETED"] }
              },
              data: {
                status: "CANCELLED",
                updatedAt: /* @__PURE__ */ new Date()
              }
            }).catch(() => {
            });
          }
        }
      } catch (err) {
        logServerError(err, "db.updateBookingStatus.prisma");
      }
    }
    await this.addAuditLog({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      action: "\u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u062C\u0632",
      performedBy,
      details: `\u0642\u0627\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u064A (${performedBy}) \u0628\u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u062C\u0632 ${booking.bookingCode} \u0645\u0646 (${prevStatus}) \u0625\u0644\u0649 (${newStatus}). \u0645\u0644\u0627\u062D\u0638\u0627\u062A: ${noteText}.`
    });
    return updatedBooking;
  },
  async getFactoryOrderPreview(bookingId) {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      throw new Error("\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0644\u062D\u0633\u0627\u0628 \u0645\u0639\u0627\u064A\u0646\u0629 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639");
    }
    const meals = await this.getMeals(true);
    const mealsMap = new Map(meals.map((m) => [m.code, m]));
    let totalFactoryCost = 0;
    const previewItems = booking.items.map((item) => {
      const meal = mealsMap.get(item.mealCode);
      const baseFactPrice = meal?.factoryPrice ?? item.baseFactoryPrice ?? 0;
      const hasJuice = meal ? meal.hasJuice : true;
      let sweetDelta = 0;
      let sweetLabel = "\u0628\u062F\u0648\u0646 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A";
      const sweetOpt = item.orientalSweetOption || "none";
      if (sweetOpt === "add_with_juice") {
        sweetDelta = 10;
        sweetLabel = "\u0625\u0636\u0627\u0641\u0629 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A \u0645\u0639 \u0627\u0644\u0639\u0635\u064A\u0631 (+10 \u062C \u0644\u0644\u0645\u0635\u0646\u0639)";
      } else if (sweetOpt === "replace_juice") {
        sweetDelta = 5;
        sweetLabel = "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A (+5 \u062C \u0644\u0644\u0645\u0635\u0646\u0639)";
      }
      let factoryDrinkDelta = 0;
      let drinkLabel = "\u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A";
      let specialInstructions = "\u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A";
      if (sweetOpt === "replace_juice") {
        drinkLabel = "\u0627\u0644\u0639\u0635\u064A\u0631 \u0645\u0633\u062A\u0628\u062F\u0644 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A";
        specialInstructions = "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A \u062D\u0644\u0648\u064A\u0627\u062A";
      } else if (hasJuice) {
        if (item.drinkOption === "pepsi") {
          factoryDrinkDelta = FACTORY_PEPSI_ACCOUNTING.netAdjustment;
          drinkLabel = "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0643\u0627\u0646\u0632 \u0628\u064A\u0628\u0633\u064A";
          specialInstructions = "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0643\u0627\u0646\u0632 \u0628\u064A\u0628\u0633\u064A";
        } else if (item.drinkOption === "no_juice") {
          factoryDrinkDelta = -FACTORY_PEPSI_ACCOUNTING.totalJuiceDeduction;
          drinkLabel = "\u0628\u062F\u0648\u0646 \u0639\u0635\u064A\u0631";
          specialInstructions = "\u0628\u062F\u0648\u0646 \u0639\u0635\u064A\u0631";
        } else {
          drinkLabel = "\u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A";
          specialInstructions = "\u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A";
        }
      } else {
        drinkLabel = "\u0628\u062F\u0648\u0646 \u0639\u0635\u064A\u0631 (\u0623\u0635\u0644\u064A\u0629)";
        specialInstructions = "\u0648\u062C\u0628\u0629 \u0623\u0635\u0644\u064A\u0629 \u0628\u062F\u0648\u0646 \u0639\u0635\u064A\u0631";
      }
      const unitFactPrice = Math.max(0, baseFactPrice + factoryDrinkDelta + sweetDelta);
      const totalFactItemPrice = unitFactPrice * item.quantity;
      totalFactoryCost += totalFactItemPrice;
      return {
        mealCode: item.mealCode,
        mealName: meal?.name || item.mealName,
        quantity: item.quantity,
        drinkOption: item.drinkOption,
        drinkLabel,
        orientalSweetOption: sweetOpt,
        orientalSweetLabel: sweetLabel,
        orientalSweetFactoryAdjustment: sweetDelta,
        ingredients: meal?.ingredients || item.ingredients,
        baseFactoryPrice: baseFactPrice,
        factoryDrinkAdjustment: factoryDrinkDelta,
        unitFactoryPrice: unitFactPrice,
        totalFactoryPrice: totalFactItemPrice,
        specialInstructions
      };
    });
    const existingOrders = (booking.factoryOrders || []).concat(
      memoryDB.factoryOrders.filter((fo) => fo.bookingId === booking.id)
    );
    const uniqueExisting = Array.from(new Map(existingOrders.map((o) => [o.orderNumber, o])).values());
    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      eventName: booking.eventName,
      eventDate: booking.eventDate,
      deliveryTime: booking.deliveryTime,
      deliveryLocation: `${booking.deliveryGovernorate} - ${booking.deliveryAddress}`,
      totalMealsCount: booking.totalMealsCount,
      totalFactoryCost,
      items: previewItems,
      existingOrdersCount: uniqueExisting.length,
      existingOrders: uniqueExisting,
      packagingNotes: (booking.notes || "").trim()
    };
  },
  async createFactoryOrder(bookingId, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629", options) {
    const cleanId = (bookingId || "").trim();
    if (!cleanId) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0639\u0631\u0641 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0644\u0644\u062D\u062C\u0632 (bookingId) \u0644\u0625\u0635\u062F\u0627\u0631 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639");
    }
    const booking = await this.getBookingByPrimaryId(cleanId) || await this.getBookingById(cleanId);
    if (!booking) {
      throw new Error("\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0644\u0625\u0635\u062F\u0627\u0631 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639");
    }
    if (booking.totalMealsCount < 50) {
      throw new Error(`\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0635\u062F\u0627\u0631 \u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0644\u0644\u0645\u0635\u0646\u0639 \u0644\u062D\u062C\u0632 \u064A\u0642\u0644 \u0625\u062C\u0645\u0627\u0644\u064A \u0648\u062C\u0628\u0627\u062A\u0647 \u0639\u0646 50 \u0648\u062C\u0628\u0629 (\u0627\u0644\u0639\u062F\u062F \u0627\u0644\u062D\u0627\u0644\u064A: ${booking.totalMealsCount} \u0648\u062C\u0628\u0629). \u064A\u0631\u062C\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u062A\u0639\u062F\u064A\u0644 \u0643\u0645\u064A\u0627\u062A \u0627\u0644\u062D\u062C\u0632 \u0625\u0644\u0649 50 \u0648\u062C\u0628\u0629 \u0641\u0623\u0643\u062B\u0631 \u0623\u0648\u0644\u0627\u064B.`);
    }
    memoryDB = loadLocalDB();
    const existingOrders = (booking.factoryOrders || []).concat(
      memoryDB.factoryOrders.filter((fo) => fo.bookingId === booking.id)
    );
    const uniqueExisting = Array.from(new Map(existingOrders.map((o) => [o.orderNumber, o])).values());
    if (uniqueExisting.length > 0 && !options?.forceNewVersion) {
      const latest = uniqueExisting[uniqueExisting.length - 1];
      throw new Error(`\u064A\u0648\u062C\u062F \u0628\u0627\u0644\u0641\u0639\u0644 \u0623\u0645\u0631 \u0645\u0635\u0646\u0639 \u0635\u0627\u062F\u0631 \u0644\u0647\u0630\u0627 \u0627\u0644\u062D\u062C\u0632 (${latest.orderNumber} - \u0627\u0644\u0625\u0635\u062F\u0627\u0631 v${latest.version}). \u0625\u0630\u0627 \u062A\u0645 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062D\u062C\u0632 \u0648\u062A\u0631\u064A\u062F \u0625\u0635\u062F\u0627\u0631 \u0646\u0633\u062E\u0629 \u0639\u0645\u0644 \u062C\u062F\u064A\u062F\u0629 \u0644\u0644\u0645\u0635\u0646\u0639\u060C \u064A\u0631\u062C\u0649 \u062A\u0623\u0643\u064A\u062F \u062E\u064A\u0627\u0631 "\u0625\u0635\u062F\u0627\u0631 \u0646\u0633\u062E\u0629 \u0639\u0645\u0644 \u062C\u062F\u064A\u062F\u0629".`);
    }
    const version = options?.targetVersion !== void 0 ? options.targetVersion : uniqueExisting.length + 1;
    memoryDB.factoryOrderCounter = Math.max(memoryDB.factoryOrderCounter || 100, 100);
    do {
      memoryDB.factoryOrderCounter += 1;
    } while (memoryDB.factoryOrders.some((o) => o.orderNumber === `FO-2026-${String(memoryDB.factoryOrderCounter).padStart(3, "0")}`) || memoryDB.factoryPayments.some((p) => p.factoryOrderNumber === `FO-2026-${String(memoryDB.factoryOrderCounter).padStart(3, "0")}`));
    const orderNumber = `FO-2026-${String(memoryDB.factoryOrderCounter).padStart(3, "0")}`;
    const preview = await this.getFactoryOrderPreview(bookingId);
    const factoryOrder = {
      id: `fo-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      orderNumber,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      version,
      status: "READY_TO_SEND",
      eventDate: booking.eventDate,
      deliveryTime: booking.deliveryTime,
      deliveryLocation: preview.deliveryLocation,
      factoryCostTotal: preview.totalFactoryCost,
      paidToFactoryAmount: 0,
      remainingToFactoryAmount: preview.totalFactoryCost,
      paymentStatus: "UNPAID",
      payments: [],
      items: preview.items,
      packagingNotes: preview.packagingNotes,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryDB.factoryOrders.unshift(factoryOrder);
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.factoryOrder.create({
            data: {
              id: factoryOrder.id,
              orderNumber: factoryOrder.orderNumber,
              bookingId: factoryOrder.bookingId,
              bookingCode: factoryOrder.bookingCode,
              version: factoryOrder.version,
              status: factoryOrder.status,
              eventDate: factoryOrder.eventDate,
              deliveryTime: factoryOrder.deliveryTime,
              deliveryLocation: factoryOrder.deliveryLocation,
              itemsJson: JSON.stringify(factoryOrder.items),
              packagingNotes: factoryOrder.packagingNotes,
              factoryCostTotal: factoryOrder.factoryCostTotal,
              paidAmount: 0,
              remainingAmount: factoryOrder.remainingToFactoryAmount,
              paymentStatus: "UNPAID"
            }
          });
          if (!options?.preserveBookingStatus) {
            await client.booking.update({
              where: { id: booking.id },
              data: {
                status: "IN_PRODUCTION",
                statusNotes: `\u062A\u0645 \u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u062D\u062C\u0632 \u0644\u0644\u0645\u0635\u0646\u0639 \u0648\u0625\u0635\u062F\u0627\u0631 \u0623\u0645\u0631 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 ${orderNumber} (\u0627\u0644\u0625\u0635\u062F\u0627\u0631 v${version})`,
                updatedAt: /* @__PURE__ */ new Date()
              }
            });
          }
        }
      } catch (err) {
        logServerError(err, "db.createFactoryOrder.prisma");
      }
    }
    const memBooking = memoryDB.bookings.find((b) => b.id === booking.id);
    if (memBooking && !options?.preserveBookingStatus) {
      memBooking.status = "IN_PRODUCTION";
      memBooking.statusNotes = `\u062A\u0645 \u0625\u0635\u062F\u0627\u0631 \u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639 \u0631\u0642\u0645 ${orderNumber} (\u0627\u0644\u0625\u0635\u062F\u0627\u0631 v${version})`;
      memBooking.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    const pepsiAdjustedItems = preview.items.filter(
      (it) => it.drinkOption === "pepsi" && (it.factoryDrinkAdjustment ?? 0) === FACTORY_PEPSI_ACCOUNTING.netAdjustment
    );
    const pepsiQty = pepsiAdjustedItems.reduce((acc, it) => acc + it.quantity, 0);
    const pepsiAuditNote = pepsiQty > 0 ? ` [\u062A\u0645 \u062A\u0637\u0628\u064A\u0642 \u0645\u0639\u0627\u062F\u0644\u0629 \u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0627\u0644\u0628\u064A\u0628\u0633\u064A \u0644\u0644\u0645\u0635\u0646\u0639: -5 \u062C \u0639\u0635\u064A\u0631 -1 \u062C \u0639\u0628\u0648\u0629 +10 \u062C \u0643\u0627\u0646\u0632 = +4 \u062C \u0639\u0644\u0649 ${pepsiQty} \u0648\u062C\u0628\u0629]` : "";
    const auditText = options?.customAuditDetails ? options.customAuditDetails : `\u062A\u0645 \u0625\u0635\u062F\u0627\u0631 \u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639 ${orderNumber} (\u0627\u0644\u0625\u0635\u062F\u0627\u0631 v${version}) \u0628\u0625\u062C\u0645\u0627\u0644\u064A ${booking.totalMealsCount} \u0648\u062C\u0628\u0629 \u0648\u062A\u0643\u0644\u0641\u0629 \u0645\u0635\u0646\u0639 ${preview.totalFactoryCost} \u062C (\u062E\u0627\u0644\u064D \u062A\u0645\u0627\u0645\u0627\u064B \u0645\u0646 \u0647\u0648\u0627\u0645\u0634 \u0631\u0628\u062D \u0627\u0644\u0645\u0648\u0632\u0639).${pepsiAuditNote}`;
    this.addAuditLog({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      action: "\u0625\u0635\u062F\u0627\u0631 \u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639",
      performedBy,
      details: auditText
    });
    saveLocalDB(memoryDB);
    return factoryOrder;
  },
  async getFactoryOrders() {
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          let dbOrders = [];
          try {
            dbOrders = await client.factoryOrder.findMany({
              include: {
                payments: {
                  orderBy: { createdAt: "desc" }
                }
              },
              orderBy: { createdAt: "desc" }
            });
          } catch (queryErr) {
            if (String(queryErr?.message || "").includes("paymentType")) {
              await ensureColumnsReady(client).catch(() => {
              });
              dbOrders = await client.factoryOrder.findMany({
                include: {
                  payments: {
                    orderBy: { createdAt: "desc" }
                  }
                },
                orderBy: { createdAt: "desc" }
              });
            } else {
              throw queryErr;
            }
          }
          if (dbOrders && dbOrders.length > 0) {
            return dbOrders.map((fo) => hydrateFactoryOrderFinancials(fo));
          }
        }
      } catch (err) {
        logServerError(err, "db.getFactoryOrders.prisma");
      }
    }
    memoryDB = loadLocalDB();
    if (!memoryDB.factoryPayments) memoryDB.factoryPayments = [];
    return memoryDB.factoryOrders.map((fo) => {
      const paymentsList = memoryDB.factoryPayments.filter(
        (p) => p.factoryOrderId ? p.factoryOrderId === fo.id : p.factoryOrderNumber === fo.orderNumber
      );
      return hydrateFactoryOrderFinancials(fo, paymentsList);
    });
  },
  async getFactoryOrderById(idOrNumber) {
    const clean = (idOrNumber || "").trim();
    if (!clean) return null;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const fo = await client.factoryOrder.findFirst({
            where: {
              OR: [{ id: clean }, { orderNumber: clean }]
            },
            include: {
              payments: {
                orderBy: { createdAt: "desc" }
              }
            }
          });
          if (fo) {
            return hydrateFactoryOrderFinancials(fo);
          }
        }
      } catch (err) {
        if (String(err?.message || "").includes("paymentType")) {
          try {
            const client = getPrismaClient();
            if (client) {
              await ensureColumnsReady(client);
              const fo = await client.factoryOrder.findFirst({
                where: { OR: [{ id: clean }, { orderNumber: clean }] },
                include: { payments: { orderBy: { createdAt: "desc" } } }
              });
              if (fo) return hydrateFactoryOrderFinancials(fo);
            }
          } catch {
          }
        }
        logServerError(err, "db.getFactoryOrderById.prisma");
      }
    }
    const orders = await this.getFactoryOrders();
    return orders.find((o) => o.id === clean || o.orderNumber === clean) || null;
  },
  async getFactoryPayments(factoryOrderId) {
    if (factoryOrderId) {
      const order = await this.getFactoryOrderById(factoryOrderId);
      return order?.payments || [];
    }
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const list = await client.factoryPayment.findMany({
            orderBy: { createdAt: "desc" }
          });
          return list.map(mapFactoryPaymentRecord);
        }
      } catch (err) {
        logServerError(err, "db.getFactoryPayments.prisma");
      }
    }
    memoryDB = loadLocalDB();
    if (!memoryDB.factoryPayments) memoryDB.factoryPayments = [];
    return [...memoryDB.factoryPayments].map(mapFactoryPaymentRecord).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async addFactoryPayment(data, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    const cleanOrderId = (data.factoryOrderId || "").trim();
    const order = await this.getFactoryOrderById(cleanOrderId);
    if (!order) {
      throw new Error("\u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u0641\u0639\u0629");
    }
    const numAmount = Number(data.amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      throw new Error("\u0642\u064A\u0645\u0629 \u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0635\u0646\u0639 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0631\u0642\u0645\u0627\u064B \u0645\u0648\u062C\u0628\u0627\u064B \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631");
    }
    const cleanReceipt = data.receiptNumber?.trim();
    if (cleanReceipt) {
      const existingDuplicate = (order.payments || []).find(
        (p) => p.status === "VALID" && p.receiptNumber && p.receiptNumber.trim().toLowerCase() === cleanReceipt.toLowerCase()
      );
      if (existingDuplicate) {
        throw new Error(`\u064A\u0648\u062C\u062F \u0628\u0627\u0644\u0641\u0639\u0644 \u062F\u0641\u0639\u0629 \u0645\u0633\u062C\u0644\u0629 \u0644\u0646\u0641\u0633 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 \u0628\u0646\u0641\u0633 \u0631\u0642\u0645 \u0627\u0644\u0625\u064A\u0635\u0627\u0644 / \u0627\u0644\u0645\u0631\u062C\u0639 (${cleanReceipt}) \u0628\u0642\u064A\u0645\u0629 ${existingDuplicate.amount} \u062C.`);
      }
    }
    const now = /* @__PURE__ */ new Date();
    const nowIso = now.toISOString();
    const paymentId = `fpay-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const safeMethod = normalizeFactoryPaymentMethod(data.method);
    const safeType = normalizeFactoryPaymentType(data.paymentType);
    const newPayment = {
      id: paymentId,
      factoryOrderId: order.id,
      factoryOrderNumber: order.orderNumber,
      bookingId: order.bookingId,
      bookingCode: order.bookingCode,
      amount: numAmount,
      method: safeMethod,
      paymentType: safeType,
      date: data.date?.trim() || nowIso.split("T")[0],
      notes: data.notes?.trim() || void 0,
      receiptNumber: cleanReceipt || void 0,
      recordedBy: performedBy,
      status: "VALID",
      createdAt: nowIso,
      updatedAt: nowIso
    };
    const priorValidPayments = (order.payments || []).filter((p) => p.status === "VALID");
    const newPaid = priorValidPayments.reduce((acc, p) => acc + p.amount, 0) + numAmount;
    const costTotal = order.factoryCostTotal || 0;
    const newRemaining = costTotal - newPaid;
    const newStatus = calculateFactoryPaymentStatus(newPaid, costTotal);
    const typeLabel = formatFactoryPaymentTypeLabel(safeType);
    const auditDetail = `\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 (${typeLabel}) \u0644\u0644\u0645\u0635\u0646\u0639 \u0628\u0642\u064A\u0645\u0629 ${numAmount} \u062C.\u0645 \u0628\u0637\u0631\u064A\u0642\u0629 (${formatFactoryPaymentMethodLabel(safeMethod)}) \u0644\u0623\u0645\u0631 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 ${order.orderNumber} (\u062D\u062C\u0632: ${order.bookingCode}) \u0628\u0648\u0627\u0633\u0637\u0629 (${performedBy}). \u0627\u0644\u0645\u0633\u062F\u062F \u0644\u0644\u0645\u0635\u0646\u0639: ${newPaid} \u062C\u060C \u0627\u0644\u0645\u062A\u0628\u0642\u064A: ${newRemaining} \u062C.${cleanReceipt ? ` \u0645\u0631\u062C\u0639: ${cleanReceipt}.` : ""}${newStatus === "OVERPAID" ? ` [\u062A\u0646\u0628\u064A\u0647: \u0633\u062F\u0627\u062F \u0628\u0627\u0644\u0632\u064A\u0627\u062F\u0629 \u0642\u062F\u0631\u0647 ${newPaid - costTotal} \u062C]` : ""}`;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await ensureColumnsReady(client).catch(() => {
          });
          await client.$transaction(async (tx) => {
            await tx.factoryPayment.create({
              data: {
                id: newPayment.id,
                factoryOrderId: order.id,
                factoryOrderNumber: order.orderNumber,
                bookingId: order.bookingId,
                bookingCode: order.bookingCode,
                amount: newPayment.amount,
                method: newPayment.method,
                paymentType: safeType,
                date: newPayment.date,
                notes: newPayment.notes,
                receiptNumber: newPayment.receiptNumber,
                recordedBy: newPayment.recordedBy,
                status: newPayment.status
              }
            });
            await tx.factoryOrder.update({
              where: { id: order.id },
              data: {
                paidAmount: newPaid,
                remainingAmount: newRemaining,
                paymentStatus: newStatus,
                updatedAt: now
              }
            });
            await tx.auditLog.create({
              data: {
                id: `al-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
                bookingId: order.bookingId,
                bookingCode: order.bookingCode,
                action: "\u062A\u0633\u062C\u064A\u0644 \u062F\u0641\u0639\u0629 \u0645\u0635\u0646\u0639",
                performedBy,
                details: auditDetail
              }
            });
          });
        }
      } catch (err) {
        logServerError(err, "db.addFactoryPayment.prisma");
      }
    }
    memoryDB = loadLocalDB();
    if (!memoryDB.factoryPayments) memoryDB.factoryPayments = [];
    memoryDB.factoryPayments.unshift(newPayment);
    const memOrderIdx = memoryDB.factoryOrders.findIndex((o) => o.id === order.id || o.orderNumber === order.orderNumber);
    if (memOrderIdx !== -1) {
      memoryDB.factoryOrders[memOrderIdx].paidToFactoryAmount = newPaid;
      memoryDB.factoryOrders[memOrderIdx].remainingToFactoryAmount = newRemaining;
      memoryDB.factoryOrders[memOrderIdx].paymentStatus = newStatus;
      memoryDB.factoryOrders[memOrderIdx].updatedAt = nowIso;
    }
    if (!memoryDB.auditLogs) memoryDB.auditLogs = [];
    memoryDB.auditLogs.unshift({
      id: `al-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      bookingId: order.bookingId,
      bookingCode: order.bookingCode,
      action: "\u062A\u0633\u062C\u064A\u0644 \u062F\u0641\u0639\u0629 \u0645\u0635\u0646\u0639",
      performedBy,
      details: auditDetail,
      timestamp: nowIso
    });
    saveLocalDB(memoryDB);
    const updatedOrder = await this.getFactoryOrderById(order.id) || {
      ...order,
      paidToFactoryAmount: newPaid,
      remainingToFactoryAmount: newRemaining,
      paymentStatus: newStatus,
      payments: [newPayment, ...order.payments || []]
    };
    return { payment: newPayment, factoryOrder: updatedOrder };
  },
  async updateFactoryPayment(paymentId, updates, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    const cleanPayId = (paymentId || "").trim();
    if (!cleanPayId) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062A\u0639\u062F\u064A\u0644\u0647\u0627");
    }
    memoryDB = loadLocalDB();
    if (!memoryDB.factoryPayments) memoryDB.factoryPayments = [];
    let payment = memoryDB.factoryPayments.find((p) => p.id === cleanPayId);
    let order = payment ? memoryDB.factoryOrders.find((o) => o.id === payment.factoryOrderId || o.orderNumber === payment.factoryOrderNumber) || null : null;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const dbPay = await client.factoryPayment.findUnique({ where: { id: cleanPayId } });
          if (dbPay) {
            payment = mapFactoryPaymentRecord(dbPay);
            const dbOrder = await client.factoryOrder.findUnique({
              where: { id: dbPay.factoryOrderId },
              include: { payments: { orderBy: { createdAt: "desc" } } }
            });
            if (dbOrder) {
              order = hydrateFactoryOrderFinancials(dbOrder);
            }
          }
        }
      } catch (err) {
        logServerError(err, "db.updateFactoryPayment.resolve");
      }
    }
    if (!payment) {
      throw new Error("\u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0635\u0646\u0639 \u0627\u0644\u0645\u0631\u0627\u062F \u062A\u0639\u062F\u064A\u0644\u0647\u0627 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    }
    if (!order) {
      order = await this.getFactoryOrderById(payment.factoryOrderId || payment.factoryOrderNumber);
    }
    if (!order) {
      throw new Error("\u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 \u0627\u0644\u0645\u0631\u062A\u0628\u0637 \u0628\u0627\u0644\u062F\u0641\u0639\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    }
    const oldAmount = payment.amount;
    const oldMethod = payment.method;
    const oldReceipt = payment.receiptNumber;
    const updatedPayment = { ...payment };
    if (updates.amount !== void 0) {
      const num = Number(updates.amount);
      if (!Number.isFinite(num) || num <= 0) {
        throw new Error("\u0642\u064A\u0645\u0629 \u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0639\u062F\u0644\u0629 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0631\u0642\u0645\u0627\u064B \u0645\u0648\u062C\u0628\u0627\u064B \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631");
      }
      updatedPayment.amount = num;
    }
    if (updates.method !== void 0) {
      updatedPayment.method = normalizeFactoryPaymentMethod(updates.method);
    }
    if (updates.paymentType !== void 0) {
      updatedPayment.paymentType = normalizeFactoryPaymentType(updates.paymentType);
    }
    if (updates.date !== void 0) {
      updatedPayment.date = updates.date.trim() || payment.date;
    }
    if (updates.notes !== void 0) {
      updatedPayment.notes = updates.notes.trim() || void 0;
    }
    const siblingPayments = order.payments && order.payments.length > 0 ? order.payments : memoryDB.factoryPayments.filter((p) => p.factoryOrderId === order.id || p.factoryOrderNumber === order.orderNumber);
    if (updates.receiptNumber !== void 0) {
      const cleanRec = updates.receiptNumber.trim() || void 0;
      if (cleanRec && cleanRec !== oldReceipt) {
        const dup = siblingPayments.find(
          (p) => p.id !== cleanPayId && p.status === "VALID" && p.receiptNumber && p.receiptNumber.trim().toLowerCase() === cleanRec.toLowerCase()
        );
        if (dup) {
          throw new Error(`\u0631\u0642\u0645 \u0627\u0644\u0625\u064A\u0635\u0627\u0644 / \u0627\u0644\u0645\u0631\u062C\u0639 (${cleanRec}) \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644 \u0641\u064A \u062F\u0641\u0639\u0629 \u0623\u062E\u0631\u0649 \u0644\u0646\u0641\u0633 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639.`);
        }
      }
      updatedPayment.receiptNumber = cleanRec;
    }
    const now = /* @__PURE__ */ new Date();
    const nowIso = now.toISOString();
    updatedPayment.updatedAt = nowIso;
    const mergedPayments = siblingPayments.map((p) => p.id === cleanPayId ? updatedPayment : p);
    if (!mergedPayments.some((p) => p.id === cleanPayId)) {
      mergedPayments.unshift(updatedPayment);
    }
    const allValidPayments = mergedPayments.filter((p) => p.status === "VALID");
    const newPaid = allValidPayments.reduce((acc, p) => acc + p.amount, 0);
    const itemsTotal = (order.items || []).reduce((acc, item) => acc + (item.totalFactoryPrice || 0), 0);
    const costTotal = order.factoryCostTotal && order.factoryCostTotal > 0 ? order.factoryCostTotal : itemsTotal;
    const newRemaining = costTotal - newPaid;
    const newStatus = calculateFactoryPaymentStatus(newPaid, costTotal);
    const auditDetail = `\u062A\u0645 \u062A\u0639\u062F\u064A\u0644 \u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0635\u0646\u0639 (\u0627\u0644\u0645\u0639\u0631\u0641: ${updatedPayment.id} - ${formatFactoryPaymentTypeLabel(updatedPayment.paymentType)}) \u0644\u0623\u0645\u0631 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 ${order.orderNumber} \u0628\u0648\u0627\u0633\u0637\u0629 (${performedBy}). \u0627\u0644\u0645\u0628\u0644\u063A: \u0643\u0627\u0646 ${oldAmount} \u062C \u0648\u0623\u0635\u0628\u062D ${updatedPayment.amount} \u062C\u060C \u0627\u0644\u0637\u0631\u064A\u0642\u0629: ${oldMethod} -> ${updatedPayment.method}. \u0627\u0644\u0645\u0633\u062F\u062F \u0627\u0644\u062C\u062F\u064A\u062F: ${newPaid} \u062C\u060C \u0627\u0644\u0645\u062A\u0628\u0642\u064A: ${newRemaining} \u062C.`;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await ensureColumnsReady(client).catch(() => {
          });
          await client.$transaction(async (tx) => {
            await tx.factoryPayment.update({
              where: { id: updatedPayment.id },
              data: {
                amount: updatedPayment.amount,
                method: updatedPayment.method,
                paymentType: normalizeFactoryPaymentType(updatedPayment.paymentType),
                date: updatedPayment.date,
                notes: updatedPayment.notes ?? null,
                receiptNumber: updatedPayment.receiptNumber ?? null,
                updatedAt: now
              }
            });
            await tx.factoryOrder.update({
              where: { id: order.id },
              data: {
                paidAmount: newPaid,
                remainingAmount: newRemaining,
                paymentStatus: newStatus,
                updatedAt: now
              }
            });
            await tx.auditLog.create({
              data: {
                id: `al-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
                bookingId: order.bookingId,
                bookingCode: order.bookingCode,
                action: "\u062A\u0639\u062F\u064A\u0644 \u062F\u0641\u0639\u0629 \u0645\u0635\u0646\u0639",
                performedBy,
                details: auditDetail
              }
            });
          });
        }
      } catch (err) {
        logServerError(err, "db.updateFactoryPayment.prisma");
      }
    }
    const memPayIdx = memoryDB.factoryPayments.findIndex((p) => p.id === cleanPayId);
    if (memPayIdx !== -1) {
      memoryDB.factoryPayments[memPayIdx] = updatedPayment;
    } else {
      memoryDB.factoryPayments.unshift(updatedPayment);
    }
    const memOrderIdx = memoryDB.factoryOrders.findIndex((o) => o.id === order.id || o.orderNumber === order.orderNumber);
    const updatedOrder = {
      ...order,
      paidToFactoryAmount: newPaid,
      remainingToFactoryAmount: newRemaining,
      paymentStatus: newStatus,
      payments: mergedPayments,
      updatedAt: nowIso
    };
    if (memOrderIdx !== -1) {
      memoryDB.factoryOrders[memOrderIdx] = updatedOrder;
    }
    if (!memoryDB.auditLogs) memoryDB.auditLogs = [];
    memoryDB.auditLogs.unshift({
      id: `al-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      bookingId: order.bookingId,
      bookingCode: order.bookingCode,
      action: "\u062A\u0639\u062F\u064A\u0644 \u062F\u0641\u0639\u0629 \u0645\u0635\u0646\u0639",
      performedBy,
      details: auditDetail,
      timestamp: nowIso
    });
    saveLocalDB(memoryDB);
    return { payment: updatedPayment, factoryOrder: updatedOrder };
  },
  async deleteFactoryPayment(paymentId, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629", reason = "\u062D\u0630\u0641 \u062F\u0641\u0639\u0629 \u0645\u0633\u062C\u0644\u0629 \u0628\u0627\u0644\u062E\u0637\u0623") {
    const cleanPayId = (paymentId || "").trim();
    if (!cleanPayId) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062D\u0630\u0641\u0647\u0627");
    }
    memoryDB = loadLocalDB();
    if (!memoryDB.factoryPayments) memoryDB.factoryPayments = [];
    let payment = memoryDB.factoryPayments.find((p) => p.id === cleanPayId);
    let order = payment ? memoryDB.factoryOrders.find((o) => o.id === payment.factoryOrderId || o.orderNumber === payment.factoryOrderNumber) || null : null;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const dbPay = await client.factoryPayment.findUnique({ where: { id: cleanPayId } });
          if (dbPay) {
            payment = mapFactoryPaymentRecord(dbPay);
            const dbOrder = await client.factoryOrder.findUnique({
              where: { id: dbPay.factoryOrderId },
              include: { payments: { orderBy: { createdAt: "desc" } } }
            });
            if (dbOrder) {
              order = hydrateFactoryOrderFinancials(dbOrder);
            }
          }
        }
      } catch (err) {
        logServerError(err, "db.deleteFactoryPayment.resolve");
      }
    }
    if (!payment) {
      throw new Error("\u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0635\u0646\u0639 \u0627\u0644\u0645\u0631\u0627\u062F \u062D\u0630\u0641\u0647\u0627 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    }
    if (!order) {
      order = await this.getFactoryOrderById(payment.factoryOrderId || payment.factoryOrderNumber);
    }
    if (!order) {
      throw new Error("\u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 \u0627\u0644\u0645\u0631\u062A\u0628\u0637 \u0628\u0627\u0644\u062F\u0641\u0639\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    }
    const basePayments = order.payments && order.payments.length > 0 ? order.payments : memoryDB.factoryPayments.filter((p) => p.factoryOrderId === order.id || p.factoryOrderNumber === order.orderNumber);
    const remainingAllPayments = basePayments.filter((p) => p.id !== cleanPayId);
    const remainingValidPayments = remainingAllPayments.filter((p) => p.status === "VALID");
    const newPaid = remainingValidPayments.reduce((acc, p) => acc + p.amount, 0);
    const itemsTotal = (order.items || []).reduce((acc, item) => acc + (item.totalFactoryPrice || 0), 0);
    const costTotal = order.factoryCostTotal && order.factoryCostTotal > 0 ? order.factoryCostTotal : itemsTotal;
    const newRemaining = costTotal - newPaid;
    const newStatus = calculateFactoryPaymentStatus(newPaid, costTotal);
    const now = /* @__PURE__ */ new Date();
    const nowIso = now.toISOString();
    const auditDetail = `\u0642\u0627\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u064A (${performedBy}) \u0628\u062D\u0630\u0641 \u062F\u0641\u0639\u0629 \u0645\u0635\u0646\u0639 \u0628\u0642\u064A\u0645\u0629 ${payment.amount} \u062C.\u0645 (${formatFactoryPaymentTypeLabel(payment.paymentType)}\u060C \u0637\u0631\u064A\u0642\u0629: ${payment.method}\u060C \u0625\u064A\u0635\u0627\u0644: ${payment.receiptNumber || "\u0628\u062F\u0648\u0646"}) \u0644\u0623\u0645\u0631 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 ${order.orderNumber}. \u0627\u0644\u0633\u0628\u0628: ${reason}. \u0627\u0644\u0645\u0633\u062F\u062F \u0627\u0644\u062C\u062F\u064A\u062F: ${newPaid} \u062C\u060C \u0627\u0644\u0645\u062A\u0628\u0642\u064A: ${newRemaining} \u062C.`;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.$transaction(async (tx) => {
            await tx.factoryPayment.delete({
              where: { id: cleanPayId }
            });
            await tx.factoryOrder.update({
              where: { id: order.id },
              data: {
                paidAmount: newPaid,
                remainingAmount: newRemaining,
                paymentStatus: newStatus,
                updatedAt: now
              }
            });
            await tx.auditLog.create({
              data: {
                id: `al-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
                bookingId: order.bookingId,
                bookingCode: order.bookingCode,
                action: "\u062D\u0630\u0641 \u062F\u0641\u0639\u0629 \u0645\u0635\u0646\u0639",
                performedBy,
                details: auditDetail
              }
            });
          });
        }
      } catch (err) {
        logServerError(err, "db.deleteFactoryPayment.prisma");
      }
    }
    memoryDB.factoryPayments = memoryDB.factoryPayments.filter((p) => p.id !== cleanPayId);
    const updatedOrder = {
      ...order,
      paidToFactoryAmount: newPaid,
      remainingToFactoryAmount: newRemaining,
      paymentStatus: newStatus,
      payments: remainingAllPayments,
      updatedAt: nowIso
    };
    const memOrderIdx = memoryDB.factoryOrders.findIndex((o) => o.id === order.id || o.orderNumber === order.orderNumber);
    if (memOrderIdx !== -1) {
      memoryDB.factoryOrders[memOrderIdx] = updatedOrder;
    }
    if (!memoryDB.auditLogs) memoryDB.auditLogs = [];
    memoryDB.auditLogs.unshift({
      id: `al-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      bookingId: order.bookingId,
      bookingCode: order.bookingCode,
      action: "\u062D\u0630\u0641 \u062F\u0641\u0639\u0629 \u0645\u0635\u0646\u0639",
      performedBy,
      details: auditDetail,
      timestamp: nowIso
    });
    saveLocalDB(memoryDB);
    return { success: true, factoryOrder: updatedOrder };
  },
  async updateFactoryOrderStatus(orderId, status, performedBy = "\u0627\u0644\u0645\u0635\u0646\u0639") {
    memoryDB = loadLocalDB();
    let fo = memoryDB.factoryOrders.find((item) => item.id === orderId || item.orderNumber === orderId) || null;
    if (!fo) {
      fo = await this.getFactoryOrderById(orderId);
    }
    if (!fo) return null;
    fo.status = status;
    fo.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.factoryOrder.updateMany({
            where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
            data: { status, updatedAt: /* @__PURE__ */ new Date() }
          });
        }
      } catch (err) {
        logServerError(err, "db.updateFactoryOrderStatus.prisma");
      }
    }
    const booking = memoryDB.bookings.find((b) => b.id === fo.bookingId);
    if (booking) {
      if (status === "COMPLETED") {
        booking.status = "READY_FOR_DELIVERY";
        booking.statusNotes = "\u062A\u0645 \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621 \u0645\u0646 \u062A\u062C\u0647\u064A\u0632 \u0648\u062A\u063A\u0644\u064A\u0641 \u0643\u0627\u0641\u0629 \u0627\u0644\u0648\u062C\u0628\u0627\u062A \u0641\u064A \u0627\u0644\u0645\u0635\u0646\u0639\u060C \u0627\u0644\u0648\u062C\u0628\u0627\u062A \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0634\u062D\u0646 \u0648\u0627\u0644\u062A\u0633\u0644\u064A\u0645.";
      } else if (status === "PREPARING") {
        booking.status = "IN_PRODUCTION";
        booking.statusNotes = "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062C\u0647\u064A\u0632 \u0648\u0627\u0644\u062A\u0639\u0628\u0626\u0629 \u0641\u064A \u0627\u0644\u0645\u0635\u0646\u0639 \u062D\u0627\u0644\u064A\u0627\u064B.";
      }
      booking.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    this.addAuditLog({
      bookingId: fo.bookingId,
      bookingCode: fo.bookingCode || (booking ? booking.bookingCode : "FACTORY_ORDER"),
      action: "\u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639",
      performedBy,
      details: `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 ${fo.orderNumber} \u0625\u0644\u0649 ${status}`
    });
    saveLocalDB(memoryDB);
    return fo;
  },
  async updateFactoryOrder(orderId, updates, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    const cleanOrderId = (orderId || "").trim();
    if (!cleanOrderId) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0645\u0639\u0631\u0651\u0641 \u0623\u0648 \u0631\u0642\u0645 \u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639 \u0644\u0644\u062A\u0639\u062F\u064A\u0644");
    }
    const currentOrder = await this.getFactoryOrderById(cleanOrderId);
    if (!currentOrder) {
      throw new Error(`\u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F: ${cleanOrderId}`);
    }
    memoryDB = loadLocalDB();
    if (!memoryDB.factoryPayments) memoryDB.factoryPayments = [];
    const prevCostTotal = currentOrder.factoryCostTotal || 0;
    const prevPaidTotal = currentOrder.paidToFactoryAmount || 0;
    const meals = await this.getMeals(true);
    const mealsMap = new Map(meals.map((m) => [m.code, m]));
    let newItems = currentOrder.items;
    let newCostTotal = prevCostTotal;
    if (updates.items && Array.isArray(updates.items)) {
      if (updates.items.length === 0) {
        throw new Error("\u064A\u062C\u0628 \u0623\u0646 \u064A\u062D\u062A\u0648\u064A \u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639 \u0639\u0644\u0649 \u0635\u0646\u0641 \u0648\u0627\u062D\u062F \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644");
      }
      newCostTotal = 0;
      newItems = updates.items.map((it) => {
        const meal = mealsMap.get(it.mealCode);
        if (!meal) {
          throw new Error(`\u0627\u0644\u0648\u062C\u0628\u0629 ${it.mealCode} \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u064A\u0648 \u0627\u0644\u0645\u0639\u062A\u0645\u062F`);
        }
        const qty = Math.max(1, Math.floor(Number(it.quantity) || 0));
        if (!Number.isFinite(qty) || qty <= 0) {
          throw new Error(`\u0643\u0645\u064A\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629 \u0644\u0644\u0635\u0646\u0641 ${it.mealCode}`);
        }
        const baseFactPrice = meal.factoryPrice || 0;
        const hasJuice = meal.hasJuice;
        let sweetDelta = 0;
        let sweetLabel = "\u0628\u062F\u0648\u0646 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A";
        const sweetOpt = it.orientalSweetOption || "none";
        if (sweetOpt === "add_with_juice") {
          sweetDelta = 10;
          sweetLabel = "\u0625\u0636\u0627\u0641\u0629 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A \u0645\u0639 \u0627\u0644\u0639\u0635\u064A\u0631 (+10 \u062C \u0644\u0644\u0645\u0635\u0646\u0639)";
        } else if (sweetOpt === "replace_juice") {
          sweetDelta = 5;
          sweetLabel = "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A (+5 \u062C \u0644\u0644\u0645\u0635\u0646\u0639)";
        }
        let drinkDelta = 0;
        let drinkLabel = "\u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A";
        let specialInstructions = "\u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A";
        if (sweetOpt === "replace_juice") {
          drinkLabel = "\u0627\u0644\u0639\u0635\u064A\u0631 \u0645\u0633\u062A\u0628\u062F\u0644 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A";
          specialInstructions = "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A \u062D\u0644\u0648\u064A\u0627\u062A";
        } else if (hasJuice) {
          if (it.drinkOption === "pepsi") {
            drinkDelta = FACTORY_PEPSI_ACCOUNTING.netAdjustment;
            drinkLabel = "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0643\u0627\u0646\u0632 \u0628\u064A\u0628\u0633\u064A";
            specialInstructions = "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0643\u0627\u0646\u0632 \u0628\u064A\u0628\u0633\u064A";
          } else if (it.drinkOption === "no_juice") {
            drinkDelta = -FACTORY_PEPSI_ACCOUNTING.totalJuiceDeduction;
            drinkLabel = "\u0628\u062F\u0648\u0646 \u0639\u0635\u064A\u0631";
            specialInstructions = "\u0628\u062F\u0648\u0646 \u0639\u0635\u064A\u0631";
          }
        } else {
          drinkLabel = "\u0628\u062F\u0648\u0646 \u0639\u0635\u064A\u0631 (\u0623\u0635\u0644\u064A\u0629)";
          specialInstructions = "\u0648\u062C\u0628\u0629 \u0623\u0635\u0644\u064A\u0629 \u0628\u062F\u0648\u0646 \u0639\u0635\u064A\u0631";
        }
        const unitFactPrice = Math.max(0, baseFactPrice + drinkDelta + sweetDelta);
        const itemTotal = unitFactPrice * qty;
        newCostTotal += itemTotal;
        return {
          mealCode: meal.code,
          mealName: meal.name,
          quantity: qty,
          drinkOption: it.drinkOption,
          drinkLabel,
          orientalSweetOption: sweetOpt,
          orientalSweetLabel: sweetLabel,
          orientalSweetFactoryAdjustment: sweetDelta,
          ingredients: meal.ingredients,
          baseFactoryPrice: baseFactPrice,
          factoryDrinkAdjustment: drinkDelta,
          unitFactoryPrice: unitFactPrice,
          totalFactoryPrice: itemTotal,
          specialInstructions
        };
      });
    }
    const existingPayments = (currentOrder.payments && currentOrder.payments.length > 0 ? currentOrder.payments : memoryDB.factoryPayments.filter(
      (p) => p.factoryOrderId ? p.factoryOrderId === currentOrder.id : p.factoryOrderNumber === currentOrder.orderNumber
    )).map(mapFactoryPaymentRecord);
    const now = /* @__PURE__ */ new Date();
    const nowIso = now.toISOString();
    const paymentChanges = updates.paymentChanges;
    const deleteIdsSet = new Set(
      Array.isArray(paymentChanges?.deleteIds) ? paymentChanges.deleteIds.map((id) => String(id).trim()).filter(Boolean) : []
    );
    const paymentUpdatesList = Array.isArray(paymentChanges?.update) ? paymentChanges.update : [];
    const paymentAddsList = Array.isArray(paymentChanges?.add) ? paymentChanges.add : [];
    for (const delId of deleteIdsSet) {
      const target = existingPayments.find((p) => p.id === delId);
      if (!target) {
        throw new Error(`\u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0631\u0627\u062F \u062D\u0630\u0641\u0647\u0627 (${delId}) \u0644\u0627 \u062A\u0646\u062A\u0645\u064A \u0625\u0644\u0649 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 ${currentOrder.orderNumber}`);
      }
    }
    const updatedPaymentsToPersist = [];
    for (const upd of paymentUpdatesList) {
      const updId = String(upd.id || "").trim();
      if (!updId || deleteIdsSet.has(updId)) continue;
      const target = existingPayments.find((p) => p.id === updId);
      if (!target) {
        throw new Error(`\u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0631\u0627\u062F \u062A\u0639\u062F\u064A\u0644\u0647\u0627 (${updId}) \u0644\u0627 \u062A\u0646\u062A\u0645\u064A \u0625\u0644\u0649 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 ${currentOrder.orderNumber}`);
      }
      const nextAmount = upd.amount !== void 0 ? Number(upd.amount) : target.amount;
      if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
        throw new Error("\u0642\u064A\u0645\u0629 \u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0639\u062F\u0644\u0629 \u0644\u0644\u0645\u0635\u0646\u0639 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0631\u0642\u0645\u0627\u064B \u0645\u0648\u062C\u0628\u0627\u064B \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631");
      }
      updatedPaymentsToPersist.push({
        ...target,
        amount: nextAmount,
        method: upd.method !== void 0 ? normalizeFactoryPaymentMethod(upd.method) : target.method,
        paymentType: upd.paymentType !== void 0 ? normalizeFactoryPaymentType(upd.paymentType) : normalizeFactoryPaymentType(target.paymentType),
        date: upd.date !== void 0 ? upd.date.trim() || target.date : target.date,
        notes: upd.notes !== void 0 ? upd.notes.trim() || void 0 : target.notes,
        receiptNumber: upd.receiptNumber !== void 0 ? upd.receiptNumber.trim() || void 0 : target.receiptNumber,
        updatedAt: nowIso
      });
    }
    const addedPaymentsToPersist = paymentAddsList.map((addItem, index) => {
      const numAmount = Number(addItem.amount);
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        throw new Error("\u0642\u064A\u0645\u0629 \u0623\u064A \u062F\u0641\u0639\u0629 \u0623\u0648 \u0639\u0631\u0628\u0648\u0646 \u062C\u062F\u064A\u062F \u0644\u0644\u0645\u0635\u0646\u0639 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0631\u0642\u0645\u0627\u064B \u0645\u0648\u062C\u0628\u0627\u064B \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631");
      }
      return {
        id: `fpay-${Date.now()}-${index}-${Math.floor(100 + Math.random() * 900)}`,
        factoryOrderId: currentOrder.id,
        factoryOrderNumber: currentOrder.orderNumber,
        bookingId: currentOrder.bookingId,
        bookingCode: currentOrder.bookingCode,
        amount: numAmount,
        method: normalizeFactoryPaymentMethod(addItem.method),
        paymentType: normalizeFactoryPaymentType(addItem.paymentType),
        date: addItem.date?.trim() || nowIso.split("T")[0],
        notes: addItem.notes?.trim() || void 0,
        receiptNumber: addItem.receiptNumber?.trim() || void 0,
        recordedBy: performedBy,
        status: "VALID",
        createdAt: nowIso,
        updatedAt: nowIso
      };
    });
    const updatesMap = new Map(updatedPaymentsToPersist.map((p) => [p.id, p]));
    const retainedPayments = existingPayments.filter((p) => !deleteIdsSet.has(p.id)).map((p) => updatesMap.get(p.id) || p);
    const resultingPayments = [...addedPaymentsToPersist, ...retainedPayments];
    const seenReceipts = /* @__PURE__ */ new Set();
    for (const p of resultingPayments) {
      if (p.status === "VALID" && p.receiptNumber) {
        const key = p.receiptNumber.trim().toLowerCase();
        if (seenReceipts.has(key)) {
          throw new Error(`\u0631\u0642\u0645 \u0627\u0644\u0625\u064A\u0635\u0627\u0644 / \u0627\u0644\u0645\u0631\u062C\u0639 (${p.receiptNumber}) \u0645\u0643\u0631\u0631 \u0641\u064A \u0623\u0643\u062B\u0631 \u0645\u0646 \u062F\u0641\u0639\u0629 \u0644\u0646\u0641\u0633 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639.`);
        }
        seenReceipts.add(key);
      }
    }
    const validPayments = resultingPayments.filter((p) => p.status === "VALID");
    const totalPaid = validPayments.reduce((acc, p) => acc + p.amount, 0);
    const newRemaining = newCostTotal - totalPaid;
    const newPaymentStatus = calculateFactoryPaymentStatus(totalPaid, newCostTotal);
    const newVersion = (currentOrder.version || 1) + 1;
    const updatedOrder = {
      ...currentOrder,
      version: newVersion,
      eventDate: updates.eventDate?.trim() || currentOrder.eventDate,
      deliveryTime: updates.deliveryTime?.trim() || currentOrder.deliveryTime,
      deliveryLocation: updates.deliveryLocation?.trim() || currentOrder.deliveryLocation,
      packagingNotes: updates.packagingNotes !== void 0 ? updates.packagingNotes : currentOrder.packagingNotes,
      items: newItems,
      factoryCostTotal: newCostTotal,
      paidToFactoryAmount: totalPaid,
      remainingToFactoryAmount: newRemaining,
      paymentStatus: newPaymentStatus,
      payments: resultingPayments,
      updatedAt: nowIso
    };
    const paymentDiffParts = [];
    if (addedPaymentsToPersist.length > 0) {
      const addedSum = addedPaymentsToPersist.reduce((s, p) => s + p.amount, 0);
      paymentDiffParts.push(`\u0625\u0636\u0627\u0641\u0629 ${addedPaymentsToPersist.length} \u062F\u0641\u0639\u0629 (${addedSum} \u062C)`);
    }
    if (updatedPaymentsToPersist.length > 0) {
      paymentDiffParts.push(`\u062A\u0639\u062F\u064A\u0644 ${updatedPaymentsToPersist.length} \u062F\u0641\u0639\u0629`);
    }
    if (deleteIdsSet.size > 0) {
      paymentDiffParts.push(`\u062D\u0630\u0641 ${deleteIdsSet.size} \u062F\u0641\u0639\u0629`);
    }
    const paymentAuditNote = paymentDiffParts.length > 0 ? ` \u062A\u0639\u062F\u064A\u0644\u0627\u062A \u0627\u0644\u062F\u0641\u0639\u0627\u062A: [${paymentDiffParts.join("\u060C ")}] (\u0627\u0644\u0645\u0633\u062F\u062F \u0643\u0627\u0646 ${prevPaidTotal} \u062C \u0648\u0623\u0635\u0628\u062D ${totalPaid} \u062C).` : "";
    const auditDetail = `\u062A\u0645 \u062A\u0639\u062F\u064A\u0644 \u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639 ${currentOrder.orderNumber} (\u062A\u0631\u0642\u064A\u0629 \u0644\u0644\u0625\u0635\u062F\u0627\u0631 v${newVersion}) \u0628\u0648\u0627\u0633\u0637\u0629 (${performedBy}). \u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0645\u0635\u0646\u0639 \u0627\u0644\u0633\u0627\u0628\u0642\u0629: ${prevCostTotal} \u062C\u060C \u0627\u0644\u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629: ${newCostTotal} \u062C. \u0627\u0644\u0645\u0633\u062F\u062F \u0627\u0644\u0641\u0639\u0644\u064A \u0644\u0644\u0645\u0635\u0646\u0639: ${totalPaid} \u062C\u060C \u0627\u0644\u0645\u062A\u0628\u0642\u064A: ${newRemaining} \u062C.${paymentAuditNote}${newPaymentStatus === "OVERPAID" ? ` [\u062A\u0646\u0628\u064A\u0647: \u0633\u062F\u0627\u062F \u0628\u0627\u0644\u0632\u064A\u0627\u062F\u0629 \u0642\u062F\u0631\u0647 ${totalPaid - newCostTotal} \u062C \u0644\u0635\u0627\u0644\u062D \u0627\u0644\u0645\u0635\u0646\u0639]` : ""}`;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await ensureColumnsReady(client).catch(() => {
          });
          await client.$transaction(async (tx) => {
            if (deleteIdsSet.size > 0) {
              await tx.factoryPayment.deleteMany({
                where: {
                  id: { in: Array.from(deleteIdsSet) },
                  factoryOrderId: currentOrder.id
                }
              });
            }
            for (const updPay of updatedPaymentsToPersist) {
              await tx.factoryPayment.update({
                where: { id: updPay.id },
                data: {
                  amount: updPay.amount,
                  method: updPay.method,
                  paymentType: normalizeFactoryPaymentType(updPay.paymentType),
                  date: updPay.date,
                  notes: updPay.notes ?? null,
                  receiptNumber: updPay.receiptNumber ?? null,
                  updatedAt: now
                }
              });
            }
            for (const addPay of addedPaymentsToPersist) {
              await tx.factoryPayment.create({
                data: {
                  id: addPay.id,
                  factoryOrderId: currentOrder.id,
                  factoryOrderNumber: currentOrder.orderNumber,
                  bookingId: currentOrder.bookingId,
                  bookingCode: currentOrder.bookingCode,
                  amount: addPay.amount,
                  method: addPay.method,
                  paymentType: normalizeFactoryPaymentType(addPay.paymentType),
                  date: addPay.date,
                  notes: addPay.notes ?? null,
                  receiptNumber: addPay.receiptNumber ?? null,
                  recordedBy: addPay.recordedBy,
                  status: addPay.status
                }
              });
            }
            await tx.factoryOrder.update({
              where: { id: currentOrder.id },
              data: {
                version: newVersion,
                eventDate: updatedOrder.eventDate,
                deliveryTime: updatedOrder.deliveryTime,
                deliveryLocation: updatedOrder.deliveryLocation,
                packagingNotes: updatedOrder.packagingNotes,
                itemsJson: JSON.stringify(updatedOrder.items),
                factoryCostTotal: newCostTotal,
                paidAmount: totalPaid,
                remainingAmount: newRemaining,
                paymentStatus: newPaymentStatus,
                updatedAt: now
              }
            });
            await tx.auditLog.create({
              data: {
                id: `al-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
                bookingId: currentOrder.bookingId,
                bookingCode: currentOrder.bookingCode,
                action: "\u062A\u0639\u062F\u064A\u0644 \u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639 \u0648\u0627\u0644\u062F\u0641\u0639\u0627\u062A",
                performedBy,
                details: auditDetail
              }
            });
          });
        }
      } catch (err) {
        logServerError(err, "db.updateFactoryOrder.prisma");
        throw err;
      }
    }
    memoryDB = loadLocalDB();
    if (!memoryDB.factoryPayments) memoryDB.factoryPayments = [];
    memoryDB.factoryPayments = memoryDB.factoryPayments.filter(
      (p) => p.factoryOrderId !== currentOrder.id && p.factoryOrderNumber !== currentOrder.orderNumber
    );
    memoryDB.factoryPayments.unshift(...resultingPayments);
    const memOrderIdx = memoryDB.factoryOrders.findIndex(
      (o) => o.id === currentOrder.id || o.orderNumber === currentOrder.orderNumber
    );
    if (memOrderIdx !== -1) {
      memoryDB.factoryOrders[memOrderIdx] = updatedOrder;
    } else {
      memoryDB.factoryOrders.unshift(updatedOrder);
    }
    if (!memoryDB.auditLogs) memoryDB.auditLogs = [];
    memoryDB.auditLogs.unshift({
      id: `al-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      bookingId: currentOrder.bookingId,
      bookingCode: currentOrder.bookingCode,
      action: paymentDiffParts.length > 0 ? "\u062A\u0639\u062F\u064A\u0644 \u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639 \u0648\u0627\u0644\u062F\u0641\u0639\u0627\u062A" : "\u062A\u0639\u062F\u064A\u0644 \u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639",
      performedBy,
      details: auditDetail,
      timestamp: nowIso
    });
    saveLocalDB(memoryDB);
    return updatedOrder;
  },
  async addAuditLog(log) {
    let bCode = (log.bookingCode || "").trim();
    if (!bCode && log.bookingId) {
      const b = await this.getBookingById(log.bookingId);
      if (b && b.bookingCode) {
        bCode = b.bookingCode.trim();
      }
    }
    if (!bCode) {
      bCode = "SYSTEM";
    }
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      bookingId: log.bookingId || "",
      bookingCode: bCode,
      action: log.action,
      performedBy: log.performedBy,
      details: log.details,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!memoryDB || !Array.isArray(memoryDB.auditLogs)) {
      memoryDB = loadLocalDB();
    }
    memoryDB.auditLogs.unshift(newLog);
    saveLocalDB(memoryDB);
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.auditLog.create({
            data: {
              id: newLog.id,
              bookingId: newLog.bookingId || null,
              bookingCode: newLog.bookingCode,
              action: newLog.action,
              performedBy: newLog.performedBy,
              details: newLog.details
            }
          });
        }
      } catch (err) {
        logServerError(err, "db.addAuditLog.prisma");
      }
    }
    return newLog;
  },
  async getAuditLogs(bookingId) {
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const whereClause = bookingId ? { OR: [{ bookingId }, { bookingCode: bookingId }] } : void 0;
          const logs = await client.auditLog.findMany({
            where: whereClause,
            orderBy: { timestamp: "desc" },
            take: 50
          });
          if (logs && logs.length > 0) {
            return logs.map((l) => ({
              id: l.id,
              bookingId: l.bookingId || "",
              bookingCode: l.bookingCode || "",
              action: l.action,
              performedBy: l.performedBy,
              details: l.details,
              timestamp: l.timestamp.toISOString()
            }));
          }
        }
      } catch (err) {
        logServerError(err, "db.getAuditLogs.prisma");
      }
    }
    memoryDB = loadLocalDB();
    if (bookingId) {
      return memoryDB.auditLogs.filter((l) => l.bookingId === bookingId || l.bookingCode === bookingId);
    }
    return memoryDB.auditLogs.slice(0, 50);
  },
  async getStats() {
    const bookings = await this.getBookings();
    const totalBookings = bookings.length;
    let totalMeals = 0;
    let totalRevenue = 0;
    let totalFactoryCost = 0;
    let totalCollected = 0;
    bookings.forEach((b) => {
      if (b.status !== "CANCELLED") {
        totalMeals += b.totalMealsCount;
        totalRevenue += b.totalDistributorPrice;
        totalFactoryCost += b.totalFactoryPrice || 0;
        totalCollected += b.paidAmount;
      }
    });
    const totalProfit = totalRevenue - totalFactoryCost;
    const totalOutstanding = Math.max(0, totalRevenue - totalCollected);
    const meals = await this.getMeals(true);
    const factoryOrders = await this.getFactoryOrders();
    return {
      totalBookings,
      totalMeals,
      totalRevenue,
      totalFactoryCost,
      totalProfit,
      totalCollected,
      totalOutstanding,
      activeMealsCount: meals.filter((m) => m.isActive).length,
      factoryOrdersCount: factoryOrders.length
    };
  },
  async verifyAdmin(username, password) {
    if (!username || !password) return null;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const dbUser = await client.adminUser.findFirst({
            where: {
              OR: [
                { username: { equals: username, mode: "insensitive" } },
                { email: { equals: username, mode: "insensitive" } }
              ]
            }
          });
          if (dbUser) {
            const isValid2 = bcrypt.compareSync(password, dbUser.passwordHash);
            if (isValid2) {
              return {
                id: dbUser.id,
                username: dbUser.username,
                email: dbUser.email,
                name: dbUser.name,
                role: dbUser.role
              };
            }
          }
        }
      } catch (err) {
        logServerError(err, "db.verifyAdmin.prisma");
      }
    }
    memoryDB = loadLocalDB();
    const user = memoryDB.adminUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
    );
    if (!user) return null;
    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },
  async findAdminUser(usernameOrEmail) {
    const clean = (usernameOrEmail || "").trim();
    if (!clean) return null;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const dbUser = await client.adminUser.findFirst({
            where: {
              OR: [
                { username: { equals: clean, mode: "insensitive" } },
                { email: { equals: clean, mode: "insensitive" } }
              ]
            }
          });
          if (dbUser) {
            return {
              id: dbUser.id,
              username: dbUser.username,
              email: dbUser.email,
              name: dbUser.name,
              role: dbUser.role
            };
          }
        }
      } catch (err) {
        logServerError(err, "db.findAdminUser.prisma");
      }
    }
    memoryDB = loadLocalDB();
    const user = memoryDB.adminUsers.find(
      (u) => u.username.toLowerCase() === clean.toLowerCase() || u.email.toLowerCase() === clean.toLowerCase()
    );
    if (!user) return null;
    const { passwordHash: _ph, ...safeUser } = user;
    return safeUser;
  },
  async updateAdminPassword(username, newPasswordHash, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    const clean = (username || "").trim();
    if (!clean) return false;
    memoryDB = loadLocalDB();
    const user = memoryDB.adminUsers.find(
      (u) => u.username.toLowerCase() === clean.toLowerCase() || u.email.toLowerCase() === clean.toLowerCase()
    );
    let updatedLocal = false;
    if (user) {
      user.passwordHash = newPasswordHash;
      saveLocalDB(memoryDB);
      updatedLocal = true;
    }
    let updatedPg = false;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          const result = await client.adminUser.updateMany({
            where: {
              OR: [
                { username: { equals: clean, mode: "insensitive" } },
                { email: { equals: clean, mode: "insensitive" } }
              ]
            },
            data: {
              passwordHash: newPasswordHash
            }
          });
          if (result.count > 0) {
            updatedPg = true;
          } else if (user) {
            await client.adminUser.upsert({
              where: { username: user.username },
              update: { passwordHash: newPasswordHash },
              create: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                passwordHash: newPasswordHash
              }
            });
            updatedPg = true;
          }
        }
      } catch (err) {
        logServerError(err, "db.updateAdminPassword.prisma");
      }
    }
    if (!updatedLocal && !updatedPg) {
      return false;
    }
    await this.addAuditLog({
      bookingId: "",
      bookingCode: "ADMIN_AUTH",
      action: "\u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0627\u0644\u0625\u062F\u0627\u0631\u064A",
      performedBy,
      details: `\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645 (${user?.username || clean}) \u0628\u0646\u062C\u0627\u062D\u060C \u0648\u062A\u0634\u0641\u064A\u0631\u0647\u0627 \u0639\u0628\u0631 bcrypt \u0648\u0625\u0644\u063A\u0627\u0621 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0642\u062F\u064A\u0645\u0629 \u0641\u0648\u0631\u0627\u064B.`
    });
    return true;
  },
  // STRICT TEST BOOKING MANAGEMENT: Only bookings with isTest === true can be modified or deleted
  async updateTestBooking(id, updates, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    const cleanId = (id || "").trim();
    if (!cleanId) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0639\u0631\u0641 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0644\u0644\u062D\u062C\u0632 (bookingId)");
    }
    if (cleanId.startsWith("CLB-")) {
      throw new Error("\u0639\u0645\u0644\u064A\u0627\u062A \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A \u062A\u062A\u0637\u0644\u0628 \u0627\u0644\u0645\u0639\u0631\u0641 \u0627\u0644\u0623\u0633\u0627\u0633\u064A bookingId \u0641\u0642\u0637 \u0648\u0644\u0627 \u062A\u0642\u0628\u0644 bookingCode.");
    }
    const booking = await this.getBookingByPrimaryId(cleanId);
    if (!booking) {
      throw new Error("\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    }
    const isTest = Boolean(booking.isTest && booking.bookingCode !== "CLB-2026-5131");
    if (!isTest) {
      throw new Error("\u0645\u0645\u0646\u0648\u0639: \u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644 \u0633\u0648\u0649 \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u0641\u0642\u0637 (isTest: true). \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u0648\u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u0645\u062D\u0645\u064A\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0648\u0644\u0627 \u062A\u0642\u0628\u0644 \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u0627\u0631.");
    }
    memoryDB = loadLocalDB();
    const memIdx = memoryDB.bookings.findIndex((b) => b.id === booking.id);
    const updatedBooking = {
      ...booking,
      ...updates,
      version: booking.version + 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (memIdx !== -1) {
      memoryDB.bookings[memIdx] = updatedBooking;
      saveLocalDB(memoryDB);
    }
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.booking.update({
            where: { id: booking.id },
            data: {
              customerName: updates.customerName ?? booking.customerName,
              customerPhone: updates.customerPhone ?? booking.customerPhone,
              eventName: updates.eventName ?? booking.eventName,
              eventDate: updates.eventDate ?? booking.eventDate,
              deliveryTime: updates.deliveryTime ?? booking.deliveryTime,
              deliveryGovernorate: updates.deliveryGovernorate ?? booking.deliveryGovernorate,
              deliveryAddress: updates.deliveryAddress ?? booking.deliveryAddress,
              notes: updates.notes !== void 0 ? updates.notes : booking.notes,
              status: updates.status ?? booking.status,
              version: updatedBooking.version,
              updatedAt: /* @__PURE__ */ new Date()
            }
          });
        }
      } catch (err) {
        logServerError(err, "db.updateTestBooking.prisma");
      }
    }
    await this.addAuditLog({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      action: "\u062A\u0639\u062F\u064A\u0644 \u062D\u062C\u0632 \u062A\u062C\u0631\u064A\u0628\u064A",
      performedBy,
      details: `\u062A\u0645 \u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A ${booking.bookingCode} (\u0627\u0644\u0625\u0635\u062F\u0627\u0631 v${updatedBooking.version}).`
    });
    return updatedBooking;
  },
  async deleteTestBooking(id, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    const cleanId = (id || "").trim();
    if (!cleanId) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0639\u0631\u0641 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0644\u0644\u062D\u062C\u0632 (bookingId)");
    }
    if (cleanId.startsWith("CLB-")) {
      throw new Error("\u0639\u0645\u0644\u064A\u0627\u062A \u062D\u0630\u0641 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A \u062A\u062A\u0637\u0644\u0628 \u0627\u0644\u0645\u0639\u0631\u0641 \u0627\u0644\u0623\u0633\u0627\u0633\u064A bookingId \u0641\u0642\u0637 \u0648\u0644\u0627 \u062A\u0642\u0628\u0644 bookingCode.");
    }
    const booking = await this.getBookingByPrimaryId(cleanId);
    if (!booking) {
      throw new Error("\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    }
    if (isStrictlyProtectedBooking(booking)) {
      throw new Error("\u0645\u0645\u0646\u0648\u0639 \u0645\u0646\u0639\u0627\u064B \u0642\u0627\u0637\u0639\u0627\u064B: \u0627\u0644\u062D\u062C\u0632 CLB-2026-5131 \u0644\u0644\u0639\u0645\u064A\u0644 \u0623\u062D\u0645\u062F \u0639\u0635\u0627\u0645 \u0627\u0644\u062F\u064A\u0646 \u062D\u0633\u064A\u0646 \u0647\u0648 \u062D\u062C\u0632 \u062D\u0642\u064A\u0642\u064A \u0645\u0639\u062A\u0645\u062F \u0648\u0645\u062D\u0645\u064A \u062A\u0645\u0627\u0645\u0627\u064B \u0645\u0646 \u0627\u0644\u062D\u0630\u0641.");
    }
    const isTest = Boolean(booking.isTest) || classifyBookingRecord(booking) !== "PROTECTED_REAL";
    if (!isTest) {
      throw new Error("\u0645\u0645\u0646\u0648\u0639 \u0645\u0646\u0639\u0627\u064B \u0628\u0627\u062A\u0627\u064B: \u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0633\u0648\u0649 \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u0623\u0648 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A\u0629. \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u0644\u0644\u0639\u0645\u0644\u0627\u0621 \u0645\u062D\u0645\u064A\u0629 \u0648\u0644\u0627 \u064A\u062C\u0648\u0632 \u062D\u0630\u0641\u0647\u0627.");
    }
    const bookingCode = booking.bookingCode;
    const targetId = booking.id;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.$transaction(async (tx) => {
            await tx.bookingItem.deleteMany({ where: { bookingId: targetId } });
            await tx.payment.deleteMany({ where: { bookingId: targetId } });
            await tx.factoryPayment.deleteMany({ where: { factoryOrder: { bookingId: targetId } } });
            await tx.factoryOrder.deleteMany({ where: { bookingId: targetId } });
            await tx.auditLog.deleteMany({ where: { bookingId: targetId } });
            await tx.booking.delete({ where: { id: targetId } });
          });
        }
      } catch (err) {
        logServerError(err, "db.deleteTestBooking.prisma");
      }
    }
    memoryDB = loadLocalDB();
    memoryDB.bookings = memoryDB.bookings.filter((b) => b.id !== targetId);
    memoryDB.payments = memoryDB.payments.filter((p) => p.bookingId !== targetId);
    const removedOrderIds = new Set(
      (memoryDB.factoryOrders || []).filter((fo) => fo.bookingId === targetId).map((fo) => fo.id)
    );
    memoryDB.factoryOrders = memoryDB.factoryOrders.filter((fo) => fo.bookingId !== targetId);
    if (memoryDB.factoryPayments) {
      memoryDB.factoryPayments = memoryDB.factoryPayments.filter((fp) => !removedOrderIds.has(fp.factoryOrderId));
    }
    saveLocalDB(memoryDB);
    await this.addAuditLog({
      bookingId: "",
      bookingCode,
      action: "\u062D\u0630\u0641 \u062D\u062C\u0632 \u062A\u062C\u0631\u064A\u0628\u064A",
      performedBy,
      details: `\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A \u0631\u0642\u0645 ${bookingCode} \u0628\u0643\u0627\u0641\u0629 \u0628\u0646\u0648\u062F\u0647 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u0628\u0639\u062F \u0627\u0644\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0635\u0631\u064A\u062D.`
    });
    return { success: true, bookingCode };
  },
  /**
   * Delete an explicitly CANCELLED booking individually.
   * Strictly enforces:
   * - bookingId primary key only (rejects bookingCode)
   * - booking.status === 'CANCELLED' (strictly rejects all active statuses)
   * - Absolute refusal if booking is CLB-2026-5131
   * - No active financial payments or obligations (paidAmount === 0 and no valid payments)
   * - No active factory payments
   * - Cascade cleanup and full audit trail
   */
  async deleteCancelledBooking(id, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    const cleanId = (id || "").trim();
    if (!cleanId) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0639\u0631\u0641 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0644\u0644\u062D\u062C\u0632 (bookingId)");
    }
    if (cleanId.startsWith("CLB-")) {
      throw new Error("\u0639\u0645\u0644\u064A\u0627\u062A \u062D\u0630\u0641 \u0627\u0644\u062D\u062C\u0632 \u062A\u062A\u0637\u0644\u0628 \u0627\u0644\u0645\u0639\u0631\u0641 \u0627\u0644\u0623\u0633\u0627\u0633\u064A bookingId \u0641\u0642\u0637 \u0648\u0644\u0627 \u062A\u0642\u0628\u0644 bookingCode \u0644\u0645\u0646\u0639 \u062A\u062F\u0627\u062E\u0644 \u0627\u0644\u0633\u062C\u0644\u0627\u062A.");
    }
    const booking = await this.getBookingByPrimaryId(cleanId);
    if (!booking) {
      throw new Error("\u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062D\u0630\u0641\u0647 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    }
    if (isStrictlyProtectedBooking(booking)) {
      throw new Error("\u0645\u0645\u0646\u0648\u0639 \u0645\u0646\u0639\u0627\u064B \u0642\u0627\u0637\u0639\u0627\u064B: \u0627\u0644\u062D\u062C\u0632 CLB-2026-5131 \u0644\u0644\u0639\u0645\u064A\u0644 \u0623\u062D\u0645\u062F \u0639\u0635\u0627\u0645 \u0627\u0644\u062F\u064A\u0646 \u062D\u0633\u064A\u0646 \u0647\u0648 \u062D\u062C\u0632 \u062D\u0642\u064A\u0642\u064A \u0645\u0639\u062A\u0645\u062F \u0648\u0645\u062D\u0645\u064A \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0645\u0646 \u0623\u064A \u062D\u0630\u0641.");
    }
    if (booking.status !== "CANCELLED") {
      throw new Error(`\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u062D\u062C\u0632: \u062E\u0627\u0635\u064A\u0629 \u0627\u0644\u062D\u0630\u0641 \u0645\u062E\u0635\u0635\u0629 \u062D\u0635\u0631\u064A\u0627\u064B \u0644\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u0645\u0644\u063A\u0627\u0629 (CANCELLED). \u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u062D\u0627\u0644\u064A\u0629: (${booking.status}) \u0648\u0647\u0648 \u0645\u062D\u0645\u064A \u062A\u0645\u0627\u0645\u0627\u064B \u0645\u0646 \u0627\u0644\u062D\u0630\u0641.`);
    }
    const validPayments = (booking.payments || []).filter((p) => p.status !== "CANCELLED" && p.amount > 0);
    if (validPayments.length > 0 || booking.paidAmount && booking.paidAmount > 0) {
      throw new Error(`\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0627\u0644\u062D\u062C\u0632 \u0644\u0648\u062C\u0648\u062F \u0645\u062F\u0641\u0648\u0639\u0627\u062A \u0645\u0627\u0644\u064A\u0629 \u0645\u0633\u062C\u0644\u0629 \u0628\u0642\u064A\u0645\u0629 (${booking.paidAmount} \u062C.\u0645). \u064A\u062C\u0628 \u0625\u0644\u063A\u0627\u0621 \u0648\u062A\u0633\u0648\u064A\u0629 \u0627\u0644\u062F\u0641\u0639\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0623\u0648\u0644\u0627\u064B \u0623\u0648 \u0627\u0644\u0625\u0628\u0642\u0627\u0621 \u0639\u0644\u0649 \u0627\u0644\u0633\u062C\u0644 \u0644\u0644\u0623\u063A\u0631\u0627\u0636 \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A\u0629.`);
    }
    const factoryOrdersWithPaid = (booking.factoryOrders || []).filter((fo) => (fo.paidToFactoryAmount || 0) > 0);
    if (factoryOrdersWithPaid.length > 0) {
      throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0627\u0644\u062D\u062C\u0632 \u0644\u0627\u0631\u062A\u0628\u0627\u0637\u0647 \u0628\u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0645\u0635\u0646\u0639 \u0639\u0644\u064A\u0647 \u0645\u062F\u0641\u0648\u0639\u0627\u062A \u0645\u0633\u062F\u062F\u0629 \u0644\u0644\u0645\u0635\u0646\u0639. \u064A\u0631\u062C\u0649 \u062A\u0633\u0648\u064A\u0629 \u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0645\u0635\u0646\u0639 \u0623\u0648\u0644\u0627\u064B.");
    }
    const bookingCode = booking.bookingCode;
    const targetId = booking.id;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.$transaction(async (tx) => {
            await tx.bookingItem.deleteMany({ where: { bookingId: targetId } });
            await tx.payment.deleteMany({ where: { bookingId: targetId } });
            await tx.factoryPayment.deleteMany({ where: { factoryOrder: { bookingId: targetId } } });
            await tx.factoryOrder.deleteMany({ where: { bookingId: targetId } });
            await tx.auditLog.deleteMany({ where: { bookingId: targetId } });
            await tx.booking.delete({ where: { id: targetId } });
          });
        }
      } catch (err) {
        logServerError(err, "db.deleteCancelledBooking.prisma");
        throw new Error(`\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u062D\u062C\u0632 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A: ${err?.message || "\u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639"}`);
      }
    }
    memoryDB = loadLocalDB();
    memoryDB.bookings = memoryDB.bookings.filter((b) => b.id !== targetId);
    memoryDB.payments = memoryDB.payments.filter((p) => p.bookingId !== targetId);
    const removedOrderIds = new Set(
      (memoryDB.factoryOrders || []).filter((fo) => fo.bookingId === targetId).map((fo) => fo.id)
    );
    memoryDB.factoryOrders = memoryDB.factoryOrders.filter((fo) => fo.bookingId !== targetId);
    if (memoryDB.factoryPayments) {
      memoryDB.factoryPayments = memoryDB.factoryPayments.filter((fp) => !removedOrderIds.has(fp.factoryOrderId));
    }
    saveLocalDB(memoryDB);
    await this.addAuditLog({
      bookingId: "",
      bookingCode,
      action: "\u062D\u0630\u0641 \u062D\u062C\u0632 \u0645\u0644\u063A\u064A",
      performedBy,
      details: `\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0644\u063A\u064A \u0631\u0642\u0645 ${bookingCode} (\u0627\u0644\u0645\u0639\u0631\u0641: ${targetId}) \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0628\u0648\u0627\u0633\u0637\u0629 (${performedBy}) \u0628\u0639\u062F \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u062E\u0644\u0648\u0647 \u0645\u0646 \u0623\u064A \u0645\u062F\u0641\u0648\u0639\u0627\u062A \u0645\u0627\u0644\u064A\u0629.`
    });
    return {
      success: true,
      bookingCode,
      message: `\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0644\u063A\u064A \u0631\u0642\u0645 ${bookingCode} \u0628\u0646\u062C\u0627\u062D.`
    };
  },
  /**
   * Bulk Delete CANCELLED Bookings.
   * Safe iteration validating each booking independently.
   */
  async deleteBatchCancelledBookings(ids, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0642\u0627\u0626\u0645\u0629 \u0645\u0639\u0631\u0651\u0641\u0627\u062A \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u0645\u0644\u063A\u0627\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062D\u0630\u0641\u0647\u0627");
    }
    const deletedCodes = [];
    const skipped = [];
    for (const rawId of ids) {
      const cleanId = (rawId || "").trim();
      if (!cleanId || cleanId.startsWith("CLB-")) {
        skipped.push({ id: rawId, reason: "\u0627\u0644\u0645\u0639\u0631\u0641 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u062A\u0645 \u062A\u0645\u0631\u064A\u0631 \u0643\u0648\u062F \u0627\u0644\u062D\u062C\u0632 \u0628\u062F\u0644\u0627\u064B \u0645\u0646 bookingId" });
        continue;
      }
      try {
        const res = await this.deleteCancelledBooking(cleanId, performedBy);
        deletedCodes.push(res.bookingCode);
      } catch (err) {
        skipped.push({ id: cleanId, reason: err.message || "\u0641\u0634\u0644 \u0627\u0644\u062D\u0630\u0641" });
      }
    }
    if (deletedCodes.length > 0) {
      await this.addAuditLog({
        bookingId: "",
        bookingCode: "SYSTEM",
        action: "\u062D\u0630\u0641 \u062C\u0645\u0627\u0639\u064A \u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0645\u0644\u063A\u0627\u0629",
        performedBy,
        details: `\u0642\u0627\u0645 (${performedBy}) \u0628\u0639\u0645\u0644\u064A\u0629 \u062D\u0630\u0641 \u062C\u0645\u0627\u0639\u064A \u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0645\u0644\u063A\u0627\u0629: \u062A\u0645 \u062D\u0630\u0641 (${deletedCodes.length}) \u062D\u062C\u0632 \u0628\u0646\u062C\u0627\u062D [${deletedCodes.join(", ")}]\u060C \u0648\u062A\u062E\u0637\u064A (${skipped.length}) \u062D\u062C\u0632 \u0644\u0623\u0633\u0628\u0627\u0628 \u0623\u0645\u0646\u064A\u0629 \u0623\u0648 \u0645\u0627\u0644\u064A\u0629.`
      });
    }
    return {
      success: true,
      totalRequested: ids.length,
      deletedCount: deletedCodes.length,
      deletedCodes,
      skipped
    };
  },
  /**
   * Database Inventory & Pre-Deletion Scan
   * Categorizes all records into:
   * 1. PROTECTED_REAL (CLB-2026-5131)
   * 2. CONFIRMED_TEST (explicit isTest = true or test names/phones)
   * 3. LEGACY_DEMO (mock demo seed records)
   * 4. CANCELLED (all cancelled bookings)
   */
  async getDatabaseInventory() {
    const all = await this.getBookings();
    const protectedBookings = [];
    const confirmedTestBookings = [];
    const legacyDemoBookings = [];
    const cancelledBookings = [];
    const enrichedAll = [];
    for (const b of all) {
      const cat = classifyBookingRecord(b);
      enrichedAll.push({ ...b, classification: cat });
      if (cat === "PROTECTED_REAL") {
        protectedBookings.push(b);
      } else if (cat === "CONFIRMED_TEST") {
        confirmedTestBookings.push(b);
      } else {
        legacyDemoBookings.push(b);
      }
      if (b.status === "CANCELLED" && cat !== "PROTECTED_REAL") {
        cancelledBookings.push(b);
      }
    }
    return {
      summary: {
        total: all.length,
        protectedReal: protectedBookings.length,
        confirmedTest: confirmedTestBookings.length,
        legacyDemo: legacyDemoBookings.length,
        cancelled: cancelledBookings.length
      },
      protectedBookings,
      confirmedTestBookings,
      legacyDemoBookings,
      cancelledBookings,
      allBookings: enrichedAll
    };
  },
  /**
   * Permanent Cascade Deletion for Test & Demo Bookings
   * Removes from PostgreSQL tables and JSON storage with 100% cascade.
   * Strictly enforces exclusion and hard refusal for CLB-2026-5131.
   */
  async deleteBookingsPermanently(bookingIds, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0645\u0639\u0631\u0641\u0627\u062A \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062D\u0630\u0641\u0647\u0627 \u0646\u0647\u0627\u0626\u064A\u0627\u064B");
    }
    const deletedCodes = [];
    const skipped = [];
    const idsToDelete = [];
    const bookingsToDelete = [];
    for (const rawId of bookingIds) {
      const cleanId = (rawId || "").trim();
      if (!cleanId) continue;
      const booking = await this.resolveBookingAnyIdentifier(cleanId);
      if (!booking) {
        skipped.push({ id: cleanId, reason: "\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" });
        continue;
      }
      if (isStrictlyProtectedBooking(booking)) {
        skipped.push({
          id: booking.id,
          code: booking.bookingCode,
          reason: "\u0645\u062D\u0638\u0648\u0631 \u062A\u0645\u0627\u0645\u0627\u064B: \u0627\u0644\u062D\u062C\u0632 CLB-2026-5131 \u0647\u0648 \u062D\u062C\u0632 \u062D\u0642\u064A\u0642\u064A \u0645\u0639\u062A\u0645\u062F \u0644\u0644\u0639\u0645\u064A\u0644 \u0623\u062D\u0645\u062F \u0639\u0635\u0627\u0645 \u0627\u0644\u062F\u064A\u0646 \u0648\u0645\u062D\u0645\u064A \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0645\u0646 \u0623\u064A \u062D\u0630\u0641 \u0623\u0648 \u062A\u0639\u062F\u064A\u0644."
        });
        continue;
      }
      if (!idsToDelete.includes(booking.id)) {
        idsToDelete.push(booking.id);
        deletedCodes.push(booking.bookingCode);
        bookingsToDelete.push(booking);
      }
    }
    if (idsToDelete.length === 0) {
      const remaining2 = (await this.getBookings()).length;
      return {
        success: true,
        totalRequested: bookingIds.length,
        deletedCount: 0,
        deletedCodes: [],
        skipped,
        remainingCount: remaining2
      };
    }
    for (const b of bookingsToDelete) {
      const activePayments = (b.payments || []).filter((p) => p.status === "VALID");
      const paidTotal = activePayments.reduce((acc, p) => acc + Number(p.amount), 0);
      const ordersCount = (b.factoryOrders || []).length;
      const archiveSummary = `[\u0623\u0631\u0634\u0641\u0629 \u0648\u062A\u0648\u062B\u064A\u0642 \u0642\u0628\u0644 \u0627\u0644\u062D\u0630\u0641 \u0627\u0644\u0646\u0647\u0627\u0626\u064A]: \u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u062C\u0632 (${b.bookingCode}) \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0628\u0648\u0627\u0633\u0637\u0629 (${performedBy}). \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0639\u0645\u064A\u0644: ${b.customerName} (${b.customerPhone})\u060C \u0627\u0644\u062D\u0627\u0644\u0629: ${b.status}\u060C \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0648\u062C\u0628\u0627\u062A: ${b.totalMealsCount} \u0648\u062C\u0628\u0629\u060C \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0642\u064A\u0645\u0629: ${b.totalDistributorPrice} \u062C\u060C \u0627\u0644\u0645\u0633\u062F\u062F: ${paidTotal} \u062C (${activePayments.length} \u062F\u0641\u0639\u0627\u062A)\u060C \u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639: ${ordersCount}. \u0633\u062C\u0644 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u062D\u0641\u0648\u0638 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0644\u0644\u0623\u063A\u0631\u0627\u0636 \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A\u0629.`;
      await this.addAuditLog({
        bookingId: "",
        bookingCode: b.bookingCode,
        action: "\u062D\u0630\u0641 \u062D\u062C\u0632 \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0648\u0623\u0631\u0634\u0641\u062A\u0647",
        performedBy,
        details: archiveSummary
      });
    }
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.$transaction(async (tx) => {
            await tx.auditLog.updateMany({
              where: { bookingId: { in: idsToDelete } },
              data: { bookingId: null }
            });
            await tx.bookingItem.deleteMany({ where: { bookingId: { in: idsToDelete } } });
            await tx.payment.deleteMany({ where: { bookingId: { in: idsToDelete } } });
            await tx.factoryPayment.deleteMany({ where: { factoryOrder: { bookingId: { in: idsToDelete } } } });
            await tx.factoryOrder.deleteMany({ where: { bookingId: { in: idsToDelete } } });
            await tx.booking.deleteMany({ where: { id: { in: idsToDelete } } });
          });
        }
      } catch (err) {
        logServerError(err, "db.deleteBookingsPermanently.prisma");
      }
    }
    memoryDB = loadLocalDB();
    const idSet = new Set(idsToDelete);
    memoryDB.bookings = memoryDB.bookings.filter((b) => !idSet.has(b.id));
    memoryDB.payments = memoryDB.payments.filter((p) => !idSet.has(p.bookingId));
    const removedOrderIds = new Set(
      (memoryDB.factoryOrders || []).filter((fo) => idSet.has(fo.bookingId)).map((fo) => fo.id)
    );
    memoryDB.factoryOrders = memoryDB.factoryOrders.filter((fo) => !idSet.has(fo.bookingId));
    if (memoryDB.factoryPayments) {
      memoryDB.factoryPayments = memoryDB.factoryPayments.filter((fp) => !removedOrderIds.has(fp.factoryOrderId));
    }
    for (const log of memoryDB.auditLogs) {
      if (log.bookingId && idSet.has(log.bookingId)) {
        log.bookingId = "";
      }
    }
    saveLocalDB(memoryDB);
    const remaining = (await this.getBookings()).length;
    return {
      success: true,
      totalRequested: bookingIds.length,
      deletedCount: deletedCodes.length,
      deletedCodes,
      skipped,
      remainingCount: remaining
    };
  },
  async updateBookingByAdmin(id, updates, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    const cleanId = (id || "").trim();
    if (!cleanId) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0645\u0639\u0631\u0641 \u0627\u0644\u062D\u062C\u0632 \u0623\u0648 \u0643\u0648\u062F \u0627\u0644\u062D\u062C\u0632");
    }
    const booking = await this.resolveBookingAnyIdentifier(cleanId);
    if (!booking) {
      throw new Error(`\u062A\u0639\u0630\u0631 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0633\u062C\u0644 \u0627\u0644\u062D\u062C\u0632 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A (\u0627\u0644\u0645\u0639\u0631\u0651\u0641 \u0623\u0648 \u0627\u0644\u0643\u0648\u062F: "${cleanId}")`);
    }
    const meals = await this.getMeals(true);
    const mealsMap = new Map(meals.map((m) => [m.code, m]));
    let validatedItems = booking.items;
    let totalMealsCount = booking.totalMealsCount;
    let totalDistributorPrice = booking.totalDistributorPrice;
    let totalFactoryPrice = booking.totalFactoryPrice || 0;
    let profitMargin = booking.profitMargin || 0;
    let remainingAmount = booking.remainingAmount;
    if (updates.items && Array.isArray(updates.items)) {
      if (updates.items.length === 0) {
        throw new Error("\u064A\u062C\u0628 \u0623\u0646 \u064A\u062D\u062A\u0648\u064A \u0627\u0644\u062D\u062C\u0632 \u0639\u0644\u0649 \u0635\u0646\u0641 \u0648\u0627\u062D\u062F \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644");
      }
      totalMealsCount = 0;
      totalDistributorPrice = 0;
      totalFactoryPrice = 0;
      validatedItems = updates.items.map((item) => {
        const meal = mealsMap.get(item.mealCode);
        if (!meal) {
          throw new Error(`\u0627\u0644\u0648\u062C\u0628\u0629 ${item.mealCode} \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u064A\u0648 \u0627\u0644\u0645\u0639\u062A\u0645\u062F`);
        }
        const quantity = Math.max(1, Math.floor(item.quantity));
        totalMealsCount += quantity;
        const baseDistributorPrice = meal.distributorPrice;
        const baseFactoryPrice = meal.factoryPrice || 0;
        const sweetOpt = item.orientalSweetOption || "none";
        let orientalSweetDistributorDelta = 0;
        let orientalSweetFactoryDelta = 0;
        let sweetLabel = "\u0628\u062F\u0648\u0646 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A";
        if (sweetOpt === "add_with_juice") {
          orientalSweetDistributorDelta = 20;
          orientalSweetFactoryDelta = 10;
          sweetLabel = "\u0625\u0636\u0627\u0641\u0629 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A \u0645\u0639 \u0627\u0644\u0639\u0635\u064A\u0631 (+20 \u062C)";
        } else if (sweetOpt === "replace_juice") {
          orientalSweetDistributorDelta = 15;
          orientalSweetFactoryDelta = 5;
          sweetLabel = "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A (+15 \u062C)";
        }
        let distributorDrinkDelta = 0;
        let factoryDrinkDelta = 0;
        if (sweetOpt !== "replace_juice" && meal.hasJuice) {
          if (item.drinkOption === "no_juice") {
            distributorDrinkDelta = -CELEBRE_CONFIG.drinkAdjustments.noJuiceDiscount;
            factoryDrinkDelta = -FACTORY_PEPSI_ACCOUNTING.totalJuiceDeduction;
          } else if (item.drinkOption === "pepsi") {
            distributorDrinkDelta = CELEBRE_CONFIG.drinkAdjustments.pepsiExtra;
            factoryDrinkDelta = FACTORY_PEPSI_ACCOUNTING.netAdjustment;
          }
        }
        const unitDistributorPrice = Math.max(0, baseDistributorPrice + distributorDrinkDelta + orientalSweetDistributorDelta);
        const unitFactoryPrice = Math.max(0, baseFactoryPrice + factoryDrinkDelta + orientalSweetFactoryDelta);
        const itemTotalDistributor = unitDistributorPrice * quantity;
        const itemTotalFactory = unitFactoryPrice * quantity;
        totalDistributorPrice += itemTotalDistributor;
        totalFactoryPrice += itemTotalFactory;
        return {
          mealId: meal.id,
          mealCode: meal.code,
          mealName: meal.name,
          category: meal.category,
          ingredients: meal.ingredients,
          quantity,
          drinkOption: item.drinkOption,
          orientalSweetOption: sweetOpt,
          orientalSweetLabel: sweetLabel,
          baseDistributorPrice,
          unitDistributorPrice,
          totalDistributorPrice: itemTotalDistributor,
          baseFactoryPrice,
          factoryDrinkAdjustment: factoryDrinkDelta,
          factoryOrientalSweetAdjustment: orientalSweetFactoryDelta,
          unitFactoryPrice,
          totalFactoryPrice: itemTotalFactory
        };
      });
      profitMargin = totalDistributorPrice - totalFactoryPrice;
      remainingAmount = Math.max(0, totalDistributorPrice - booking.paidAmount);
    }
    const targetStatus = updates.status || booking.status;
    if ((targetStatus === "CONFIRMED" || targetStatus === "IN_PRODUCTION") && totalMealsCount < 50) {
      throw new Error(`\u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u062D\u062C\u0632 \u0623\u0648 \u0646\u0642\u0644\u0647 \u0644\u0644\u062A\u0634\u063A\u064A\u0644 \u0628\u0643\u0645\u064A\u0629 \u062A\u0642\u0644 \u0639\u0646 50 \u0648\u062C\u0628\u0629 (\u0627\u0644\u0643\u0645\u064A\u0629 \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629: ${totalMealsCount} \u0648\u062C\u0628\u0629). \u064A\u0631\u062C\u0649 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0643\u0645\u064A\u0627\u062A \u0623\u0648\u0644\u0627\u064B.`);
    }
    const updatedBooking = {
      ...booking,
      customerName: updates.customerName !== void 0 ? updates.customerName.trim() : booking.customerName,
      customerPhone: updates.customerPhone !== void 0 ? updates.customerPhone.trim() : booking.customerPhone,
      customerWhatsapp: updates.customerWhatsapp !== void 0 ? updates.customerWhatsapp.trim() : booking.customerWhatsapp,
      preferredContact: updates.preferredContact || booking.preferredContact,
      eventName: updates.eventName !== void 0 ? updates.eventName.trim() : booking.eventName,
      eventDate: updates.eventDate || booking.eventDate,
      deliveryTime: updates.deliveryTime || booking.deliveryTime,
      deliveryGovernorate: updates.deliveryGovernorate || booking.deliveryGovernorate,
      deliveryAddress: updates.deliveryAddress !== void 0 ? updates.deliveryAddress.trim() : booking.deliveryAddress,
      notes: updates.notes !== void 0 ? updates.notes.trim() : booking.notes,
      status: targetStatus,
      statusNotes: updates.statusNotes !== void 0 ? updates.statusNotes : booking.statusNotes,
      items: validatedItems,
      totalMealsCount,
      totalDistributorPrice,
      totalFactoryPrice,
      profitMargin,
      remainingAmount,
      version: booking.version + 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryDB = loadLocalDB();
    const memIdx = memoryDB.bookings.findIndex((b) => b.id === booking.id);
    if (memIdx !== -1) {
      memoryDB.bookings[memIdx] = updatedBooking;
      saveLocalDB(memoryDB);
    }
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.booking.update({
            where: { id: booking.id },
            data: {
              customerName: updatedBooking.customerName,
              customerPhone: updatedBooking.customerPhone,
              customerWhatsapp: updatedBooking.customerWhatsapp,
              preferredContact: updatedBooking.preferredContact,
              eventName: updatedBooking.eventName,
              eventDate: updatedBooking.eventDate,
              deliveryTime: updatedBooking.deliveryTime,
              deliveryGovernorate: updatedBooking.deliveryGovernorate,
              deliveryAddress: updatedBooking.deliveryAddress,
              notes: updatedBooking.notes,
              status: updatedBooking.status,
              statusNotes: updatedBooking.statusNotes,
              totalMealsCount: updatedBooking.totalMealsCount,
              totalDistributorPrice: updatedBooking.totalDistributorPrice,
              totalFactoryPrice: updatedBooking.totalFactoryPrice,
              profitMargin: updatedBooking.profitMargin,
              remainingAmount: updatedBooking.remainingAmount,
              version: updatedBooking.version,
              updatedAt: /* @__PURE__ */ new Date()
            }
          });
          if (updates.items && Array.isArray(updates.items)) {
            await client.bookingItem.deleteMany({ where: { bookingId: booking.id } });
            await client.bookingItem.createMany({
              data: validatedItems.map((it) => ({
                bookingId: booking.id,
                mealId: it.mealId,
                mealCode: it.mealCode,
                mealName: it.mealName,
                category: it.category,
                ingredients: it.ingredients,
                quantity: it.quantity,
                drinkOption: it.drinkOption,
                orientalSweetOption: it.orientalSweetOption || "none",
                baseDistributorPrice: it.baseDistributorPrice,
                unitDistributorPrice: it.unitDistributorPrice,
                totalDistributorPrice: it.totalDistributorPrice,
                baseFactoryPrice: it.baseFactoryPrice,
                unitFactoryPrice: it.unitFactoryPrice,
                totalFactoryPrice: it.totalFactoryPrice
              }))
            });
          }
        }
      } catch (err) {
        logServerError(err, "db.updateBookingByAdmin.prisma");
      }
    }
    await this.addAuditLog({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      action: "\u062A\u0639\u062F\u064A\u0644 \u062D\u062C\u0632 \u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629",
      performedBy,
      details: `\u062A\u0645 \u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u062C\u0632 ${booking.bookingCode} (\u0627\u0644\u0625\u0635\u062F\u0627\u0631 v${updatedBooking.version}). \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0648\u062C\u0628\u0627\u062A: ${totalMealsCount}\u060C \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0642\u064A\u0645\u0629: ${totalDistributorPrice} \u062C.`
    });
    return updatedBooking;
  },
  async confirmBooking(id, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    const cleanId = (id || "").trim();
    if (!cleanId) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0639\u0631\u0641 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0644\u0644\u062D\u062C\u0632 (bookingId)");
    }
    if (cleanId.startsWith("CLB-")) {
      throw new Error("\u0639\u0645\u0644\u064A\u0627\u062A \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u062C\u0632 \u062A\u062A\u0637\u0644\u0628 \u0627\u0644\u0645\u0639\u0631\u0641 \u0627\u0644\u0623\u0633\u0627\u0633\u064A bookingId \u0641\u0642\u0637 \u0648\u0644\u0627 \u062A\u0642\u0628\u0644 bookingCode.");
    }
    const booking = await this.getBookingByPrimaryId(cleanId);
    if (!booking) {
      throw new Error("\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    }
    if (booking.totalMealsCount < 50) {
      throw new Error(`\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0623\u0643\u064A\u062F \u062D\u062C\u0632 \u064A\u0642\u0644 \u0625\u062C\u0645\u0627\u0644\u064A \u0648\u062C\u0628\u0627\u062A\u0647 \u0639\u0646 50 \u0648\u062C\u0628\u0629 (\u0627\u0644\u0639\u062F\u062F \u0627\u0644\u062D\u0627\u0644\u064A: ${booking.totalMealsCount} \u0648\u062C\u0628\u0629). \u064A\u0631\u062C\u0649 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0643\u0645\u064A\u0627\u062A \u0623\u0648\u0644\u0627\u064B \u0644\u062A\u0635\u0644 \u0625\u0644\u0649 50 \u0648\u062C\u0628\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.`);
    }
    const prevStatus = booking.status;
    const newVersion = booking.version + 1;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const updatedBooking = {
      ...booking,
      status: "CONFIRMED",
      statusNotes: `\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0648\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u062D\u062C\u0632 \u0631\u0633\u0645\u064A\u0627\u064B \u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 (${performedBy}) \u0641\u064A ${(/* @__PURE__ */ new Date()).toLocaleString("ar-EG")}.`,
      version: newVersion,
      updatedAt: now
    };
    memoryDB = loadLocalDB();
    const memIdx = memoryDB.bookings.findIndex((b) => b.id === booking.id);
    if (memIdx !== -1) {
      memoryDB.bookings[memIdx] = updatedBooking;
      saveLocalDB(memoryDB);
    }
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.booking.update({
            where: { id: booking.id },
            data: {
              status: "CONFIRMED",
              statusNotes: updatedBooking.statusNotes,
              version: newVersion,
              updatedAt: /* @__PURE__ */ new Date()
            }
          });
        }
      } catch (err) {
        logServerError(err, "db.confirmBooking.prisma");
      }
    }
    await this.addAuditLog({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      action: "\u062A\u0623\u0643\u064A\u062F \u0648\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u062D\u062C\u0632",
      performedBy,
      details: `\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0648\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u062D\u062C\u0632 ${booking.bookingCode} (\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062D\u0627\u0644\u0629 \u0645\u0646 ${prevStatus} \u0625\u0644\u0649 CONFIRMED) \u0628\u0648\u0627\u0633\u0637\u0629 (${performedBy}). \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0648\u062C\u0628\u0627\u062A: ${booking.totalMealsCount} \u0648\u062C\u0628\u0629\u060C \u0627\u0644\u0642\u064A\u0645\u0629: ${booking.totalDistributorPrice} \u062C.\u0645.`
    });
    return updatedBooking;
  },
  async confirmFactoryOrderSent(orderId, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    memoryDB = loadLocalDB();
    const order = memoryDB.factoryOrders.find((fo) => fo.id === orderId || fo.orderNumber === orderId);
    if (!order) {
      throw new Error("\u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    order.status = "MANUALLY_CONFIRMED";
    order.sentBy = performedBy;
    order.sentAt = now;
    order.updatedAt = now;
    if (databaseUrl) {
      try {
        const client = getPrismaClient();
        if (client) {
          await client.factoryOrder.updateMany({
            where: { OR: [{ id: order.id }, { orderNumber: order.orderNumber }] },
            data: { status: "MANUALLY_CONFIRMED", updatedAt: /* @__PURE__ */ new Date() }
          });
        }
      } catch (err) {
        logServerError(err, "db.confirmFactoryOrderSent.prisma");
      }
    }
    await this.addAuditLog({
      bookingId: order.bookingId,
      bookingCode: order.bookingCode || "FACTORY_ORDER",
      action: "\u062A\u0623\u0643\u064A\u062F \u0625\u0631\u0633\u0627\u0644 \u0623\u0645\u0631 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0644\u0644\u0645\u0635\u0646\u0639 \u064A\u062F\u0648\u064A\u0627\u064B",
      performedBy,
      details: `\u0642\u0627\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u064A (${performedBy}) \u0628\u062A\u0623\u0643\u064A\u062F \u0625\u0631\u0633\u0627\u0644 \u0623\u0645\u0631 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 ${order.orderNumber} (\u0627\u0644\u0625\u0635\u062F\u0627\u0631 v${order.version}) \u0625\u0644\u0649 \u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0645\u0635\u0646\u0639 \u064A\u062F\u0648\u064A\u0627\u064B \u0641\u064A ${now}.`
    });
    saveLocalDB(memoryDB);
    return order;
  }
};
function buildFactoryWhatsAppMessage(factoryOrder, booking, factoryPhone) {
  const itemsText = factoryOrder.items.map((it, idx) => {
    let drinkText = "\u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A";
    if (it.orientalSweetOption === "replace_juice") {
      drinkText = "\u0627\u0644\u0639\u0635\u064A\u0631 \u0645\u0633\u062A\u0628\u062F\u0644 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A";
    } else if (it.drinkOption === "pepsi") {
      drinkText = "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0643\u0627\u0646\u0632 \u0628\u064A\u0628\u0633\u064A";
    } else if (it.drinkOption === "no_juice") {
      drinkText = "\u0628\u062F\u0648\u0646 \u0639\u0635\u064A\u0631";
    } else if (it.drinkLabel) {
      drinkText = it.drinkLabel;
    }
    let sweetText = "";
    if (it.orientalSweetOption === "add_with_juice") {
      sweetText = "\u0625\u0636\u0627\u0641\u0629 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A \u0645\u0639 \u0627\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0628\u0627\u0644\u0639\u0635\u064A\u0631 (+10 \u062C \u0644\u0644\u0645\u0635\u0646\u0639)";
    } else if (it.orientalSweetOption === "replace_juice") {
      sweetText = "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A (+5 \u062C \u0644\u0644\u0645\u0635\u0646\u0639)";
    } else if (it.orientalSweetLabel && it.orientalSweetLabel !== "\u0628\u062F\u0648\u0646 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A") {
      sweetText = it.orientalSweetLabel;
    }
    const itemHeader = factoryOrder.items.length > 1 ? `*\u0637\u0644\u0628 (${idx + 1}):* ` : "";
    const row = [
      `\u2022 ${itemHeader}*\u0627\u0644\u0648\u062C\u0628\u0629:* ${it.mealName} (${it.mealCode})`,
      `  - *\u062E\u064A\u0627\u0631 \u0627\u0644\u0645\u0634\u0631\u0648\u0628:* ${drinkText}`
    ];
    if (sweetText) {
      row.push(`  - *\u0625\u0636\u0627\u0641\u0629 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A:* ${sweetText}`);
    }
    row.push(
      `  - *\u0627\u0644\u0643\u0645\u064A\u0629:* ${it.quantity} \u0628\u0648\u0643\u0633`,
      `  - *\u0633\u0639\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 \u0627\u0644\u0645\u0639\u062F\u0651\u0644 \u0644\u0644\u0628\u0648\u0643\u0633:* ${it.unitFactoryPrice ?? 0} \u062C.\u0645`,
      `  - *\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0635\u0646\u0641 \u0644\u0644\u0645\u0635\u0646\u0639:* ${it.totalFactoryPrice ?? 0} \u062C.\u0645`,
      `  - *\u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A:* ${it.ingredients}`
    );
    return row.join("\n");
  }).join("\n\n");
  const totalCost = factoryOrder.factoryCostTotal || 0;
  const totalBoxes = factoryOrder.items.reduce((sum, it) => sum + (it.quantity || 0), 0) || booking.totalMealsCount;
  const validPayments = (factoryOrder.payments || []).filter((p) => p.status === "VALID");
  const paidToFactory = factoryOrder.paidToFactoryAmount !== void 0 ? factoryOrder.paidToFactoryAmount : validPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingToFactory = totalCost - paidToFactory;
  const paymentSummaryLines = [];
  if (paidToFactory > 0 || validPayments.length > 0) {
    paymentSummaryLines.push(
      `*\u0627\u0644\u0645\u062F\u0641\u0648\u0639 \u0644\u0644\u0645\u0635\u0646\u0639 (\u0627\u0644\u0639\u0631\u0628\u0648\u0646 / \u0627\u0644\u062F\u0641\u0639\u0627\u062A):* ${paidToFactory.toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647 \u0645\u0635\u0631\u064A`
    );
    if (remainingToFactory < 0) {
      paymentSummaryLines.push(
        `*\u0631\u0635\u064A\u062F \u062F\u0627\u0626\u0646 (\u0633\u062F\u0627\u062F \u0628\u0627\u0644\u0632\u064A\u0627\u062F\u0629 \u0644\u0644\u0645\u0635\u0646\u0639):* +${Math.abs(remainingToFactory).toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647 \u0645\u0635\u0631\u064A`
      );
    } else {
      paymentSummaryLines.push(
        `*\u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0644\u0644\u0645\u0635\u0646\u0639:* ${remainingToFactory.toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647 \u0645\u0635\u0631\u064A`
      );
    }
    if (validPayments.length > 0) {
      paymentSummaryLines.push(`*\u062A\u0641\u0627\u0635\u064A\u0644 \u062F\u0641\u0639\u0627\u062A \u0627\u0644\u0645\u0635\u0646\u0639 (${validPayments.length}):*`);
      validPayments.forEach((p, idx) => {
        const typeLabel = formatFactoryPaymentTypeLabel(p.paymentType);
        const methodLabel = formatFactoryPaymentMethodLabel(p.method);
        const recPart = p.receiptNumber ? ` | \u0645\u0631\u062C\u0639: ${p.receiptNumber}` : "";
        const notePart = p.notes ? ` (${p.notes})` : "";
        paymentSummaryLines.push(
          `  ${idx + 1}. ${typeLabel}: ${p.amount.toLocaleString("ar-EG")} \u062C.\u0645 - ${methodLabel} - \u0628\u062A\u0627\u0631\u064A\u062E ${p.date}${recPart}${notePart}`
        );
      });
    }
  }
  const lines = [
    `*\u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0645\u0637\u0628\u062E \u0648\u0645\u0635\u0646\u0639 C\xC9L\xC8BRE CATERING*`,
    `-----------------------------------------`,
    `*\u0631\u0642\u0645 \u0623\u0645\u0631 \u0627\u0644\u062A\u0634\u063A\u064A\u0644:* ${factoryOrder.orderNumber} (\u0627\u0644\u0625\u0635\u062F\u0627\u0631 v${factoryOrder.version})`,
    `*\u0631\u0642\u0645 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0631\u062C\u0639\u064A:* ${booking.bookingCode}`,
    `*\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0639\u0645\u064A\u0644:* ${booking.customerName} | \u0647\u0627\u062A\u0641: ${booking.customerPhone}`,
    ...booking.customerWhatsapp && booking.customerWhatsapp !== booking.customerPhone ? [`*\u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0639\u0645\u064A\u0644:* ${booking.customerWhatsapp}`] : [],
    ...booking.eventName ? [`*\u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629:* ${booking.eventName}`] : [],
    `*\u0627\u0644\u062A\u0627\u0631\u064A\u062E:* ${factoryOrder.eventDate}`,
    `*\u0627\u0644\u0648\u0642\u062A:* ${factoryOrder.deliveryTime}`,
    `*\u0645\u0643\u0627\u0646 \u0627\u0644\u062A\u0633\u0644\u064A\u0645:* ${factoryOrder.deliveryLocation}`,
    `-----------------------------------------`,
    `*\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0637\u0644\u0628 (${factoryOrder.items.length} ${factoryOrder.items.length > 1 ? "\u0623\u0635\u0646\u0627\u0641" : "\u0635\u0646\u0641"}):*`,
    itemsText,
    ...booking.notes && booking.notes.trim() ? [`
*\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0639\u0645\u064A\u0644 \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628:* ${booking.notes.trim()}`] : [],
    `-----------------------------------------`,
    `*\u0625\u062C\u0645\u0627\u0644\u064A \u0639\u062F\u062F \u0627\u0644\u0628\u0648\u0643\u0633\u0627\u062A:* ${totalBoxes} \u0628\u0648\u0643\u0633`,
    `*\u0625\u062C\u0645\u0627\u0644\u064A \u062A\u0643\u0644\u0641\u0629 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639:* ${totalCost.toLocaleString("ar-EG")} \u062C\u0646\u064A\u0647 \u0645\u0635\u0631\u064A`,
    ...paymentSummaryLines
  ];
  const messageText = lines.join("\n");
  const cleanPhone = (factoryPhone || "").replace(/\D/g, "");
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}` : "";
  return { messageText, whatsappUrl };
}

// src/server/metaService.ts
var META_CONFIG = {
  verifyToken: process.env.META_VERIFY_TOKEN || "celebre_meta_verify_token_2026",
  pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN || "",
  appSecret: process.env.META_APP_SECRET || "",
  phoneNumberId: process.env.META_PHONE_NUMBER_ID || "",
  apiVersion: "v21.0",
  officialPageUrl: "https://m.me/celebre.catering",
  officialWhatsAppNumber: CELEBRE_CONFIG.whatsappNumber
};
function isMetaAutomatedConfigured() {
  return Boolean(
    META_CONFIG.pageAccessToken && META_CONFIG.pageAccessToken.length > 25 && !META_CONFIG.pageAccessToken.includes("YOUR_") && !META_CONFIG.pageAccessToken.includes("MY_")
  );
}
function handleMetaWebhookVerification(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  console.log(`[Meta Webhook] Verification request received. Mode: ${mode}, Token: ${token ? "***" : "missing"}`);
  if (mode && token) {
    if (mode === "subscribe" && token === META_CONFIG.verifyToken) {
      console.log("[Meta Webhook] Verification successful. Responding with challenge.");
      res.status(200).send(challenge);
      return;
    } else {
      console.warn("[Meta Webhook] Verification failed: Token mismatch or invalid mode.");
      res.status(403).json({ error: "Verification token mismatch" });
      return;
    }
  }
  res.status(400).json({ error: "Missing hub.mode or hub.verify_token query parameters" });
}
function handleMetaWebhookEvent(req, res) {
  try {
    const body = req.body;
    console.log("[Meta Webhook] Event payload received:", JSON.stringify(body, null, 2));
    if (body.object === "page") {
      body.entry?.forEach((entry) => {
        const webhookEvent = entry.messaging?.[0];
        if (webhookEvent) {
          const senderPsid = webhookEvent.sender?.id;
          console.log(`[Meta Messenger] Received event from sender PSID: ${senderPsid}`);
          if (webhookEvent.message) {
            console.log(`[Meta Messenger] Message text: ${webhookEvent.message.text}`);
          }
        }
      });
      res.status(200).send("EVENT_RECEIVED");
      return;
    }
    if (body.object === "whatsapp_business_account") {
      body.entry?.forEach((entry) => {
        entry.changes?.forEach((change) => {
          if (change.field === "messages") {
            const message = change.value?.messages?.[0];
            if (message) {
              console.log(`[Meta WhatsApp] Received message from: ${message.from}, type: ${message.type}`);
            }
          }
        });
      });
      res.status(200).send("EVENT_RECEIVED");
      return;
    }
    res.status(200).send("EVENT_RECEIVED");
  } catch (err) {
    console.error("[Meta Webhook] Error handling webhook event:", err);
    res.status(200).send("EVENT_RECEIVED");
  }
}
function getMetaDiagnosticStatus() {
  const isConfigured = isMetaAutomatedConfigured();
  return {
    automatedTransmissionActive: isConfigured,
    environmentMode: isConfigured ? "PRODUCTION_AUTOMATED" : "STANDALONE_FALLBACK_ACTIVE",
    webhookVerificationUrl: "/api/webhooks/meta",
    verifyTokenConfigured: Boolean(META_CONFIG.verifyToken),
    pageAccessTokenConfigured: isConfigured,
    directChannels: {
      whatsappNumber: CELEBRE_CONFIG.whatsappNumber,
      whatsappDirectUrl: `https://wa.me/${CELEBRE_CONFIG.whatsappNumber}`,
      messengerPageUrl: "https://m.me/celebre.catering",
      facebookPage: CELEBRE_CONFIG.socials.facebook,
      hotline: CELEBRE_CONFIG.hotline
    },
    transparencyNotice: isConfigured ? "\u062A\u0645 \u062A\u0647\u064A\u0626\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0639\u062A\u0645\u0627\u062F Meta Graph API \u0628\u0646\u062C\u0627\u062D \u0644\u0644\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0622\u0644\u064A." : "\u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0622\u0644\u064A \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u064A\u062A\u0637\u0644\u0628 \u0625\u062F\u062E\u0627\u0644 META_PAGE_ACCESS_TOKEN \u0631\u0633\u0645\u064A \u0645\u0646 Meta Developer Portal. \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u064A\u0639\u0645\u0644 \u0628\u0643\u0641\u0627\u0621\u0629 100% \u0639\u0628\u0631 \u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 (WhatsApp wa.me \u0648 Messenger m.me)\u060C \u0648\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u062A\u064F\u062D\u0641\u0638 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0635\u0648\u0631\u0629 \u0641\u0648\u0631\u064A\u0629 \u0648\u0645\u0633\u062A\u0642\u0644\u0629 \u062A\u0645\u0627\u0645\u0627\u064B."
  };
}
function buildBookingWhatsAppMessage(booking) {
  const itemsSummary = booking.items.map((it) => {
    let drinkLabel = it.drinkOption === "no_juice" ? "\u0628\u062F\u0648\u0646 \u0639\u0635\u064A\u0631 (-5\u062C)" : it.drinkOption === "pepsi" ? "\u0628\u064A\u0628\u0633\u064A (+10\u062C)" : "\u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629";
    if (it.orientalSweetOption === "replace_juice") {
      drinkLabel = "\u0627\u0644\u0639\u0635\u064A\u0631 \u0645\u0633\u062A\u0628\u062F\u0644 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A (+15\u062C)";
    } else if (it.orientalSweetOption === "add_with_juice") {
      drinkLabel += " + \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A (+20\u062C)";
    }
    return `\u2022 \u0643\u0648\u062F: ${it.mealCode} | \u0627\u0644\u0639\u062F\u062F: ${it.quantity} \u0648\u062C\u0628\u0629 | ${drinkLabel} | \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A: ${it.totalDistributorPrice} \u062C`;
  }).join("\n");
  const rawText = `*\u0637\u0644\u0628 \u062D\u062C\u0632 \u062C\u062F\u064A\u062F - C\xC9L\xC8BRE CATERING*
-----------------------------------------
*\u0631\u0642\u0645 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0639\u062A\u0645\u062F:* ${booking.bookingCode}
*\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0633\u0631\u064A:* ${booking.securityCode}
*\u0627\u0633\u0645 \u0627\u0644\u0639\u0645\u064A\u0644:* ${booking.customerName}
*\u0631\u0642\u0645 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644:* ${booking.customerPhone}
*\u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629:* ${booking.eventName}
*\u062A\u0627\u0631\u064A\u062E \u0648\u0645\u0648\u0639\u062F \u0627\u0644\u062A\u0633\u0644\u064A\u0645:* ${booking.eventDate} \u0627\u0644\u0633\u0627\u0639\u0629 ${booking.deliveryTime}
*\u0645\u0643\u0627\u0646 \u0627\u0644\u062A\u0633\u0644\u064A\u0645:* ${booking.deliveryGovernorate} - ${booking.deliveryAddress}
-----------------------------------------
*\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0648\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629:*
${itemsSummary}
-----------------------------------------
*\u0625\u062C\u0645\u0627\u0644\u064A \u0639\u062F\u062F \u0627\u0644\u0628\u0648\u0643\u0633\u0627\u062A:* ${booking.totalMealsCount} \u0628\u0648\u0643\u0633
*\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u062A\u0642\u062F\u064A\u0631\u064A\u0629:* ${booking.totalDistributorPrice} \u062C\u0646\u064A\u0647 \u0645\u0635\u0631\u064A
*\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0639\u0645\u064A\u0644:* ${booking.notes || "\u0644\u0627 \u064A\u0648\u062C\u062F"}
-----------------------------------------
*\u0645\u062A\u0627\u0628\u0639\u0629 \u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u062C\u0632:* https://celebre-eg.com/track?code=${booking.bookingCode}&verify=${booking.securityCode}
*\u0627\u0644\u062E\u0637 \u0627\u0644\u0633\u0627\u062E\u0646:* 01284484868
\xAB\u0643\u0644 \u0645\u0646\u0627\u0633\u0628\u0629.. \u0623\u062D\u0644\u0649 \u0645\u0639 \u0633\u064A\u0644\u064A\u0628\u0631\u064A\xBB`;
  const encoded = encodeURIComponent(rawText);
  const directUrl = `https://wa.me/${CELEBRE_CONFIG.whatsappNumber}?text=${encoded}`;
  return {
    messageText: rawText,
    directUrl
  };
}
async function notifyBookingViaMeta(booking) {
  if (!isMetaAutomatedConfigured()) {
    console.log(`[Meta Service] Skipping automated API dispatch for ${booking.bookingCode}: Real credentials not set.`);
    return {
      attempted: false,
      delivered: false,
      channel: "DIRECT_LINK_FALLBACK",
      note: "\u062D\u0641\u0638 \u0627\u0644\u062D\u062C\u0632 \u0645\u0624\u0643\u062F \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A. \u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0639\u0645\u064A\u0644 \u0648\u0627\u0644\u0625\u062F\u0627\u0631\u0629."
    };
  }
  try {
    console.log(`[Meta Service] Attempting Meta Graph API dispatch for booking ${booking.bookingCode}...`);
    const response = await fetch(`https://graph.facebook.com/${META_CONFIG.apiVersion}/me/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${META_CONFIG.pageAccessToken}`
      },
      body: JSON.stringify({
        messaging_type: "MESSAGE_TAG",
        tag: "CONFIRMED_EVENT_UPDATE",
        recipient: {
          phone_number: booking.customerWhatsapp || booking.customerPhone
        },
        message: {
          text: `\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u062D\u062C\u0632\u0643 \u0644\u062F\u0649 \u0633\u064A\u0644\u064A\u0628\u0631\u064A \u0643\u0627\u062A\u0631\u064A\u0646\u062C \u0628\u0631\u0642\u0645: ${booking.bookingCode}. \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629: ${booking.securityCode}. \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A: ${booking.totalDistributorPrice} \u062C. \u0644\u0644\u062A\u0648\u0627\u0635\u0644: 01284484868.`
        }
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Meta Service] Meta Graph API returned non-OK status ${response.status}:`, errText);
      return {
        attempted: true,
        delivered: false,
        channel: "DIRECT_LINK_FALLBACK",
        note: `\u062A\u0639\u0630\u0631 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0639\u0628\u0631 Meta API (${response.status})\u060C \u0648\u062A\u0645 \u062A\u0648\u0641\u064A\u0631 \u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0641\u0648\u0631\u064A\u0629. \u0627\u0644\u062D\u062C\u0632 \u0645\u062D\u0641\u0648\u0638 \u0628\u0623\u0645\u0627\u0646.`
      };
    }
    const data = await response.json();
    console.log(`[Meta Service] Meta Graph API success:`, data);
    return {
      attempted: true,
      delivered: true,
      channel: "META_GRAPH_API",
      note: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631 \u0627\u0644\u0622\u0644\u064A \u0628\u0646\u062C\u0627\u062D."
    };
  } catch (err) {
    console.warn(`[Meta Service] Network or API error during Meta dispatch (non-blocking):`, err?.message || err);
    return {
      attempted: true,
      delivered: false,
      channel: "DIRECT_LINK_FALLBACK",
      note: "\u0641\u0634\u0644 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u062E\u0627\u0631\u062C\u064A \u0628\u0640 Meta\u060C \u0648\u0627\u0644\u062D\u062C\u0632 \u0645\u062D\u0641\u0648\u0638 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A."
    };
  }
}
async function sendAdminRecoveryOtpViaMeta(username, otp) {
  if (!isMetaAutomatedConfigured()) {
    return false;
  }
  try {
    const response = await fetch(`https://graph.facebook.com/${META_CONFIG.apiVersion}/me/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${META_CONFIG.pageAccessToken}`
      },
      body: JSON.stringify({
        messaging_type: "UPDATE",
        recipient: {
          phone_number: META_CONFIG.officialWhatsAppNumber
        },
        message: {
          text: `\u0631\u0645\u0632 \u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0644\u062D\u0633\u0627\u0628 (${username}) \u0647\u0648: ${otp} (\u0635\u0627\u0644\u062D \u0644\u0645\u062F\u0629 10 \u062F\u0642\u0627\u0626\u0642 \u0648\u0644\u0644\u0645\u0631\u0629 \u0627\u0644\u0648\u0627\u062D\u062F\u0629 \u0641\u0642\u0637).`
        }
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

// src/server/menuPdfGenerator.ts
function generateMenuPdfHtml(meals, autoPrint = false) {
  const mixBoxMeals = meals.filter((m) => m.category === "mix_box" && m.isActive).sort((a, b) => a.code.localeCompare(b.code, void 0, { numeric: true }));
  const sandwichBoxMeals = meals.filter((m) => m.category === "sandwich_box" && m.isActive).sort((a, b) => a.code.localeCompare(b.code, void 0, { numeric: true }));
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u0645\u0646\u064A\u0648 \u0633\u064A\u0644\u064A\u0628\u0631\u064A \u0643\u0627\u062A\u0631\u064A\u0646\u062C \u0627\u0644\u0631\u0633\u0645\u064A \u0627\u0644\u0645\u0639\u062A\u0645\u062F | C\xC9L\xC8BRE CATERING</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --burgundy: #7A0C2E;
      --burgundy-dark: #560820;
      --gold: #C59B27;
      --gold-dark: #9A7718;
      --gold-light: #DFC066;
      --cream: #FAF8F5;
      --border-color: #E2D5BA;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--cream);
      color: #1e293b;
      line-height: 1.5;
      direction: rtl;
      text-align: right;
      padding: 24px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid var(--gold);
      border-radius: 24px;
      padding: 36px 40px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    }
    .no-print-toolbar {
      position: sticky;
      top: 10px;
      z-index: 100;
      background: var(--burgundy);
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 14px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(122, 12, 46, 0.3);
    }
    .print-btn {
      background: var(--gold);
      color: #1e293b;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 14px;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s;
    }
    .print-btn:hover {
      background: #dfc066;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid var(--gold);
      padding-bottom: 24px;
      margin-bottom: 28px;
      position: relative;
    }
    .logo {
      width: 100px;
      height: 100px;
      margin: 0 auto 12px auto;
      object-fit: contain;
      display: block;
    }
    .title {
      font-family: 'Playfair Display', 'Cairo', serif;
      font-size: 32px;
      font-weight: 900;
      color: var(--burgundy);
      letter-spacing: 0.5px;
    }
    .slogan {
      font-size: 18px;
      font-weight: 800;
      color: var(--gold);
      margin-top: 4px;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin-top: 6px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    .contact-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 20px;
      background: var(--cream);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 10px 16px;
      margin-top: 16px;
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }
    .contact-item span {
      color: var(--burgundy);
      font-family: monospace;
      font-size: 14px;
      font-weight: 800;
    }
    .section-header {
      background: linear-gradient(90deg, var(--burgundy), #94133A);
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 12px;
      margin-top: 24px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title {
      font-size: 18px;
      font-weight: 800;
    }
    .badge {
      background: var(--gold);
      color: #1e293b;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 800;
    }
    .meals-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }
    .meal-card {
      background: var(--cream);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      break-inside: avoid;
    }
    .meal-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #ebdcc3;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .meal-code {
      font-family: monospace;
      font-weight: 900;
      font-size: 13px;
      color: var(--burgundy);
      background: #ffffff;
      border: 1px solid #e0d0b0;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .meal-price {
      font-weight: 900;
      font-size: 15px;
      color: var(--burgundy);
    }
    .meal-desc {
      font-size: 12px;
      color: #1e293b;
      line-height: 1.6;
      font-weight: 600;
    }
    .meal-footer {
      font-size: 10px;
      color: #64748b;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dashed #d5c5a0;
    }
    .policy-box {
      background: #ffffff;
      border: 2px solid var(--gold);
      border-radius: 14px;
      padding: 16px 20px;
      margin-top: 24px;
      margin-bottom: 24px;
      break-inside: avoid;
    }
    .policy-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--burgundy);
      margin-bottom: 8px;
    }
    .policy-list {
      padding-right: 20px;
      font-size: 12px;
      color: #334155;
      line-height: 1.7;
    }
    .policy-list li {
      margin-bottom: 4px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .social-links {
      font-family: monospace;
      font-weight: 700;
      color: var(--burgundy);
      margin-top: 4px;
      direction: ltr;
    }
    @media (max-width: 640px) {
      .meals-grid {
        grid-template-columns: 1fr;
      }
      .container {
        padding: 20px;
      }
      .title {
        font-size: 24px;
      }
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .container {
        border: none !important;
        box-shadow: none !important;
        padding: 10px !important;
        max-width: 100% !important;
      }
      .no-print, .no-print-toolbar {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
        break-before: page;
      }
      .meal-card {
        border: 1px solid #bbb !important;
        background: #fafafa !important;
      }
    }
  </style>
</head>
<body>

  <div class="no-print-toolbar">
    <div>
      <strong>\u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0644\u0640 C\xC9L\xC8BRE CATERING (\u0646\u0633\u062E\u0629 PDF)</strong>
    </div>
    <button class="print-btn" onclick="window.print()">
      \u{1F5A8}\uFE0F \u0637\u0628\u0627\u0639\u0629 / \u062D\u0641\u0638 \u0628\u062A\u0646\u0633\u064A\u0642 PDF
    </button>
  </div>

  <div class="container">
    
    <!-- Header -->
    <div class="header">
      <img src="${CELEBRE_CONFIG.logoUrl}" alt="Celebre Catering Logo" class="logo" />
      <h1 class="title">C\xC9L\xC8BRE CATERING</h1>
      <p class="slogan">\xAB\u0643\u0644 \u0645\u0646\u0627\u0633\u0628\u0629.. \u0623\u062D\u0644\u0649 \u0645\u0639 \u0633\u064A\u0644\u064A\u0628\u0631\u064A\xBB</p>
      <p class="subtitle">\u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0643\u0627\u062A\u0631\u064A\u0646\u062C \u0648\u062A\u062C\u0647\u064A\u0632 \u0648\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062A \u0641\u064A \u062C\u0645\u0647\u0648\u0631\u064A\u0629 \u0645\u0635\u0631 \u0627\u0644\u0639\u0631\u0628\u064A\u0629</p>

      <div class="contact-bar">
        <div class="contact-item">\u0627\u0644\u062E\u0637 \u0627\u0644\u0633\u0627\u062E\u0646 \u0648\u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A: <span dir="ltr">01284484868</span></div>
        <div class="contact-item">\u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u0631\u0633\u0645\u064A: <span dir="ltr">https://celebre-eg.com</span></div>
        <div class="contact-item">\u0648\u0627\u062A\u0633\u0627\u0628: <span dir="ltr">+20 128 448 4868</span></div>
      </div>
    </div>

    <!-- Section 1: Mix Box -->
    <div class="section-header">
      <span class="section-title">\u0623\u0648\u0644\u0627\u064B: \u0645\u064A\u0643\u0633 \u0628\u0648\u0643\u0633 (Mix Box)</span>
      <span class="badge">12 \u0648\u062C\u0628\u0629 \u0645\u0639\u062A\u0645\u062F\u0629</span>
    </div>

    <div class="meals-grid">
      ${mixBoxMeals.map(
    (m) => `
        <div class="meal-card">
          <div>
            <div class="meal-top">
              <span class="meal-code">${m.code}</span>
              <span class="meal-price">${m.distributorPrice} \u062C.\u0645</span>
            </div>
            <p class="meal-desc">${m.ingredients}</p>
          </div>
          <div class="meal-footer">
            \u2713 \u0627\u0644\u062A\u0639\u0628\u0626\u0629: \u0627\u0644\u0639\u0644\u0628\u0629 \u0627\u0644\u0628\u064A\u0636\u0627\u0621 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644 \u0645\u0639\u0637\u0631
          </div>
        </div>
      `
  ).join("")}
    </div>

    <!-- Section 2: Sandwich Box -->
    <div class="section-header page-break">
      <span class="section-title">\u062B\u0627\u0646\u064A\u0627\u064B: \u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u0648\u0643\u0633 (Sandwich Box)</span>
      <span class="badge">6 \u0648\u062C\u0628\u0627\u062A \u0645\u0639\u062A\u0645\u062F\u0629</span>
    </div>

    <div class="meals-grid">
      ${sandwichBoxMeals.map(
    (m) => `
        <div class="meal-card">
          <div>
            <div class="meal-top">
              <span class="meal-code">${m.code}</span>
              <span class="meal-price">${m.distributorPrice} \u062C.\u0645</span>
            </div>
            <p class="meal-desc">${m.ingredients}</p>
          </div>
          <div class="meal-footer">
            \u2713 \u0627\u0644\u062A\u0639\u0628\u0626\u0629: \u0627\u0644\u0639\u0644\u0628\u0629 \u0627\u0644\u0628\u064A\u0636\u0627\u0621 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644 \u0645\u0639\u0637\u0631
          </div>
        </div>
      `
  ).join("")}
    </div>

    <!-- Policy & Drink Adjustment Terms -->
    <div class="policy-box">
      <h3 class="policy-title">\u0634\u0631\u0648\u0637 \u0627\u0644\u0645\u0646\u064A\u0648 \u0648\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0634\u0631\u0648\u0628\u0627\u062A \u0648\u0627\u0644\u062A\u0639\u0628\u0626\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629:</h3>
      <ul class="policy-list">
        <li><strong>\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0634\u0631\u0648\u0628\u0627\u062A:</strong> \u0627\u0633\u062A\u0628\u0639\u0627\u062F \u0627\u0644\u0639\u0635\u064A\u0631 \u064A\u062E\u0635\u0645 <strong>5 \u062C\u0646\u064A\u0647</strong> \u0645\u0646 \u0633\u0639\u0631 \u0627\u0644\u0645\u0648\u0632\u0639 \u0644\u0643\u0644 \u0648\u062C\u0628\u0629\u060C \u0648\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0628\u064A\u0628\u0633\u064A \u064A\u0636\u064A\u0641 <strong>10 \u062C\u0646\u064A\u0647</strong> \u0644\u0643\u0644 \u0648\u062C\u0628\u0629 (\u0627\u0644\u0645\u0634\u0631\u0648\u0628 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629).</li>
        <li><strong>\u0627\u0644\u0639\u0644\u0628\u0629 \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629:</strong> \u062A\u064F\u0639\u0628\u0623 \u062C\u0645\u064A\u0639 \u0627\u0644\u0648\u062C\u0628\u0627\u062A \u0641\u064A \u0627\u0644\u0639\u0644\u0628\u0629 \u0627\u0644\u0628\u064A\u0636\u0627\u0621 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0644\u0640 Celebre \u0628\u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644 \u0645\u0639\u0637\u0631 \u0645\u0639 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0623\u0639\u0644\u0649 \u0645\u0639\u0627\u064A\u064A\u0631 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u063A\u0630\u0627\u0621.</li>
        <li><strong>\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A:</strong> \u064A\u062A\u0645 \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0648\u062C\u0628\u0627\u062A \u0637\u0628\u0642\u0627\u064B \u0644\u0644\u0645\u0643\u0648\u0646\u0627\u062A \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u062D\u0631\u0641\u064A\u0627\u064B \u0644\u0643\u0644 \u0643\u0648\u062F \u062F\u0648\u0646 \u062A\u063A\u064A\u064A\u0631 \u0641\u064A \u0627\u0644\u0623\u0648\u0632\u0627\u0646 \u0623\u0648 \u0627\u0644\u0623\u0635\u0646\u0627\u0641.</li>
        <li><strong>\u0627\u0644\u062D\u062C\u0632 \u0648\u0627\u0644\u062A\u0623\u0643\u064A\u062F:</strong> \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0645\u0648\u0636\u062D\u0629 \u0647\u064A \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0645\u0648\u0632\u0639 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0628\u062C\u0645\u0647\u0648\u0631\u064A\u0629 \u0645\u0635\u0631 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0644\u0639\u0627\u0645 2026.</li>
      </ul>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>C\xC9L\xC8BRE CATERING MANAGEMENT PLATFORM</strong></p>
      <p class="social-links">
        FB: ${CELEBRE_CONFIG.socials.facebook} | TT: ${CELEBRE_CONFIG.socials.tiktok} | IG: ${CELEBRE_CONFIG.socials.instagram}
      </p>
      <p style="font-size: 10px; color: #94a3b8; margin-top: 8px;">
        \u062A\u0645 \u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u064A\u0648 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0633\u064A\u0644\u064A\u0628\u0631\u064A \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u0629 \u0628\u062A\u0627\u0631\u064A\u062E ${(/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
      </p>
    </div>

  </div>

  ${autoPrint ? '<script>window.addEventListener("load", () => { setTimeout(() => window.print(), 300); });</script>' : ""}
</body>
</html>`;
}

// src/server/bookingPdfGenerator.ts
function generateBookingPdfHtml(booking, autoPrint = false) {
  const verifiedPaid = booking.paidAmount || 0;
  const total = booking.totalDistributorPrice || 0;
  const remaining = Math.max(0, total - verifiedPaid);
  const itemsRows = (booking.items || []).map((it, idx) => {
    let drinkText = "\u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A";
    if (it.orientalSweetOption === "replace_juice") {
      drinkText = "\u0627\u0644\u0639\u0635\u064A\u0631 \u0645\u0633\u062A\u0628\u062F\u0644 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A";
    } else if (it.drinkOption === "pepsi") {
      drinkText = "\u0643\u0627\u0646\u0632 \u0628\u064A\u0628\u0633\u064A (+10 \u062C)";
    } else if (it.drinkOption === "no_juice") {
      drinkText = "\u0628\u062F\u0648\u0646 \u0639\u0635\u064A\u0631 (-5 \u062C)";
    }
    let sweetText = "\u2014";
    if (it.orientalSweetOption === "add_with_juice") {
      sweetText = "\u0625\u0636\u0627\u0641\u0629 \u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A \u0645\u0639 \u0627\u0644\u0639\u0635\u064A\u0631 (+20 \u062C)";
    } else if (it.orientalSweetOption === "replace_juice") {
      sweetText = "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A (+15 \u062C)";
    }
    const unitPrice = it.unitDistributorPrice || Math.round(it.totalDistributorPrice / (it.quantity || 1));
    return `
      <tr>
        <td style="text-align: center; font-weight: bold; color: #7A0C2E;">${idx + 1}</td>
        <td>
          <div style="font-weight: 800; color: #1e293b; font-size: 11.5px;">${it.mealName}</div>
          <div style="font-size: 9.5px; color: #64748b; line-height: 1.3; margin-top: 2px;">${it.ingredients}</div>
        </td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; background: #FAF8F5; border: 1px solid #E2D5BA; border-radius: 6px; font-weight: 800; font-size: 11px; color: #7A0C2E;">
            ${it.quantity} \u0628\u0648\u0643\u0633
          </span>
        </td>
        <td style="font-size: 10px; color: #334155;">${drinkText}</td>
        <td style="font-size: 10px; color: ${it.orientalSweetOption && it.orientalSweetOption !== "none" ? "#7A0C2E; font-weight: bold;" : "#94a3b8;"}">${sweetText}</td>
        <td style="text-align: center; font-size: 11px; font-weight: 700; color: #334155;">${unitPrice.toLocaleString("en-US")} \u062C</td>
        <td style="text-align: center; font-size: 11.5px; font-weight: 900; color: #7A0C2E;">${it.totalDistributorPrice.toLocaleString("en-US")} \u062C</td>
      </tr>
    `;
  }).join("");
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u0625\u0634\u0639\u0627\u0631 \u062D\u062C\u0632 \u0645\u0639\u062A\u0645\u062F \u0648\u0645\u0633\u062F\u062F \u0627\u0644\u0639\u0631\u0628\u0648\u0646 | ${booking.bookingCode} | C\xC9L\xC8BRE CATERING</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --burgundy: #7A0C2E;
      --burgundy-dark: #560820;
      --gold: #C59B27;
      --gold-dark: #9A7718;
      --gold-light: #DFC066;
      --cream: #FAF8F5;
      --border: #E8DCC0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      direction: rtl;
      text-align: right;
      padding: 16px;
      font-size: 11px;
    }
    .page-a4 {
      width: 210mm;
      min-height: 297mm;
      max-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid var(--gold);
      border-radius: 12px;
      padding: 10mm 12mm;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .no-print {
      max-width: 210mm;
      margin: 0 auto 12px auto;
      background: white;
      padding: 10px 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .btn {
      padding: 6px 14px;
      border-radius: 6px;
      font-family: 'Cairo', sans-serif;
      font-weight: 700;
      font-size: 11px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-gold {
      background: var(--gold);
      color: white;
      border: none;
    }
    .btn-gold:hover {
      background: var(--gold-dark);
    }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--border);
      color: #475569;
    }
    .btn-outline:hover {
      background: #f8fafc;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid var(--gold);
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .brand-title {
      font-family: 'Playfair Display', serif;
      font-size: 19px;
      font-weight: 900;
      color: var(--burgundy-dark);
      letter-spacing: 0.5px;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 700;
      color: var(--gold-dark);
    }
    .badge-confirmed {
      background: #ecfdf5;
      color: #047857;
      border: 1.5px solid #10b981;
      padding: 4px 10px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 11px;
      text-align: center;
    }
    .booking-number {
      font-family: monospace;
      font-size: 13px;
      font-weight: 900;
      color: var(--burgundy);
      display: block;
      margin-top: 2px;
    }

    /* Client & Event Info Grid */
    .info-card {
      background: var(--cream);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 14px;
      font-size: 10.5px;
    }
    .info-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .info-label {
      color: #64748b;
      font-weight: 600;
      min-width: 90px;
    }
    .info-value {
      color: #0f172a;
      font-weight: 800;
    }
    .phone-highlight {
      font-family: monospace;
      font-size: 12px;
      color: var(--burgundy);
      font-weight: 900;
      letter-spacing: 0.5px;
      direction: ltr;
      display: inline-block;
    }

    /* Table */
    .table-container {
      margin-bottom: 8px;
      flex-grow: 1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    th {
      background: var(--burgundy);
      color: white;
      padding: 6px 8px;
      font-weight: 800;
      font-size: 10.5px;
      border: 1px solid #560820;
    }
    td {
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }

    /* Financial Summary Box */
    .finance-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 8px;
    }
    .finance-box {
      border: 1.5px solid var(--gold);
      border-radius: 8px;
      padding: 6px 10px;
      text-align: center;
      background: #ffffff;
    }
    .finance-box.highlight {
      background: #fefce8;
      border-color: #ca8a04;
    }
    .finance-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
    }
    .finance-val {
      font-size: 13.5px;
      font-weight: 900;
      color: var(--burgundy-dark);
      margin-top: 1px;
    }
    .finance-val.green {
      color: #059669;
    }

    /* Notes */
    .notes-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 9.5px;
      margin-bottom: 8px;
      color: #475569;
    }

    /* Footer */
    .footer {
      border-top: 1.5px solid var(--gold);
      padding-top: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9.5px;
      color: #64748b;
    }
    .footer-hotline {
      font-weight: 900;
      font-size: 11px;
      color: var(--burgundy);
      direction: ltr;
      display: inline-block;
    }

    @page {
      size: A4 portrait;
      margin: 8mm;
    }

    @media print {
      body {
        background: white !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .page-a4 {
        border: 1.5px solid var(--gold) !important;
        box-shadow: none !important;
        width: 100% !important;
        height: 100% !important;
        max-height: 285mm !important;
        border-radius: 0 !important;
        padding: 8mm 10mm !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>

  <!-- Controls for browser preview -->
  <div class="no-print">
    <div>
      <span style="font-weight: 800; color: #7A0C2E;">\u0625\u064A\u0635\u0627\u0644 \u062D\u062C\u0632 \u0645\u0639\u062A\u0645\u062F \u0648\u0645\u0633\u062F\u062F \u0627\u0644\u0639\u0631\u0628\u0648\u0646 (A4 \u0635\u0641\u062D\u0629 \u0648\u0627\u062D\u062F\u0629)</span>
      <span style="font-size: 10px; color: #64748b; margin-right: 8px;">\u0645\u062E\u0635\u0635 \u0644\u0644\u0639\u0645\u064A\u0644 \u0648\u0645\u0646\u062F\u0648\u0628 \u0627\u0644\u062A\u0633\u0644\u064A\u0645</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" class="btn btn-gold">
        \u{1F5A8}\uFE0F \u0637\u0628\u0627\u0639\u0629 \u0623\u0648 \u062D\u0641\u0638 \u0643\u0645\u0644\u0641 PDF
      </button>
      <a href="https://wa.me/2${booking.customerPhone}?text=${encodeURIComponent(`\u0623\u0647\u0644\u0627\u064B \u0628\u062D\u0636\u0631\u062A\u0643 \u0623\u0633\u062A\u0627\u0630 ${booking.customerName}\u060C \u0645\u0631\u0641\u0642 \u0625\u0634\u0639\u0627\u0631 \u062D\u062C\u0632\u0643 \u0627\u0644\u0645\u0639\u062A\u0645\u062F \u0628\u0631\u0642\u0645 ${booking.bookingCode} \u0645\u0639 \u0633\u064A\u0644\u064A\u0628\u0631\u064A \u0643\u0627\u062A\u0631\u064A\u0646\u062C.`)}" target="_blank" class="btn btn-outline">
        \u{1F4AC} \u0645\u0634\u0627\u0631\u0643\u0629 \u0628\u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628
      </a>
    </div>
  </div>

  <div class="page-a4">
    <!-- Header -->
    <div class="header">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${CELEBRE_CONFIG.logoUrl}" alt="Celebre Catering Logo" style="height: 48px; width: auto; object-fit: contain;" />
        <div>
          <div class="brand-title">C\xC9L\xC8BRE CATERING</div>
          <div class="brand-sub">\u0643\u0644 \u0645\u0646\u0627\u0633\u0628\u0629.. \u0623\u062D\u0644\u0649 \u0645\u0639 \u0633\u064A\u0644\u064A\u0628\u0631\u064A | \u0643\u0627\u062A\u0631\u064A\u0646\u062C \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062A \u0648\u0627\u0644\u0623\u0641\u0631\u0627\u062D</div>
        </div>
      </div>
      <div style="text-align: left;">
        <div class="badge-confirmed">
          \u2713 \u0625\u0634\u0639\u0627\u0631 \u062D\u062C\u0632 \u0645\u0639\u062A\u0645\u062F \u0648\u0645\u0633\u062F\u062F \u0627\u0644\u0639\u0631\u0628\u0648\u0646
          <span class="booking-number">${booking.bookingCode}</span>
        </div>
        <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
          \u0625\u0635\u062F\u0627\u0631 v${booking.version || 1} \u2022 ${(/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG")}
        </div>
      </div>
    </div>

    <!-- Client & Event Info Card -->
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">\u0627\u0633\u0645 \u0627\u0644\u0639\u0645\u064A\u0644:</span>
        <span class="info-value">${booking.customerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">\u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629:</span>
        <span class="info-value">${booking.eventName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">\u0631\u0642\u0645 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644:</span>
        <span class="info-value phone-highlight">${booking.customerPhone}</span>
      </div>
      <div class="info-row">
        <span class="info-label">\u062A\u0627\u0631\u064A\u062E \u0648\u0645\u0648\u0639\u062F \u0627\u0644\u062A\u0633\u0644\u064A\u0645:</span>
        <span class="info-value">${booking.eventDate} \u0627\u0644\u0633\u0627\u0639\u0629 ${booking.deliveryTime}</span>
      </div>
      <div class="info-row" style="grid-column: span 2;">
        <span class="info-label">\u0645\u0643\u0627\u0646 \u0648\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062A\u0633\u0644\u064A\u0645:</span>
        <span class="info-value">${booking.deliveryGovernorate} \u2013 ${booking.deliveryAddress}</span>
      </div>
    </div>

    <!-- Meals Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 25px;">#</th>
            <th>\u0627\u0644\u0648\u062C\u0628\u0629 \u0648\u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A</th>
            <th style="width: 75px; text-align: center;">\u0627\u0644\u0643\u0645\u064A\u0629</th>
            <th style="width: 120px;">\u0627\u0644\u0645\u0634\u0631\u0648\u0628</th>
            <th style="width: 135px;">\u0642\u0637\u0639\u0629 \u0634\u0631\u0642\u064A</th>
            <th style="width: 70px; text-align: center;">\u0633\u0639\u0631 \u0627\u0644\u0648\u062C\u0628\u0629</th>
            <th style="width: 80px; text-align: center;">\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <!-- Financial Breakdown -->
    <div class="finance-grid">
      <div class="finance-box">
        <div class="finance-label">\u0625\u062C\u0645\u0627\u0644\u064A \u0642\u064A\u0645\u0629 \u0627\u0644\u0637\u0644\u0628</div>
        <div class="finance-val">${total.toLocaleString("en-US")} \u062C.\u0645</div>
      </div>
      <div class="finance-box highlight">
        <div class="finance-label">\u0627\u0644\u0639\u0631\u0628\u0648\u0646 \u0627\u0644\u0645\u0633\u062F\u062F \u0641\u0639\u0644\u064A\u0627\u064B</div>
        <div class="finance-val green">${verifiedPaid.toLocaleString("en-US")} \u062C.\u0645</div>
      </div>
      <div class="finance-box">
        <div class="finance-label">\u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0627\u0644\u0645\u0633\u062A\u062D\u0642 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645</div>
        <div class="finance-val">${remaining.toLocaleString("en-US")} \u062C.\u0645</div>
      </div>
    </div>

    <!-- Customer Notes -->
    <div class="notes-box">
      <strong>\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0648\u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0627\u0644\u0639\u0645\u064A\u0644:</strong>
      <span>${booking.notes && booking.notes.trim() ? booking.notes.trim() : "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0625\u0636\u0627\u0641\u064A\u0629. \u0627\u0644\u062A\u0639\u0628\u0626\u0629 \u0641\u064A \u0639\u0644\u0628\u0629 \u0633\u064A\u0644\u064A\u0628\u0631\u064A \u0627\u0644\u0628\u064A\u0636\u0627\u0621 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0645\u0639 \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644 \u0645\u0639\u0637\u0631."}</span>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>
        <span>\u0627\u0644\u062A\u0639\u0628\u0626\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629: <strong>\u0627\u0644\u0639\u0644\u0628\u0629 \u0627\u0644\u0628\u064A\u0636\u0627\u0621 \u0627\u0644\u0641\u0627\u062E\u0631\u0629 \u0644\u0640 Celebre Catering</strong></span>
        <span style="margin: 0 6px;">\u2022</span>
        <span>\u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u0631\u0626\u064A\u0633\u064A: \u0627\u0644\u0642\u0627\u0647\u0631\u0629 \u0648\u0627\u0644\u062C\u064A\u0632\u0629</span>
      </div>
      <div>
        <span>\u0627\u0644\u062E\u0637 \u0627\u0644\u0633\u0627\u062E\u0646 \u0648\u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A: </span>
        <span class="footer-hotline">01284484868</span>
        <span style="margin: 0 6px;">\u2022</span>
        <span>celebre-eg.com</span>
      </div>
    </div>
  </div>

  ${autoPrint ? '<script>window.addEventListener("DOMContentLoaded", () => window.print());</script>' : ""}
</body>
</html>`;
}

// scripts/migrate-to-postgres.ts
import fs3 from "fs";
import path3 from "path";
import { PrismaClient } from "@prisma/client";
async function runSafeMigration() {
  const databaseUrl2 = process.env.DATABASE_URL;
  if (!databaseUrl2) {
    console.error("\u274C \u062E\u0637\u0623: \u0645\u062A\u063A\u064A\u0631 DATABASE_URL \u063A\u064A\u0631 \u0645\u062D\u062F\u062F. \u064A\u0631\u062C\u0649 \u062A\u0648\u0641\u064A\u0631 \u0631\u0627\u0628\u0637 \u0627\u062A\u0635\u0627\u0644 PostgreSQL \u0642\u0628\u0644 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u062A\u0631\u062D\u064A\u0644.");
    process.exit(1);
  }
  const formattedUrl = formatDatabaseUrl(databaseUrl2);
  const prisma2 = new PrismaClient({
    datasources: {
      db: {
        url: formattedUrl
      }
    }
  });
  const backupPath = path3.resolve(process.cwd(), "data", "backup-35-bookings.json");
  if (!fs3.existsSync(backupPath)) {
    console.error("\u274C \u062E\u0637\u0623: \u0645\u0644\u0641 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F:", backupPath);
    process.exit(1);
  }
  const backupData = JSON.parse(fs3.readFileSync(backupPath, "utf8"));
  const sourceBookings = backupData.bookings || [];
  const sourceMeals = backupData.meals || [];
  const sourcePayments = backupData.payments || [];
  const sourceFactoryOrders = backupData.factoryOrders || [];
  const sourceAdminUsers = backupData.adminUsers || [];
  console.log("====================================================");
  console.log("\u{1F680} \u0628\u062F\u0621 \u062E\u0637\u0629 \u0627\u0644\u062A\u0631\u062D\u064A\u0644 \u0627\u0644\u0622\u0645\u0646 \u0627\u0644\u0645\u0648\u062B\u0642 \u0628\u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A (Prisma Transactions)");
  console.log("====================================================");
  console.log(`\u{1F4E6} \u0639\u062F\u062F \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u0645\u0635\u062F\u0631\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629: ${sourceBookings.length} \u062D\u062C\u0632`);
  console.log(`\u{1F372} \u0639\u062F\u062F \u0627\u0644\u0648\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u0635\u062F\u0631\u064A\u0629: ${sourceMeals.length} \u0648\u062C\u0628\u0629`);
  console.log(`\u{1F4B3} \u0639\u062F\u062F \u0633\u062C\u0644\u0627\u062A \u0627\u0644\u062F\u0641\u0639\u0627\u062A (\u0627\u0644\u0639\u0631\u0628\u0648\u0646): ${sourcePayments.length} \u0633\u062C\u0644`);
  console.log(`\u{1F3ED} \u0639\u062F\u062F \u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0644\u0644\u0645\u0635\u0646\u0639: ${sourceFactoryOrders.length} \u0623\u0645\u0631`);
  try {
    await prisma2.$connect();
    console.log("\u2705 \u062A\u0645 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A PostgreSQL \u0628\u0646\u062C\u0627\u062D.");
    const preBookingCount = await prisma2.booking.count();
    const preMealCount = await prisma2.meal.count();
    console.log(`\u{1F4CA} \u0639\u062F\u062F \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u0645\u0648\u062C\u0648\u062F\u0629 \u0645\u0633\u0628\u0642\u0627\u064B \u0641\u064A PostgreSQL: ${preBookingCount}`);
    console.log(`\u{1F4CA} \u0639\u062F\u062F \u0627\u0644\u0648\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u0648\u062C\u0648\u062F\u0629 \u0645\u0633\u0628\u0642\u0627\u064B \u0641\u064A PostgreSQL: ${preMealCount}`);
    console.log("\n--- 1. \u062A\u0631\u062D\u064A\u0644 \u0648\u062A\u062D\u062F\u064A\u062B \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0648\u062C\u0628\u0627\u062A ---");
    for (const m of sourceMeals) {
      await prisma2.meal.upsert({
        where: { code: m.code },
        update: {
          name: m.name,
          category: m.category,
          ingredients: m.ingredients,
          distributorPrice: m.distributorPrice,
          factoryPrice: m.factoryPrice,
          hasJuice: m.hasJuice ?? true,
          isActive: m.isActive ?? true,
          image: m.image
        },
        create: {
          id: m.id || `meal-${m.code}`,
          code: m.code,
          name: m.name,
          category: m.category,
          ingredients: m.ingredients,
          distributorPrice: m.distributorPrice,
          factoryPrice: m.factoryPrice,
          hasJuice: m.hasJuice ?? true,
          isActive: m.isActive ?? true,
          image: m.image
        }
      });
    }
    console.log(`\u2705 \u062A\u0645 \u062A\u0631\u062D\u064A\u0644 \u0627\u0644\u0640 ${sourceMeals.length} \u0648\u062C\u0628\u0629 \u0628\u0646\u062C\u0627\u062D.`);
    console.log("\n--- 2. \u062A\u0631\u062D\u064A\u0644 \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 (\u0645\u0639 \u0627\u0633\u062A\u0628\u0639\u0627\u062F \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u0648\u0627\u0644\u0648\u0647\u0645\u064A\u0629 \u062A\u0645\u0627\u0645\u0627\u064B) ---");
    let insertedBookings = 0;
    let existingBookings = 0;
    const verifiedSourceBookings = sourceBookings.filter((b) => {
      if (b.bookingCode === "CLB-2026-5131" || b.customerPhone === "01158855911") return true;
      if (b.isTest) return false;
      const name = (b.customerName || "").toLowerCase();
      if (name.includes("\u062A\u062C\u0631\u0628") || name.includes("\u0641\u062D\u0635") || name.includes("\u0627\u062E\u062A\u0628\u0627\u0631") || name.includes("\u062A\u0633\u062A")) return false;
      return false;
    });
    for (const b of verifiedSourceBookings) {
      await prisma2.$transaction(async (tx) => {
        const existing = await tx.booking.findUnique({
          where: { bookingCode: b.bookingCode }
        });
        if (existing) {
          existingBookings++;
          return;
        }
        await tx.booking.create({
          data: {
            id: b.id,
            bookingCode: b.bookingCode,
            securityCode: b.securityCode,
            customerName: b.customerName,
            customerPhone: b.customerPhone,
            customerWhatsapp: b.customerWhatsapp || b.customerPhone,
            preferredContact: b.preferredContact || "whatsapp",
            eventName: b.eventName,
            eventDate: b.eventDate,
            deliveryTime: b.deliveryTime,
            deliveryGovernorate: b.deliveryGovernorate,
            deliveryAddress: b.deliveryAddress,
            notes: b.notes || "",
            totalMealsCount: b.totalMealsCount,
            totalDistributorPrice: b.totalDistributorPrice,
            totalFactoryPrice: b.totalFactoryPrice || null,
            profitMargin: b.profitMargin || null,
            paidAmount: b.paidAmount || 0,
            remainingAmount: b.remainingAmount,
            status: b.status || "INITIAL",
            statusNotes: b.statusNotes || "",
            version: b.version || 1,
            createdAt: b.createdAt ? new Date(b.createdAt) : /* @__PURE__ */ new Date(),
            updatedAt: b.updatedAt ? new Date(b.updatedAt) : /* @__PURE__ */ new Date(),
            items: {
              create: (b.items || []).map((it) => ({
                mealId: it.mealId || it.mealCode,
                mealCode: it.mealCode,
                mealName: it.mealName,
                category: it.category || "mix_box",
                ingredients: it.ingredients,
                quantity: it.quantity,
                drinkOption: it.drinkOption || "standard",
                baseDistributorPrice: it.baseDistributorPrice,
                unitDistributorPrice: it.unitDistributorPrice,
                totalDistributorPrice: it.totalDistributorPrice,
                baseFactoryPrice: it.baseFactoryPrice,
                unitFactoryPrice: it.unitFactoryPrice,
                totalFactoryPrice: it.totalFactoryPrice
              }))
            }
          }
        });
        const relatedPayments = sourcePayments.filter((p) => p.bookingId === b.id);
        for (const p of relatedPayments) {
          await tx.payment.create({
            data: {
              id: p.id,
              bookingId: p.bookingId,
              amount: p.amount,
              method: p.method,
              date: p.date,
              notes: p.notes || "",
              receiptNumber: p.receiptNumber || null,
              createdAt: p.createdAt ? new Date(p.createdAt) : /* @__PURE__ */ new Date()
            }
          });
        }
        const relatedOrders = sourceFactoryOrders.filter((fo) => fo.bookingId === b.id);
        for (const fo of relatedOrders) {
          await tx.factoryOrder.create({
            data: {
              id: fo.id,
              orderNumber: fo.orderNumber,
              bookingId: fo.bookingId,
              bookingCode: fo.bookingCode,
              version: fo.version || 1,
              status: fo.status || "PENDING",
              eventDate: fo.eventDate,
              deliveryTime: fo.deliveryTime,
              deliveryLocation: fo.deliveryLocation,
              itemsJson: typeof fo.items === "string" ? fo.items : JSON.stringify(fo.items || []),
              packagingNotes: fo.packagingNotes || "",
              preparedAt: fo.preparedAt ? new Date(fo.preparedAt) : null,
              createdAt: fo.createdAt ? new Date(fo.createdAt) : /* @__PURE__ */ new Date()
            }
          });
        }
        insertedBookings++;
      });
    }
    console.log("\n--- 3. \u062A\u0631\u062D\u064A\u0644 \u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629 ---");
    for (const u of sourceAdminUsers) {
      await prisma2.adminUser.upsert({
        where: { username: u.username },
        update: {
          email: u.email,
          role: u.role,
          name: u.name,
          passwordHash: u.passwordHash
        },
        create: {
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          name: u.name,
          passwordHash: u.passwordHash
        }
      });
    }
    const postBookingCount = await prisma2.booking.count();
    const postMealCount = await prisma2.meal.count();
    const postPaymentCount = await prisma2.payment.count();
    const postOrderCount = await prisma2.factoryOrder.count();
    console.log(`
====================================================`);
    console.log(`\u{1F4CA} \u062A\u0642\u0631\u064A\u0631 \u0646\u062A\u0627\u0626\u062C \u0627\u0644\u062A\u0631\u062D\u064A\u0644 \u0627\u0644\u0631\u0642\u0627\u0628\u064A \u0627\u0644\u0634\u0627\u0645\u0644:`);
    console.log(`- \u062D\u062C\u0648\u0632\u0627\u062A \u062C\u062F\u064A\u062F\u0629 \u0623\u064F\u0636\u064A\u0641\u062A \u0628\u0646\u062C\u0627\u062D: ${insertedBookings}`);
    console.log(`- \u062D\u062C\u0648\u0632\u0627\u062A \u0643\u0627\u0646\u062A \u0645\u0648\u062C\u0648\u062F\u0629 \u0645\u0633\u0628\u0642\u0627\u064B (\u062A\u0645 \u062A\u062E\u0637\u064A\u0647\u0627 \u0644\u0645\u0646\u0639 \u0627\u0644\u062A\u0643\u0631\u0627\u0631): ${existingBookings}`);
    console.log(`- \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0641\u064A PostgreSQL \u0627\u0644\u0622\u0646: ${postBookingCount}`);
    console.log(`- \u0625\u062C\u0645\u0627\u0644\u064A \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0648\u062C\u0628\u0627\u062A \u0641\u064A PostgreSQL \u0627\u0644\u0622\u0646: ${postMealCount}`);
    console.log(`- \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062F\u0641\u0639\u0627\u062A \u0641\u064A PostgreSQL \u0627\u0644\u0622\u0646: ${postPaymentCount}`);
    console.log(`- \u0625\u062C\u0645\u0627\u0644\u064A \u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 \u0641\u064A PostgreSQL \u0627\u0644\u0622\u0646: ${postOrderCount}`);
    console.log(`====================================================`);
    const testSample = await prisma2.booking.findFirst({
      where: { bookingCode: "CLB-2026-8934" },
      include: { items: true, payments: true, factoryOrders: true }
    });
    if (testSample) {
      console.log(`\u2705 \u0641\u062D\u0635 \u0639\u064A\u0646\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629: \u0627\u0644\u062D\u062C\u0632 CLB-2026-8934 \u0645\u0633\u062A\u0631\u062C\u0639 \u0645\u0639 ${testSample.items.length} \u0648\u062C\u0628\u0629 \u0648 ${testSample.payments.length} \u062F\u0641\u0639\u0629 \u0648 ${testSample.factoryOrders.length} \u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644.`);
    }
    console.log("\u{1F389} \u0627\u0643\u062A\u0645\u0644\u062A \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u062A\u0631\u062D\u064A\u0644 \u0627\u0644\u0630\u0631\u064A \u0628\u0646\u062C\u0627\u062D \u062A\u0627\u0645 \u0648\u0628\u0623\u0645\u0627\u0646 \u0643\u0627\u0645\u0644 100%.");
    return {
      success: true,
      insertedBookings,
      existingBookings,
      postBookingCount,
      postMealCount,
      postPaymentCount,
      postOrderCount
    };
  } catch (err) {
    console.error("\u274C \u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0631\u062D\u064A\u0644:", err);
    throw err;
  } finally {
    await prisma2.$disconnect();
  }
}
if (process.argv[1] && process.argv[1].endsWith("migrate-to-postgres.ts")) {
  runSafeMigration();
}

// src/server/authSession.ts
import jwt from "jsonwebtoken";
import crypto from "crypto";
var JWT_SECRET = process.env.JWT_SECRET || "celebre-catering-jwt-super-secret-key-2026";
var INACTIVITY_TIMEOUT_MS = 15 * 60 * 1e3;
var activeSessions = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [sid, session] of activeSessions.entries()) {
    if (now - session.lastActivityAt > INACTIVITY_TIMEOUT_MS * 2) {
      activeSessions.delete(sid);
    }
  }
}, 5 * 60 * 1e3);
function createAdminSession(user, res) {
  const sessionId = crypto.randomUUID();
  const now = Date.now();
  const session = {
    sessionId,
    userId: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    createdAt: now,
    lastActivityAt: now
  };
  activeSessions.set(sessionId, session);
  const token = jwt.sign(
    {
      id: user.id,
      sessionId,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: "2h" }
    // Hard expiration cap (while inactivity enforces 15 mins)
  );
  if (res && typeof res.cookie === "function") {
    res.cookie("celebre_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: INACTIVITY_TIMEOUT_MS,
      path: "/"
    });
  }
  return { token, sessionId, session };
}
function validateAdminSession(req, res) {
  let token = void 0;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.celebre_admin_session) {
    token = req.cookies.celebre_admin_session;
  }
  if (!token) {
    return {
      valid: false,
      error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0644\u0632\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629",
      code: "UNAUTHORIZED"
    };
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const sessionId = decoded.sessionId;
    if (!sessionId) {
      return {
        valid: false,
        error: "\u062C\u0644\u0633\u0629 \u0642\u062F\u064A\u0645\u0629 \u0623\u0648 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629\u060C \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B",
        code: "INVALID_TOKEN"
      };
    }
    const session = activeSessions.get(sessionId);
    if (!session) {
      if (res && typeof res.clearCookie === "function") {
        res.clearCookie("celebre_admin_session", { path: "/" });
      }
      return {
        valid: false,
        error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0644\u063A\u0627\u0629 \u0623\u0648 \u0645\u0646\u062A\u0647\u064A\u0629\u060C \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B",
        code: "SESSION_REVOKED"
      };
    }
    const now = Date.now();
    if (now - session.lastActivityAt > INACTIVITY_TIMEOUT_MS) {
      activeSessions.delete(sessionId);
      if (res && typeof res.clearCookie === "function") {
        res.clearCookie("celebre_admin_session", { path: "/" });
      }
      return {
        valid: false,
        error: "\u0627\u0646\u062A\u0647\u062A \u0627\u0644\u062C\u0644\u0633\u0629 \u0628\u0633\u0628\u0628 \u0639\u062F\u0645 \u0627\u0644\u0646\u0634\u0627\u0637 (15 \u062F\u0642\u064A\u0642\u0629)",
        code: "SESSION_INACTIVITY_TIMEOUT"
      };
    }
    session.lastActivityAt = now;
    if (res && typeof res.cookie === "function") {
      res.cookie("celebre_admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: INACTIVITY_TIMEOUT_MS,
        path: "/"
      });
    }
    const user = {
      id: session.userId,
      username: session.username,
      email: decoded.email || `${session.username}@celebre-eg.com`,
      role: session.role,
      name: session.name
    };
    return {
      valid: true,
      user,
      session
    };
  } catch (err) {
    if (res && typeof res.clearCookie === "function") {
      res.clearCookie("celebre_admin_session", { path: "/" });
    }
    return {
      valid: false,
      error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0646\u062A\u0647\u064A\u0629 \u0623\u0648 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629",
      code: "INVALID_TOKEN"
    };
  }
}
function revokeAdminSession(sessionId, res) {
  activeSessions.delete(sessionId);
  if (res && typeof res.clearCookie === "function") {
    res.clearCookie("celebre_admin_session", { path: "/" });
  }
}
function revokeAllUserSessions(userId, res) {
  for (const [sid, session] of activeSessions.entries()) {
    if (session.userId === userId) {
      activeSessions.delete(sid);
    }
  }
  if (res && typeof res.clearCookie === "function") {
    res.clearCookie("celebre_admin_session", { path: "/" });
  }
}

// src/server/routes.ts
import pg2 from "pg";
var apiRouter = Router();
function requireAuth(req, res, next) {
  const result = validateAdminSession(req, res);
  if (!result.valid || !result.user) {
    res.status(401).json({
      error: result.error || "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0644\u0632\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
      code: result.code || "UNAUTHORIZED"
    });
    return;
  }
  req.user = result.user;
  req.sessionId = result.session?.sessionId;
  next();
}
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0644\u062A\u0646\u0641\u064A\u0630 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621" });
      return;
    }
    next();
  };
}
apiRouter.get("/", (_req, res) => {
  res.json({
    name: "Celebre Catering API",
    status: "healthy",
    version: "2.1.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
apiRouter.get("/health", async (_req, res) => {
  let isDbLive = false;
  let tablesReady = false;
  let latencyMs = void 0;
  let dbDiagnostic = "resilient_storage";
  let dbDiagnosticReason = void 0;
  let existingTablesList = [];
  let schemaInitDetails = void 0;
  let pgEngineCheck = { tested: false, connected: false, phase: "idle" };
  if (process.env.DATABASE_URL) {
    const rawUrl = process.env.DATABASE_URL;
    const formattedUrl = formatDatabaseUrl(rawUrl);
    pgEngineCheck.tested = true;
    const pgStart = Date.now();
    const pgUrl = new URL(formattedUrl);
    pgUrl.searchParams.delete("sslmode");
    const pgClient = new pg2.Client({
      connectionString: pgUrl.toString(),
      connectionTimeoutMillis: 7e3,
      ssl: {
        rejectUnauthorized: true,
        ca: SUPABASE_ROOT_CA,
        servername: pgUrl.hostname
      }
    });
    try {
      pgEngineCheck.phase = "connecting";
      await pgClient.connect();
      pgEngineCheck.phase = "query";
      await pgClient.query("SELECT 1");
      pgEngineCheck.phase = "ready";
      pgEngineCheck.connected = true;
      pgEngineCheck.latencyMs = Date.now() - pgStart;
    } catch (pgErr) {
      pgEngineCheck.code = pgErr?.code || pgErr?.name || "ERR_CONNECT";
      const cleanPgMsg = String(pgErr?.message || "").replace(/postgresql:\/\/[^@]+@/, "postgresql://***:***@").replace(/postgres:[^@]+@/, "postgres:***@");
      pgEngineCheck.message = cleanPgMsg.slice(0, 160);
    } finally {
      try {
        await pgClient.end();
      } catch {
      }
    }
    const start = Date.now();
    try {
      const client = getPrismaClient();
      if (client) {
        await client.$queryRaw`SELECT 1`;
        isDbLive = true;
        latencyMs = Date.now() - start;
        const schemaInitResult = await ensureSchemaReady(client);
        tablesReady = schemaInitResult.success;
        existingTablesList = schemaInitResult.tablesFound;
        schemaInitDetails = {
          created: schemaInitResult.created,
          errors: schemaInitResult.errors
        };
        dbDiagnostic = "postgresql";
      }
    } catch (err) {
      logServerError(err, "HealthCheck.DB");
      dbDiagnostic = "postgresql_error";
      const rawLines = String(err?.message || "").split("\n").map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("Invalid `"));
      const firstRealLine = rawLines[0] || String(err?.name || "PrismaConnectionError");
      const cleanMsg = firstRealLine.replace(/postgresql:\/\/[^@]+@/, "postgresql://***:***@").replace(/postgres:[^@]+@/, "postgres:***@");
      dbDiagnosticReason = cleanMsg.slice(0, 180);
    }
  }
  res.json({
    status: "ok",
    database: dbDiagnostic,
    connected: isDbLive,
    tablesReady,
    latencyMs,
    tables: {
      ready: tablesReady,
      count: existingTablesList.length,
      required: REQUIRED_TABLES.length,
      existing: existingTablesList,
      created: schemaInitDetails?.created || [],
      errors: schemaInitDetails?.errors || []
    },
    diagnostic: dbDiagnosticReason || (isDbLive ? "ready" : process.env.DATABASE_URL ? "connection_failed" : "no_database_url"),
    pgTest: pgEngineCheck.tested ? pgEngineCheck : void 0,
    connection: getSafeConnectionMetadata(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
apiRouter.get("/config", (req, res) => {
  res.json({
    ...CELEBRE_CONFIG,
    currentYear: 2026,
    version: "2.1.0",
    meta: {
      supabaseReady: true,
      databaseType: db.isPostgres() ? "PostgreSQL" : "Resilient File/Memory DB",
      customDomain: "https://celebre-eg.com",
      metaWebhookEndpoint: "/api/webhooks/meta",
      messengerLink: "https://m.me/celebre.catering",
      whatsappNumber: CELEBRE_CONFIG.whatsappNumber
    }
  });
});
apiRouter.get("/menu/pdf", async (req, res) => {
  try {
    const { download, print } = req.query;
    const meals = await db.getMeals(false);
    const html = generateMenuPdfHtml(meals, print === "true");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    if (download === "true") {
      res.setHeader("Content-Disposition", 'attachment; filename="Celebre-Catering-Official-Menu.html"');
    }
    res.send(html);
  } catch (err) {
    console.error("Error rendering menu PDF HTML:", err);
    res.status(500).json({ error: "\u062A\u0639\u0630\u0631 \u062A\u0648\u0644\u064A\u062F \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0646\u064A\u0648 \u0627\u0644\u0631\u0633\u0645\u064A\u0629" });
  }
});
apiRouter.get("/webhooks/meta", (req, res) => {
  handleMetaWebhookVerification(req, res);
});
apiRouter.post("/webhooks/meta", (req, res) => {
  handleMetaWebhookEvent(req, res);
});
apiRouter.get("/meta/status", (req, res) => {
  res.json(getMetaDiagnosticStatus());
});
apiRouter.get("/meals", async (req, res) => {
  try {
    const meals = await db.getMeals(false);
    const sorted = [...meals].sort((a, b) => a.code.localeCompare(b.code, void 0, { numeric: true }));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message || "\u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0648\u062C\u0628\u0627\u062A" });
  }
});
apiRouter.post("/bookings", async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerWhatsapp,
      preferredContact,
      eventName,
      eventDate,
      deliveryTime,
      deliveryGovernorate,
      deliveryAddress,
      notes,
      items
    } = req.body || {};
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
      res.status(400).json({ success: false, error: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u0639\u0645\u064A\u0644 \u0628\u0634\u0643\u0644 \u0635\u062D\u064A\u062D" });
      return;
    }
    if (!customerPhone || typeof customerPhone !== "string" || customerPhone.trim().length < 10) {
      res.status(400).json({ success: false, error: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0635\u062D\u064A\u062D (11 \u0631\u0642\u0645)" });
      return;
    }
    if (!eventName || !eventDate || !deliveryTime || !deliveryGovernorate || !deliveryAddress) {
      res.status(400).json({ success: false, error: "\u064A\u0631\u062C\u0649 \u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u062C\u0645\u064A\u0639 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0648\u0645\u0643\u0627\u0646 \u0648\u0645\u0648\u0639\u062F \u0627\u0644\u062A\u0633\u0644\u064A\u0645" });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: "\u064A\u062C\u0628 \u0627\u062E\u062A\u064A\u0627\u0631 \u0648\u062C\u0628\u0629 \u0648\u0627\u062D\u062F\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0644\u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u062D\u062C\u0632" });
      return;
    }
    const totalMealsRequested = items.reduce((sum, it) => sum + Math.max(1, Math.floor(Number(it.quantity) || 0)), 0);
    if (totalMealsRequested < 50) {
      res.status(400).json({
        success: false,
        error: `\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u0644\u0637\u0644\u0628 50 \u0648\u062C\u0628\u0629. \u0625\u062C\u0645\u0627\u0644\u064A \u0639\u062F\u062F \u0627\u0644\u0648\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u062D\u0627\u0644\u064A\u0627\u064B (${totalMealsRequested} \u0648\u062C\u0628\u0629) \u0623\u0642\u0644 \u0645\u0646 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649. \u064A\u0631\u062C\u0649 \u0632\u064A\u0627\u062F\u0629 \u0627\u0644\u0643\u0645\u064A\u0629 \u0625\u0644\u0649 50 \u0648\u062C\u0628\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0644\u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u062D\u062C\u0632.`
      });
      return;
    }
    const booking = await db.createBooking({
      customerName,
      customerPhone,
      customerWhatsapp,
      preferredContact: preferredContact === "phone" ? "phone" : "whatsapp",
      eventName,
      eventDate,
      deliveryTime,
      deliveryGovernorate,
      deliveryAddress,
      notes,
      items
    });
    let whatsappUrl = "";
    let messageText = "";
    try {
      const wa = buildBookingWhatsAppMessage(booking);
      whatsappUrl = wa.directUrl;
      messageText = wa.messageText;
    } catch (waErr) {
      console.warn("[WhatsApp Build Warning]:", waErr?.message || waErr);
    }
    const messengerUrl = "https://m.me/celebre.catering";
    let metaDispatchResult = {
      attempted: false,
      delivered: false,
      channel: "DIRECT_LINK_FALLBACK",
      note: "\u0627\u0644\u062D\u062C\u0632 \u0645\u0633\u062C\u0644 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0645\u062D\u0645\u064A \u0645\u0646 \u0623\u064A \u0627\u0646\u0642\u0637\u0627\u0639 \u062E\u0627\u0631\u062C\u064A."
    };
    try {
      metaDispatchResult = await notifyBookingViaMeta(booking);
    } catch (metaErr) {
      console.warn("[Meta Dispatch Non-blocking Warning]:", metaErr?.message || metaErr);
    }
    const { totalFactoryPrice, profitMargin, ...clientBooking } = booking;
    res.status(201).json({
      success: true,
      booking: clientBooking,
      whatsappUrl,
      whatsappMessage: messageText,
      messengerUrl,
      metaStatus: metaDispatchResult,
      persistenceConfirmed: true
    });
  } catch (err) {
    const sanitized = logServerError(err, "POST /api/bookings");
    res.status(500).json({
      success: false,
      error: sanitized.errorMessage || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645 \u0623\u062B\u0646\u0627\u0621 \u062D\u0641\u0638 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u062C\u0632. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",
      code: sanitized.errorCode
    });
  }
});
apiRouter.get("/bookings/track", async (req, res) => {
  try {
    const { code, verify } = req.query;
    if (!code || typeof code !== "string" || !code.trim()) {
      res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u062A\u0642\u062F\u064A\u0645 \u0631\u0642\u0645 \u0627\u0644\u062D\u062C\u0632" });
      return;
    }
    const booking = await db.trackBooking(String(code), typeof verify === "string" ? verify : void 0);
    if (!booking) {
      res.status(404).json({ error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u062D\u062C\u0632 \u064A\u0637\u0627\u0628\u0642 \u0647\u0630\u0627 \u0627\u0644\u0631\u0642\u0645\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0643\u062A\u0627\u0628\u0629 \u0631\u0642\u0645 \u0627\u0644\u062D\u062C\u0632 \u0623\u0648 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0628\u0634\u0643\u0644 \u0635\u062D\u064A\u062D." });
      return;
    }
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: err.message || "\u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0639\u0646 \u0627\u0644\u062D\u062C\u0632" });
  }
});
apiRouter.get("/bookings/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    const { download, print, verify } = req.query;
    const booking = await db.getBookingById(id);
    if (!booking) {
      res.status(404).json({ error: "\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      return;
    }
    if (verify && typeof verify === "string") {
      const allowed = await db.trackBooking(booking.bookingCode, verify);
      if (!allowed) {
        res.status(403).json({ error: "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u063A\u064A\u0631 \u0645\u062A\u0637\u0627\u0628\u0642" });
        return;
      }
    }
    const eligibleStatuses = ["CONFIRMED", "IN_PRODUCTION", "READY_FOR_DELIVERY", "DELIVERED", "COMPLETED"];
    if (!eligibleStatuses.includes(booking.status)) {
      res.status(400).json({
        error: `\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0635\u062F\u0627\u0631 \u0625\u064A\u0635\u0627\u0644 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0631\u0633\u0645\u064A \u0644\u0623\u0646 \u0627\u0644\u062D\u062C\u0632 \u062D\u0627\u0644\u064A\u0627\u064B \u0641\u064A \u062D\u0627\u0644\u0629 (${booking.status}). \u064A\u0634\u062A\u0631\u0637 \u062A\u0623\u0643\u064A\u062F \u0648\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u062D\u062C\u0632 \u0623\u0648\u0644\u0627\u064B.`,
        code: "BOOKING_NOT_CONFIRMED"
      });
      return;
    }
    const verifiedDeposit = Number(booking.paidAmount) || 0;
    if (verifiedDeposit <= 0) {
      res.status(400).json({
        error: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0635\u062F\u0627\u0631 \u0625\u064A\u0635\u0627\u0644 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0631\u0633\u0645\u064A \u0625\u0644\u0627 \u0628\u0639\u062F \u062A\u0633\u062C\u064A\u0644 \u062F\u0641\u0639\u0629 \u0627\u0644\u0639\u0631\u0628\u0648\u0646 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 (\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0645\u0633\u062F\u062F \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631).",
        code: "DEPOSIT_NOT_RECORDED"
      });
      return;
    }
    const html = generateBookingPdfHtml(booking, print === "true");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    if (download === "true") {
      res.setHeader("Content-Disposition", `attachment; filename="Celebre-Confirmation-${booking.bookingCode}.html"`);
    }
    res.send(html);
  } catch (err) {
    console.error("Error generating client booking PDF:", err);
    res.status(500).json({ error: err.message || "\u062A\u0639\u0630\u0631 \u0625\u0635\u062F\u0627\u0631 \u0625\u064A\u0635\u0627\u0644 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u062C\u0632" });
  }
});
apiRouter.post("/admin/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" });
      return;
    }
    const user = await db.verifyAdmin(username, password);
    if (!user) {
      res.status(401).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
      return;
    }
    const { token, sessionId, session } = createAdminSession(user, res);
    res.json({
      success: true,
      token,
      sessionId,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "\u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
  }
});
apiRouter.post("/admin/auth/logout", (req, res) => {
  let sessionId = req.sessionId;
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : void 0;
  if (!token && req.cookies && req.cookies.celebre_admin_session) {
    token = req.cookies.celebre_admin_session;
  }
  if (token) {
    try {
      const decoded = jwt2.decode(token);
      if (decoded && decoded.sessionId) {
        sessionId = decoded.sessionId;
      }
    } catch {
    }
  }
  if (sessionId) {
    revokeAdminSession(sessionId, res);
  } else if (res && typeof res.clearCookie === "function") {
    res.clearCookie("celebre_admin_session", { path: "/" });
  }
  res.json({
    success: true,
    message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0628\u0646\u062C\u0627\u062D \u0648\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062C\u0644\u0633\u0629 \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645"
  });
});
apiRouter.post("/admin/auth/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0648\u062A\u0623\u0643\u064A\u062F\u0647\u0627" });
      return;
    }
    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u063A\u064A\u0631 \u0645\u062A\u0637\u0627\u0628\u0642\u0629 \u0645\u0639 \u0627\u0644\u062A\u0623\u0643\u064A\u062F" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "\u064A\u062C\u0628 \u0623\u0646 \u062A\u062A\u0643\u0648\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0645\u0646 8 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" });
      return;
    }
    if (currentPassword === newPassword) {
      res.status(400).json({ error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0645\u062E\u062A\u0644\u0641\u0629 \u0639\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629" });
      return;
    }
    const username = req.user.username;
    const verified = await db.verifyAdmin(username, currentPassword);
    if (!verified) {
      res.status(400).json({ error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
      return;
    }
    const salt = bcrypt2.genSaltSync(10);
    const newPasswordHash = bcrypt2.hashSync(newPassword, salt);
    await db.updateAdminPassword(username, newPasswordHash, req.user.name || req.user.username);
    revokeAllUserSessions(req.user.id, res);
    res.json({
      success: true,
      message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0628\u0646\u062C\u0627\u062D. \u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0642\u062F\u064A\u0645\u0629 \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645\u060C \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B \u0628\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629."
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" });
  }
});
apiRouter.get("/admin/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
var recoveryRateBuckets = /* @__PURE__ */ new Map();
var usedRecoveryTokens = /* @__PURE__ */ new Set();
var recoveryOtpAttempts = /* @__PURE__ */ new Map();
function checkRecoveryRateLimit(key, maxRequests, windowMs = 15 * 60 * 1e3) {
  const now = Date.now();
  const bucket = recoveryRateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    recoveryRateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= maxRequests) {
    return false;
  }
  bucket.count += 1;
  return true;
}
function timingSafeHashEqual(a, b) {
  const hashA = crypto2.createHash("sha256").update(a).digest();
  const hashB = crypto2.createHash("sha256").update(b).digest();
  return crypto2.timingSafeEqual(hashA, hashB);
}
apiRouter.get("/admin/auth/recovery-options", (_req, res) => {
  const configuredKey = (process.env.ADMIN_RECOVERY_KEY || "").trim();
  res.json({
    recoveryKeyConfigured: configuredKey.length >= 8,
    metaWhatsAppConfigured: isMetaAutomatedConfigured()
  });
});
apiRouter.post("/admin/auth/request-reset", async (req, res) => {
  try {
    const rawUsername = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    if (!rawUsername || rawUsername.length > 120) {
      res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648\u0644\u0627\u064B" });
      return;
    }
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
    if (!checkRecoveryRateLimit(`req:${clientIp}:${rawUsername.toLowerCase()}`, 5, 15 * 60 * 1e3)) {
      res.status(429).json({ error: "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u0631\u062F\u0627\u062F. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0628\u0639\u062F 15 \u062F\u0642\u064A\u0642\u0629." });
      return;
    }
    const user = await db.findAdminUser(rawUsername);
    const jti = crypto2.randomUUID();
    const otp = crypto2.randomBytes(5).toString("hex").toUpperCase();
    const otpHmac = crypto2.createHmac("sha256", JWT_SECRET).update(`${otp}:${jti}`).digest("hex");
    let deliveredViaWhatsApp = false;
    if (user) {
      console.info(
        `[ADMIN_PASSWORD_RESET] Username: ${user.username} | One-Time Recovery Code: ${otp} | Valid for 10 minutes (jti=${jti})`
      );
      deliveredViaWhatsApp = await sendAdminRecoveryOtpViaMeta(user.username, otp);
      await db.addAuditLog({
        bookingId: "",
        bookingCode: "ADMIN_AUTH",
        action: "\u0637\u0644\u0628 \u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0627\u0644\u0625\u062F\u0627\u0631\u064A",
        performedBy: user.username,
        details: `\u062A\u0645 \u0625\u0635\u062F\u0627\u0631 \u0631\u0645\u0632 \u062A\u062D\u0642\u0642 \u0645\u0624\u0642\u062A \u0644\u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u0633\u0627\u0628 (${user.username})${deliveredViaWhatsApp ? " \u0648\u0625\u0631\u0633\u0627\u0644\u0647 \u0639\u0628\u0631 WhatsApp API" : " \u0641\u064A \u0633\u062C\u0644 \u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u0622\u0645\u0646"}.`
      });
    }
    const challengeToken = jwt2.sign(
      {
        purpose: "admin_password_reset",
        username: user ? user.username : rawUsername,
        jti,
        otpHmac
      },
      JWT_SECRET,
      { expiresIn: "10m" }
    );
    res.json({
      success: true,
      challengeToken,
      expiresInSeconds: 600,
      deliveredViaWhatsApp,
      message: "\u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0633\u062C\u0644\u0627\u064B\u060C \u0641\u0642\u062F \u062A\u0645 \u0625\u0635\u062F\u0627\u0631 \u0631\u0645\u0632 \u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0635\u0627\u0644\u062D \u0644\u0645\u062F\u0629 10 \u062F\u0642\u0627\u0626\u0642 \u0641\u064A \u0633\u062C\u0644 \u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u0622\u0645\u0646 (Server Logs)" + (isMetaAutomatedConfigured() ? " \u0648\u0625\u0631\u0633\u0627\u0644\u0647 \u0625\u0644\u0649 \u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0625\u062F\u0627\u0631\u0629." : ".")
    });
  } catch (err) {
    logServerError(err, "admin.auth.requestReset");
    res.status(500).json({ error: "\u062A\u0639\u0630\u0631 \u0645\u0639\u0627\u0644\u062C\u0629 \u0637\u0644\u0628 \u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" });
  }
});
apiRouter.post("/admin/auth/reset-password", async (req, res) => {
  try {
    const rawUsername = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const method = req.body?.method === "recovery_key" ? "recovery_key" : "server_otp";
    const recoveryCode = typeof req.body?.recoveryCode === "string" ? req.body.recoveryCode.trim() : "";
    const challengeToken = typeof req.body?.challengeToken === "string" ? req.body.challengeToken.trim() : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    const confirmPassword = typeof req.body?.confirmPassword === "string" ? req.body.confirmPassword : "";
    if (!rawUsername || !recoveryCode || !newPassword || !confirmPassword) {
      res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629" });
      return;
    }
    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u063A\u064A\u0631 \u0645\u062A\u0637\u0627\u0628\u0642\u0629 \u0645\u0639 \u0627\u0644\u062A\u0623\u0643\u064A\u062F" });
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      res.status(400).json({ error: "\u064A\u062C\u0628 \u0623\u0646 \u062A\u062A\u0643\u0648\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0645\u0646 8 \u0625\u0644\u0649 128 \u062D\u0631\u0641\u0627\u064B" });
      return;
    }
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
    if (!checkRecoveryRateLimit(`reset:${clientIp}`, 10, 15 * 60 * 1e3)) {
      res.status(429).json({ error: "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0639\u062F\u062F \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647\u0627. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 15 \u062F\u0642\u064A\u0642\u0629." });
      return;
    }
    if (method === "recovery_key") {
      const configuredKey = (process.env.ADMIN_RECOVERY_KEY || "").trim();
      if (configuredKey.length < 8) {
        res.status(400).json({
          error: "\u0645\u0641\u062A\u0627\u062D \u0627\u0644\u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0627\u0644\u0633\u0631\u064A (ADMIN_RECOVERY_KEY) \u063A\u064A\u0631 \u0645\u0636\u0628\u0648\u0637 \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645. \u0627\u0633\u062A\u062E\u062F\u0645 \u062E\u064A\u0627\u0631 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0645\u0624\u0642\u062A \u0645\u0646 \u0633\u062C\u0644 \u0627\u0644\u062E\u0627\u062F\u0645."
        });
        return;
      }
      if (!timingSafeHashEqual(recoveryCode, configuredKey)) {
        res.status(401).json({ error: "\u0645\u0641\u062A\u0627\u062D \u0627\u0644\u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0627\u0644\u0633\u0631\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
        return;
      }
    } else {
      if (!challengeToken) {
        res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u0637\u0644\u0628 \u0631\u0645\u0632 \u0627\u0644\u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0627\u0644\u0645\u0624\u0642\u062A \u0623\u0648\u0644\u0627\u064B \u0642\u0628\u0644 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646" });
        return;
      }
      let decoded;
      try {
        decoded = jwt2.verify(challengeToken, JWT_SECRET);
      } catch {
        res.status(401).json({ error: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0631\u0645\u0632 \u0627\u0644\u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0623\u0648 \u0623\u0646\u0647 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u060C \u064A\u0631\u062C\u0649 \u0637\u0644\u0628 \u0631\u0645\u0632 \u062C\u062F\u064A\u062F" });
        return;
      }
      if (!decoded || decoded.purpose !== "admin_password_reset" || !decoded.jti || !decoded.otpHmac) {
        res.status(401).json({ error: "\u0637\u0644\u0628 \u0627\u0633\u062A\u0631\u062F\u0627\u062F \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
        return;
      }
      if (usedRecoveryTokens.has(decoded.jti)) {
        res.status(401).json({ error: "\u062A\u0645 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0631\u0645\u0632 \u0627\u0644\u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0647\u0630\u0627 \u0645\u0633\u0628\u0642\u0627\u064B \u0623\u0648 \u062A\u0645 \u0625\u0628\u0637\u0627\u0644\u0647\u060C \u064A\u0631\u062C\u0649 \u0637\u0644\u0628 \u0631\u0645\u0632 \u062C\u062F\u064A\u062F" });
        return;
      }
      const attempts = recoveryOtpAttempts.get(decoded.jti) || 0;
      if (attempts >= 5) {
        usedRecoveryTokens.add(decoded.jti);
        res.status(429).json({ error: "\u062A\u0645 \u0627\u0633\u062A\u0646\u0641\u0627\u062F \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0631\u0645\u0632\u060C \u064A\u0631\u062C\u0649 \u0637\u0644\u0628 \u0631\u0645\u0632 \u0627\u0633\u062A\u0631\u062F\u0627\u062F \u062C\u062F\u064A\u062F" });
        return;
      }
      const expectedHmac = crypto2.createHmac("sha256", JWT_SECRET).update(`${recoveryCode.toUpperCase()}:${decoded.jti}`).digest("hex");
      if (!timingSafeHashEqual(expectedHmac, String(decoded.otpHmac))) {
        recoveryOtpAttempts.set(decoded.jti, attempts + 1);
        res.status(401).json({ error: "\u0631\u0645\u0632 \u0627\u0644\u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0627\u0644\u0645\u0624\u0642\u062A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
        return;
      }
      const userCheck = await db.findAdminUser(rawUsername);
      if (!userCheck || userCheck.username.toLowerCase() !== String(decoded.username).toLowerCase()) {
        res.status(401).json({ error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u0633\u0627\u0628 \u0644\u0627 \u062A\u0637\u0627\u0628\u0642 \u0637\u0644\u0628 \u0627\u0644\u0627\u0633\u062A\u0631\u062F\u0627\u062F" });
        return;
      }
      usedRecoveryTokens.add(decoded.jti);
    }
    const user = await db.findAdminUser(rawUsername);
    if (!user) {
      res.status(404).json({ error: "\u062A\u0639\u0630\u0631 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u062D\u0633\u0627\u0628 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628" });
      return;
    }
    const salt = bcrypt2.genSaltSync(10);
    const newPasswordHash = bcrypt2.hashSync(newPassword, salt);
    const updated = await db.updateAdminPassword(
      user.username,
      newPasswordHash,
      `\u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 (${method === "recovery_key" ? "\u0645\u0641\u062A\u0627\u062D \u0627\u0644\u0627\u0633\u062A\u0631\u062F\u0627\u062F" : "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0645\u0624\u0642\u062A"})`
    );
    if (!updated) {
      res.status(500).json({ error: "\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" });
      return;
    }
    revokeAllUserSessions(user.id, res);
    res.json({
      success: true,
      username: user.username,
      message: "\u062A\u0645 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0628\u0646\u062C\u0627\u062D \u0648\u0625\u0644\u063A\u0627\u0621 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0633\u0627\u0628\u0642\u0629. \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0622\u0646 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629."
    });
  } catch (err) {
    logServerError(err, "admin.auth.resetPassword");
    res.status(500).json({ error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" });
  }
});
apiRouter.get("/admin/meals", requireAuth, async (req, res) => {
  try {
    const isSuperOrAdmin = req.user?.role === "super_admin" || req.user?.role === "admin";
    const meals = await db.getMeals(isSuperOrAdmin);
    const sorted = [...meals].sort((a, b) => a.code.localeCompare(b.code, void 0, { numeric: true }));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/admin/meals/:id", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { distributorPrice, factoryPrice, ingredients, name, isActive } = req.body;
    const updated = await db.updateMeal(id, {
      distributorPrice: distributorPrice !== void 0 ? Number(distributorPrice) : void 0,
      factoryPrice: factoryPrice !== void 0 ? Number(factoryPrice) : void 0,
      ingredients,
      name,
      isActive
    }, req.user?.name || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    if (!updated) {
      res.status(404).json({ error: "\u0627\u0644\u0648\u062C\u0628\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      return;
    }
    res.json({ success: true, meal: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/admin/bookings", requireAuth, async (req, res) => {
  try {
    const { status, search } = req.query;
    const bookings = await db.getBookings({
      status: status ? String(status) : void 0,
      search: search ? String(search) : void 0
    });
    if (req.user?.role === "factory") {
      const sanitized = bookings.map((b) => {
        const { totalDistributorPrice, profitMargin, paidAmount, remainingAmount, items, ...rest } = b;
        return {
          ...rest,
          items: items.map((it) => {
            const { baseDistributorPrice, unitDistributorPrice, totalDistributorPrice: tdp, ...kitchenItem } = it;
            return kitchenItem;
          })
        };
      });
      res.json(sanitized);
      return;
    }
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/admin/bookings/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await db.getBookingById(id);
    if (!booking) {
      res.status(404).json({ error: "\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      return;
    }
    if (req.user?.role === "factory") {
      const { totalDistributorPrice, profitMargin, paidAmount, remainingAmount, items, ...rest } = booking;
      res.json({
        ...rest,
        items: items.map((it) => {
          const { baseDistributorPrice, unitDistributorPrice, totalDistributorPrice: tdp, ...kitchenItem } = it;
          return kitchenItem;
        })
      });
      return;
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/admin/bookings/:id/pdf", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { download, print } = req.query;
    const booking = await db.getBookingById(id);
    if (!booking) {
      res.status(404).json({ error: "\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      return;
    }
    const eligibleStatuses = ["CONFIRMED", "IN_PRODUCTION", "READY_FOR_DELIVERY", "DELIVERED", "COMPLETED"];
    if (!eligibleStatuses.includes(booking.status)) {
      res.status(400).json({
        error: `\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0635\u062F\u0627\u0631 \u0625\u064A\u0635\u0627\u0644 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0631\u0633\u0645\u064A \u0644\u0623\u0646 \u0627\u0644\u062D\u062C\u0632 \u062D\u0627\u0644\u064A\u0627\u064B \u0641\u064A \u062D\u0627\u0644\u0629 (${booking.status}). \u064A\u0634\u062A\u0631\u0637 \u062A\u0623\u0643\u064A\u062F \u0648\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u062D\u062C\u0632 \u0623\u0648\u0644\u0627\u064B.`,
        code: "BOOKING_NOT_CONFIRMED"
      });
      return;
    }
    const verifiedDeposit = Number(booking.paidAmount) || 0;
    if (verifiedDeposit <= 0) {
      res.status(400).json({
        error: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0635\u062F\u0627\u0631 \u0625\u064A\u0635\u0627\u0644 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0631\u0633\u0645\u064A \u0625\u0644\u0627 \u0628\u0639\u062F \u062A\u0633\u062C\u064A\u0644 \u062F\u0641\u0639\u0629 \u0627\u0644\u0639\u0631\u0628\u0648\u0646 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 (\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0645\u0633\u062F\u062F \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631).",
        code: "DEPOSIT_NOT_RECORDED"
      });
      return;
    }
    const html = generateBookingPdfHtml(booking, print === "true");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    if (download === "true") {
      res.setHeader("Content-Disposition", `attachment; filename="Celebre-Client-Confirmation-${booking.bookingCode}.html"`);
    }
    res.send(html);
  } catch (err) {
    console.error("Error generating admin client booking PDF:", err);
    res.status(500).json({ error: err.message || "\u062A\u0639\u0630\u0631 \u0625\u0635\u062F\u0627\u0631 \u0625\u064A\u0635\u0627\u0644 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u062C\u0632" });
  }
});
apiRouter.patch("/admin/bookings/:id", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, statusNotes, ...otherUpdates } = req.body;
    let updated = null;
    if (status) {
      updated = await db.updateBookingStatus(id, status, req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629", statusNotes);
    }
    if (Object.keys(otherUpdates).length > 0) {
      updated = await db.updateBooking(id, otherUpdates, req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    }
    if (!updated) {
      res.status(404).json({ error: "\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      return;
    }
    res.json({ success: true, booking: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.post("/admin/bookings/:id/status", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, statusNotes } = req.body;
    if (!status) {
      res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u062C\u062F\u064A\u062F\u0629" });
      return;
    }
    const updated = await db.updateBookingStatus(
      id,
      status,
      req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629",
      statusNotes
    );
    res.json({ success: true, booking: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.post("/admin/bookings/:id/payments", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, date, notes, receiptNumber, allowOverpayment, bookingId, bookingCode } = req.body || {};
    const targetId = (id || bookingId || bookingCode || "").trim();
    if (!targetId || targetId === "undefined" || targetId === "null") {
      res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u062A\u0642\u062F\u064A\u0645 \u0645\u0639\u0631\u0651\u0641 \u0623\u0648 \u0643\u0648\u062F \u0627\u0644\u062D\u062C\u0632 \u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u0641\u0639\u0629" });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ error: "\u0642\u064A\u0645\u0629 \u0627\u0644\u062F\u0641\u0639\u0629 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631" });
      return;
    }
    const result = await db.addPayment({
      bookingId: bookingId || targetId,
      bookingCode: bookingCode || (targetId.startsWith("CLB-") ? targetId : void 0),
      amount: Number(amount),
      method: method || "cash",
      date,
      notes,
      receiptNumber,
      allowOverpayment: Boolean(allowOverpayment)
    }, req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    res.json({ success: true, payment: result.payment, booking: result.booking });
  } catch (err) {
    const sanitized = logServerError(err, "POST /admin/bookings/:id/payments");
    res.status(400).json({ error: sanitized.errorMessage || err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u0641\u0639\u0629" });
  }
});
apiRouter.post("/admin/payments/:id/cancel", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u062A\u0642\u062F\u064A\u0645 \u0633\u0628\u0628 \u0625\u0644\u063A\u0627\u0621 \u0623\u0648 \u0639\u0643\u0633 \u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0644\u062A\u0648\u062B\u064A\u0642\u0647\u0627 \u0641\u064A \u0633\u062C\u0644 \u0627\u0644\u062A\u062F\u0642\u064A\u0642" });
      return;
    }
    const result = await db.cancelPayment(
      id,
      reason.trim(),
      req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629"
    );
    res.json({ success: true, payment: result.payment, booking: result.booking });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.get("/admin/bookings/:id/factory-preview", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const preview = await db.getFactoryOrderPreview(id);
    res.json({ success: true, preview });
  } catch (err) {
    res.status(404).json({ error: err.message || "\u0641\u0634\u0644 \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0645\u0639\u0627\u064A\u0646\u0629 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639" });
  }
});
apiRouter.post("/admin/bookings/:id/factory-order", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { forceNewVersion } = req.body || {};
    const factoryOrder = await db.createFactoryOrder(id, req.user?.name || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629", { forceNewVersion });
    res.json({ success: true, factoryOrder });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.put("/admin/bookings/:id", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateBookingByAdmin(id, req.body, req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    res.json({ success: true, booking: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.post("/admin/bookings/:id/confirm", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const confirmed = await db.confirmBooking(id, req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    res.json({ success: true, booking: confirmed });
  } catch (err) {
    res.status(400).json({ error: err.message || "\u0641\u0634\u0644 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u062C\u0632" });
  }
});
apiRouter.post("/admin/bookings/:id/factory-order/whatsapp", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { factoryPhone, forceNewVersion, kitchenInstructions } = req.body || {};
    const booking = await db.getBookingById(id);
    if (!booking) {
      res.status(404).json({ error: "\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      return;
    }
    if (booking.totalMealsCount < 50) {
      res.status(400).json({
        error: `\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u062C\u0647\u064A\u0632 \u0637\u0644\u0628 \u0627\u0644\u0645\u0635\u0646\u0639 \u0644\u062D\u062C\u0632 \u064A\u0642\u0644 \u0625\u062C\u0645\u0627\u0644\u064A \u0648\u062C\u0628\u0627\u062A\u0647 \u0639\u0646 50 \u0648\u062C\u0628\u0629 (\u0627\u0644\u0639\u062F\u062F \u0627\u0644\u062D\u0627\u0644\u064A: ${booking.totalMealsCount} \u0648\u062C\u0628\u0629). \u064A\u0631\u062C\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u062A\u0639\u062F\u064A\u0644 \u0643\u0645\u064A\u0627\u062A \u0627\u0644\u062D\u062C\u0632 \u0625\u0644\u0649 50 \u0648\u062C\u0628\u0629 \u0641\u0623\u0643\u062B\u0631 \u0623\u0648\u0644\u0627\u064B.`
      });
      return;
    }
    let factoryOrder = booking.factoryOrders && booking.factoryOrders.length > 0 ? booking.factoryOrders[booking.factoryOrders.length - 1] : null;
    if (!factoryOrder || forceNewVersion) {
      factoryOrder = await db.createFactoryOrder(id, req.user?.name || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629", { forceNewVersion: Boolean(forceNewVersion) });
    }
    if (kitchenInstructions) {
      factoryOrder.packagingNotes = `${factoryOrder.packagingNotes || ""} - \u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0627\u0644\u0645\u0637\u0628\u062E: ${kitchenInstructions}`.trim();
    }
    const phoneToUse = factoryPhone || CELEBRE_CONFIG.whatsappNumber;
    const { messageText, whatsappUrl } = buildFactoryWhatsAppMessage(factoryOrder, booking, phoneToUse);
    res.json({
      success: true,
      factoryOrder,
      messageText,
      whatsappUrl,
      factoryPhone: phoneToUse
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.post("/admin/factory-orders/:id/confirm-sent", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db.confirmFactoryOrderSent(id, req.user?.name || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    res.json({ success: true, factoryOrder: order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.put("/admin/bookings/:id/test-edit", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateTestBooking(id, req.body, req.user?.name || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    res.json({ success: true, booking: updated });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});
apiRouter.delete("/admin/bookings/:id/test-delete", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.deleteTestBooking(id, req.user?.name || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    res.json({ success: true, message: `\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A ${result.bookingCode} \u0628\u0646\u062C\u0627\u062D` });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});
apiRouter.delete("/admin/bookings/:id/cancelled", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.deleteCancelledBooking(id, req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    res.json({ success: true, message: result.message, bookingCode: result.bookingCode });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.post("/admin/bookings/bulk-delete-cancelled", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { bookingIds } = req.body || {};
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0642\u0627\u0626\u0645\u0629 \u0645\u0639\u0631\u0651\u0641\u0627\u062A \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u0645\u0644\u063A\u0627\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062D\u0630\u0641\u0647\u0627" });
      return;
    }
    const result = await db.deleteBatchCancelledBookings(bookingIds, req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.get("/admin/database/inventory", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const inventory = await db.getDatabaseInventory();
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message || "\u0641\u0634\u0644 \u0641\u062D\u0635 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" });
  }
});
apiRouter.post("/admin/test-bookings/clean", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { bookingIds } = req.body || {};
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0642\u0627\u0626\u0645\u0629 \u0645\u0639\u0631\u0641\u0627\u062A \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062D\u0630\u0641\u0647\u0627 \u0646\u0647\u0627\u0626\u064A\u0627\u064B" });
      return;
    }
    const result = await db.deleteBookingsPermanently(bookingIds, req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.delete("/admin/bookings/:id", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const performer = req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629";
    const auditPerformer = reason ? `${performer} (\u0627\u0644\u0633\u0628\u0628: ${reason.trim()})` : performer;
    const result = await db.deleteBookingsPermanently([id], auditPerformer);
    if (result.skipped.length > 0 && result.deletedCount === 0) {
      res.status(400).json({ error: result.skipped[0].reason });
      return;
    }
    res.json({ success: true, message: `\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u062C\u0632 \u0648\u0623\u0631\u0634\u0641\u0629 \u0633\u062C\u0644\u0627\u062A\u0647 \u0628\u0646\u062C\u0627\u062D`, deletedCodes: result.deletedCodes });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.delete("/admin/bookings/:id/force-test", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.deleteBookingsPermanently([id], req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    if (result.skipped.length > 0 && result.deletedCount === 0) {
      res.status(400).json({ error: result.skipped[0].reason });
      return;
    }
    res.json({ success: true, message: `\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u062C\u0632 \u0628\u0646\u062C\u0627\u062D`, deletedCodes: result.deletedCodes });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.get("/admin/factory-orders", requireAuth, async (req, res) => {
  try {
    const orders = await db.getFactoryOrders();
    if (req.user?.role === "factory") {
      const sanitized = orders.map((fo) => {
        const { factoryCostTotal, ...safeOrder } = fo;
        return {
          ...safeOrder,
          items: safeOrder.items.map((it) => {
            const { unitFactoryPrice, totalFactoryPrice, ...kitchenItem } = it;
            return kitchenItem;
          })
        };
      });
      res.json(sanitized);
      return;
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/admin/factory-orders/:id", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    if (body.paymentChanges !== void 0 && (typeof body.paymentChanges !== "object" || body.paymentChanges === null)) {
      res.status(400).json({ error: "\u0635\u064A\u063A\u0629 \u062A\u0639\u062F\u064A\u0644\u0627\u062A \u0627\u0644\u062F\u0641\u0639\u0627\u062A (paymentChanges) \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
      return;
    }
    const updated = await db.updateFactoryOrder(id, body, req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    res.json({ success: true, factoryOrder: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.patch("/admin/factory-orders/:id/status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await db.updateFactoryOrderStatus(id, status, req.user?.name || "\u0627\u0644\u0645\u0635\u0646\u0639");
    if (!updated) {
      res.status(404).json({ error: "\u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      return;
    }
    res.json({ success: true, factoryOrder: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/admin/factory-orders/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db.getFactoryOrderById(id);
    if (!order) {
      res.status(404).json({ error: "\u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      return;
    }
    if (req.user?.role === "factory") {
      const { factoryCostTotal, paidToFactoryAmount, remainingToFactoryAmount, paymentStatus, ...safeOrder } = order;
      res.json(safeOrder);
      return;
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/admin/factory-orders/:id/payments", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const payments = await db.getFactoryPayments(id);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/admin/factory-orders/:id/payments", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, paymentType, date, notes, receiptNumber } = req.body || {};
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: "\u0642\u064A\u0645\u0629 \u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0635\u0646\u0639 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0631\u0642\u0645\u0627\u064B \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631" });
      return;
    }
    const result = await db.addFactoryPayment(
      {
        factoryOrderId: id,
        amount: numAmount,
        method: method || "cash",
        paymentType,
        date,
        notes,
        receiptNumber
      },
      req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629"
    );
    res.json({ success: true, payment: result.payment, factoryOrder: result.factoryOrder });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.put("/admin/factory-payments/:id", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, paymentType, date, notes, receiptNumber } = req.body || {};
    let parsedAmount;
    if (amount !== void 0) {
      parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: "\u0642\u064A\u0645\u0629 \u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0639\u062F\u0644\u0629 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0631\u0642\u0645\u0627\u064B \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631" });
        return;
      }
    }
    const result = await db.updateFactoryPayment(
      id,
      {
        amount: parsedAmount,
        method,
        paymentType,
        date,
        notes,
        receiptNumber
      },
      req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629"
    );
    res.json({ success: true, payment: result.payment, factoryOrder: result.factoryOrder });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.delete("/admin/factory-payments/:id", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const result = await db.deleteFactoryPayment(
      id,
      req.user?.name || req.user?.username || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629",
      reason || "\u062D\u0630\u0641 \u062F\u0641\u0639\u0629 \u0645\u0633\u062C\u0644\u0629 \u0628\u0627\u0644\u062E\u0637\u0623"
    );
    res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u062F\u0641\u0639\u0629 \u0627\u0644\u0645\u0635\u0646\u0639 \u0628\u0646\u062C\u0627\u062D", factoryOrder: result.factoryOrder });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.get("/admin/stats", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/admin/audit-logs", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { bookingId } = req.query;
    const logs = await db.getAuditLogs(bookingId ? String(bookingId) : void 0);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/admin/system/migrate", requireAuth, requireRole(["super_admin"]), async (req, res) => {
  try {
    const stats = await runSafeMigration();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err?.message || "\u0641\u0634\u0644 \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u062A\u0631\u062D\u064A\u0644" });
  }
});
apiRouter.get("/admin/system/rls-status", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const client = getPrismaClient();
    if (!client) {
      res.json({
        enabled: false,
        storageMode: "resilient_storage",
        message: "\u0627\u0644\u0646\u0638\u0627\u0645 \u064A\u0639\u0645\u0644 \u0628\u0648\u0636\u0639 \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u0645\u0631\u0646 (data/db.json). RLS \u0645\u0641\u0639\u0644 \u0639\u0644\u0649 \u0628\u064A\u0626\u0629 Supabase PostgreSQL."
      });
      return;
    }
    const report = await getRlsStatusReport(client);
    res.json({
      enabled: report.allSecured,
      ...report
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/admin/system/apply-rls", requireAuth, requireRole(["super_admin"]), async (req, res) => {
  try {
    const client = getPrismaClient();
    if (!client) {
      res.status(400).json({ error: "\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A PostgreSQL \u063A\u064A\u0631 \u0645\u062A\u0635\u0644\u0629 \u062D\u0627\u0644\u064A\u0627\u064B" });
      return;
    }
    const result = await ensureRlsSecurity(client);
    const report = await getRlsStatusReport(client);
    res.json({ success: result.success, result, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// src/server/api.ts
var app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use((req, res, next) => {
  const queryPath = typeof req.query.__path === "string" ? req.query.__path : null;
  const forwardedUri = req.headers["x-forwarded-uri"] || req.headers["x-matched-path"];
  if (queryPath) {
    req.url = `/${queryPath.replace(/^\//, "")}`;
  } else if (forwardedUri && forwardedUri.startsWith("/api")) {
    req.url = forwardedUri.replace(/^\/api/, "") || "/";
  } else if (req.url.startsWith("/api")) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }
  next();
});
app.use("/api", apiRouter);
app.use(apiRouter);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `\u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F: ${req.method} ${req.originalUrl || req.url}`
  });
});
app.use((err, req, res, _next) => {
  const sanitized = logServerError(err, `Express.GlobalError.${req.method}.${req.url}`);
  const status = typeof err.status === "number" && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({
    success: false,
    error: sanitized.errorMessage || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u0637\u0644\u0628",
    code: sanitized.errorCode
  });
});
process.on("unhandledRejection", (reason) => {
  logServerError(reason, "Process.UnhandledRejection");
});
process.on("uncaughtException", (err) => {
  logServerError(err, "Process.UncaughtException");
});
var api_default = app;
function handler(req, res) {
  return app(req, res);
}
export {
  api_default as default,
  handler
};
