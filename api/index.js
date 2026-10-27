// src/server/api.ts
import express from "express";
import cors from "cors";

// src/server/routes.ts
import { Router } from "express";
import jwt from "jsonwebtoken";

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
    factoryPrice: 53,
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
    name: "\u0645\u064A\u0643\u0633 \u0628\u0648\u0643\u0633 12 - \u062C\u0627\u062A\u0648\u0647 \u0648\u0628\u0627\u0646\u064A\u0629 \u0628\u0627\u0644\u0632\u0628\u062F\u0629 \u0646\u0643\u0647\u0627\u062A \u0645\u062E\u062A\u0644\u0641\u0629",
    category: "mix_box",
    ingredients: "\u0642\u0637\u0639\u0629 \u062C\u0627\u062A\u0648\u0629 \u0645\u063A\u0644\u0641\u0629 + \u0628\u0627\u0646\u064A\u0629 \u0628\u0627\u0644\u0630\u0628\u062F\u0629 \u0646\u0643\u0647\u0627\u062A \u0645\u062E\u062A\u0644\u0641\u0629 + \u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 + \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644",
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
    pepsiExtra: 10
  }
};

// src/lib/prisma.ts
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

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
    const formattedUrl = formatDatabaseUrl(rawUrl);
    prismaInstance = new PrismaClient({
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

// src/server/db.ts
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
    this.addAuditLog({
      bookingId: "",
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
      let drinkDelta = 0;
      if (meal.hasJuice) {
        if (item.drinkOption === "no_juice") {
          drinkDelta = -CELEBRE_CONFIG.drinkAdjustments.noJuiceDiscount;
        } else if (item.drinkOption === "pepsi") {
          drinkDelta = CELEBRE_CONFIG.drinkAdjustments.pepsiExtra;
        }
      }
      const unitDistributorPrice = Math.max(0, baseDistributorPrice + drinkDelta);
      const unitFactoryPrice = Math.max(0, baseFactoryPrice + drinkDelta);
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
        baseDistributorPrice,
        unitDistributorPrice,
        totalDistributorPrice: itemTotalDistributor,
        baseFactoryPrice,
        unitFactoryPrice,
        totalFactoryPrice: itemTotalFactory
      };
    });
    let bookingCode = generateBookingCode();
    let collisionAttempts = 0;
    while (memoryDB.bookings.some((b) => b.bookingCode === bookingCode) && collisionAttempts < 10) {
      bookingCode = generateBookingCode();
      collisionAttempts++;
    }
    const securityCode = generateSecurityCode();
    const now = (/* @__PURE__ */ new Date()).toISOString();
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
      version: 1,
      createdAt: now,
      updatedAt: now
    };
    memoryDB.bookings.unshift(newBooking);
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
      action: "\u0625\u0646\u0634\u0627\u0621 \u062D\u062C\u0632 \u0645\u0628\u062F\u0626\u064A",
      performedBy: "\u0627\u0644\u0639\u0645\u064A\u0644 (\u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A)",
      details: `\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u062C\u0632 \u0631\u0642\u0645 ${bookingCode} \u0628\u0625\u062C\u0645\u0627\u0644\u064A ${totalMealsCount} \u0648\u062C\u0628\u0629 \u0648\u0642\u064A\u0645\u0629 ${totalDistributorPrice} \u062C\u0646\u064A\u0647.`
    });
    saveLocalDB(memoryDB);
    return newBooking;
  },
  async getBookings(filters) {
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
      payments: memoryDB.payments.filter((p) => p.bookingId === b.id),
      factoryOrders: memoryDB.factoryOrders.filter((fo) => fo.bookingId === b.id),
      auditLogs: memoryDB.auditLogs.filter((al) => al.bookingId === b.id)
    }));
  },
  async getBookingById(id) {
    memoryDB = loadLocalDB();
    const b = memoryDB.bookings.find((item) => item.id === id || item.bookingCode === id);
    if (!b) return null;
    return {
      ...b,
      payments: memoryDB.payments.filter((p) => p.bookingId === b.id),
      factoryOrders: memoryDB.factoryOrders.filter((fo) => fo.bookingId === b.id),
      auditLogs: memoryDB.auditLogs.filter((al) => al.bookingId === b.id)
    };
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
    memoryDB = loadLocalDB();
    const idx = memoryDB.bookings.findIndex((b) => b.id === id || b.bookingCode === id);
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
      action: "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062D\u062C\u0632",
      performedBy,
      details: auditDetail
    });
    saveLocalDB(memoryDB);
    return updated;
  },
  async addPayment(data, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    memoryDB = loadLocalDB();
    const booking = memoryDB.bookings.find((b) => b.id === data.bookingId);
    if (!booking) {
      throw new Error("\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    }
    const payment = {
      id: `pay-${Date.now()}`,
      bookingId: data.bookingId,
      amount: data.amount,
      method: data.method,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      notes: data.notes || "",
      receiptNumber: data.receiptNumber || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryDB.payments.unshift(payment);
    booking.paidAmount += data.amount;
    booking.remainingAmount = Math.max(0, booking.totalDistributorPrice - booking.paidAmount);
    booking.version += 1;
    booking.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (booking.status === "INITIAL" || booking.status === "PENDING_CONFIRMATION") {
      booking.status = "CONFIRMED";
      booking.statusNotes = `\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u062C\u0632 \u0628\u0639\u062F \u0627\u0633\u062A\u0644\u0627\u0645 \u062F\u0641\u0639\u0629 \u0628\u0642\u064A\u0645\u0629 ${data.amount} \u062C\u0646\u064A\u0647`;
    }
    this.addAuditLog({
      bookingId: booking.id,
      action: "\u062A\u0633\u062C\u064A\u0644 \u062F\u0641\u0639\u0629 \u0645\u0627\u0644\u064A\u0629",
      performedBy,
      details: `\u062A\u0645 \u062A\u062D\u0635\u064A\u0644 \u0645\u0628\u0644\u063A ${data.amount} \u062C (${data.method}). \u0627\u0644\u0645\u062A\u0628\u0642\u064A: ${booking.remainingAmount} \u062C.`
    });
    saveLocalDB(memoryDB);
    return payment;
  },
  async createFactoryOrder(bookingId, performedBy = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629") {
    memoryDB = loadLocalDB();
    const booking = memoryDB.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      throw new Error("\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0644\u0625\u0635\u062F\u0627\u0631 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639");
    }
    const existingOrders = memoryDB.factoryOrders.filter((fo) => fo.bookingId === bookingId);
    const version = existingOrders.length + 1;
    memoryDB.factoryOrderCounter += 1;
    const orderNumber = `FO-2026-${memoryDB.factoryOrderCounter}`;
    const factoryOrder = {
      id: `fo-${Date.now()}`,
      orderNumber,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      version,
      status: "PENDING",
      eventDate: booking.eventDate,
      deliveryTime: booking.deliveryTime,
      deliveryLocation: `${booking.deliveryGovernorate} - ${booking.deliveryAddress}`,
      factoryCostTotal: booking.totalFactoryPrice || 0,
      // Strictly separate kitchen information:
      // quantities, meal codes, ingredients list, drink option, packaging notes, factory unit cost
      // STRICTLY NO distributor prices or profit margins!
      items: booking.items.map((item) => ({
        mealCode: item.mealCode,
        mealName: item.mealName,
        quantity: item.quantity,
        drinkOption: item.drinkOption,
        ingredients: item.ingredients,
        unitFactoryPrice: item.unitFactoryPrice,
        totalFactoryPrice: item.totalFactoryPrice,
        specialInstructions: item.drinkOption === "no_juice" ? "\u0628\u062F\u0648\u0646 \u0639\u0635\u064A\u0631" : item.drinkOption === "pepsi" ? "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0639\u0635\u064A\u0631 \u0628\u0643\u0627\u0646\u0632 \u0628\u064A\u0628\u0633\u064A" : "\u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A"
      })),
      packagingNotes: `\u0627\u0644\u0639\u0644\u0628\u0629 \u0627\u0644\u0628\u064A\u0636\u0627\u0621 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0644\u0640 Celebre Catering. \u0648\u0636\u0639 \u0634\u0648\u0643\u0629 \u0648\u0645\u0646\u062F\u064A\u0644 \u0645\u0639\u0637\u0631 \u0645\u0639 \u0643\u0644 \u0648\u062C\u0628\u0629. \u0641\u062D\u0635 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u062A\u0639\u0628\u0626\u0629. ${booking.notes || ""}`.trim(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryDB.factoryOrders.unshift(factoryOrder);
    if (booking.status === "CONFIRMED" || booking.status === "PENDING_CONFIRMATION") {
      booking.status = "IN_PRODUCTION";
      booking.statusNotes = `\u062A\u0645 \u0625\u0635\u062F\u0627\u0631 \u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639 \u0631\u0642\u0645 ${orderNumber} (\u0627\u0644\u0625\u0635\u062F\u0627\u0631 v${version})`;
      booking.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    this.addAuditLog({
      bookingId: booking.id,
      action: "\u0625\u0635\u062F\u0627\u0631 \u0623\u0645\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0635\u0646\u0639",
      performedBy,
      details: `\u062A\u0645 \u0625\u0635\u062F\u0627\u0631 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 \u0631\u0642\u0645 ${orderNumber} (\u0627\u0644\u0625\u0635\u062F\u0627\u0631 ${version}) \u0628\u0625\u062C\u0645\u0627\u0644\u064A ${booking.totalMealsCount} \u0648\u062C\u0628\u0629 \u0628\u062F\u0648\u0646 \u0625\u0638\u0647\u0627\u0631 \u0647\u0648\u0627\u0645\u0634 \u0627\u0644\u0631\u0628\u062D.`
    });
    saveLocalDB(memoryDB);
    return factoryOrder;
  },
  async getFactoryOrders() {
    memoryDB = loadLocalDB();
    return memoryDB.factoryOrders;
  },
  async updateFactoryOrderStatus(orderId, status, performedBy = "\u0627\u0644\u0645\u0635\u0646\u0639") {
    memoryDB = loadLocalDB();
    const fo = memoryDB.factoryOrders.find((item) => item.id === orderId || item.orderNumber === orderId);
    if (!fo) return null;
    fo.status = status;
    fo.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
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
      action: "\u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639",
      performedBy,
      details: `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0623\u0645\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 ${fo.orderNumber} \u0625\u0644\u0649 ${status}`
    });
    saveLocalDB(memoryDB);
    return fo;
  },
  async addAuditLog(log) {
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...log
    };
    memoryDB.auditLogs.unshift(newLog);
    return newLog;
  },
  async getAuditLogs(bookingId) {
    memoryDB = loadLocalDB();
    if (bookingId) {
      return memoryDB.auditLogs.filter((l) => l.bookingId === bookingId);
    }
    return memoryDB.auditLogs.slice(0, 50);
  },
  async getStats() {
    memoryDB = loadLocalDB();
    const totalBookings = memoryDB.bookings.length;
    let totalMeals = 0;
    let totalRevenue = 0;
    let totalFactoryCost = 0;
    let totalCollected = 0;
    memoryDB.bookings.forEach((b) => {
      if (b.status !== "CANCELLED") {
        totalMeals += b.totalMealsCount;
        totalRevenue += b.totalDistributorPrice;
        totalFactoryCost += b.totalFactoryPrice || 0;
        totalCollected += b.paidAmount;
      }
    });
    const totalProfit = totalRevenue - totalFactoryCost;
    const totalOutstanding = Math.max(0, totalRevenue - totalCollected);
    return {
      totalBookings,
      totalMeals,
      totalRevenue,
      totalFactoryCost,
      totalProfit,
      totalCollected,
      totalOutstanding,
      activeMealsCount: memoryDB.meals.filter((m) => m.isActive).length,
      factoryOrdersCount: memoryDB.factoryOrders.length
    };
  },
  async verifyAdmin(username, password) {
    memoryDB = loadLocalDB();
    const user = memoryDB.adminUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
    );
    if (!user) return null;
    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
};

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
    const drinkLabel = it.drinkOption === "no_juice" ? "\u0628\u062F\u0648\u0646 \u0639\u0635\u064A\u0631 (-5\u062C)" : it.drinkOption === "pepsi" ? "\u0628\u064A\u0628\u0633\u064A (+10\u062C)" : "\u0639\u0635\u064A\u0631 \u0628\u062E\u064A\u0631\u0629";
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

// scripts/migrate-to-postgres.ts
import fs3 from "fs";
import path3 from "path";
import { PrismaClient as PrismaClient2 } from "@prisma/client";
async function runSafeMigration() {
  const databaseUrl2 = process.env.DATABASE_URL;
  if (!databaseUrl2) {
    console.error("\u274C \u062E\u0637\u0623: \u0645\u062A\u063A\u064A\u0631 DATABASE_URL \u063A\u064A\u0631 \u0645\u062D\u062F\u062F. \u064A\u0631\u062C\u0649 \u062A\u0648\u0641\u064A\u0631 \u0631\u0627\u0628\u0637 \u0627\u062A\u0635\u0627\u0644 PostgreSQL \u0642\u0628\u0644 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u062A\u0631\u062D\u064A\u0644.");
    process.exit(1);
  }
  const formattedUrl = formatDatabaseUrl(databaseUrl2);
  const prisma2 = new PrismaClient2({
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
    console.log("\n--- 2. \u062A\u0631\u062D\u064A\u0644 \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u0640 35 (\u0645\u0639 \u062D\u0638\u0631 \u0627\u0644\u062A\u0643\u0631\u0627\u0631 \u0648\u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0627\u0644\u0622\u0645\u0646\u0629) ---");
    let insertedBookings = 0;
    let existingBookings = 0;
    for (const b of sourceBookings) {
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

// src/server/schemaInit.ts
var REQUIRED_TABLES = [
  "meals",
  "bookings",
  "booking_items",
  "payments",
  "factory_orders",
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
  if (!status.allReady) {
    for (const tableName of status.missingTables) {
      const ddl = TABLE_DDL_QUERIES[tableName];
      if (ddl) {
        try {
          await client.$executeRawUnsafe(ddl);
          created.push(tableName);
        } catch (err) {
          logServerError(err, `SchemaInit.CreateTable.${tableName}`);
        }
      }
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
    }
  } catch {
  }
  const postCheck = await checkTablesStatus(client);
  return {
    success: postCheck.allReady,
    created,
    tablesFound: postCheck.existingTables
  };
}

// src/server/routes.ts
import pg from "pg";
var apiRouter = Router();
var JWT_SECRET = process.env.JWT_SECRET || "celebre-catering-jwt-super-secret-key-2026";
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0644\u0632\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0646\u062A\u0647\u064A\u0629 \u0623\u0648 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
    return;
  }
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
  let pgEngineCheck = { tested: false, connected: false, phase: "idle" };
  if (process.env.DATABASE_URL) {
    const rawUrl = process.env.DATABASE_URL;
    const formattedUrl = formatDatabaseUrl(rawUrl);
    pgEngineCheck.tested = true;
    const pgStart = Date.now();
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
      existing: existingTablesList
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
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      success: true,
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "\u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
  }
});
apiRouter.get("/admin/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
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
apiRouter.patch("/admin/bookings/:id", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await db.updateBooking(id, updates, req.user?.name || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    if (!updated) {
      res.status(404).json({ error: "\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      return;
    }
    res.json({ success: true, booking: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/admin/bookings/:id/payments", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, notes, receiptNumber } = req.body;
    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ error: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0645\u0628\u0644\u063A \u0635\u062D\u064A\u062D" });
      return;
    }
    const payment = await db.addPayment({
      bookingId: id,
      amount: Number(amount),
      method: method || "cash",
      notes,
      receiptNumber
    }, req.user?.name || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    const updatedBooking = await db.getBookingById(id);
    res.json({ success: true, payment, booking: updatedBooking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/admin/bookings/:id/factory-order", requireAuth, requireRole(["super_admin", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const factoryOrder = await db.createFactoryOrder(id, req.user?.name || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629");
    res.json({ success: true, factoryOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// src/server/api.ts
var app = express();
app.use(cors());
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
