import express, { Request, Response } from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "OK" });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
