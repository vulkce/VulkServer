// esse é apenas um projetinho antigo meu
// nada sério! meow! 

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;
const localFilesPath = path.resolve(__dirname, "files");
const infoFilesPath = path.resolve(__dirname, "info");

app.use(cors());
app.use(express.static("public"));

// Function to list files and directores
const getDirectoryStructure = (dirPath) => {
    try {
        const absolutePath = path.resolve(localFilesPath, dirPath);
        if (!absolutePath.startsWith(localFilesPath)) {
            return null;
        }

        const items = fs.readdirSync(absolutePath);
        return {
            directories: items.filter(item => fs.statSync(path.join(absolutePath, item)).isDirectory()),
            files: items.filter(item => fs.statSync(path.join(absolutePath, item)).isFile())
        };
    } catch (err) {
        return null;
    }
};

// API to get the files and folders with the path
app.get("/api/files", (req, res) => {
    const relativePath = req.query.path || "";
    if (relativePath.includes("..")) return res.status(400).json({ error: "Caminho inválido" });

    const structure = getDirectoryStructure(relativePath);
    if (structure) {
        res.json({
            directories: structure.directories,
            files: structure.files.map(file => ({
                name: file,
                url: `/files/${encodeURIComponent(relativePath)}/${encodeURIComponent(file)}`,
                                                infoUrl: `/api/info/${encodeURIComponent(relativePath)}/${encodeURIComponent(file)}`
            }))
        });
    } else {
        res.status(404).json({ error: "Pasta não encontrada" });
    }
});

// API to get information from files
app.get("/api/info/*", (req, res) => {
    const filePath = req.params[0];
    if (filePath.includes("..")) return res.status(400).json({ error: "Caminho inválido" });

    const infoFilePath = path.resolve(infoFilesPath, filePath + ".txt");
    if (!infoFilePath.startsWith(infoFilesPath)) return res.status(400).json({ error: "Acesso negado" });

    if (fs.existsSync(infoFilePath) && fs.statSync(infoFilePath).isFile()) {
        const infoContent = fs.readFileSync(infoFilePath, "utf8");
        res.json({ info: infoContent });
    } else {
        res.json({ info: "Nenhuma informação disponível." });
    }
});

// Serving the local 
app.get("/files/*", (req, res) => {
    const filePath = path.resolve(localFilesPath, req.params[0]);
    if (!filePath.startsWith(localFilesPath)) return res.status(400).json({ error: "Acesso negado" });

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "Arquivo não encontrado" });
    }
});

// Serving the home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`server on: http://localhost:${PORT}`);
});
