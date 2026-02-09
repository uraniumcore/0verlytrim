import { Router } from "express";
import path from "path";

const pagesRoutes = Router();

const root = path.join(process.cwd(), "src/static");

pagesRoutes.get("/", (_req, res) => {
    res.sendFile(path.join(root, "../static/index.html"));
});

pagesRoutes.get("/profile", (_req, res) => {
    res.sendFile(path.join(root, "../static/profile.html"));
});

pagesRoutes.get("/login", (_req, res) => {
    res.sendFile(path.join(root, "../static/login.html"));
});

pagesRoutes.get("/register", (_req, res) => {
    res.sendFile(path.join(root, "../static/register.html"));
});

pagesRoutes.get("/book", (_req, res) => {
    res.sendFile(path.join(root, "../static/book.html"));
});

export default pagesRoutes;